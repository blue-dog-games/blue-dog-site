const ratingLabel = (r) => (r >= 9 ? '特别好评' : r >= 8 ? '多半好评' : r >= 7 ? '褒贬不一' : '差评');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (s) => String(s).slice(0, 10);

const css = `
:root{
  --bg:#F2F6FB;--panel:#fff;--line:#E4EBF4;--line2:#D2DEEC;
  --text:#0B1B33;--dim:#5C6C82;--dim2:#8B98AC;
  --blue:#0A84FF;--blue-l:#EAF3FF;--cyan:#5AC8FA;
  --shadow:0 8px 24px rgba(16,58,122,.08);--shadow-h:0 16px 36px rgba(16,58,122,.14);
  --sans:-apple-system,BlinkMacSystemFont,"SF Pro SC","PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  --ease:cubic-bezier(.22,.61,.36,1);
}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(900px 420px at 50% -160px,#DDEBFF 0,rgba(221,235,255,0) 70%),linear-gradient(#F7FAFE,#EFF4FB);
  color:var(--text);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
img{display:block;max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 18px}
.top{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.8);backdrop-filter:saturate(180%) blur(20px);
  -webkit-backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid rgba(11,27,51,.07)}
.top-in{display:flex;align-items:center;gap:12px;min-height:62px;flex-wrap:wrap;padding:8px 0}
.brand{display:flex;align-items:center;gap:10px}
.brand img{width:36px;height:36px;border-radius:11px;background:#fff;box-shadow:0 4px 12px rgba(10,132,255,.22);border:1px solid rgba(11,27,51,.05)}
.brand b{font-size:18px;font-weight:800;letter-spacing:-.02em;display:block}
.brand small{display:block;font-size:8.5px;letter-spacing:.16em;color:var(--dim2);font-family:ui-monospace,monospace}
nav{display:flex;gap:2px;flex-wrap:wrap}
nav a{font-size:13.5px;color:var(--dim);padding:7px 11px;border-radius:999px;transition:.2s var(--ease)}
nav a:hover{background:rgba(10,132,255,.07);color:var(--text)}
nav a.on{color:var(--blue);background:var(--blue-l);font-weight:600}
.top-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 15px;border-radius:12px;
  font-size:13px;font-weight:600;border:1px solid var(--line2);background:#fff;box-shadow:0 1px 2px rgba(16,58,122,.06);
  transition:transform .18s var(--ease),box-shadow .18s,background .18s}
.btn:hover{background:#F9FBFF;box-shadow:0 4px 12px rgba(16,58,122,.10);transform:translateY(-1px)}
.btn:active{transform:scale(.97)}
.btn.solid{background:linear-gradient(#0A84FF,#0A78F0);border-color:transparent;color:#fff;box-shadow:0 6px 16px rgba(10,132,255,.26)}
.btn.solid:hover{background:linear-gradient(#1E8FFF,#0A7BEE)}
.btn.sm{height:30px;padding:0 11px;font-size:12px;border-radius:10px}
.btn.danger{color:#C0392B;border-color:#F2CFC9;background:#FFF5F3}
.search-top{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 10px;height:36px;width:160px}
.search-top:focus-within{border-color:rgba(10,132,255,.45);box-shadow:0 0 0 4px rgba(10,132,255,.10)}
.search-top input{border:0;outline:none;background:none;width:100%;font-size:13px;min-width:0}
.hero{padding:46px 0 22px;position:relative;overflow:hidden}
.hero::after{content:"";position:absolute;right:-120px;top:-140px;width:480px;height:480px;border-radius:50%;
  background:radial-gradient(circle,rgba(90,200,250,.34),rgba(90,200,250,0) 68%);pointer-events:none}
.kicker{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--blue);
  background:rgba(10,132,255,.08);border:1px solid rgba(10,132,255,.16);padding:5px 12px;border-radius:999px}
.kicker::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 4px rgba(10,132,255,.14)}
.hero h1{font-size:clamp(30px,6vw,50px);font-weight:800;line-height:1.16;letter-spacing:-.03em;margin:16px 0 0}
.hero h1 em{font-style:normal;color:var(--blue)}
.lede{color:var(--dim);font-size:15px;margin:14px 0 0;max-width:36em;line-height:1.8}
.hero-form{display:flex;gap:10px;margin-top:24px;max-width:560px}
.hero-form .field{flex:1;display:flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--line2);
  border-radius:16px;padding:0 14px;height:52px;box-shadow:0 6px 18px rgba(16,58,122,.07)}
.hero-form .field:focus-within{border-color:rgba(10,132,255,.5);box-shadow:0 0 0 5px rgba(10,132,255,.10),0 8px 22px rgba(16,58,122,.08)}
.hero-form input{flex:1;border:0;outline:none;background:none;font-size:16px;min-width:0}
.hero-form .go{height:52px;padding:0 22px;border-radius:16px;font-size:14.5px}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
.stat{background:#fff;border:1px solid rgba(228,235,244,.9);border-radius:16px;padding:12px 18px;box-shadow:var(--shadow)}
.stat b{font-size:22px;font-weight:800}
.stat b i{font-style:normal;font-size:11px;color:var(--blue);margin-left:2px}
.stat span{display:block;font-size:11.5px;color:var(--dim2)}
.sec{padding:26px 0 0}
.sec-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.sec-head h2{font-size:20px;font-weight:800;margin:0;letter-spacing:-.02em}
.sec-head .more{margin-left:auto;font-size:12.5px;color:var(--dim)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.chip{font-size:13px;color:var(--dim);border:1px solid var(--line);background:rgba(255,255,255,.85);
  border-radius:999px;padding:7px 14px;font-weight:500;transition:.2s var(--ease)}
.chip:hover{color:var(--text);background:#fff;box-shadow:0 3px 10px rgba(16,58,122,.07)}
.chip.on{color:#fff;background:linear-gradient(#0A84FF,#0A79EE);border-color:transparent;box-shadow:0 5px 14px rgba(10,132,255,.26)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.card{display:block;background:#fff;border:1px solid rgba(228,235,244,.9);border-radius:22px;padding:9px;
  box-shadow:var(--shadow);transition:transform .25s var(--ease),box-shadow .25s var(--ease)}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow-h)}
.cover{position:relative;aspect-ratio:1/1;border-radius:18px;overflow:hidden;
  background:radial-gradient(120% 110% at 18% 0,hsl(var(--h) 96% 78%/.85),transparent 58%),
             linear-gradient(150deg,hsl(var(--h) 92% 64%),hsl(calc(var(--h) + 16) 86% 47%));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 6px 14px hsl(var(--h) 80% 45%/.22)}
.cover::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,0) 46%)}
.cover .glyph{position:absolute;right:-4px;bottom:-18px;font-size:clamp(58px,13vw,104px);font-weight:800;
  line-height:.82;color:rgba(255,255,255,.32);letter-spacing:-.04em;user-select:none}
.cover .idx{position:absolute;left:12px;top:10px;font:9.5px/1 ui-monospace,monospace;letter-spacing:.12em;color:rgba(255,255,255,.85)}
.cover .genre{position:absolute;left:10px;bottom:10px;font-size:10.5px;font-weight:600;color:#fff;
  background:rgba(255,255,255,.22);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:3px 8px}
.cover .ten{position:absolute;right:10px;top:9px;font-size:12px;font-weight:700;color:#fff;background:rgba(11,27,51,.16);border-radius:7px;padding:1px 6px}
.card h3{font-size:14.5px;font-weight:700;margin:10px 2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .en{font-size:10.5px;color:var(--dim2);margin:1px 2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .meta{display:flex;gap:5px;margin:6px 2px 0;font-size:11.5px;color:var(--dim);flex-wrap:wrap}
.card .meta .sz{font-weight:600;color:#28405F}
.nets{display:flex;gap:5px;margin:8px 2px 2px}
.net{font-size:10px;padding:5px 8px;border-radius:7px;font-weight:600;color:#0A69CC;background:#EAF3FF;border:1px solid #D5E7FF}
.net.b{color:#56708F;background:#F2F5F9;border:1px solid #E2E9F1}
.net.a{color:#0E8FA8;background:#E8F8FC;border:1px solid #D2F0F2}
.empty{grid-column:1/-1;text-align:center;padding:56px 0;color:var(--dim2)}
.empty b{display:block;font-size:18px;color:var(--text);margin-bottom:8px}
.detail{padding:22px 0 0}
.crumb{font-size:12px;color:var(--dim2);margin-bottom:18px}
.d-head{display:grid;gap:24px}
.d-cover{position:relative;aspect-ratio:3/4;border-radius:26px;overflow:hidden;box-shadow:0 16px 36px rgba(16,58,122,.16);
  background:radial-gradient(120% 110% at 18% 0,hsl(var(--h) 96% 78%/.85),transparent 58%),
             linear-gradient(150deg,hsl(var(--h) 92% 64%),hsl(calc(var(--h) + 16) 86% 47%))}
.d-cover .glyph{position:absolute;right:-8px;bottom:-40px;font-size:150px;font-weight:800;color:rgba(255,255,255,.3);line-height:.8}
.c-tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--blue);
  background:var(--blue-l);border:1px solid #D5E7FF;padding:4px 11px;border-radius:999px}
.d-title{font-size:clamp(26px,4vw,34px);font-weight:800;line-height:1.22;margin:14px 0 0;letter-spacing:-.03em}
.d-en{font-size:12px;color:var(--dim2);margin-top:6px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px}
.tag{font-size:11.5px;color:var(--dim);background:#F4F8FD;border:1px solid var(--line);padding:4px 10px;border-radius:999px}
.desc{color:var(--dim);font-size:13.5px;line-height:1.9;margin:16px 0 0;max-width:44em;white-space:pre-wrap}
.d-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:20px}
.d-meta .cell{background:#fff;border:1px solid rgba(228,235,244,.95);border-radius:14px;padding:10px 12px;box-shadow:0 3px 10px rgba(16,58,122,.04)}
.d-meta .k{font:9.5px/1 ui-monospace,monospace;color:var(--dim2);letter-spacing:.1em}
.d-meta .v{font-size:13px;font-weight:600;margin-top:4px;color:#1B3150}
.dl-list{display:grid;gap:10px;margin-top:8px}
.dl{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;background:#fff;
  border:1px solid rgba(228,235,244,.95);border-radius:18px;padding:12px 14px;box-shadow:0 4px 12px rgba(16,58,122,.05)}
.dl .ic{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:13px}
.dl .ic.q{background:linear-gradient(#3D9BFF,#0A84FF)}.dl .ic.b{background:linear-gradient(#93A9C4,#6E86A3)}.dl .ic.a{background:linear-gradient(#6FE3F2,#22B8CF)}
.dl .nm{font-size:13.5px;font-weight:700;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dl .nm .code{font:10.5px/1 ui-monospace,monospace;color:var(--dim);background:#F3F7FC;border:1px solid var(--line);padding:3px 7px;border-radius:7px;font-weight:500}
.dl .sub{font-size:11px;color:var(--dim2);margin-top:2px}
.dl .act{display:flex;gap:7px}
.help-line{font-size:11.5px;color:var(--dim2);margin-top:12px;line-height:1.8}
.panel{background:#fff;border:1px solid rgba(228,235,244,.95);border-radius:22px;box-shadow:var(--shadow);overflow:hidden}
.panel-h{padding:14px 18px;border-bottom:1px solid var(--line);font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px}
.panel-b{padding:16px 18px}
.cmt{padding:14px 0;border-bottom:1px solid var(--line)}
.cmt:last-child{border-bottom:0}
.cmt .who{font-size:12px;color:var(--dim2)}
.cmt .who b{color:#28405F;font-weight:700}
.cmt .body{font-size:13.5px;color:var(--text);margin-top:5px;line-height:1.8;white-space:pre-wrap}
.form{background:#fff;border:1px solid rgba(228,235,244,.95);border-radius:22px;box-shadow:var(--shadow);padding:22px}
.form h2{font-size:18px;font-weight:800;margin:0 0 4px}
.form .sub{font-size:12.5px;color:var(--dim);margin:0 0 18px}
label{display:block;font-size:12px;font-weight:600;color:#36506F;margin:12px 0 6px}
input[type=text],input[type=password],input[type=url],textarea,select{width:100%;border:1px solid var(--line2);
  border-radius:12px;padding:11px 13px;font-size:15px;background:#fff;outline:none;transition:.18s;color:var(--text)}
input:focus,textarea:focus,select:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 4px rgba(10,132,255,.10)}
/* 胶囊搜索框内部不再画第二个边框 */
.hero-form .field input,.search-top input{border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;background:none!important}
.hero-form .field:focus-within input,.search-top:focus-within input{box-shadow:none!important}
.notice{display:flex;gap:10px;align-items:flex-start;background:linear-gradient(180deg,#F4F9FF,#EDF5FF);
  border:1px solid #D8E7FB;border-radius:16px;padding:12px 16px;margin:0 0 18px;font-size:13px;color:#16405F;line-height:1.75}
.notice .dot{flex:none;width:16px;height:16px;border-radius:50%;background:var(--blue);color:#fff;font-size:10px;
  display:grid;place-items:center;margin-top:2px;font-weight:700}
.notice b{color:#0A5DB8}
textarea{min-height:110px;resize:vertical;font-family:inherit;line-height:1.7}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form .actions{display:flex;gap:10px;margin-top:20px;align-items:center}
.form .hint{font-size:12px;color:var(--dim2)}
.alert{border-radius:14px;padding:11px 14px;font-size:13px;margin-bottom:16px;border:1px solid}
.alert.err{background:#FFF4F2;border-color:#F6D3CC;color:#B4382A}
.alert.ok{background:#EFFAF5;border-color:#C6EDD9;color:#1B7A52}
.alert.info{background:#F1F8FF;border-color:#D5E7FF;color:#0A5DB8}
.badge{display:inline-block;font-size:11px;padding:2px 9px;border-radius:999px;font-weight:600}
.badge.pending{background:#FFF6E6;color:#B4761B;border:1px solid #F5E2BE}
.badge.approved{background:#EFFAF5;color:#1B7A52;border:1px solid #C6EDD9}
.badge.rejected{background:#FFF4F2;color:#B4382A;border:1px solid #F6D3CC}
table.tbl{width:100%;border-collapse:collapse;font-size:13px}
table.tbl th{text-align:left;background:#F7FAFE;color:var(--dim);font-weight:600;font-size:12px;padding:10px 12px;border-bottom:1px solid var(--line)}
table.tbl td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}
table.tbl tr:last-child td{border-bottom:0}
footer{margin-top:46px;border-top:1px solid rgba(11,27,51,.07);padding:28px 0 38px;background:rgba(255,255,255,.72);
  font-size:12px;color:var(--dim2)}
.f-in{display:grid;gap:14px}
.f-links{display:flex;gap:16px;flex-wrap:wrap}
.f-brand{display:flex;align-items:center;gap:9px;color:var(--text)}
.f-brand img{width:24px;height:24px;border-radius:7px}
.f-brand b{font-size:15px;font-weight:800}
.toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,16px) scale(.96);opacity:0;pointer-events:none;
  background:rgba(255,255,255,.94);backdrop-filter:blur(18px);border:1px solid rgba(11,27,51,.08);
  padding:12px 20px;border-radius:16px;font-size:13px;font-weight:500;z-index:900;
  box-shadow:0 18px 44px rgba(16,58,122,.18);transition:.28s var(--ease);max-width:calc(100vw - 32px);text-align:center}
.toast.show{opacity:1;transform:translate(-50%,0) scale(1)}
.box{border:1px solid var(--line);border-radius:18px;padding:16px;margin-top:16px;background:#FBFDFF}
.box-h{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;margin-bottom:6px}
.box .hint{font-size:12px;color:var(--dim2);line-height:1.8;margin:0 0 10px}
.box .actions{margin-top:12px}
.ed-toolbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;border:1px solid var(--line2);border-bottom:0;
  border-radius:12px 12px 0 0;padding:6px;background:#F7FAFE}
.ed-toolbar button{height:28px;min-width:28px;padding:0 9px;border-radius:8px;font-size:12px;font-weight:600;
  border:1px solid var(--line);background:#fff;color:#36506F}
.ed-toolbar button:hover{background:#EAF3FF;border-color:#D5E7FF;color:var(--blue)}
.ed-body{min-height:200px;border:1px solid var(--line2);border-radius:0 0 12px 12px;padding:14px;background:#fff;
  font-size:14px;line-height:1.85;outline:none;overflow:auto}
.ed-body:focus{border-color:rgba(10,132,255,.55);box-shadow:0 0 0 4px rgba(10,132,255,.10)}
.ed-body img{max-width:100%;border-radius:12px;margin:8px 0}
.ed-body h2{font-size:17px;margin:14px 0 6px}.ed-body h3{font-size:15px;margin:12px 0 6px}
.ed-body ul,.ed-body ol{padding-left:22px}
.doc{font-size:13px;color:var(--text);line-height:1.9}
.doc h2{font-size:16px;margin:18px 0 8px}.doc h3{font-size:14px;margin:14px 0 6px}
.doc img{max-width:100%;border-radius:12px;margin:10px 0;box-shadow:0 6px 18px rgba(16,58,122,.10)}
.doc ul,.doc ol{padding-left:24px}.doc li{margin:4px 0}
.doc a{color:var(--blue);text-decoration:underline}
.doc table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12.5px}
.doc td,.doc th{border:1px solid var(--line);padding:8px 10px}
.cover.has-img{padding:0;overflow:hidden}
.cover.has-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:18px;z-index:1}
.cover.has-img .genre{z-index:3}
.navava{width:18px;height:18px;border-radius:50%;object-fit:cover;margin-right:5px;vertical-align:-4px;background:#E8F1FF}
.cava{display:inline-flex;width:22px;height:22px;border-radius:50%;overflow:hidden;background:#E8F1FF;color:#0A69CC;font-size:11px;font-weight:700;align-items:center;justify-content:center;margin-right:6px;vertical-align:-6px}
.cava img{width:100%;height:100%;object-fit:cover}
.rate{display:inline-block;margin:9px 2px 0;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:7px}
.rate.good{color:#1B7A52;background:#EFFAF5;border:1px solid #C6EDD9}
.rate.ok{color:#0A69CC;background:#EAF3FF;border:1px solid #D5E7FF}
.rate.bad{color:#B4761B;background:#FFF6E6;border:1px solid #F5E2BE}
.net.x{color:#C0392B;background:#FFF4F2;border:1px solid #F6D3CC}
.d-cover.has-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shots{display:grid;grid-template-columns:1fr;gap:10px}
.shots img{width:100%;border-radius:16px;border:1px solid var(--line);box-shadow:0 6px 18px rgba(16,58,122,.08)}
@media(min-width:700px){.shots{grid-template-columns:1fr 1fr}}
@media(min-width:560px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:900px){
  .grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
  .d-head{grid-template-columns:320px 1fr;gap:30px}
  .d-meta{grid-template-columns:repeat(3,1fr)}
  .d-cover{max-width:none}
}
@media(min-width:1180px){.grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const script = `
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');
  clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),2200);}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-copy]');
  if(!b) return;
  const t=b.dataset.copy;
  try{await navigator.clipboard.writeText(t);}catch(_){
    const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy')}catch(__){}ta.remove();
  }
  toast(b.dataset.msg||'已复制');
});
`;

const DEFAULT_SITE = {
  site_name: '蓝狗游戏站',
  site_sub: 'BLUE DOG GAMES',
  hero_title: '想玩的游戏\n都在蓝狗这里',
  hero_kicker: '网盘资源索引',
  hero_sub: 'PC 单机、Switch 模拟器、安卓手游按版本整理好。注册后可以自己投稿，审核通过就出现在首页。',
  section_title: '资源库',
  help_html: '',
  announcement: '',
  footer_note: '本站为游戏资源索引站，只收录版本信息与网盘入口，不托管游戏文件。收录内容须为自有版权、官方免费发布、开源或已获授权的资源。',
};

function layout({ title, body, user, active = '', flash = '', site = {} }) {
  const S = { ...DEFAULT_SITE, ...site };
  const authArea = user
    ? `<a class="btn sm" href="/submit">投稿</a>
       <a class="btn sm" href="/me">${user.avatar ? `<img class="navava" src="${esc(user.avatar)}" alt="">` : ''}${esc(user.username)}</a>
       <a class="btn sm" href="/account">设置</a>
       ${user.role === 'admin' ? '<a class="btn sm" href="/admin">审核</a>' : ''}
       <form method="post" action="/logout" style="display:inline"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><button class="btn sm" type="submit">退出</button></form>`
    : `<a class="btn sm" href="/login">登录</a><a class="btn sm solid" href="/register">注册</a>`;

  return `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · ${esc(S.site_name)}</title>
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="stylesheet" href="/style.css">
</head><body>
<header class="top"><div class="wrap top-in">
  <a class="brand" href="/"><img src="/logo.png" alt="${esc(S.site_name)}"><span><b>${esc(S.site_name)}</b><small>${esc(S.site_sub)}</small></span></a>
  <nav>
    <a href="/" class="${active==='home'?'on':''}">首页</a>
    <a href="/list" class="${active==='list'?'on':''}">全部游戏</a>
    <a href="/list?platform=PC" class="${active==='pc'?'on':''}">PC游戏</a>
    <a href="/rank" class="${active==='rank'?'on':''}">热门游戏</a>
    <a href="/new" class="${active==='new'?'on':''}">近期新游</a>
    <a href="/list?platform=${encodeURIComponent('安卓')}" class="${active==='mobile'?'on':''}">手机游戏</a>
    <a href="/submit" class="${active==='submit'?'on':''}">玩家投稿</a>
    <a href="/help" class="${active==='help'?'on':''}">帮助中心</a>
  </nav>
  <div class="top-right">${authArea}</div>
