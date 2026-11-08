const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const V = require('./views');
const B = require('./bulk');

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'blue-dog.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  pass TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  csrf TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  en TEXT DEFAULT '',
  genre TEXT NOT NULL,
  platform TEXT NOT NULL,
  size TEXT DEFAULT '',
  version TEXT DEFAULT '',
  desc TEXT NOT NULL,
  tags TEXT DEFAULT '',
  hue INTEGER DEFAULT 210,
  rating REAL DEFAULT 8.0,
  views INTEGER DEFAULT 0,
  link_q TEXT DEFAULT '',
  code_q TEXT DEFAULT '',
  link_b TEXT DEFAULT '',
  code_b TEXT DEFAULT '',
  link_a TEXT DEFAULT '',
  code_a TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings(
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS favorites(
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  created TEXT NOT NULL,
  PRIMARY KEY(user_id, post_id)
);
CREATE TABLE IF NOT EXISTS tickets(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  contact TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created TEXT NOT NULL
);
`);
db.exec('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)');

function ensureColumn(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
ensureColumn('posts', 'link_x', "TEXT DEFAULT ''");
ensureColumn('posts', 'code_x', "TEXT DEFAULT ''");
ensureColumn('posts', 'cover', "TEXT DEFAULT ''");
ensureColumn('posts', 'shots', "TEXT DEFAULT ''");
ensureColumn('posts', 'req', "TEXT DEFAULT ''");
ensureColumn('posts', 'log', "TEXT DEFAULT ''");
ensureColumn('posts', 'year', "TEXT DEFAULT ''");
ensureColumn('users', 'account', "TEXT DEFAULT ''");
ensureColumn('users', 'avatar', "TEXT DEFAULT ''");
ensureColumn('users', 'nick_changed', "TEXT DEFAULT ''");
db.exec("UPDATE users SET account=username WHERE account='' OR account IS NULL");
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_account ON users(account)");

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const now = () => new Date().toISOString();
const esc = V.esc;

/* ---------- 站点设置 ---------- */
function getSite() {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  const site = { ...V.DEFAULT_SITE };
  rows.forEach((r) => { if (r.key in site) site[r.key] = r.value; });
  return site;
}
function saveSite(fields) {
  const stmt = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  Object.entries(fields).forEach(([k, v]) => stmt.run(k, v));
}

/* ---------- 用户与密码 ---------- */
const hashPass = (pw, salt = crypto.randomBytes(16).toString('hex')) =>
  salt + ':' + crypto.pbkdf2Sync(pw, salt, 120000, 32, 'sha256').toString('hex');
const checkPass = (pw, stored) => {
  const [salt] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(hashPass(pw, salt)), Buffer.from(stored));
};

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function currentUser(req) {
  const token = getCookie(req, 'bd_session');
  if (!token) return null;
  const row = db.prepare(`SELECT u.id,u.username,u.account,u.role,u.avatar,u.nick_changed,s.csrf FROM sessions s
    JOIN users u ON u.id=s.user_id WHERE s.token=?`).get(token);
  return row || null;
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const csrf = crypto.randomBytes(18).toString('hex');
  db.prepare('INSERT INTO sessions(token,user_id,csrf,created) VALUES(?,?,?,?)').run(token, userId, csrf, now());
  return { token, csrf };
}

/* ---------- 请求工具 ---------- */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 1.5e6) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(new URLSearchParams(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', reject);
  });
}

function readRaw(req, limit = 12e6) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(body);
}
function redirect(res, to, extra = {}) {
  res.writeHead(303, { Location: to, ...extra });
  res.end();
}

const loginAttempts = new Map();
function throttled(ip) {
  const rec = loginAttempts.get(ip);
  if (rec && Date.now() - rec.ts < 10 * 60 * 1000 && rec.n >= 8) return true;
  return false;
}
function noteAttempt(ip) {
  const rec = loginAttempts.get(ip);
  if (!rec || Date.now() - rec.ts > 10 * 60 * 1000) loginAttempts.set(ip, { n: 1, ts: Date.now() });
  else rec.n++;
}

/* ---------- 数据查询 ---------- */
function approvedPosts(where = '', order = 'created DESC', limit = 40) {
  return db.prepare(`SELECT p.*,u.username AS author,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS cmt
    FROM posts p JOIN users u ON u.id=p.author_id
    WHERE p.status='approved' ${where} ORDER BY ${order} LIMIT ${limit}`).all();
}
function postById(id) {
  return db.prepare(`SELECT p.*,u.username AS author,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS cmt
    FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=?`).get(id);
}
function isFav(userId, postId) {
  if (!userId) return false;
  return !!db.prepare('SELECT 1 FROM favorites WHERE user_id=? AND post_id=?').get(userId, postId);
}
function genresList(active) {
  const base = ['全部', '动作冒险', '角色扮演', '射击', '策略', '模拟经营', '独立', '恐怖生存', '竞速', '解谜', '休闲'];
  return base.map((g) => ({ name: g, on: g === (active || '全部') }));
}

/* ---------- 种子数据 ---------- */
function seed() {
  const adminName = process.env.ADMIN_NAME || 'jeywoo';
  let admin = db.prepare("SELECT * FROM users WHERE role='admin'").get();
  if (!admin) {
    if (db.prepare('SELECT id FROM users WHERE username=?').get(adminName)) return;
    const pw = process.env.ADMIN_PASS || crypto.randomBytes(6).toString('base64url');
    db.prepare('INSERT INTO users(username,pass,role,created) VALUES(?,?,?,?)')
      .run(adminName, hashPass(pw), 'admin', now());
    fs.writeFileSync(path.join(DATA_DIR, 'admin.txt'),
      `蓝狗游戏站 管理员账号\n用户名: ${adminName}\n密码: ${pw}\n后台地址: /admin\n（请妥善保存，删除 data/admin.txt 前先记下）\n`);
    console.log('[seed] 管理员已创建:', adminName, '/', pw);
    admin = db.prepare('SELECT * FROM users WHERE username=?').get(adminName);
  }
  const count = db.prepare("SELECT COUNT(*) n FROM posts").get().n;
  if (count > 0) return;
  const games = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'games.json'), 'utf8'));
  const ins = db.prepare(`INSERT INTO posts(author_id,title,en,genre,platform,size,version,desc,tags,hue,rating,views,
    link_q,code_q,link_b,code_b,link_a,code_a,status,created,updated)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const codeOf = (s) => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 10000;
    let out = ''; for (let i = 0; i < 4; i++) out += chars[(h >> (i * 2)) % chars.length];
    return out.toUpperCase();
  };
  games.forEach((g, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString();
    ins.run(admin.id, g.cn, g.en, g.g, g.p, g.sz, g.v, g.desc, (g.tags || []).join(' / '),
      g.h || 210, (g.sc || 8), Math.round((g.pop || 60) * 12),
      `https://pan.quark.cn/s/demo-${g.id}`, codeOf(g.id + 'q'),
      i % 3 === 0 ? '' : `https://pan.baidu.com/s/demo-${g.id}`, codeOf(g.id + 'b'),
      parseFloat(g.sz) > 10 || (g.pop || 0) > 70 ? `https://www.alipan.com/s/demo-${g.id}` : '', codeOf(g.id + 'a'),
      'approved', ds, ds);
  });
  console.log('[seed] 写入示例游戏:', games.length);
}
seed();

