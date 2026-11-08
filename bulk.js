// 批量解析：multipart 上传、CSV/XLSX 表格、分享文本智能识别
const zlib = require('node:zlib');

/* ---------------- multipart/form-data ---------------- */
function parseMultipart(raw, boundary) {
  const fields = {};
  const files = [];
  const sep = Buffer.from('--' + boundary);
  let pos = raw.indexOf(sep);
  while (pos !== -1) {
    let start = pos + sep.length;
    if (raw[start] === 0x2d && raw[start + 1] === 0x2d) break; // 结束分隔
    if (raw[start] === 0x0d) start += 2;
    const next = raw.indexOf(sep, start);
    if (next === -1) break;
    let body = raw.slice(start, next);
    if (body.length && body[body.length - 1] === 0x0a) body = body.slice(0, -1);
    if (body.length && body[body.length - 1] === 0x0d) body = body.slice(0, -1);
    const headEnd = body.indexOf('\r\n\r\n');
    if (headEnd === -1) { pos = next; continue; }
    const head = body.slice(0, headEnd).toString('utf8');
    const content = body.slice(headEnd + 4);
    const nameM = head.match(/name="([^"]*)"/);
    const fileM = head.match(/filename="([^"]*)"/);
    if (nameM && fileM) {
      files.push({ field: nameM[1], filename: fileM[1], type: (head.match(/Content-Type:\s*([^\r\n]+)/) || [])[1] || '', data: content });
    } else if (nameM) {
      fields[nameM[1]] = content.toString('utf8');
    }
    pos = next;
  }
  return { fields, files };
}

/* ---------------- CSV ---------------- */
function csvRows(buf) {
  const text = buf.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim()));
}

/* ---------------- XLSX（纯 Node 解 zip + xml） ---------------- */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 xlsx 文件');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    const lName = buf.readUInt16LE(localOff + 26);
    const lExtra = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lName + lExtra;
    const data = buf.slice(dataStart, dataStart + compSize);
    try { files[name] = method === 0 ? data : zlib.inflateRawSync(data); } catch { /* 跳过异常条目 */ }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const xmlDecode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
  .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(parseInt(d, 10)))
  .replace(/&amp;/g, '&');

function colIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function xlsxRows(buf) {
  const files = unzip(buf);
  const sheetName = Object.keys(files).find((n) => /xl\/worksheets\/sheet1\.xml$/.test(n))
    || Object.keys(files).find((n) => /xl\/worksheets\/.*\.xml$/.test(n));
  if (!sheetName) throw new Error('xlsx 里没有找到工作表');
  const shared = [];
  const ss = files['xl/sharedStrings.xml'];
  if (ss) {
    const siRe = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = siRe.exec(ss.toString('utf8')))) {
      const texts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => xmlDecode(x[1]));
      shared.push(texts.join(''));
    }
  }
  const xml = files[sheetName].toString('utf8');
  const rows = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const cells = [];
    const cellRe = /<c[^>]*?(?:r="([A-Z]+)\d+"|)([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    let auto = 0;
    while ((cm = cellRe.exec(rm[1]))) {
      const idx = cm[1] ? colIndex(cm[1]) : auto;
      const attrs = cm[2] || '';
      const inner = cm[3] || '';
      let val = '';
      const vM = inner.match(/<v>([\s\S]*?)<\/v>/);
      const tM = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      if (/t="s"/.test(attrs) && vM) val = shared[Number(vM[1])] || '';
      else if (tM) val = xmlDecode(tM[1]);
      else if (vM) val = xmlDecode(vM[1]);
      cells[idx >= 0 ? idx : auto] = val;
      auto = (idx >= 0 ? idx : auto) + 1;
      if (!cm[0].length) break;
    }
    if (cells.some((v) => v != null && String(v).trim())) rows.push(cells.map((v) => v == null ? '' : String(v)));
  }
  return rows;
}