</div></header>
<main class="wrap">${flash}${body}</main>
<footer><div class="wrap f-in">
  <div class="f-brand"><img src="/logo.png" alt=""><b>${esc(S.site_name)}</b></div>
  <div class="f-links"><a href="/help">常见问题</a><a href="/submit">投稿与收录</a><a href="/list">全部资源</a></div>
  <div style="border-left:2px solid #D5E7FF;padding-left:12px;line-height:1.8;max-width:70em">
    ${esc(S.footer_note).replace(/\n/g, '<br>')}
  </div>
  <div style="font-family:ui-monospace,monospace;font-size:10.5px">© 2026 ${esc(S.site_name)} · 用户投稿均需人工审核后展示</div>
</div></footer>
<div class="toast" id="toast"></div>
<script>${script}</script>
</body></html>`;
}

function coverHTML(p, i) {
  if (p.cover) {
    return `<div class="cover has-img" style="--h:${p.hue}">
      <img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">
      <span class="genre">${esc(p.genre)}</span>
    </div>`;
  }
  return `<div class="cover" style="--h:${p.hue}">
    <span class="idx">NO.${String(i + 1).padStart(3, '0')}</span>
    <span class="glyph">${esc(p.title.slice(0, 1))}</span>
    <span class="genre">${esc(p.genre)}</span>
  </div>`;
}

function cardHTML(p, i) {
  const dateStr = fmt(p.created);
  return `<a class="card" href="/game/${p.id}">
    ${coverHTML(p, i)}
    <div class="rate ${p.rating >= 9 ? 'good' : p.rating >= 8 ? 'ok' : 'bad'}">${ratingLabel(p.rating)} ${(p.rating || 0).toFixed(1)}</div>
    <h3>${esc(p.title)}</h3>
    <div class="en">${esc(p.en)}</div>
    <div class="meta"><span class="sz">${esc(p.size)}</span><span>·</span><span>${dateStr}</span><span>·</span><span>${p.cmt || 0} 评论</span></div>
    <div class="nets"><span class="net">夸克</span>${p.link_b ? '<span class="net b">百度</span>' : ''}${p.link_a ? '<span class="net a">阿里</span>' : ''}${p.link_x ? '<span class="net x">迅雷</span>' : ''}</div>
  </a>`;
}

function gridHTML(posts) {
  if (!posts.length) return `<div class="empty"><b>还没有内容</b>换个关键词，或者去投稿页提交第一个资源。</div>`;
  return posts.map(cardHTML).join('');
}

function homeView({ posts, stats, user, genres, site = {} }) {
  const S = { ...DEFAULT_SITE, ...site };
  const lines = String(S.hero_title || '').split('\n').filter(Boolean);
  const heroTitle = lines.length
    ? lines.map((l, i) => (i === 0 ? esc(l) : `<em>${esc(l)}</em>`)).join('<br>')
    : '想玩的游戏<br><em>都在蓝狗这里</em>';
  return `<section class="hero">
    <div class="kicker">${esc(S.site_name)} · ${esc(S.hero_kicker)}</div>
    <h1>${heroTitle}</h1>
    <p class="lede">${esc(S.hero_sub)}</p>
    ${S.announcement ? `<div class="notice" style="max-width:620px"><span class="dot">!</span><div>${esc(S.announcement).replace(/\n/g, '<br>')}</div></div>` : ''}
    <form class="hero-form" method="get" action="/search">
      <div class="field"><input type="text" name="q" placeholder="试试「动作」「模拟经营」或游戏英文名" aria-label="搜索"></div>
      <button class="btn solid go" type="submit">搜索</button>
    </form>
    <div class="stats">
      <div class="stat"><b>${stats.total}<i>款</i></b><span>已收录</span></div>
      <div class="stat"><b>${stats.today}<i>款</i></b><span>今日更新</span></div>
      ${user && user.role === 'admin' ? `<div class="stat"><b>${stats.users}<i>人</i></b><span>注册用户</span></div>` : ''}
      <div class="stat"><b>${stats.comments}<i>条</i></b><span>玩家留言</span></div>
    </div>
  </section>
  <section class="sec">
    <div class="sec-head"><h2>${esc(S.section_title)}</h2><a class="more" href="/list">查看全部 →</a></div>
    <div class="chips">${genres.map(g => `<a class="chip ${g.on ? 'on' : ''}" href="/list?genre=${encodeURIComponent(g.name)}">${esc(g.name)}</a>`).join('')}</div>
    <div class="grid">${gridHTML(posts)}</div>
  </section>`;
}

function listView({ title, posts, q = '', genres, user }) {
  return `<section class="sec" style="padding-top:30px">
    <div class="sec-head"><h2>${esc(title)}</h2><span style="font-size:12px;color:var(--dim2)">${posts.length} 条结果</span></div>
    <form class="hero-form" method="get" action="/search" style="margin:0 0 18px;max-width:520px">
      <div class="field"><input type="text" name="q" value="${esc(q)}" placeholder="搜索游戏 / 英文名" aria-label="搜索"></div>
      <button class="btn solid go" type="submit" style="height:52px;border-radius:16px">搜索</button>
    </form>
    <div class="chips">${genres.map(g => `<a class="chip ${g.on ? 'on' : ''}" href="/list?genre=${encodeURIComponent(g.name)}">${esc(g.name)}</a>`).join('')}</div>
    <div class="grid">${gridHTML(posts)}</div>
  </section>`;
}

function netRow(kind, label, initial, url, code, sub) {
  if (!url) return '';
  return `<div class="dl">
    <div class="ic ${kind}">${initial}</div>
    <div><div class="nm">${label}${code ? `<span class="code">提取码 ${esc(code)}</span>` : ''}</div><div class="sub">${esc(sub)}</div></div>
    <div class="act">
      <button class="btn sm" data-copy="${esc(url)}" data-msg="链接已复制">复制链接</button>
      <a class="btn sm solid" href="${esc(url)}" target="_blank" rel="noopener">打开</a>
    </div>
  </div>`;
}

function postEditForm(p, user) {
  const f = (k) => esc(p[k] || '');
  return `<div class="form" style="margin:12px 0 22px">
    <h2 style="font-size:17px">编辑《${esc(p.title)}》</h2>
    <p class="sub">改完保存立刻生效。补新网盘链接、换失效链接直接改下面 4 组线路即可。</p>
    <form method="post" action="/admin/edit/${p.id}">
      <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
      <div class="row2">
        <div><label>游戏名</label><input type="text" name="title" value="${f('title')}" required maxlength="80"></div>
        <div><label>英文名</label><input type="text" name="en" value="${f('en')}" maxlength="60"></div>
      </div>
      <div class="row2">
        <div><label>分类</label><input type="text" name="genre" value="${f('genre')}"></div>
        <div><label>平台</label><input type="text" name="platform" value="${f('platform')}"></div>
      </div>
      <div class="row2">
        <div><label>体积</label><input type="text" name="size" value="${f('size')}"></div>
        <div><label>版本</label><input type="text" name="version" value="${f('version')}"></div>
      </div>
      <div class="row2">
        <div><label>年份</label><input type="text" name="year" value="${f('year')}" placeholder="2024"></div>
        <div><label>评分（0-10）</label><input type="text" name="rating" value="${p.rating}"></div>
      </div>
      <label>标签（用 / 分隔，会显示成 #标签）</label>
      <input type="text" name="tags" value="${f('tags')}" placeholder="像素风 / 联机 / 沙盒">
      <label>游戏介绍</label>
      <textarea name="desc" maxlength="400">${f('desc')}</textarea>
      <label>封面图链接</label>
      <input type="text" name="cover" value="${f('cover')}" placeholder="https://... 或 /uploads/xxx.jpg">
      <label>截图链接（多张换行分隔）</label>
      <textarea name="shots" style="min-height:60px">${f('shots')}</textarea>
      <label>配置要求</label>
      <textarea name="req" style="min-height:60px">${f('req')}</textarea>
      <label>更新日志</label>
      <textarea name="log" style="min-height:60px">${f('log')}</textarea>
      <div class="row2">
        <div><label>夸克链接</label><input type="text" name="link_q" value="${f('link_q')}"></div>
        <div><label>夸克提取码</label><input type="text" name="code_q" value="${f('code_q')}"></div>
      </div>
      <div class="row2">
        <div><label>百度链接</label><input type="text" name="link_b" value="${f('link_b')}"></div>
        <div><label>百度提取码</label><input type="text" name="code_b" value="${f('code_b')}"></div>
      </div>
      <div class="row2">
        <div><label>阿里链接</label><input type="text" name="link_a" value="${f('link_a')}"></div>
        <div><label>阿里提取码</label><input type="text" name="code_a" value="${f('code_a')}"></div>
      </div>
      <div class="row2">
        <div><label>迅雷链接</label><input type="text" name="link_x" value="${f('link_x')}"></div>
        <div><label>迅雷提取码</label><input type="text" name="code_x" value="${f('code_x')}"></div>
      </div>
      <div class="actions"><button class="btn solid" type="submit">保存修改</button><a class="btn" href="/game/${p.id}">取消</a></div>
    </form>
    <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:11.5px;color:var(--dim2)">删除后这条资源的评论、收藏和失效反馈会一起清掉，不可恢复。</span>
      <form method="post" action="/admin/delete" style="margin-left:auto" onsubmit="return confirm('确定删除《${esc(p.title)}》？不可恢复。')">
        <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
        <input type="hidden" name="id" value="${p.id}">
        <input type="hidden" name="next" value="/list">
        <button class="btn danger" type="submit">删除这条资源</button>
      </form>
    </div>
  </div>`;
}

function detailView({ p, comments, user, related, fav = false, editing = false }) {
  return `<section class="detail">
    <div class="crumb"><a href="/">首页</a> / <a href="/list?genre=${encodeURIComponent(p.genre)}">${esc(p.genre)}</a> / ${esc(p.title)}</div>
    ${user && user.role === 'admin' ? `<div style="display:flex;justify-content:flex-end;gap:8px;margin:8px 0">
      ${editing ? `<a class="btn sm" href="/game/${p.id}">退出编辑</a>` : `<a class="btn sm solid" href="/game/${p.id}?edit=1">✎ 编辑此帖</a>`}
    </div>` : ''}
    ${editing ? postEditForm(p, user) : ''}
    <div class="d-head">
      <div class="d-cover ${p.cover ? 'has-img' : ''}" style="--h:${p.hue}">
        ${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}">` : `<span class="glyph">${esc(p.title.slice(0, 1))}</span>`}
      </div>
      <div>
        <span class="c-tag">更新于 ${fmt(p.created)}</span>
        <span class="c-tag" style="color:#1B7A52;background:#EFFAF5;border-color:#C6EDD9">${ratingLabel(p.rating)}</span>
        <h1 class="d-title">${esc(p.title)}</h1>
        <div class="d-en">${esc(p.en)}</div>
        <div class="tags">
          <span class="tag">#${esc(p.platform)}</span><span class="tag">#${esc(p.genre)}</span>
          <span class="tag">${esc(p.size)}</span><span class="tag">${esc(p.version)}</span>
          ${(p.tags || '').split('/').map(t => t.trim()).filter(Boolean).slice(0, 4).map(t => `<a class="tag" href="/list?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}
        </div>
        <p class="desc">${esc(p.desc)}</p>
        <div class="d-meta">
          <div class="cell"><div class="k">版本</div><div class="v">${esc(p.version)}</div></div>
          <div class="cell"><div class="k">体积</div><div class="v">${esc(p.size)}</div></div>
          <div class="cell"><div class="k">平台</div><div class="v">${esc(p.platform)}</div></div>
          <div class="cell"><div class="k">分类</div><div class="v">${esc(p.genre)}</div></div>
          <div class="cell"><div class="k">评分</div><div class="v">${(p.rating || 0).toFixed(1)}</div></div>
          <div class="cell"><div class="k">浏览</div><div class="v">${p.views}</div></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
          ${user ? `<form method="post" action="/fav/${p.id}" style="display:inline">
            <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
            <button class="btn ${fav ? 'solid' : ''}" type="submit">${fav ? '★ 已收藏' : '☆ 收藏'}</button>
          </form>` : `<a class="btn" href="/login">☆ 收藏</a>`}
          <a class="btn" href="/report/${p.id}">⚑ 链接失效反馈</a>
        </div>
        <p class="help-line">投稿人：${esc(p.author || '管理员')}｜点「复制链接」拿到地址和提取码，转存到自己的网盘再下载。</p>
      </div>
    </div>
    ${p.shots ? `<div class="sec"><div class="sec-head"><h2>游戏截图</h2></div>
      <div class="shots">${p.shots.split(/[|\n]/).map(u => u.trim()).filter(Boolean).slice(0, 6).map(u => `<img src="${esc(u)}" alt="截图" loading="lazy">`).join('')}</div></div>` : ''}
    ${p.req ? `<div class="sec"><div class="sec-head"><h2>配置要求</h2></div>
      <div class="panel"><div class="panel-b doc" style="white-space:pre-wrap;font-size:13px;color:var(--dim)">${esc(p.req)}</div></div></div>` : ''}
    ${p.log ? `<div class="sec"><div class="sec-head"><h2>更新日志</h2></div>
      <div class="panel"><div class="panel-b doc" style="white-space:pre-wrap;font-size:13px;color:var(--dim)">${esc(p.log)}</div></div></div>` : ''}
    <div class="sec">
      <div class="sec-head"><h2>网盘资源</h2></div>
      <div class="dl-list">
        ${netRow('q', '夸克网盘', 'Q', p.link_q, p.code_q, '推荐线路 · 转存后不限速')}
        ${netRow('b', '百度网盘', 'B', p.link_b, p.code_b, '备用线路 · 需登录客户端')}
        ${netRow('a', '阿里云盘', 'A', p.link_a, p.code_a, '大文件线路 · 适合整包转存')}
        ${netRow('x', '迅雷网盘', 'X', p.link_x, p.code_x, '离线云添加 · 支持秒传')}
      </div>
      <div class="sec" style="padding-top:34px">
        <div class="sec-head"><h2>玩家留言</h2><span style="font-size:12px;color:var(--dim2)">${comments.length} 条</span></div>
        <div class="panel"><div class="panel-b" style="padding-top:0">
          ${comments.length ? comments.map(c => `<div class="cmt"><div class="who"><b>${esc(c.username)}</b> · ${fmt(c.created)}</div><div class="body">${esc(c.body)}</div></div>`).join('') : '<div style="padding:18px 0;color:var(--dim2);font-size:13px">还没有留言，注册后可以来说两句。</div>'}
          <form method="post" action="/comment/${p.id}" style="margin-top:16px">
            <input type="hidden" name="_csrf" value="${esc(user ? user.csrf : '')}">
            <textarea name="body" maxlength="600" placeholder="${user ? '说说你下的是哪个版本、跑起来顺不顺' : '登录后即可留言'}" ${user ? '' : 'disabled'}></textarea>
            <div style="display:flex;justify-content:flex-end;margin-top:10px">
              ${user ? '<button class="btn solid" type="submit">发表留言</button>' : '<a class="btn solid" href="/login">登录后留言</a>'}
            </div>
          </form>
        </div></div>
      </div>
      <div class="sec" style="padding-top:34px">
        <div class="sec-head"><h2>相关推荐</h2></div>
        <div class="grid">${gridHTML(related)}</div>
      </div>
    </div>
  </section>`;
}

function authView({ mode, error }) {
  const isLogin = mode === 'login';
  return `<section class="sec" style="padding-top:40px;max-width:460px">
    <div class="form">
      <h2>${isLogin ? '登录蓝狗游戏站' : '注册新账号'}</h2>
      <p class="sub">${isLogin ? '登录后可以投稿、留言、查看自己的投稿进度。' : '账号用来登录，昵称是投稿和留言时显示的名字，两者可以不一样。'}</p>
      ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
      <form method="post" action="/${isLogin ? 'login' : 'register'}">
        ${isLogin ? `<label>账号</label>
        <input type="text" name="username" autocomplete="username" required placeholder="注册时填的账号">` : `<label>账号 *</label>
        <input type="text" name="account" autocomplete="username" required minlength="3" maxlength="16" placeholder="3-16 位字母/数字/下划线，登录用">
        <label>昵称（别人看到的名字）</label>
        <input type="text" name="nickname" maxlength="16" placeholder="2-16 位，中文也行；留空就用账号">`}
        <label>密码</label>
        <input type="password" name="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required minlength="6" placeholder="至少 6 位">
        <div class="actions">
          <button class="btn solid" type="submit">${isLogin ? '登录' : '注册'}</button>
          ${isLogin ? '<a class="hint" href="/register">还没有账号？去注册</a>' : '<a class="hint" href="/login">已有账号？去登录</a>'}
        </div>
      </form>
    </div>
    <div class="alert info" style="margin-top:16px">提示：注册不需要邮箱验证。用户名和密码妥善保存，忘记密码只能重新注册。</div>
  </section>`;
}

function submitView({ user, error, ok, notice }) {
  return `<section class="sec" style="padding-top:30px">
    <div class="form">
      <h2>投稿游戏资源</h2>
      <p class="sub">三种方式任选：粘贴分享文本自动识别、上传表格批量导入、手动填一条。提交后统一进入待审核队列。</p>
      ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
      ${ok ? `<div class="alert ok">${esc(notice || '已提交，等待审核。可以在「我的投稿」里看进度。')}</div>` : ''}

      <div class="box">
        <div class="box-h"><b>① 粘贴分享文本，自动识别</b><span class="hint">推荐</span></div>
        <p class="hint">把网盘 App 里「复制链接」的整段话贴进来，自动认出游戏名、链接、提取码，夸克 / 百度 / 阿里 / 迅雷自动分线路。一次贴多条也行。</p>
        <form method="post" action="/submit/preview">
          <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
          <textarea name="bulk_text" required placeholder="例：&#10;「艾尔登法环」https://pan.quark.cn/s/abcd1234 提取码：8x2k&#10;「双人成行」https://pan.xunlei.com/s/xyz 提取码：q1w2"></textarea>
          <div class="actions">
            <button class="btn solid" type="submit">识别并预览</button>
            <button class="btn" type="submit" formaction="/submit/batch" formnovalidate>不用预览，直接提交</button>
          </div>
        </form>
      </div>

      <div class="box">
        <div class="box-h"><b>② 上传表格批量导入</b><span class="hint">.xlsx / .csv</span></div>
        <p class="hint">表格第一行写表头：中文名、英文名、类型、平台、体积、版本、介绍、夸克链接、提取码、迅雷链接。没有表头也能按顺序读。</p>
        <form method="post" action="/submit/file" enctype="multipart/form-data">
          <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
          <input type="file" name="file" accept=".xlsx,.xls,.csv" required style="padding:9px 0">
          <div class="actions">
            <button class="btn solid" type="submit">上传并导入</button>
            <a class="btn" href="/submit/template.csv">下载 CSV 模板</a>
          </div>
        </form>
      </div>

      <div class="box">
        <div class="box-h"><b>③ 手动填一条</b><span class="hint">字段最全</span></div>
        <form method="post" action="/submit">
          <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
          <div class="row2">
            <div><label>中文名 *</label><input type="text" name="title" required maxlength="40" placeholder="例：灰烬回廊"></div>
            <div><label>英文名</label><input type="text" name="en" maxlength="60" placeholder="Ashen Corridor"></div>
          </div>
          <div class="row2">
            <div><label>类型 *</label>
              <select name="genre">${['动作冒险','角色扮演','射击','策略','模拟经营','独立','恐怖生存','竞速','解谜','休闲'].map(g => `<option>${g}</option>`).join('')}</select>
            </div>
            <div><label>平台 *</label>
              <select name="platform"><option>PC</option><option>Switch</option><option>安卓</option></select>
            </div>
          </div>
          <div class="row2">
            <div><label>体积</label><input type="text" name="size" maxlength="12" placeholder="12.4 GB"></div>
            <div><label>版本</label><input type="text" name="version" maxlength="20" placeholder="Build.2641"></div>
          </div>
          <label>游戏介绍 *</label>
          <textarea name="desc" required maxlength="400" placeholder="两三句话说清楚是什么游戏、什么玩法、这次更新了什么。"></textarea>
          <div class="row2">
            <div><label>封面图链接（可选）</label><input type="text" name="cover" id="coverInput" maxlength="400" placeholder="https://.../cover.jpg 或右侧上传"></div>
            <div><label>上传封面</label><input type="file" id="coverFile" accept="image/*" style="padding:9px 0"></div>
          </div>
          <label>截图链接（可选，多张用换行分隔）</label>
          <textarea name="shots" maxlength="1200" style="min-height:64px" placeholder="https://.../1.jpg&#10;https://.../2.jpg"></textarea>
          <label>夸克网盘链接（至少填一条线路）</label>
          <input type="url" name="link_q" placeholder="https://pan.quark.cn/s/xxxx">
          <div class="row2" style="margin-top:12px">
            <div><label style="margin-top:0">夸克提取码</label><input type="text" name="code_q" maxlength="12" placeholder="可不填"></div>
            <div><label style="margin-top:0">百度网盘</label><input type="url" name="link_b" placeholder="https://pan.baidu.com/s/xxxx"></div>
          </div>
          <div class="row2" style="margin-top:12px">
            <div><label style="margin-top:0">百度提取码</label><input type="text" name="code_b" maxlength="12"></div>
            <div><label style="margin-top:0">阿里云盘</label><input type="url" name="link_a" placeholder="https://www.alipan.com/s/xxxx"></div>
          </div>
          <div class="row2" style="margin-top:12px">
            <div><label style="margin-top:0">迅雷网盘</label><input type="url" name="link_x" placeholder="https://pan.xunlei.com/s/xxxx"></div>
            <div><label style="margin-top:0">迅雷提取码</label><input type="text" name="code_x" maxlength="12"></div>
          </div>
          <div class="actions">
            <button class="btn solid" type="submit">提交审核</button>
            <span class="hint">一般 24 小时内处理完</span>
          </div>
        </form>
      </div>
      <p class="hint" style="margin-top:14px">只提交自有版权、官方免费发布、开源或已获授权的资源；网盘链接失效会被驳回。</p>
      <script>
      (function(){
        var f=document.getElementById('coverFile'), inp=document.getElementById('coverInput');
        if(!f||!inp) return;
        f.addEventListener('change', function(){
          if(!f.files[0]) return;
          var fd=new FormData(); fd.append('file', f.files[0]); fd.append('_csrf','${esc(user.csrf)}');
          toast('封面上传中…');
          fetch('/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(d){
            if(!d.ok) return toast(d.error||'上传失败');
            inp.value=d.url; toast('封面已上传，提交后会一起保存');
          }).catch(function(){ toast('上传失败'); });
          f.value='';
        });
      })();
      </script>
    </div>
  </section>`;
}

function previewView({ user, items }) {
  const netName = { q: '夸克', b: '百度', a: '阿里', x: '迅雷' };
  const norm = (it, i) => ({
    ...it,
    genre: it.genre || '待补充', platform: it.platform || 'PC',
    size: it.size || '—', version: it.version || '—', en: it.en || '',
    rating: 8.0, hue: it.hue || (210 + i * 23) % 350,
  });
  return `<section class="sec" style="padding-top:30px">
    <div class="sec-head"><h2>识别结果 ${items.length} 条</h2><span style="font-size:12px;color:var(--dim2)">先看卡片效果，再核对下面的字段</span></div>
    ${items.length ? `<div class="grid">${items.map((it, i) => cardHTML(norm(it, i), i)).join('')}</div>` : '<div class="alert err">没识别到有效链接，回去检查一下文本。</div>'}
    <form method="post" action="/submit/batch" id="pvForm" style="margin-top:26px">
      <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
      <input type="hidden" name="bulk_text" id="bulkText" value="">
      ${items.map((it, i) => `<div class="panel pvitem" style="margin-bottom:12px">
        <div class="panel-h" style="justify-content:space-between"><b>第 ${i + 1} 条</b><span style="font-size:11px;color:var(--dim2)">识别到 ${['q','b','a','x'].filter(k => it['link_' + k]).map(k => netName[k]).join('、') || '无线路'}</span></div>
        <div class="panel-b">
          <div class="row2">
            <div><label>游戏名</label><input type="text" name="title" value="${esc(it.title || '')}" placeholder="中文名"></div>
            <div><label>英文名（可空）</label><input type="text" name="en" value="${esc(it.en || '')}"></div>
          </div>
          <div class="row2">
            <div><label>分类</label><input type="text" name="genre" value="${esc(it.genre || '')}" placeholder="动作冒险 / 休闲益智"></div>
            <div><label>平台</label><input type="text" name="platform" value="${esc(it.platform || 'PC')}" placeholder="PC / Switch / 安卓"></div>
          </div>
          <div class="row2">
            <div><label>体积</label><input type="text" name="size" value="${esc(it.size || '')}" placeholder="12.4GB"></div>
            <div><label>版本</label><input type="text" name="version" value="${esc(it.version || '')}" placeholder="v1.83"></div>
          </div>
          <label>封面图链接（可空）</label>
          <input type="text" name="cover" value="${esc(it.cover || '')}" placeholder="https://.../cover.jpg">
          ${['q','b','a','x'].map(k => it['link_' + k] ? `<div class="row2">
            <div><label>${netName[k]}链接</label><input type="text" name="link_${k}" value="${esc(it['link_' + k])}"></div>
            <div><label>${netName[k]}提取码</label><input type="text" name="code_${k}" value="${esc(it['code_' + k] || '')}"></div>
          </div>` : '').join('')}
        </div>
      </div>`).join('')}
      <div class="actions">
        <button class="btn solid" type="submit" ${items.length ? '' : 'disabled'}>确认提交这 ${items.length} 条</button>
        <a class="btn" href="/submit">返回修改</a>
      </div>
    </form>
    <p class="hint">提交后全部进入待审核，管理员通过后才出现在站点。</p>
  </section>
  <script>
  (function(){
    var f = document.getElementById('pvForm');
    if (!f) return;
    f.addEventListener('submit', function(){
      var arr = [].map.call(f.querySelectorAll('.pvitem'), function(el){
        var o = {};
        [].forEach.call(el.querySelectorAll('input'), function(i){ if (i.name) o[i.name] = i.value.trim(); });
        return o;
      });
      document.getElementById('bulkText').value = arr.map(function(o){ return JSON.stringify(o); }).join('\n');
    });
  })();
  </script>`;
}

function meView({ user, posts, favs = [], tickets = [], tab = 'posts' }) {
  const tabs = [['posts', '我的投稿', posts.length], ['favs', '我的收藏', favs.length], ['tickets', '我的反馈', tickets.length]];
  const listPosts = `<div class="panel"><table class="tbl">
      <tr><th>游戏</th><th>状态</th><th>提交时间</th><th></th></tr>
      ${posts.length ? posts.map(p => `<tr>
        <td><b>${esc(p.title)}</b><div style="font-size:11px;color:var(--dim2)">${esc(p.size)} · ${esc(p.version)}</div></td>
        <td><span class="badge ${p.status}">${p.status === 'pending' ? '待审核' : p.status === 'approved' ? '已通过' : '未通过'}</span></td>
        <td style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dim2)">${fmt(p.created)}</td>
        <td>${p.status === 'approved' ? `<a class="btn sm" href="/game/${p.id}">查看</a>` : ''}</td>
      </tr>`).join('') : '<tr><td colspan="4" style="padding:26px 0;text-align:center;color:var(--dim2)">还没投稿，去提交第一个吧</td></tr>'}
    </table></div>`;
  const listFavs = `<div class="grid">${favs.length ? favs.map(cardHTML).join('') : '<div class="empty"><b>还没有收藏</b>在游戏详情页点「☆ 收藏」，这里就能快速找回。</div>'}</div>`;
  const listTickets = `<div class="panel"><table class="tbl">
      <tr><th>游戏</th><th>类型</th><th>处理状态</th><th>提交时间</th></tr>
      ${tickets.length ? tickets.map(t => `<tr>
        <td><a href="/game/${t.post_id}">${esc(t.title)}</a><div style="font-size:11px;color:var(--dim2)">${esc(t.body.slice(0, 60))}</div></td>
        <td>${esc(t.kind)}</td>
        <td><span class="badge ${t.status === 'open' ? 'pending' : 'approved'}">${t.status === 'open' ? '待处理' : '已处理'}</span></td>
        <td style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dim2)">${fmt(t.created)}</td>
      </tr>`).join('') : '<tr><td colspan="4" style="padding:26px 0;text-align:center;color:var(--dim2)">没有提交过反馈</td></tr>'}
    </table></div>`;
  const body = tab === 'favs' ? listFavs : tab === 'tickets' ? listTickets : listPosts;
  return `<section class="sec" style="padding-top:30px">
    <div class="sec-head"><h2>${esc(user.username)}</h2><a class="more" href="/submit">＋ 再投一个</a></div>
    <div class="chips" style="margin-bottom:16px">
      ${tabs.map(([k, label, n]) => `<a class="chip ${tab === k ? 'on' : ''}" href="/me?tab=${k}">${label} ${n}</a>`).join('')}
    </div>
    ${body}
  </section>`;
}

