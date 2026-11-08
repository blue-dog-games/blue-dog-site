# 蓝狗游戏站（可注册 / 投稿 / 审核版）

一个真正跑得起来的游戏资源索引站：**注册账号 → 投稿游戏 → 管理员审核 → 出现在首页 → 玩家留言**，全流程可用。纯 Node.js + SQLite，不依赖 PHP / MySQL，也没有第三方 npm 包，放到任何一台装 Node 22 的机器上就能跑。

## 目录

```
blue-dog-site/
├── server.js          # 全部后端：路由、账号、会话、投稿、审核、留言
├── views.js           # 蓝白 iOS 风格页面模板 + 全站 CSS
├── public/            # logo.png / favicon.png（你的蓝狗图标）
├── data/
│   ├── games.json     # 30 条初始示例资源（首次启动时写入数据库）
│   ├── blue-dog.db    # SQLite 数据库（用户、投稿、留言都在这里，务必备份）
│   └── admin.txt      # 管理员账号密码（首次启动生成）
├── server.log         # 运行日志
└── tunnel.log         # 公网隧道日志（含当前访问地址）
```

## 启动

```bash
cd blue-dog-site
PORT=8123 node server.js
```

浏览器打开 `http://127.0.0.1:8123`。

## 长期运行（换到自己的服务器）

本包已经带了两种部署方式：

- **Docker**：`docker build -t blue-dog . && docker run -d -p 8123:8123 -v $PWD/data:/app/data --restart=always blue-dog`
  （`-v` 挂载 data 目录，容器重建不会丢数据库）
- **systemd**：把目录放到 `/opt/blue-dog-site`，`blue-dog.service` 拷到 `/etc/systemd/system/`，然后
  `systemctl daemon-reload && systemctl enable --now blue-dog`

固定域名推荐用 Cloudflare 命名隧道（免费、不需要公网 IP、不要备案）：

```bash
cloudflared tunnel login          # 浏览器授权你的 Cloudflare 账号
cloudflared tunnel create blue-dog
cloudflared tunnel route dns blue-dog game.你的域名.com
cloudflared tunnel run --url http://127.0.0.1:8123 blue-dog
```

## 对外开放（免服务器费）

```bash
# 下载隧道工具（只做一次）
curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared

# 起隧道，日志里会打印 https://xxxx.trycloudflare.com
./cloudflared tunnel --url http://127.0.0.1:8123 --no-autoupdate
```

快速隧道的地址每次重启都会变，且只有进程活着时才可访问。要长期固定域名，把本目录丢到任意一台便宜 VPS（1 核 1G 足够），用 systemd 托管 `node server.js`，再绑自己的域名即可；也可以直接换成 Cloudflare 的命名隧道（`cloudflared tunnel create`）拿固定域名。

## 投稿的三种方式

1. **粘贴分享文本自动识别**：把网盘 App 复制的整段话贴进来，自动拆出游戏名、链接、提取码，夸克 / 百度 / 阿里 / 迅雷分线路归位，一次贴多条也行。先「识别并预览」可核对，再提交。
2. **上传表格批量导入**：支持 `.csv` 和 `.xlsx`（纯 Node 解析，不依赖第三方库）。表头写：中文名、英文名、类型、平台、体积、版本、介绍、夸克链接、提取码、迅雷链接；没有表头按顺序读。模板可下载：`/submit/template.csv`。
3. **手动填一条**：字段最全，含四条网盘线路。

## 后台可改的内容

`/admin` →「⚙ 站点设置」：站点名称、英文副名、首页小标签、首页大标题（换行即两行、第二行自动蓝色）、副标题、资源区标题、站点公告、页脚免责声明，以及**帮助中心整页富文本**（加粗/标题/列表/链接/插图，图片走 `/upload` 存到 `data/uploads/`）。

## 功能与路由

| 路由 | 说明 |
|---|---|
| `GET /` | 首页：统计、分类、最新资源卡片 |
| `GET /list?genre=` | 分类列表 |
| `GET /rank` | 按浏览量排序的热榜 |
| `GET /search?q=` | 搜索中文名 / 英文名 / 类型 / 简介 |
| `GET /game/:id` | 详情页：版本信息 + 夸克/百度/阿里三条线路 + 一键复制 + 留言 |
| `GET/POST /register` `/login` `/logout` | 注册登录，密码 PBKDF2-SHA256 加盐存储 |
| `GET/POST /submit` | 投稿（需登录，提交后进入待审核） |
| `GET /me` | 我的投稿 + 审核状态 |
| `GET /admin` | 审核后台（仅管理员），通过 / 驳回 |
| `POST /comment/:id` | 留言（需登录） |

## 管理员

用户名 `admin`，初始密码写在 `data/admin.txt`（首次启动随机生成）。改密码：删掉该用户在 `users` 表里的记录重新生成，或用 `ADMIN_PASS` 环境变量在首次启动时指定：

```bash
ADMIN_NAME=boss ADMIN_PASS='你的密码' PORT=8123 node server.js
```

## 上线后的日常操作

- **换掉示例网盘链接**：详情页里的 `https://pan.quark.cn/s/demo-xxx` 是占位地址，改成真实分享链接即可（可在后台按游戏改，也可直接改库里 `posts` 表的 `link_q / link_b / link_a`）。
- **加游戏**：登录后到「投稿」提交，管理员在 `/admin` 通过后自动出现在首页。
- **备份**：直接拷 `data/blue-dog.db` 一个文件就是全量数据。
- **合规**：页脚与投稿页已写明只收录自有版权 / 官方免费 / 开源 / 已授权资源，不托管游戏文件。这条不要删。

## 安全说明

- 会话 token 存服务端，cookie 为 `HttpOnly + SameSite=Lax`；所有写操作校验 CSRF token。
- 密码用 PBKDF2 加盐，登录失败 10 分钟内超过 8 次会锁定该 IP。
- 所有用户输入在渲染前做 HTML 转义，SQL 全部走参数化查询。
- 公网只是隧道转发，没有开放额外端口；隧道停止后站点即下线。