/* ---------------- 分享文本智能识别 ---------------- */
const LINK_RE = /(https?:\/\/[^\s，。；、"'<>()）]+)/i;
function linkKind(url) {
  if (/pan\.quark\.cn/i.test(url)) return 'q';
  if (/pan\.baidu\.com/i.test(url)) return 'b';
  if (/(alipan\.com|aliyundrive\.com)/i.test(url)) return 'a';
  if (/(pan\.xunlei\.com|xunlei\.com)/i.test(url)) return 'x';
  return '';
}

function smartParse(text) {
  const s = String(text || '').trim();
  const urls = [...s.matchAll(new RegExp(LINK_RE.source, 'gi'))].map((m) => m[1]);
  const codeM = s.match(/(?:提取码|提取碼|密码|訪問碼|访问码|pwd)\s*[:：=]?\s*([A-Za-z0-9]{4,8})/i);
  const code = codeM ? codeM[1] : '';
  const res = { title: '', link_q: '', code_q: '', link_b: '', code_b: '', link_a: '', link_x: '', code_x: '' };
  urls.forEach((u) => {
    const k = linkKind(u);
    if (k === 'q' && !res.link_q) { res.link_q = u; res.code_q = code; }
    else if (k === 'b' && !res.link_b) { res.link_b = u; res.code_b = code; }
    else if (k === 'a' && !res.link_a) { res.link_a = u; res.code_a = code; }
    else if (k === 'x' && !res.link_x) { res.link_x = u; res.code_x = code; }
    else if (!k && !res.link_q) { res.link_q = u; res.code_q = code; }
  });
  let rest = s.replace(LINK_RE, ' ').replace(/(?:提取码|提取碼|密码|訪問碼|访问码|pwd)\s*[:：=]?\s*[A-Za-z0-9]{4,8}/gi, ' ');
  const quoted = rest.match(/[「『“"《]([^」』”"》]{2,40})[」』”"》]/);
  if (quoted) res.title = quoted[1].trim();
  if (!res.title) {
    res.title = rest.split('\n').map((l) => l.replace(/[|｜·—\-]+/g, ' ').trim())
      .find((l) => l.length >= 2 && !/^(分享|链接|复制|打开|提取码|密码|来自|下载|游戏)/.test(l)) || '';
  }
  res.title = (res.title || '').replace(/^[\s·、,，-]+|[\s·、,，-]+$/g, '').slice(0, 40);
  return res;
}

// 整段文本 → 多条（一个游戏块可含多条线路）
const NET_LABEL_RE = /^(夸克|百度|阿里|迅雷|UC|uc|天翼|微云|蓝奏|123|分享|链接|地址|提取码|提取碼|密码|访问码|pwd|复制|打开)/i;
function isLinkOnlyLine(line) {
  const rest = line.replace(LINK_RE, '')
    .replace(/(?:提取码|提取碼|密码|訪問碼|访问码|pwd)\s*[:：=]?\s*[A-Za-z0-9]{4,8}/gi, '')
    .replace(/[：:，,、|｜\-—]/g, '').trim();
  return rest === '' || NET_LABEL_RE.test(rest);
}
function parseBulkText(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let cur = [];
  const flush = () => { if (cur.length && LINK_RE.test(cur.join('\n'))) blocks.push(cur.join('\n')); cur = []; };
  for (const line of lines) {
    const hasLink = LINK_RE.test(line);
    if (!hasLink) {
      // 纯文字行：如果当前块已经有链接，说明是下一个游戏的标题
      if (cur.some((l) => LINK_RE.test(l))) flush();
      cur.push(line);
      continue;
    }
    if (isLinkOnlyLine(line) && cur.length) { cur.push(line); continue; }
    flush();
    cur = [line];
  }
  flush();
  return blocks.map(smartParse).filter((x) => x.link_q || x.link_b || x.link_a || x.link_x);
}

/* ---------------- 表格 → 记录 ---------------- */
const HEAD_ALIASES = {
  title: ['中文名', '游戏名', '名称', 'title', 'name', '游戏'],
  en: ['英文名', '英文', 'en', 'english'],
  genre: ['类型', '分类', 'genre', 'type', '类别'],
  platform: ['平台', 'platform', '端'],
  size: ['体积', '大小', 'size'],
  version: ['版本', 'version', 'ver'],
  desc: ['介绍', '简介', '描述', 'desc', 'description', '说明'],
  link_q: ['夸克', '夸克网盘', 'quark'],
  code_q: ['夸克提取码', '提取码', 'code'],
  link_b: ['百度', '百度网盘', 'baidu'],
  link_x: ['迅雷', '迅雷网盘', 'xunlei'],
  code_x: ['迅雷提取码'],
  link_a: ['阿里', '阿里云盘', 'ali'],
  cover: ['封面', 'cover', '封面图'],
  shots: ['截图', 'screenshots', 'shot'],
  year: ['年份', 'year', '发行年'],
};

function tableToRows(rows) {
  if (!rows.length) return [];
  const head = rows[0].map((h) => String(h).trim().toLowerCase());
  const map = {};
  head.forEach((h, i) => {
    for (const [key, aliases] of Object.entries(HEAD_ALIASES)) {
      if (aliases.some((a) => h.includes(a.toLowerCase()))) { if (!(key in map)) map[key] = i; }
    }
  });
  const hasHead = Object.keys(map).length >= 2;
  const body = hasHead ? rows.slice(1) : rows;
  const posOrder = ['title', 'en', 'genre', 'platform', 'size', 'version', 'desc', 'link_q', 'code_q'];
  return body.map((r, idx) => {
    const get = (k) => {
      const i = hasHead ? map[k] : posOrder.indexOf(k);
      return i != null && i >= 0 ? String(r[i] == null ? '' : r[i]).trim() : '';
    };
    const rec = {
      title: get('title'), en: get('en'), genre: get('genre') || '动作冒险',
      platform: get('platform') || 'PC', size: get('size'), version: get('version'),
      desc: get('desc'), link_q: get('link_q'), code_q: get('code_q'),
      link_b: get('link_b'), code_b: get('code_q'), link_a: get('link_a'),
      link_x: get('link_x'), code_x: get('code_x'),
      cover: get('cover'), shots: get('shots'), year: get('year'),
    };
    if (!rec.link_q && rec.link_x) { rec.link_q = rec.link_x; rec.code_q = rec.code_x; }
    rec._row = idx + (hasHead ? 2 : 1);
    return rec;
  }).filter((r) => r.title && (r.link_q || r.link_b || r.link_a || r.link_x));
}

function tableFileToRows(buf, filename) {
  if (/\.xlsx?$/i.test(filename)) return tableToRows(xlsxRows(buf));
  return tableToRows(csvRows(buf));
}

module.exports = { parseMultipart, csvRows, xlsxRows, tableFileToRows, smartParse, parseBulkText, linkKind };