function accountView({ user, days = 999, ok = false, error = '' }) {
  const isAdmin = user.role === 'admin';
  const wait = 30 - days;
  const av = user.avatar || '';
  return `<section class="sec" style="padding-top:30px;max-width:560px">
    <div class="sec-head"><h2>账号设置</h2><a class="more" href="/me">← 我的</a></div>
    <div class="form">
      ${ok ? '<div class="alert ok">已保存</div>' : ''}
      ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:#E8F1FF;display:flex;align-items:center;justify-content:center;font-weight:700;color:#0A69CC">
          ${av ? `<img src="${esc(av)}" style="width:100%;height:100%;object-fit:cover" alt="">` : esc(user.username.slice(0, 1))}
        </div>
        <div>
          <div style="font-weight:700;font-size:15px">${esc(user.username)}</div>
          <div style="font-size:11.5px;color:var(--dim2)">登录账号：${esc(user.account || user.username)}${isAdmin ? ' · 管理员' : ''}</div>
        </div>
      </div>
      <form method="post" action="/account">
        <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
        <input type="hidden" name="avatar" id="avatarVal" value="${esc(av)}">
        <label>昵称（投稿人、评论区显示的名字）</label>
        <input type="text" name="nickname" value="${esc(user.username)}" maxlength="16" placeholder="2-16 位，中文也行">
        <p class="hint" style="margin-top:6px">${isAdmin ? '管理员不受改名次数限制。' : days < 30 ? `30 天只能改一次，上次改于 ${fmt(user.nick_changed)}，还需等 ${wait} 天。` : '普通用户 30 天可改一次昵称。'}</p>
        <label style="margin-top:14px">头像</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="file" id="avaFile" accept="image/*" style="flex:1;min-width:180px">
          <input type="text" id="avatarUrl" value="${esc(av)}" placeholder="也可以填图片链接" style="flex:1;min-width:180px">
        </div>
        <div class="actions"><button class="btn solid" type="submit">保存</button><a class="btn" href="/me">返回</a></div>
      </form>
    </div>
    <p class="hint">头像会显示在右上角、评论区。上传后立即生效。</p>
  </section>
  <script>
  (function(){
    var f = document.getElementById('avaFile'), val = document.getElementById('avatarVal'), url = document.getElementById('avatarUrl');
    if (!f) return;
    ['input','change'].forEach(function(ev){
      url.addEventListener(ev, function(){ val.value = url.value.trim(); });
    });
    f.addEventListener('change', function(){
      if (!f.files[0]) return;
      var fd = new FormData(); fd.append('file', f.files[0]); fd.append('_csrf','${esc(user.csrf)}');
      toast('头像上传中…');
      fetch('/upload', { method:'POST', body: fd }).then(function(r){ return r.json(); }).then(function(d){
        if (!d.ok) return toast(d.error || '上传失败');
        url.value = d.url; val.value = d.url; toast('已上传，记得点保存');
      }).catch(function(){ toast('上传失败'); });
    });
  })();
  </script>`;
}