function sanitizeRich(html) {
  const allow = ['p','br','b','strong','i','em','u','h2','h3','h4','ul','ol','li','a','img',
    'blockquote','code','pre','span','div','table','tbody','tr','td','th','hr'];
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<[^>]+>/g, (tag) => {
      const name = ((tag.match(/^<\/?([a-z0-9]+)/i) || [])[1] || '').toLowerCase();
      if (!name || !allow.includes(name)) return '';
      let t = tag
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');
      if (name === 'img') {
        t = t.replace(/\ssrc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m) => {
          const url = (m.split('=')[1] || '').replace(/["']/g, '');
          return /^(\/uploads\/|https?:)/i.test(url) ? m : '';
        });
      }
      return t;
    });
}

function insertPost(userId, r) {
  const title = String(r.title || '').trim().slice(0, 40);
  const desc = String(r.desc || '').trim().slice(0, 400) || '由投稿人批量导入，详情待补充。';
  if (!title) return null;
  const linkQ = String(r.link_q || '').trim();
  const linkB = String(r.link_b || '').trim();
  const linkA = String(r.link_a || '').trim();
  const linkX = String(r.link_x || '').trim();
  if (!linkQ && !linkB && !linkA && !linkX) return null;
  const genre = ['动作冒险','角色扮演','射击','策略','模拟经营','独立','恐怖生存','竞速','解谜','休闲'].includes(r.genre) ? r.genre : '动作冒险';
  const platform = ['PC','Switch','安卓'].includes(r.platform) ? r.platform : 'PC';
  const cover = String(r.cover || '').trim().slice(0, 400);
  const shots = String(r.shots || '').trim().slice(0, 1200);
  const info = db.prepare(`INSERT INTO posts(author_id,title,en,genre,platform,size,version,desc,tags,hue,rating,views,
    link_q,code_q,link_b,code_b,link_a,code_a,link_x,code_x,cover,shots,status,created,updated)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)`).run(
    userId, title, String(r.en || '').trim().slice(0, 60), genre, platform,
    String(r.size || '').trim().slice(0, 12), String(r.version || '').trim().slice(0, 20), desc, '',
    (210 + (title.length * 7) % 30), 8.0, 0, linkQ, String(r.code_q || '').trim().slice(0, 12),
    linkB, String(r.code_b || '').trim().slice(0, 12), linkA, String(r.code_a || '').trim().slice(0, 12),
    linkX, String(r.code_x || '').trim().slice(0, 12), cover, shots, now(), now());
  return info.lastInsertRowid;
}