function reportView({ user, p, done }) {
  return `<section class="sec" style="padding-top:30px;max-width:620px">
    <div class="form">
      <h2>链接失效反馈</h2>
      <p class="sub">${esc(p.title)} · 提交后管理员会在后台看到，补链或换成新版本。</p>
      ${done ? '<div class="alert ok">已提交，管理员处理后会更新链接。你可以在「我的 → 我的反馈」里看状态。</div>' : ''}
      ${user ? `<form method="post" action="/report/${p.id}">
        <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
        <label>问题类型</label>
        <select name="kind"><option>链接打不开</option><option>提取码错误</option><option>文件损坏/缺分卷</option><option>版本不对</option><option>其他</option></select>
        <label>具体说明</label>
        <textarea name="body" required maxlength="400" placeholder="哪条线路、报什么错、什么时候试的。"></textarea>
        <label>联系方式（可选）</label>
        <input type="text" name="contact" maxlength="60" placeholder="QQ / 邮箱，方便补链后通知你">
        <div class="actions"><button class="btn solid" type="submit">提交反馈</button><a class="btn" href="/game/${p.id}">返回游戏页</a></div>
      </form>` : `<div class="alert info">登录后才能提交反馈。</div><a class="btn solid" href="/login">去登录</a>`}
    </div>
  </section>`;
}

function adminView({ user, pending, all, tickets = [], q = '' }) {
  return `<section class="sec" style="padding-top:30px">
    <div class="sec-head"><h2>审核后台</h2>
      <a class="btn sm" href="/admin/settings">⚙ 站点设置</a>
      <span style="font-size:12px;color:var(--dim2);margin-left:auto">${pending.length} 条待处理</span></div>
    <div class="panel"><table class="tbl">
      <tr><th>游戏</th><th>投稿人</th><th>链接</th><th>操作</th></tr>
      ${pending.length ? pending.map(p => `<tr>
        <td><b>${esc(p.title)}</b><div style="font-size:11px;color:var(--dim2)">${esc(p.genre)} · ${esc(p.size)} · ${esc(p.version)}</div>
          <div style="font-size:11.5px;color:var(--dim);margin-top:4px;max-width:40em">${esc(p.desc.slice(0, 120))}</div></td>
        <td>${esc(p.author)}</td>
        <td style="word-break:break-all;font-size:11.5px;max-width:16em">${esc(p.link_q)}</td>
        <td style="white-space:nowrap">
          <form method="post" action="/admin/approve" style="display:inline"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><input type="hidden" name="id" value="${p.id}"><button class="btn sm solid">通过</button></form>
          <form method="post" action="/admin/reject" style="display:inline"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><input type="hidden" name="id" value="${p.id}"><button class="btn sm danger">驳回</button></form>
          <form method="post" action="/admin/delete" style="display:inline" onsubmit="return confirm('确定删除《${esc(p.title)}》？评论和收藏会一起删掉，不可恢复。')"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><input type="hidden" name="id" value="${p.id}"><button class="btn sm danger">删除</button></form>
        </td>
      </tr>`).join('') : '<tr><td colspan="4" style="padding:26px 0;text-align:center;color:var(--dim2)">没有待审核的投稿</td></tr>'}
    </table></div>
    <div class="sec-head" style="margin-top:30px"><h2>失效反馈</h2><span style="font-size:12px;color:var(--dim2)">${tickets.length} 条待处理</span></div>
    <div class="panel"><table class="tbl">
      <tr><th>游戏</th><th>类型</th><th>说明</th><th>提交人</th><th></th></tr>
      ${tickets.length ? tickets.map(t => `<tr>
        <td><a href="/game/${t.pid}">${esc(t.title)}</a></td>
        <td>${esc(t.kind)}</td>
        <td style="max-width:32em"><div style="font-size:12px;color:var(--dim);line-height:1.8">${esc(t.body)}</div>${t.contact ? `<div style="font-size:11px;color:var(--dim2);margin-top:4px">联系：${esc(t.contact)}</div>` : ''}</td>
        <td>${esc(t.username || '游客')}<div style="font:11px/1.6 ui-monospace,monospace;color:var(--dim2)">${fmt(t.created)}</div></td>
        <td><form method="post" action="/admin/ticket" style="display:inline"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><input type="hidden" name="id" value="${t.id}"><button class="btn sm">标记已处理</button></form></td>
      </tr>`).join('') : '<tr><td colspan="5" style="padding:26px 0;text-align:center;color:var(--dim2)">没有待处理的反馈</td></tr>'}
    </table></div>
    <div class="sec-head" style="margin-top:30px"><h2>全部内容</h2>
      <form method="get" action="/admin" style="margin-left:auto;display:flex;gap:8px">
        <input type="text" name="q" value="${esc(q || '')}" placeholder="搜游戏名 / 英文名 / 标签" style="height:32px;width:220px;border-radius:10px;border:1px solid var(--line);padding:0 12px;font-size:12.5px">
        <button class="btn sm" type="submit">搜索</button>
        ${q ? '<a class="btn sm" href="/admin">清空</a>' : ''}
      </form>
      <span style="font-size:12px;color:var(--dim2);margin-left:12px">${all.length} 条</span></div>
    <div class="panel"><table class="tbl">
      <tr><th>游戏</th><th>状态</th><th>时间</th><th></th></tr>
      ${all.length ? all.map(p => `<tr><td><a href="/game/${p.id}">${esc(p.title)}</a></td>
        <td><span class="badge ${p.status}">${p.status === 'pending' ? '待审核' : p.status === 'approved' ? '已通过' : '未通过'}</span></td>
        <td style="font:11.5px/1.6 ui-monospace,monospace;color:var(--dim2)">${fmt(p.created)}</td>
        <td style="white-space:nowrap">${p.status !== 'approved' ? `<form method="post" action="/admin/approve" style="display:inline"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><input type="hidden" name="id" value="${p.id}"><button class="btn sm">通过</button></form>` : ''}
          <form method="post" action="/admin/delete" style="display:inline" onsubmit="return confirm('确定删除《${esc(p.title)}》？不可恢复。')"><input type="hidden" name="_csrf" value="${esc(user.csrf)}"><input type="hidden" name="id" value="${p.id}"><button class="btn sm danger">删除</button></form>
        </td></tr>`).join('') : `<tr><td colspan="4" style="padding:26px 0;text-align:center;color:var(--dim2)">${q ? '没搜到匹配的内容' : '还没有内容'}</td></tr>`}
    </table></div>
  </section>`;
}