/* ---------- 页面处理 ---------- */
function page(res, title, body, user, active) {
  send(res, 200, V.layout({ title, body, user, active, site: getSite() }));
}

function statData() {
  const total = db.prepare("SELECT COUNT(*) n FROM posts WHERE status='approved'").get().n;
  const users = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  const comments = db.prepare('SELECT COUNT(*) n FROM comments').get().n;
  const today = db.prepare("SELECT COUNT(*) n FROM posts WHERE status='approved' AND substr(created,1,10)=?").get(new Date().toISOString().slice(0, 10)).n;
  return { total, users, comments, today };
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pname = decodeURIComponent(url.pathname);
  const user = currentUser(req);
  const ip = req.socket.remoteAddress || 'unknown';

  /* 静态资源 */
  if (req.method === 'GET' && pname === '/style.css') {
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public,max-age=600' });
    return res.end(V.css);
  }
  if (req.method === 'GET' && (pname === '/logo.png' || pname === '/favicon.png')) {
    const file = path.join(ROOT, 'public', pname.slice(1));
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=86400' });
      return res.end(fs.readFileSync(file));
    }
  }

  if (req.method === 'GET' && pname.startsWith('/uploads/')) {
    const name = path.basename(pname);
    const file = path.join(UPLOAD_DIR, name);
    if (fs.existsSync(file)) {
      const ext = path.extname(name).toLowerCase();
      const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'public,max-age=86400' });
      return res.end(fs.readFileSync(file));
    }
  }

  /* 首页 */
  if (req.method === 'GET' && pname === '/') {
    const posts = approvedPosts('', 'created DESC', 20);
    return page(res, '首页', V.homeView({ posts, stats: statData(), user, genres: genresList(), site: getSite() }), user, 'home');
  }

  /* 列表 / 热榜 / 搜索 */
  if (req.method === 'GET' && pname === '/new') {
    const rows = approvedPosts('', 'created DESC', 30);
    return page(res, '近期新游', V.listView({ title: '近期新游', posts: rows, q: '', genres: genresList(), user }), user, 'new');
  }

  if (req.method === 'GET' && (pname === '/list' || pname === '/rank' || pname === '/search')) {
    const genre = url.searchParams.get('genre') || '全部';
    const platform = url.searchParams.get('platform') || '';
    const tag = url.searchParams.get('tag') || '';
    const q = (url.searchParams.get('q') || '').trim();
    let rows, title;
    if (pname === '/rank') { rows = approvedPosts('', 'views DESC', 40); title = '热度榜'; }
    else if (pname === '/search') {
      title = q ? `搜索：${q}` : '全部资源';
      rows = q ? approvedPosts('AND (p.title LIKE ? OR p.en LIKE ? OR p.genre LIKE ? OR p.desc LIKE ?)', 'created DESC', 40,
        ...[1, 2, 3, 4].map(() => `%${q}%`)) : approvedPosts();
    } else if (tag) {
      rows = approvedPosts('AND (p.tags LIKE ? OR p.genre=?)', 'created DESC', 40, '%' + tag + '%', tag);
      title = '标签：' + tag;
    } else if (platform) {
      rows = approvedPosts('AND p.platform=?', 'created DESC', 40, platform);
      title = platform === '安卓' ? '手机游戏' : platform === 'Switch' ? 'Switch 游戏' : platform;
    } else {
      if (genre === '全部') { rows = approvedPosts(); title = '全部游戏'; }
      else { rows = approvedPosts('AND (p.genre=? OR p.platform=?)', 'created DESC', 40, genre, genre); title = genre; }
    }
    return page(res, title, V.listView({ title, posts: rows, q, genres: genresList(genre), user }), user,
      pname === '/rank' ? 'rank'
        : pname === '/list' && platform === '安卓' ? 'mobile'
        : pname === '/list' && platform === 'PC' ? 'pc' : 'list');
  }

  /* 详情 */
  const gm = pname.match(/^\/game\/(\d+)$/);
  if (req.method === 'GET' && gm) {
    const p = postById(Number(gm[1]));
    if (!p || (p.status !== 'approved' && (!user || (user.role !== 'admin' && user.id !== p.author_id))))
      return send(res, 404, V.layout({ title: '资源不存在', body: '<section class="sec"><div class="empty"><b>这个资源不在了</b>可能已被驳回或删除。</div></section>', user, site: getSite() }), user);
    db.prepare('UPDATE posts SET views=views+1 WHERE id=?').run(p.id);
    p.views++;
    const comments = db.prepare(`SELECT c.*,u.username,u.avatar FROM comments c JOIN users u ON u.id=c.user_id
      WHERE c.post_id=? ORDER BY c.id DESC`).all(p.id);
    const related = approvedPosts('AND p.genre=? AND p.id<>?', 'created DESC', 5, p.genre, p.id);
    const editing = url.searchParams.get('edit') === '1' && user && user.role === 'admin';
    return page(res, p.title, V.detailView({ p, comments, user, related, fav: isFav(user && user.id, p.id), editing }), user, 'list');
  }

  /* 登录 / 注册 / 投稿 / 我的 / 后台 / 帮助 */
  if (req.method === 'GET' && pname === '/login') {
    if (user) return redirect(res, '/');
    return page(res, '登录', V.authView({ mode: 'login' }), user);
  }
  if (req.method === 'GET' && pname === '/register') {
    if (user) return redirect(res, '/');
    return page(res, '注册', V.authView({ mode: 'register' }), user);
  }
  if (req.method === 'GET' && pname === '/submit') {
    if (!user) return redirect(res, '/login');
    return page(res, '投稿', V.submitView({ user }), user, 'submit');
  }
  if (req.method === 'GET' && pname === '/account') {
    if (!user) return redirect(res, '/login');
    const me = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
    const days = me.nick_changed ? Math.floor((Date.now() - Date.parse(me.nick_changed)) / 86400000) : 999;
    return page(res, '账号设置', V.accountView({ user: { ...user, ...me }, days, ok: url.searchParams.get('ok') === '1', error: url.searchParams.get('error') || '' }), user, 'me');
  }

  if (req.method === 'GET' && pname === '/me') {
    if (!user) return redirect(res, '/login');
    const tab = url.searchParams.get('tab') || 'posts';
    const posts = db.prepare('SELECT * FROM posts WHERE author_id=? ORDER BY id DESC').all(user.id);
    const favs = db.prepare(`SELECT p.*,u.username AS author,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) AS cmt
      FROM favorites f JOIN posts p ON p.id=f.post_id JOIN users u ON u.id=p.author_id
      WHERE f.user_id=? ORDER BY f.created DESC`).all(user.id);
    const tickets = db.prepare(`SELECT t.*,p.title FROM tickets t JOIN posts p ON p.id=t.post_id
      WHERE t.user_id=? ORDER BY t.id DESC`).all(user.id);
    return page(res, '我的', V.meView({ user, posts, favs, tickets, tab }), user, 'me');
  }

  /* 失效反馈 */
  const rm = pname.match(/^\/report\/(\d+)$/);
  if (req.method === 'GET' && rm) {
    const p = postById(Number(rm[1]));
    if (!p) return send(res, 404, '资源不存在');
    return page(res, '反馈失效', V.reportView({ user, p, done: url.searchParams.get('ok') === '1' }), user);
  }

  /* 收藏夹 */
  if (req.method === 'GET' && pname === '/me/favorites') return redirect(res, '/me?tab=favs');
  if (req.method === 'GET' && pname === '/admin/settings') {
    if (!user || user.role !== 'admin') return send(res, 403, V.layout({ title: '无权访问', body: '<section class="sec"><div class="empty"><b>需要管理员权限</b>用管理员账号登录后再来。</div></section>', user, site: getSite() }), user);
    return page(res, '站点设置', V.adminSettingsView({ user, site: getSite(), ok: url.searchParams.get('ok') === '1' }), user);
  }
  if (req.method === 'GET' && pname === '/admin') {
    if (!user || user.role !== 'admin') return send(res, 403, V.layout({ title: '无权访问', body: '<section class="sec"><div class="empty"><b>需要管理员权限</b>用管理员账号登录后再来。</div></section>', user, site: getSite() }), user);
    const q = (url.searchParams.get('q') || '').trim();
    const pending = db.prepare(`SELECT p.*,u.username AS author FROM posts p JOIN users u ON u.id=p.author_id
      WHERE p.status='pending' ORDER BY p.id ASC`).all();
    const all = q
      ? db.prepare(`SELECT p.*,u.username AS author FROM posts p JOIN users u ON u.id=p.author_id
          WHERE p.title LIKE ? OR p.en LIKE ? OR p.tags LIKE ? OR p.genre LIKE ?
          ORDER BY p.id DESC LIMIT 80`).all('%' + q + '%', '%' + q + '%', '%' + q + '%', '%' + q + '%')
      : db.prepare(`SELECT p.*,u.username AS author FROM posts p JOIN users u ON u.id=p.author_id
          ORDER BY p.id DESC LIMIT 80`).all();
    const tickets = db.prepare(`SELECT t.*,p.title,p.id AS pid,u.username FROM tickets t
      JOIN posts p ON p.id=t.post_id LEFT JOIN users u ON u.id=t.user_id
      WHERE t.status='open' ORDER BY t.id DESC`).all();
    return page(res, '审核后台', V.adminView({ user, pending, all, tickets, q }), user);
  }
  if (req.method === 'GET' && pname === '/submit/template.csv') {
    const head = '中文名,英文名,类型,平台,体积,版本,介绍,夸克链接,提取码,迅雷链接\n';
    const sample = '灰烬回廊,Ashen Corridor,动作冒险,PC,12.4 GB,Build.2641,一句话介绍这里,https://pan.quark.cn/s/xxxx,8x2k,https://pan.xunlei.com/s/yyyy\n';
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="blue-dog-template.csv"',
    });
    return res.end('\ufeff' + head + sample);
  }
  if (req.method === 'GET' && pname === '/help') {
    return page(res, '帮助中心', V.helpView({ user, site: getSite() }), user, 'help');
  }

  /* ---------- POST ---------- */
  if (req.method === 'POST') {
    const ctype = req.headers['content-type'] || '';
    if (ctype.startsWith('multipart/form-data')) {
      const bMatch = ctype.match(/boundary=(?:"([^"]+)"|([^;]+))/);
      const boundary = bMatch ? (bMatch[1] || bMatch[2]) : '';
      let raw;
      try { raw = await readRaw(req, 14e6); } catch { return send(res, 413, '文件太大，请控制在 12MB 以内'); }
      const { fields, files } = B.parseMultipart(raw, boundary);

      if (pname === '/upload') {
        if (!user) return send(res, 403, '请先登录');
        if (fields._csrf !== user.csrf) return send(res, 403, '页面已过期');
        const f = files.find((x) => x.field === 'file');
        if (!f) return send(res, 400, '没有收到图片');
        const extM = f.filename.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
        if (!extM || !/^image\//.test(f.type || '')) return send(res, 400, '只支持 png / jpg / gif / webp 图片');
        const name = crypto.randomBytes(8).toString('hex') + '.' + extM[1].toLowerCase();
        fs.writeFileSync(path.join(UPLOAD_DIR, name), f.data);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: true, url: '/uploads/' + name }));
      }

      if (pname === '/submit/file') {
        if (!user) return redirect(res, '/login');
        if (fields._csrf !== user.csrf) return page(res, '投稿', V.submitView({ user, error: '页面已过期，请重新上传' }), user, 'submit');
        const f = files.find((x) => x.field === 'file');
        if (!f) return page(res, '投稿', V.submitView({ user, error: '没有收到表格文件' }), user, 'submit');
        let rows;
        try { rows = B.tableFileToRows(f.data, f.filename); }
        catch (e) { return page(res, '投稿', V.submitView({ user, error: '表格解析失败：' + e.message }), user, 'submit'); }
        if (!rows.length) return page(res, '投稿', V.submitView({ user, error: '表格里没有读到有效行（需要至少包含「中文名」和「夸克/迅雷链接」）' }), user, 'submit');
        let n = 0;
        rows.forEach((r) => { if (insertPost(user.id, r)) n++; });
        const skipped = rows.length - n;
        return page(res, '投稿', V.submitView({
          user, ok: true,
          notice: `已从表格导入 ${n} 条${skipped ? `（${skipped} 条因缺少名称或链接被跳过）` : ''}，全部进入待审核队列。`,
        }), user, 'submit');
      }
      return send(res, 400, '不支持的请求');
    }

    let form;
    try { form = await readBody(req); } catch { return send(res, 413, '请求过大'); }

    const requireCsrf = () => !user || form.get('_csrf') !== user.csrf;

    if (pname === '/register') {
      const account = (form.get('account') || '').trim();
      const password = form.get('password') || '';
      const nick = (form.get('nickname') || '').trim() || account;
      const err =
        !/^[A-Za-z0-9_]{3,16}$/.test(account) ? '账号只能是 3-16 位字母、数字或下划线（登录用）'
        : !/^[\p{L}\p{N}_\-·]{2,16}$/u.test(nick) ? '昵称只能是 2-16 位中文、字母、数字、下划线或短横线'
        : password.length < 6 ? '密码至少 6 位'
        : db.prepare('SELECT id FROM users WHERE account=?').get(account) ? '这个账号已经被注册了，换一个'
        : null;
      if (err) return page(res, '注册', V.authView({ mode: 'register', error: err }), null);
      const info = db.prepare('INSERT INTO users(username,account,pass,role,created) VALUES(?,?,?,?,?)')
        .run(nick, account, hashPass(password), 'user', now());
      const s = createSession(info.lastInsertRowid);
      return redirect(res, '/', { 'Set-Cookie': `bd_session=${s.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000` });
    }

    if (pname === '/login') {
      if (throttled(ip)) return page(res, '登录', V.authView({ mode: 'login', error: '尝试次数过多，请 10 分钟后再试' }), null);
      const username = (form.get('username') || '').trim();
      const password = form.get('password') || '';
      const row = db.prepare('SELECT * FROM users WHERE account=?').get(username)
        || db.prepare("SELECT * FROM users WHERE username=? AND account=''").get(username);
      let ok = false;
      try { ok = !!row && checkPass(password, row.pass); } catch { ok = false; }
      if (!ok) { noteAttempt(ip); return page(res, '登录', V.authView({ mode: 'login', error: '用户名或密码不对' }), null); }
      const s = createSession(row.id);
      return redirect(res, '/', { 'Set-Cookie': `bd_session=${s.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000` });
    }

    if (pname === '/logout') {
      const token = getCookie(req, 'bd_session');
      if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
      return redirect(res, '/', { 'Set-Cookie': 'bd_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    }

    if (pname === '/submit') {
      if (!user) return redirect(res, '/login');
      if (requireCsrf()) return page(res, '投稿', V.submitView({ user, error: '页面已过期，请重新提交' }), user, 'submit');
      const title = (form.get('title') || '').trim();
      const linkQ = (form.get('link_q') || '').trim();
      const desc = (form.get('desc') || '').trim();
      const err =
        !title || !desc ? '游戏名和介绍都要填'
        : !/^https?:\/\/.+/.test(linkQ) ? '夸克网盘链接格式不对，需要 http(s) 开头'
        : null;
      if (err) return page(res, '投稿', V.submitView({ user, error: err }), user, 'submit');
      const linkX = (form.get('link_x') || '').trim();
      db.prepare(`INSERT INTO posts(author_id,title,en,genre,platform,size,version,desc,tags,hue,rating,views,
        link_q,code_q,link_b,code_b,link_a,code_a,link_x,code_x,cover,shots,status,created,updated)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)`).run(
        user.id, title, (form.get('en') || '').trim(), form.get('genre') || '动作冒险', form.get('platform') || 'PC',
        (form.get('size') || '').trim(), (form.get('version') || '').trim(), desc, '',
        (210 + (title.length * 7) % 30), 8.0, 0, linkQ, (form.get('code_q') || '').trim(),
        (form.get('link_b') || '').trim(), (form.get('code_b') || '').trim(),
        (form.get('link_a') || '').trim(), '', linkX, (form.get('code_x') || '').trim(),
        (form.get('cover') || '').trim().slice(0, 400), (form.get('shots') || '').replace(/\r/g, '').slice(0, 1200),
        now(), now());
      return page(res, '投稿', V.submitView({ user, ok: true }), user, 'submit');
    }

    if (pname === '/submit/batch') {
      if (!user) return redirect(res, '/login');
      if (requireCsrf()) return page(res, '投稿', V.submitView({ user, error: '页面已过期，请重新粘贴' }), user, 'submit');
      const text = form.get('bulk_text') || '';
      let items;
      if (text.trim().startsWith('{')) {
        items = text.split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } })
          .filter((x) => x && (x.link_q || x.link_b || x.link_a || x.link_x));
      } else items = B.parseBulkText(text);
      if (!items.length) return page(res, '投稿', V.submitView({ user, error: '没识别到有效链接，请确认文本里至少有一条网盘分享地址' }), user, 'submit');
      let n = 0;
      items.forEach((r) => { if (!r.desc) r.desc = '由分享文本批量识别导入，详情待补充。'; if (insertPost(user.id, r)) n++; });
      return page(res, '投稿', V.submitView({ user, ok: true, notice: `已识别并提交 ${n} 条，全部进入待审核队列。` }), user, 'submit');
    }

    if (pname === '/submit/preview') {
      if (!user) return redirect(res, '/login');
      const text = form.get('bulk_text') || '';
      const items = B.parseBulkText(text);
      return page(res, '识别结果', V.previewView({ user, items }), user, 'submit');
    }

    const cm = pname.match(/^\/comment\/(\d+)$/);
    if (cm) {
      if (!user) return redirect(res, '/login');
      if (requireCsrf()) return redirect(res, `/game/${cm[1]}?_=csrf`);
      const body = (form.get('body') || '').trim().slice(0, 600);
      const p = postById(Number(cm[1]));
      if (p && p.status === 'approved' && body) {
        db.prepare('INSERT INTO comments(post_id,user_id,body,created) VALUES(?,?,?,?)').run(p.id, user.id, body, now());
      }
      return redirect(res, `/game/${cm[1]}#comments`);
    }

    const fm = pname.match(/^\/fav\/(\d+)$/);
    if (fm) {
      if (!user) return redirect(res, '/login');
      if (requireCsrf()) return redirect(res, `/game/${fm[1]}`);
      const pid = Number(fm[1]);
      const has = db.prepare('SELECT 1 FROM favorites WHERE user_id=? AND post_id=?').get(user.id, pid);
      if (has) db.prepare('DELETE FROM favorites WHERE user_id=? AND post_id=?').run(user.id, pid);
      else db.prepare('INSERT INTO favorites(user_id,post_id,created) VALUES(?,?,?)').run(user.id, pid, now());
      return redirect(res, `/game/${pid}`);
    }

    const rp = pname.match(/^\/report\/(\d+)$/);
    if (rp) {
      if (!user) return redirect(res, '/login');
      if (requireCsrf()) return redirect(res, `/report/${rp[1]}`);
      const body = (form.get('body') || '').trim().slice(0, 400);
      if (body) {
        db.prepare('INSERT INTO tickets(post_id,user_id,kind,body,contact,status,created) VALUES(?,?,?,?,?,?,?)')
          .run(Number(rp[1]), user.id, (form.get('kind') || '其他').slice(0, 12), body,
            (form.get('contact') || '').trim().slice(0, 60), 'open', now());
      }
      return redirect(res, `/report/${rp[1]}?ok=1`);
    }

    if (pname === '/admin/ticket') {
      if (!user || user.role !== 'admin') return send(res, 403, '无权操作');
      if (requireCsrf()) return redirect(res, '/admin');
      const id = Number(form.get('id'));
      db.prepare("UPDATE tickets SET status='closed' WHERE id=?").run(id);
      return redirect(res, '/admin');
    }

    if (pname === '/admin/settings') {
      if (!user || user.role !== 'admin') return send(res, 403, '无权操作');
      if (requireCsrf()) return page(res, '站点设置', V.adminSettingsView({ user, site: getSite(), error: '页面已过期，请重新保存' }), user);
      const fields = {};
      ['site_name', 'site_sub', 'hero_kicker', 'hero_title', 'hero_sub', 'section_title', 'announcement', 'footer_note'].forEach((k) => {
        if (form.has(k)) fields[k] = (form.get(k) || '').trim().slice(0, 400);
      });
      if (form.has('help_html')) fields.help_html = sanitizeRich((form.get('help_html') || '').slice(0, 200000));
      if (!fields.site_name) return page(res, '站点设置', V.adminSettingsView({ user, site: getSite(), error: '站点名称不能为空' }), user);
      if (!fields.hero_title) return page(res, '站点设置', V.adminSettingsView({ user, site: getSite(), error: '首页大标题不能为空' }), user);
      saveSite(fields);
      return redirect(res, '/admin/settings?ok=1');
    }

    if (pname === '/account') {
      if (!user) return redirect(res, '/login');
      if (requireCsrf()) return redirect(res, '/account?error=页面已过期，请重试');
      const nick = (form.get('nickname') || '').trim();
      const avatar = (form.get('avatar') || '').trim();
      const me = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      let err = '';
      if (nick && nick !== me.username) {
        if (!/^[\p{L}\p{N}_\-·]{2,16}$/u.test(nick)) err = '昵称只能是 2-16 位中文、字母、数字、下划线或短横线';
        else if (me.role !== 'admin') {
          const days = me.nick_changed ? Math.floor((Date.now() - Date.parse(me.nick_changed)) / 86400000) : 999;
          if (days < 30) err = `昵称 30 天只能改一次，还需等 ${30 - days} 天`;
        }
      }
      if (!err && avatar && !(/^\/uploads\/[A-Za-z0-9._\-]+$/.test(avatar) || /^https?:\/\/\S+$/.test(avatar)))
        err = '头像地址不合法';
      if (err) return redirect(res, '/account?error=' + encodeURIComponent(err));
      if (nick && nick !== me.username) db.prepare('UPDATE users SET username=?,nick_changed=? WHERE id=?').run(nick, now(), user.id);
      if (avatar) db.prepare('UPDATE users SET avatar=? WHERE id=?').run(avatar, user.id);
      return redirect(res, '/account?ok=1');
    }

    const em = pname.match(/^\/admin\/edit\/(\d+)$/);
    if (em) {
      if (!user || user.role !== 'admin') return send(res, 403, '无权操作');
      if (requireCsrf()) return redirect(res, `/game/${em[1]}?edit=1`);
      const f = (k) => (form.get(k) || '').trim();
      const id = Number(em[1]);
      const rating = Math.max(0, Math.min(10, Number(f('rating') || 8)));
      db.prepare(`UPDATE posts SET title=?,en=?,genre=?,platform=?,size=?,version=?,desc=?,tags=?,rating=?,
        cover=?,shots=?,req=?,log=?,year=?,link_q=?,code_q=?,link_b=?,code_b=?,link_a=?,code_a=?,link_x=?,code_x=?,updated=?
        WHERE id=?`).run(
        f('title'), f('en'), f('genre') || '动作冒险', f('platform') || 'PC', f('size'), f('version'),
        (form.get('desc') || '').trim(), f('tags'), rating, f('cover'),
        (form.get('shots') || '').replace(/\r/g, ''), (form.get('req') || '').trim(), (form.get('log') || '').trim(),
        f('year'), f('link_q'), f('code_q'), f('link_b'), f('code_b'), f('link_a'), f('code_a'), f('link_x'), f('code_x'),
        now(), id);
      return redirect(res, `/game/${id}?saved=1`);
    }

    if (pname === '/admin/delete') {
      if (!user || user.role !== 'admin') return send(res, 403, '无权操作');
      if (requireCsrf()) return redirect(res, '/admin');
      const id = Number(form.get('id'));
      if (Number.isFinite(id)) {
        db.prepare('DELETE FROM comments WHERE post_id=?').run(id);
        db.prepare('DELETE FROM favorites WHERE post_id=?').run(id);
        db.prepare('DELETE FROM tickets WHERE post_id=?').run(id);
        db.prepare('DELETE FROM posts WHERE id=?').run(id);
      }
      const next = (form.get('next') || '').trim();
      return redirect(res, next.startsWith('/') && !next.startsWith('//') ? next : '/admin');
    }

    if (pname === '/admin/approve' || pname === '/admin/reject') {
      if (!user || user.role !== 'admin') return send(res, 403, '无权操作');
      if (requireCsrf()) return redirect(res, '/admin');
      const id = Number(form.get('id'));
      db.prepare('UPDATE posts SET status=?, updated=? WHERE id=?')
        .run(pname.endsWith('approve') ? 'approved' : 'rejected', now(), id);
      return redirect(res, '/admin');
    }
  }

  send(res, 404, V.layout({ title: '页面不存在', body: '<section class="sec"><div class="empty"><b>404</b>这个页面不存在，回首页看看。</div></section>', site: getSite() }));
}

http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error(e);
    send(res, 500, '服务器错误');
  });
}).listen(PORT, '0.0.0.0', () => console.log(`蓝狗游戏站 running on http://127.0.0.1:${PORT}`));