function adminSettingsView({ user, site, ok, error }) {
  const S = { ...DEFAULT_SITE, ...site };
  return `<section class="sec" style="padding-top:30px;max-width:820px">
    <div class="sec-head"><h2>站点设置</h2><a class="more" href="/admin">← 回审核后台</a></div>
    <div class="form">
      <p class="sub">改完点保存，前台立刻生效，不用重启。带 * 的会显示在首页最显眼的位置。</p>
      ${ok ? '<div class="alert ok">已保存，前台已更新</div>' : ''}
      ${error ? `<div class="alert err">${esc(error)}</div>` : ''}
      <form method="post" action="/admin/settings" id="settingsForm">
        <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
        <div class="row2">
          <div><label>站点名称 *</label><input type="text" name="site_name" maxlength="20" value="${esc(S.site_name)}"></div>
          <div><label>英文副名</label><input type="text" name="site_sub" maxlength="30" value="${esc(S.site_sub)}"></div>
        </div>
        <div class="row2">
          <div><label>首页小标签（站点名后面的那句）</label><input type="text" name="hero_kicker" maxlength="24" value="${esc(S.hero_kicker)}"></div>
          <div><label>首页资源区标题</label><input type="text" name="section_title" maxlength="24" value="${esc(S.section_title)}"></div>
        </div>
        <label>首页大标题 *（换行即换行，第二行自动变蓝）</label>
        <textarea name="hero_title" maxlength="80" style="min-height:76px">${esc(S.hero_title)}</textarea>
        <label>首页副标题</label>
        <textarea name="hero_sub" maxlength="200" style="min-height:76px">${esc(S.hero_sub)}</textarea>
        <label>站点公告（留空则不显示；支持换行）</label>
        <textarea name="announcement" maxlength="300" placeholder="例：本周新增 12 款资源，夸克线路已全部补链。">${esc(S.announcement)}</textarea>
        <label>页脚说明 / 免责声明</label>
        <textarea name="footer_note" maxlength="400">${esc(S.footer_note)}</textarea>

        <label>帮助中心页面内容（可加粗、标题、列表、插图；留空则用默认问答）</label>
        <div class="ed-toolbar">
          <button type="button" data-cmd="bold"><b>B</b></button>
          <button type="button" data-cmd="italic"><i>I</i></button>
          <button type="button" data-cmd="formatBlock" data-val="h2">标题</button>
          <button type="button" data-cmd="formatBlock" data-val="h3">小标题</button>
          <button type="button" data-cmd="insertUnorderedList">列表</button>
          <button type="button" data-cmd="createLink">链接</button>
          <button type="button" id="edImg">插入图片</button>
          <button type="button" data-cmd="removeFormat">清格式</button>
        </div>
        <div class="ed-body" id="edBody" contenteditable="true">${S.help_html || ''}</div>
        <input type="hidden" name="help_html" id="helpHtml" value="${esc(S.help_html || '')}">
        <input type="file" id="edFile" accept="image/*" style="display:none">

        <div class="actions">
          <button class="btn solid" type="submit">保存设置</button>
          <span class="hint">其他页面文案（按钮文字、详情页标签）在 views.js 里，需要改告诉我具体哪句。</span>
        </div>
      </form>
    </div>
  </section>
  <script>
  (function(){
    var body = document.getElementById('edBody');
    var csrf = document.querySelector('#settingsForm input[name=_csrf]').value;
    document.querySelectorAll('.ed-toolbar [data-cmd]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var cmd = btn.dataset.cmd, val = btn.dataset.val || null;
        body.focus();
        if (cmd === 'createLink') { var u = prompt('链接地址', 'https://'); if (!u) return; document.execCommand('createLink', false, u); }
        else if (val) document.execCommand(cmd, false, val);
        else document.execCommand(cmd, false, null);
      });
    });
    var file = document.getElementById('edFile');
    document.getElementById('edImg').addEventListener('click', function(){ file.click(); });
    file.addEventListener('change', function(){
      if (!file.files[0]) return;
      var fd = new FormData(); fd.append('file', file.files[0]); fd.append('_csrf', csrf);
      toast('图片上传中…');
      fetch('/upload', { method: 'POST', body: fd }).then(function(r){ return r.json(); }).then(function(d){
        if (!d.ok) return toast(d.error || '上传失败');
        body.focus();
        var img = '<img src="' + d.url + '" alt="">';
        document.execCommand('insertHTML', false, img);
        toast('图片已插入，记得点保存');
      }).catch(function(){ toast('上传失败'); });
      file.value = '';
    });
    document.getElementById('settingsForm').addEventListener('submit', function(){
      document.getElementById('helpHtml').value = body.innerHTML;
    });
    if (!body.innerHTML.trim()) {
      body.innerHTML = '<p>把常见问题写在这里，想插图片就点上面的「插入图片」。</p>';
    }
  })();
  </script>`;
}

function helpView({ user, site = {} }) {
  if (site.help_html && site.help_html.trim()) {
    return `<section class="sec" style="padding-top:30px">
      <div class="sec-head"><h2>帮助中心</h2></div>
      <div class="panel"><div class="panel-b doc">${site.help_html}</div></div>
    </section>`;
  }
  const faq = [
    ['怎么注册账号？', '点右上角「注册」，填一个 2-16 位的用户名（中文、英文、数字都行）和至少 6 位密码即可，不需要邮箱验证。'],
    ['投稿之后多久能看到？', '提交后进入待审核队列，管理员确认链接有效、来源合规后才会展示，一般 24 小时内。'],
    ['网盘链接打不开怎么办？', '先换一个网盘线路（夸克 / 百度 / 阿里互为备份）。都失效就在游戏页留言，管理员会补链。'],
    ['分卷压缩包怎么合并？', '用 7-Zip 或 Bandizip 选中第一个分卷（.001）解压，其余分卷不要改名、不要移动。'],
    ['解压路径有什么要求？', '必须是纯英文路径，不要带中文、空格和特殊符号，例如 D:\\Games\\AshenCorridor。'],
    ['为什么我的投稿被驳回？', '常见原因：链接失效、来源无授权、重复收录、介绍与内容不符。修改后可以重新提交。'],
  ];
  return `<section class="sec" style="padding-top:30px">
    <div class="sec-head"><h2>帮助中心</h2></div>
    <div class="panel">${faq.map(([q, a]) => `<div style="border-bottom:1px solid var(--line)"><div class="panel-b"><b style="font-size:13.5px">${esc(q)}</b><div style="font-size:12.5px;color:var(--dim);line-height:1.85;margin-top:6px">${esc(a)}</div></div></div>`).join('')}</div>
    <div class="sec-head" style="margin-top:30px"><h2>收录标准</h2></div>
    <div class="panel"><div class="panel-b" style="font-size:13px;color:var(--dim);line-height:1.9">
      1. 只收自有版权、官方免费发放、开源或已获书面授权的内容；<br>
      2. 网盘链接必须有效，分卷完整；<br>
      3. 一个游戏一个版本，重复内容会被合并；<br>
      4. 提交时写清楚版本号和体积，方便别人判断该下哪个。
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line);font-size:12px;color:var(--dim2)">
        管理员账号：${esc(process.env.ADMIN_NAME || 'admin')}｜当前登录：${user ? esc(user.username) : '未登录'}
      </div>
    </div></div>
  </section>`;
}

module.exports = { css, layout, homeView, listView, detailView, authView, submitView, previewView, meView, accountView, adminView, adminSettingsView, reportView, helpView, DEFAULT_SITE, esc, fmt };
