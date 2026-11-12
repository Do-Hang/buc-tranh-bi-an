/* ===== BỨC TRANH BÍ ẨN – Ms. Hằng Đỗ – xuất game tương tác (HTML & PowerPoint) ===== */
(function (G) {
'use strict';
const E = G.GMBT, PT = E.PT, LET = E.LET;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---- văn bản có công thức → HTML (công thức là SVG nội tuyến) ---- */
function richHTML(text, mathInfo) {
  return E.splitMath(text).map(p => {
    if (p.m == null) return esc(p.t);
    const mi = mathInfo(p.m.trim()); if (!mi) return esc('$' + p.m + '$');
    return `<svg class="mx" viewBox="${mi.vb}" style="width:${mi.w.toFixed(3)}em;height:${(mi.asc + mi.desc).toFixed(3)}em;vertical-align:-${mi.desc.toFixed(3)}em" fill="currentColor" stroke="currentColor">${mi.inner}</svg>`;
  }).join('');
}

/* ---- dữ liệu game ---- */
function buildGameData(ds, part, cellMM, mathInfo, fills) {
  const qs = ds.questions;
  const regions = part.regions.map(g => ({ d: 'M' + g.poly.map(p => p[0] + ' ' + p[1]).join('L') + 'Z', q: g.code ? g.code.q : -1, o: g.code ? g.code.o : -1, ok: !!(g.code && g.code.ok), c: g.cls, lb: g.label || '', lx: g.lab ? +g.lab.x.toFixed(2) : 0, ly: g.lab ? +g.lab.y.toFixed(2) : 0, fs: g.lab ? +(g.lab.pt * PT / cellMM).toFixed(3) : 0, a: (g.bbox[2] - g.bbox[0]) * (g.bbox[3] - g.bbox[1]) }));
  regions.sort((a, b) => b.a - a.a); regions.forEach(r => delete r.a);
  return {
    title: ds.meta.title || 'BỨC TRANH BÍ ẨN', subtitle: ds.meta.subtitle || '', pic: ds.meta.pictureName || '', accent: ds.meta.accent || '#1F3A5F', W: part.W, H: part.H, regions,
    questions: qs.map((q, i) => ({ html: richHTML(q.text, mathInfo), opts: q.options.map(o => richHTML(o, mathInfo)), correct: q.correct, color: q.colorHex || fills[q.color] || E.PALETTE[q.color].hex, colorName: q.colorName || (E.PALETTE[q.color] || E.PALETTE[0]).name, explain: richHTML(q.explain || '', mathInfo) }))
  };
}

/* ---- trang HTML game ---- */
function gameHTML(data, mode) {
  data = Object.assign({}, data, { mode: mode === 'final' ? 'final' : 'instant' });
  const raw = new TextEncoder().encode(JSON.stringify(data)); let bin = ''; for (let i = 0; i < raw.length; i++) bin += String.fromCharCode(raw[i] ^ (i * 7 + 29 & 255)); const json = `(()=>{const s=atob('${btoa(bin)}');const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)^(i*7+29&255);return JSON.parse(new TextDecoder().decode(u));})()`;
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.title)}${data.pic ? '' : ''} – Game tương tác · Ms. Hằng Đỗ</title>
<style>
:root{--acc:${data.accent};--ink:#1b2230;--mute:#6b7280;--ok:#16a34a;--bad:#dc2626;--bg:#eef1f6;--card:#fff}
*{box-sizing:border-box}html,body{-webkit-user-select:none;user-select:none;margin:0;height:100%;background:var(--bg);font-family:"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--ink);overflow:hidden}
button{font:inherit;cursor:pointer}
.app{display:grid;grid-template-rows:auto 1fr;height:100vh}
header{display:flex;align-items:center;gap:1.2vw;padding:1vh 2vw;background:var(--acc);color:#fff;box-shadow:0 2px 12px rgba(0,0,0,.18)}
.logo{width:3.2vh;height:3.2vh;display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.logo i{background:#fff;border-radius:2px}.logo i:nth-child(2),.logo i:nth-child(4),.logo i:nth-child(5){background:#ffd166}.logo i:nth-child(9){background:#7dd3fc}.logo i:nth-child(7){background:#86efac}
h1{font-size:2.6vh;margin:0;letter-spacing:.06em;font-weight:800}
.sub{opacity:.85;font-size:1.7vh}
.sp{flex:1}
.chip{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);padding:.6vh 1.1vw;border-radius:99px;font-weight:700;font-size:1.8vh;display:flex;gap:.5vw;align-items:center;white-space:nowrap}
.hbtn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:10px;padding:.7vh .9vw;font-size:1.8vh}
.hbtn:hover{background:rgba(255,255,255,.28)}
main{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:2vw;padding:2vh 2vw;min-height:0}
.card{background:var(--card);border-radius:18px;box-shadow:0 6px 24px rgba(17,24,39,.08);padding:2vh 1.6vw;min-height:0;display:flex;flex-direction:column}
.board{align-items:center}
.bhead{width:100%;display:flex;align-items:center;gap:1vw;margin-bottom:1.2vh}
.bar{flex:1;height:1.3vh;background:#e5e7eb;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--acc),#22c55e);transition:width .6s}
.btxt{font-weight:700;font-size:1.8vh;color:var(--mute);white-space:nowrap}
svg.pic{flex:1;width:100%;min-height:0}
svg.pic path{stroke:#2b2b2b;stroke-width:.07;fill:#fff;transition:fill .45s ease}
svg.pic text{font-family:Arial,Helvetica,sans-serif;font-weight:700;fill:#111;text-anchor:middle;dominant-baseline:central;pointer-events:none;transition:fill .45s}
svg.pic path.pop{animation:pop .5s ease}
@keyframes pop{0%{opacity:.4}60%{opacity:1}100%{opacity:1}}
svg.pic path.flash{animation:flash 1.1s ease}
@keyframes flash{0%,100%{fill:#fff}25%,75%{fill:#fecaca}}
.legend{display:flex;gap:1vw;flex-wrap:wrap;margin-top:1vh;font-size:1.6vh;color:var(--mute)}
.legend span{display:flex;align-items:center;gap:.4vw}.legend b{display:inline-block;width:1.6vh;height:1.6vh;border-radius:4px;border:1px solid #0003}
.qtop{display:flex;align-items:center;gap:1vw;margin-bottom:1.4vh;flex-wrap:wrap}
.qnum{background:var(--acc);color:#fff;font-weight:800;border-radius:12px;padding:.8vh 1.2vw;font-size:2.2vh}
.qcol{display:flex;align-items:center;gap:.5vw;font-size:1.8vh;color:var(--mute);font-weight:600}.qcol b{width:2.2vh;height:2.2vh;border-radius:6px;border:1px solid #0003;display:inline-block}
.qtext{font-size:clamp(16px,3vh,34px);font-weight:700;line-height:1.35;margin:0 0 2vh;font-family:"Times New Roman",Georgia,serif}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:1.4vh 1.2vw}
.opts.one{grid-template-columns:1fr}
.opt{display:flex;align-items:center;gap:1vw;text-align:left;border:2px solid #e3e6ec;background:#f8fafc;border-radius:16px;padding:1.6vh 1.2vw;font-size:clamp(14px,2.5vh,28px);font-family:"Times New Roman",Georgia,serif;transition:transform .12s,background .2s,border-color .2s;min-height:7vh}
.opt:hover:not(:disabled){transform:translateY(-2px);border-color:var(--acc);background:#fff}
.opt .L{flex:none;width:4.6vh;height:4.6vh;border-radius:50%;display:grid;place-items:center;background:var(--acc);color:#fff;font-weight:800;font-family:Arial,sans-serif;font-size:2.2vh}
.opt.ok{background:#dcfce7;border-color:var(--ok)}.opt.ok .L{background:var(--ok)}
.opt.bad{background:#fee2e2;border-color:var(--bad);animation:shake .4s}.opt.bad .L{background:var(--bad)}
.send{margin-top:1vh;font-size:1.9vh;font-weight:700}.send .ok{color:#16a34a}.send a.nbtn{display:inline-block;text-decoration:none;background:#0f766e}
.who-chip{background:#ffd166;color:#1b2230}
.opt.sel{background:#e0e7ff;border-color:#6366f1}.opt.sel .L{background:#6366f1}
svg.pic path.wrongc{animation:wblink 1s ease-in-out infinite}@keyframes wblink{50%{fill:#fecaca}}
.wlist{display:flex;flex-wrap:wrap;gap:.6vw;justify-content:center;margin-top:1vh}.wlist span{background:#fee2e2;color:#b91c1c;border-radius:8px;padding:.4vh .8vw;font-weight:700;font-size:1.8vh}
.opt:disabled{cursor:default;color:inherit}.opt:disabled:not(.ok){opacity:.55}
@keyframes shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.fb{margin-top:2vh;min-height:5vh;font-size:clamp(14px,2.3vh,26px);font-weight:700}
.fb.ok{color:var(--ok)}.fb.bad{color:var(--bad)}
.exp{font-weight:400;color:var(--ink);font-family:"Times New Roman",Georgia,serif;margin-top:.6vh;font-size:clamp(13px,2.1vh,24px)}
.nav{margin-top:auto;display:flex;align-items:center;gap:1vw;padding-top:1.5vh}
.nbtn{border:0;background:var(--acc);color:#fff;border-radius:12px;padding:1.2vh 1.4vw;font-weight:700;font-size:2vh}
.nbtn.ghost{background:#eef1f6;color:var(--ink)}
.nbtn:disabled{opacity:.35;cursor:default}
.dots{flex:1;display:flex;gap:.6vw;justify-content:center;flex-wrap:wrap}
.dot{width:3.6vh;height:3.6vh;border-radius:50%;border:2px solid #d1d5db;background:#fff;font-weight:700;font-size:1.6vh;color:var(--mute)}
.dot.cur{border-color:var(--acc);color:var(--acc)}.dot.done{background:var(--ok);border-color:var(--ok);color:#fff}
.mx{display:inline-block}
.teams{display:none;gap:.6vw}.teams.on{display:flex}
.team{background:rgba(255,255,255,.12);border:2px solid transparent;border-radius:12px;padding:.4vh 1vw;font-weight:800;font-size:1.8vh;cursor:pointer}
.team.cur{border-color:#ffd166;background:rgba(255,255,255,.25)}
.modal{position:fixed;inset:0;background:rgba(10,15,25,.6);display:none;align-items:center;justify-content:center;z-index:20}
.modal.on{display:flex}
.box{background:#fff;border-radius:22px;padding:4vh 3vw;width:min(640px,92vw);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.box h2{margin:0 0 1vh;font-size:3.6vh;color:var(--acc)}
.big{font-size:5vh;font-weight:900;letter-spacing:.04em;color:var(--ink);margin:1.5vh 0}
.stats{display:flex;justify-content:center;gap:2vw;margin:2vh 0;font-size:2vh;color:var(--mute)}.stats b{display:block;font-size:3.4vh;color:var(--ink)}
.box input{font:inherit;font-size:2.4vh;padding:1.2vh 1vw;border:2px solid #d1d5db;border-radius:12px;width:100%;text-align:center;text-transform:uppercase}
.row{display:flex;gap:1vw;justify-content:center;margin-top:2vh;flex-wrap:wrap}
canvas#fx{position:fixed;inset:0;pointer-events:none;z-index:30}
.hidden{visibility:hidden}
.start .box{width:min(760px,92vw)}
.start ul{text-align:left;color:var(--ink);font-size:2vh;line-height:1.6}
.cert .box{width:min(1100px,96vw);padding:2.4vh 2vw;max-height:96vh;overflow:auto}
.cert img{width:100%;height:auto;max-height:68vh;object-fit:contain;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.15);-webkit-user-select:auto;user-select:auto;-webkit-touch-callout:default}
.cert .hint{color:var(--mute);font-size:1.6vh;margin-top:.6vh}
.exam .dot{pointer-events:none}
.exam #mStart{background:linear-gradient(135deg,var(--acc),#0f172a)}
@media (max-width:820px){main{grid-template-columns:1fr;overflow:auto}html,body{overflow:auto}}
</style></head><body>
<div class="app">
<header><span class="logo"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><div><h1 id="ttl"></h1><div class="sub" id="sub"></div></div>
<span class="sp"></span>
<div class="teams" id="teams"><span class="team cur" data-t="0">Đội A: <span id="s0">0</span></span><span class="team" data-t="1">Đội B: <span id="s1">0</span></span></div>
<span class="chip who-chip" id="whoChip" style="display:none">👤 <span id="whoName"></span></span><span class="chip" id="scoreChip">⭐ <span id="score">0</span></span><span class="chip">⏱ <span id="time">00:00</span></span>
<button class="hbtn" id="bGuess" title="Đoán tên bức tranh">🤔 Đoán tranh</button>
<button class="hbtn" id="bTeam" title="Chế độ 2 đội">👥</button><button class="hbtn" id="bSound" title="Âm thanh">🔊</button><button class="hbtn" id="bFull" title="Toàn màn hình (F)">⛶</button><button class="hbtn" id="bReset" title="Chơi lại">↺</button>
</header>
<main>
<section class="card board"><div class="bhead"><span class="btxt" id="prog"></span><div class="bar"><i id="barI"></i></div></div><svg class="pic" id="pic" preserveAspectRatio="xMidYMid meet"></svg><div class="legend" id="legend"></div></section>
<section class="card"><div class="qtop"><span class="qnum" id="qnum"></span><span class="qcol" id="qcol"></span></div><div class="qtext" id="qtext"></div><div class="opts" id="opts"></div><div class="fb" id="fb"></div>
<div class="nav"><button class="nbtn ghost" id="prev">◀ Câu trước</button><div class="dots" id="dots"></div><button class="nbtn" id="next">Câu sau ▶</button></div></section>
</main></div>
<div class="modal start on" id="mStart"><div class="box"><h2>🧩 BỨC TRANH BÍ ẨN</h2><div class="sub" style="color:var(--mute);font-size:2vh" id="stSub"></div>
<ul id="rules"><li>Trả lời từng câu hỏi bằng cách bấm vào phương án (hoặc phím <b>A, B, C, D</b>).</li><li>Đáp án đúng → các ô mang mã tương ứng (VD: <b>1-A</b>) tự tô màu trên bức tranh.</li><li>Giải mã hết các câu để bức tranh bí ẩn hiện ra. Có thể bấm <b>🤔 Đoán tranh</b> bất cứ lúc nào!</li></ul>
<div id="who" style="display:none;margin:1.5vh 0 0"><div style="display:grid;grid-template-columns:2fr 1fr;gap:1vw"><input id="pName" placeholder="Họ và tên của em" autocomplete="off" style="text-transform:none"><input id="pClass" placeholder="Lớp" autocomplete="off" style="text-transform:none"></div><div class="fb bad" id="whoErr" style="min-height:0;margin-top:.8vh;font-size:1.8vh"></div></div>
<div class="row"><button class="nbtn" id="bStart" style="font-size:2.4vh;padding:1.6vh 3vw">▶ Bắt đầu</button><button class="nbtn ghost" id="bStartTeam">👥 Chơi theo 2 đội</button></div></div></div>
<div class="modal" id="mGuess"><div class="box"><h2>🤔 Đoán bức tranh</h2><p style="color:var(--mute)">Bức tranh bí ẩn là gì?</p><input id="gIn" autocomplete="off"><div class="fb" id="gFb"></div><div class="row"><button class="nbtn" id="gOk">Kiểm tra</button><button class="nbtn ghost" id="gClose">Đóng</button></div></div></div>
<div class="modal" id="mWin"><div class="box"><h2>🎉 Giải mã thành công!</h2><div style="color:var(--mute);font-size:2vh">Bức tranh bí ẩn là</div><div class="big" id="wPic"></div><div class="stats" id="wStats"></div><div class="send" id="wSend"></div><div class="row"><button class="nbtn ghost" id="wView">👀 Ngắm tranh</button><button class="nbtn" id="wAgain">↺ Chơi lại</button></div></div></div>
<div class="modal" id="mLose"><div class="box"><h2 style="color:#dc2626">😮 Ôi! Bức tranh bị sai rồi</h2><div style="color:var(--mute);font-size:2vh">Kết quả giải mã</div><div class="big" id="lScore"></div><div style="color:var(--mute);font-size:1.9vh">Các câu trả lời sai (ô tô nhầm đang nhấp nháy trên tranh):</div><div class="wlist" id="lList"></div><div class="stats" id="lStats"></div><div class="send" id="lSend"></div><div class="row"><button class="nbtn ghost" id="lView">👀 Xem tranh</button><button class="nbtn" id="lAgain">↺ Chơi lại</button></div></div></div>
<div class="modal cert" id="mCert"><div class="box"><img id="cImg" alt="Giấy chứng nhận"><div class="send" id="cSend"></div><div class="row"><a class="nbtn" id="cSave" download="Giay-chung-nhan.png" style="text-decoration:none">💾 Lưu giấy chứng nhận</a><button class="nbtn ghost" id="cView">👀 Xem lại tranh</button><button class="nbtn ghost" id="cAgain">↺ Làm lại</button></div><div class="hint">Nếu nút lưu không tải được, em nhấn giữ (hoặc chuột phải) vào giấy chứng nhận để lưu ảnh, hoặc chụp màn hình.</div></div></div>
<canvas id="fx"></canvas>
<div style="position:fixed;right:1vw;bottom:.6vh;font-size:1.3vh;color:#94a3b8;pointer-events:none;z-index:5">© BỨC TRANH BÍ ẨN – Ms. Hằng Đỗ</div>
<script>
(function () {
document.addEventListener('contextmenu', e => e.preventDefault()); document.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (k === 'f12' || (e.ctrlKey && (k === 'u' || k === 's' || k === 'p')) || (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'))) { e.preventDefault(); e.stopPropagation(); } }, true); document.addEventListener('dragstart', e => e.preventDefault());
const D = ${json};
const $ = s => document.querySelector(s);
const N = D.questions.length; let cur = 0, score = 0, wrong = 0, t0 = 0, timer = null, sound = true, teamMode = false, team = 0, tScore = [0, 0];
const st = D.questions.map(() => ({ done: false, tries: [] }));
$('#ttl').textContent = D.title; $('#sub').textContent = D.subtitle || 'Game giải mã tương tác'; $('#stSub').textContent = (D.subtitle ? D.subtitle + ' · ' : '') + N + ' câu hỏi'; document.title = D.title + ' – Game tương tác';
// ---- tranh ----
const svg = $('#pic'); svg.setAttribute('viewBox', '-0.4 -0.4 ' + (D.W + 0.8) + ' ' + (D.H + 0.8));
let html = '<rect x="0" y="0" width="' + D.W + '" height="' + D.H + '" fill="#fff" stroke="#222" stroke-width=".18"/>';
D.regions.forEach((r, i) => { html += '<path id="r' + i + '" d="' + r.d + '"/>'; });
D.regions.forEach((r, i) => { if (r.lb) html += '<text id="t' + i + '" x="' + r.lx + '" y="' + r.ly + '" font-size="' + r.fs + '">' + r.lb + '</text>'; });
svg.innerHTML = html;
const leg = {}; D.questions.forEach(q => leg[q.color] = q.colorName); $('#legend').innerHTML = Object.entries(leg).map(([c, n]) => '<span><b style="background:' + c + '"></b>' + n + '</span>').join('');
function lum(h) { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
function paint(qi, animate) { const col = D.questions[qi].color; const ids = []; D.regions.forEach((r, i) => { if (r.ok && r.q === qi) ids.push(i); });
  ids.forEach((i, k) => { const go = () => { const p = document.getElementById('r' + i); p.style.fill = col; if (animate) { p.classList.remove('pop'); void p.getBBox(); p.classList.add('pop'); } const t = document.getElementById('t' + i); if (t) t.style.fill = lum(col) > .55 ? '#111' : '#fff'; }; animate ? setTimeout(go, k * 45) : go(); }); }
function paintCode(qi, o, col) { let k = 0; D.regions.forEach((r, i) => { if (r.q === qi && r.o === o) { const p = document.getElementById('r' + i); setTimeout(() => { p.style.fill = col; p.classList.remove('pop'); void p.getBBox(); p.classList.add('pop'); const t = document.getElementById('t' + i); if (t) t.style.fill = lum(col) > .55 ? '#111' : '#fff'; }, (k++) * 40); } }); }
const FINAL = D.mode === 'final'; const EXAM = !!D.exam; if (EXAM) D.askName = true;
function flashWrong(qi, o) { D.regions.forEach((r, i) => { if (r.q === qi && r.o === o && !r.ok) { const p = document.getElementById('r' + i); p.classList.remove('flash'); void p.getBBox(); p.classList.add('flash'); } }); }
// ---- âm thanh ----
let ac = null; function tone(fr, d, type, when, vol) { if (!sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = fr; const t = ac.currentTime + (when || 0); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .18, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .05); } catch (e) {} }
const sfx = {
  ok() { [1046, 1318, 1568].forEach((f, i) => tone(f, .28, 'triangle', i * .08, .22)); tone(2093, .5, 'sine', .26, .12); tone(2637, .45, 'sine', .34, .08); },
  bad() { tone(330, .22, 'square', 0, .09); tone(247, .42, 'square', .22, .09); tone(110, .35, 'sawtooth', .22, .05); },
  pick() { tone(880, .09, 'sine', 0, .2); tone(1320, .12, 'triangle', .05, .12); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .3, 'triangle', i * .13, .22)); [523, 659, 784, 1046].forEach(f => tone(f, 1.1, 'triangle', .6, .12)); tone(2093, .8, 'sine', .7, .06); },
  sad() { [392, 370, 349].forEach((f, i) => tone(f, .42, 'sawtooth', i * .45, .1)); try { if (!sound) return; ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain(); const t = ac.currentTime + 1.35; o.type = 'sawtooth'; o.frequency.value = 330; l.frequency.value = 6; lg.gain.value = 9; l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + 1.2); o.connect(g); g.connect(ac.destination); o.start(t); l.start(t); o.stop(t + 1.3); l.stop(t + 1.3); } catch (e) {} }
};
// ---- hiệu ứng pháo giấy ----
const cv = $('#fx'), cx = cv.getContext('2d'); let parts = [];
function confetti(n) { cv.width = innerWidth; cv.height = innerHeight; const cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']; for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * innerWidth * .6, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, c: cols[i % cols.length], a: Math.random() * 6, life: 120 }); if (parts.length === n) requestAnimationFrame(loop); }
function loop() { cx.clearRect(0, 0, cv.width, cv.height); parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.a += .2; p.life--; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); }); parts = parts.filter(p => p.life > 0 && p.y < cv.height + 20); if (parts.length) requestAnimationFrame(loop); else cx.clearRect(0, 0, cv.width, cv.height); }
// ---- câu hỏi ----
function show(i) { cur = i; const q = D.questions[i]; $('#qnum').textContent = 'Câu ' + (i + 1) + '/' + N; $('#qcol').innerHTML = 'Đáp án đúng tô màu <b style="background:' + q.color + '"></b> ' + q.colorName;
  $('#qtext').innerHTML = q.html; const long = q.opts.some(o => o.replace(/<[^>]+>/g, '').length > 38); $('#opts').className = 'opts' + (long ? ' one' : '');
  $('#opts').innerHTML = q.opts.map((o, k) => '<button class="opt" data-k="' + k + '"><span class="L">' + 'ABCDEF'[k] + '</span><span>' + o + '</span></button>').join('');
  const s = st[i]; if (FINAL) { if (s.done) { $('#opts').children[s.pick].classList.add('sel'); [...$('#opts').children].forEach(b => b.disabled = true); $('#fb').className = 'fb'; $('#fb').innerHTML = 'Đã chọn <b>' + 'ABCDEF'[s.pick] + '</b>.'; } else { $('#fb').className = 'fb'; $('#fb').innerHTML = ''; } $('#prev').disabled = i === 0; $('#next').textContent = i === N - 1 ? 'Kết thúc ✔' : 'Câu sau ▶'; dots(); return; }
  s.tries.forEach(k => { const b = $('#opts').children[k]; b.classList.add(k === q.correct ? 'ok' : 'bad'); b.style.animation = 'none'; if (k !== q.correct) b.disabled = true; });
  if (s.done) { [...$('#opts').children].forEach(b => b.disabled = true); fbOk(q, false); } else { $('#fb').className = 'fb'; $('#fb').innerHTML = ''; }
  $('#prev').disabled = i === 0; $('#next').textContent = i === N - 1 ? 'Kết thúc ✔' : 'Câu sau ▶'; if (EXAM) { $('#next').textContent = i === N - 1 ? 'Xem kết quả ✔' : 'Câu tiếp ▶'; $('#next').disabled = !s.done; } dots(); }
function fbOk(q, fresh) { $('#fb').className = 'fb ok'; $('#fb').innerHTML = '✔ Chính xác! Các ô mã <b>' + (cur + 1) + '-' + 'ABCDEF'[q.correct] + '</b> đã được tô màu ' + q.colorName + '.' + (q.explain ? '<div class="exp">💡 ' + q.explain + '</div>' : ''); }
function answer(k) { if (FINAL) return pickFinal(k); const q = D.questions[cur], s = st[cur]; if (s.done || s.tries.includes(k)) return; if (!t0) startTimer(); s.tries.push(k); const b = $('#opts').children[k];
  if (k === q.correct) { s.done = true; b.classList.add('ok'); [...$('#opts').children].forEach(x => x.disabled = true); const pts = s.tries.length === 1 ? 10 : 5; score += pts; if (teamMode) { tScore[team] += pts; } paint(cur, true); sfx.ok(); fbOk(q, true); confetti(40); update(); if (teamMode) switchTeam(); if (st.every(x => x.done)) setTimeout(win, 1300); else { $('#next').disabled = false; const me = cur; setTimeout(() => { const nx = nextOpen(); if (nx >= 0 && autoNext && cur === me) show(nx); }, q.explain ? 4200 : 2200); } }
  else { wrong++; b.classList.add('bad'); b.disabled = true; flashWrong(cur, k); sfx.bad(); $('#fb').className = 'fb bad'; $('#fb').innerHTML = '✘ Chưa đúng – các ô ' + (cur + 1) + '-' + 'ABCDEF'[k] + ' không thuộc bức tranh. Thử lại nhé!'; if (teamMode) switchTeam(); } }
let autoNext = !!D.exam;
function nextOpen() { for (let j = 1; j <= N; j++) { const x = (cur + j) % N; if (!st[x].done) return x; } return -1; }
function dots() { $('#dots').innerHTML = D.questions.map((_, i) => '<button class="dot ' + (i === cur ? 'cur ' : '') + (st[i].done ? 'done' : '') + '"' + (FINAL && st[i].done ? ' style="background:#6366f1;border-color:#6366f1"' : '') + ' data-i="' + i + '">' + (i + 1) + '</button>').join(''); }
function update() { const d = st.filter(x => x.done).length; $('#prog').textContent = (FINAL ? 'Đã trả lời ' : 'Đã giải mã ') + d + '/' + N; $('#barI').style.width = (d / N * 100) + '%'; $('#score').textContent = score; $('#s0').textContent = tScore[0]; $('#s1').textContent = tScore[1]; dots(); }
function startTimer() { t0 = Date.now(); clearInterval(timer); timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $('#time').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 500); }
function switchTeam() { team = 1 - team; document.querySelectorAll('.team').forEach(t => t.classList.toggle('cur', +t.dataset.t === team)); }
function pickFinal(k) { const q = D.questions[cur], s = st[cur]; if (s.done) return; if (!t0) startTimer(); s.done = true; s.pick = k; const b = $('#opts').children[k]; b.classList.add('sel'); [...$('#opts').children].forEach(x => x.disabled = true);
  paintCode(cur, k, q.color); sfx.pick(); $('#fb').className = 'fb'; $('#fb').style.color = '#4338ca'; $('#fb').innerHTML = '✎ Đã chọn <b>' + 'ABCDEF'[k] + '</b> – các ô mã <b>' + (cur + 1) + '-' + 'ABCDEF'[k] + '</b> đã được tô màu ' + q.colorName + '.'; update();
  if (st.every(x => x.done)) setTimeout(finish, 1600); else setTimeout(() => { const nx = nextOpen(); if (nx >= 0) show(nx); }, 1300); }
function resultData(right) { const det = D.questions.map((q, i) => (i + 1) + (FINAL ? ('ABCDEF'[st[i].pick] || '-') : ('ABCDEF'[(st[i].tries || [])[0]] || '-'))).join(' ');
  return { name: player.name || '(không tên)', cls: player.cls || '', game: D.pic || D.title, mode: FINAL ? 'Chấm điểm cuối' : 'Phản hồi ngay', right, total: N, score: EXAM ? score10() : score, time: $('#time').textContent, wrong, detail: det }; }
function sendResult(box, right) { if (!D.sheet) { box.innerHTML = ''; return; } if (sent) return; const p = resultData(right); const qs = Object.entries(p).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&'); const url = D.sheet + (D.sheet.includes('?') ? '&' : '?') + qs;
  const manual = () => { box.innerHTML = '<a class="nbtn" href="' + url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener" id="sendA">📤 Gửi kết quả cho thầy/cô</a>'; const a = box.querySelector('#sendA'); a.onclick = () => { sent = true; setTimeout(() => { box.innerHTML = '<span class="ok">✅ Đã mở trang gửi kết quả – em đợi trang báo “Đã gửi” là xong.</span>'; }, 300); }; };
  box.innerHTML = '<span style="color:#64748b">⏳ Đang gửi kết quả…</span>';
  try { fetch(D.sheet, { method: 'POST', mode: 'no-cors', body: JSON.stringify(p) }).then(() => { sent = true; box.innerHTML = '<span class="ok">✅ Kết quả đã được gửi cho thầy/cô.</span>'; }).catch(manual); } catch (e) { manual(); } }
function finish() { clearInterval(timer); const right = D.questions.filter((q, i) => st[i].pick === q.correct).length;
  if (right === N) { score = right * 10; update(); win(); return; }
  if (EXAM) { sfx.sad(); const wq = D.questions.map((q, i) => st[i].pick !== q.correct ? i : -1).filter(i => i >= 0); D.regions.forEach((r, i) => { if (wq.includes(r.q) && r.o === st[r.q].pick && !r.ok) document.getElementById('r' + i).classList.add('wrongc'); }); cert(right, wq); return; }
  sfx.sad(); const wrongQ = D.questions.map((q, i) => st[i].pick !== q.correct ? i : -1).filter(i => i >= 0);
  D.regions.forEach((r, i) => { if (wrongQ.includes(r.q) && r.o === st[r.q].pick && !r.ok) document.getElementById('r' + i).classList.add('wrongc'); });
  $('#lScore').textContent = 'Đúng ' + right + '/' + N + ' câu'; $('#lList').innerHTML = wrongQ.map(i => '<span>Câu ' + (i + 1) + '</span>').join(''); $('#lStats').innerHTML = '<div><b>' + $('#time').textContent + '</b>thời gian</div><div><b>' + Math.round(right / N * 100) + '%</b>chính xác</div>'; $('#mLose').classList.add('on'); sendResult($('#lSend'), right); }
function win() { clearInterval(timer); sfx.win(); confetti(220); if (EXAM) { const r = FINAL ? N : st.filter(s => s.tries.length === 1).length; cert(r, FINAL ? [] : D.questions.map((q, i) => st[i].tries.length > 1 ? i : -1).filter(i => i >= 0)); return; } $('#wPic').textContent = D.pic || '★'; $('#wStats').innerHTML = (teamMode ? '<div><b>' + tScore[0] + ' – ' + tScore[1] + '</b>Đội A – Đội B</div>' : '<div><b>' + score + '</b>điểm</div>') + '<div><b>' + $('#time').textContent + '</b>thời gian</div><div><b>' + wrong + '</b>lần chọn sai</div>'; $('#mWin').classList.add('on'); sendResult($('#wSend'), FINAL ? N : st.filter(s => s.tries.length === 1).length); }
function reset() { $('#mCert').classList.remove('on'); $('#cSend').innerHTML = ''; sent = false; $('#wSend').innerHTML = ''; $('#lSend').innerHTML = ''; $('#mLose').classList.remove('on'); document.querySelectorAll('.wrongc').forEach(p => p.classList.remove('wrongc')); st.forEach(s => { s.done = false; s.tries = []; delete s.pick; }); score = 0; wrong = 0; tScore = [0, 0]; team = 0; t0 = 0; clearInterval(timer); $('#time').textContent = '00:00'; D.regions.forEach((r, i) => { const p = document.getElementById('r' + i); p.style.fill = ''; const t = document.getElementById('t' + i); if (t) t.style.fill = ''; }); document.querySelectorAll('.team').forEach(t => t.classList.toggle('cur', +t.dataset.t === 0)); update(); show(0); }
// ---- sự kiện ----
$('#opts').onclick = e => { const b = e.target.closest('.opt'); if (b && !b.disabled) answer(+b.dataset.k); };
$('#dots').onclick = e => { if (EXAM) return; const b = e.target.closest('.dot'); if (b) show(+b.dataset.i); };
$('#prev').onclick = () => !EXAM && cur > 0 && show(cur - 1);
$('#next').onclick = () => { if (EXAM && !st[cur].done) return; if (cur < N - 1) show(cur + 1); else if (st.every(x => x.done)) (FINAL ? finish() : win()); else { const nx = nextOpen(); if (nx >= 0) show(nx); } };
$('#bSound').onclick = () => { sound = !sound; $('#bSound').textContent = sound ? '🔊' : '🔇'; };
$('#bFull').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} };
$('#bReset').onclick = () => { $('#mWin').classList.remove('on'); reset(); };
$('#bTeam').onclick = () => { teamMode = !teamMode; $('#teams').classList.toggle('on', teamMode); $('#scoreChip').style.display = teamMode ? 'none' : ''; };
document.querySelectorAll('.team').forEach(t => t.onclick = () => { team = +t.dataset.t; document.querySelectorAll('.team').forEach(x => x.classList.toggle('cur', x === t)); });
let player = { name: '', cls: '' }; let sent = false;
if (D.askName) { $('#who').style.display = ''; try { const sv = JSON.parse(localStorage.getItem('btba-player') || 'null'); if (sv) { $('#pName').value = sv.name || ''; $('#pClass').value = sv.cls || ''; } } catch (e) {} }
function takeName() { if (!D.askName) return true; const n = $('#pName').value.trim().replace(/\s+/g, ' '); if (n.length < 2) { $('#whoErr').textContent = 'Em hãy nhập họ và tên trước khi chơi nhé!'; $('#pName').focus(); return false; } player = { name: n, cls: $('#pClass').value.trim() }; try { localStorage.setItem('btba-player', JSON.stringify(player)); } catch (e) {} $('#whoName').textContent = n + (player.cls ? ' · ' + player.cls : ''); $('#whoChip').style.display = ''; return true; }
$('#pName').onkeydown = e => { if (e.key === 'Enter') $('#bStart').click(); }; $('#pClass').onkeydown = e => { if (e.key === 'Enter') $('#bStart').click(); };
$('#bStart').onclick = () => { if (!takeName()) return; $('#mStart').classList.remove('on'); startTimer(); };
$('#bStartTeam').onclick = () => { if (D.askName && !takeName()) return; teamMode = true; $('#teams').classList.add('on'); $('#scoreChip').style.display = 'none'; $('#mStart').classList.remove('on'); startTimer(); };
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
$('#bGuess').onclick = () => { $('#gIn').value = ''; $('#gFb').textContent = ''; $('#mGuess').classList.add('on'); setTimeout(() => $('#gIn').focus(), 50); };
$('#gClose').onclick = () => $('#mGuess').classList.remove('on');
$('#gOk').onclick = () => { const ok = D.pic && norm($('#gIn').value) === norm(D.pic); $('#gFb').className = 'fb ' + (ok ? 'ok' : 'bad'); $('#gFb').textContent = ok ? '🎉 Chính xác! +20 điểm' : 'Chưa đúng, giải thêm vài câu nữa rồi đoán lại nhé!'; if (ok) { score += 20; if (teamMode) tScore[team] += 20; update(); sfx.win(); confetti(120); } else sfx.bad(); };
$('#gIn').onkeydown = e => { if (e.key === 'Enter') $('#gOk').click(); };
$('#wView').onclick = () => $('#mWin').classList.remove('on');
$('#wAgain').onclick = () => { $('#mWin').classList.remove('on'); reset(); };
$('#lView').onclick = () => $('#mLose').classList.remove('on');
$('#lAgain').onclick = () => { reset(); };
if (FINAL) { $('#bTeam').style.display = 'none'; $('#bStartTeam').style.display = 'none'; $('#scoreChip').style.display = 'none'; $('#rules').innerHTML = '<li>Mỗi câu chỉ được chọn <b>một lần</b> – chọn xong, các ô mang mã đó (VD: <b>1-B</b>) sẽ được tô màu ngay, dù đúng hay sai.</li><li>Làm lần lượt đến câu cuối cùng. <b>Chỉ khi hoàn thành</b> mới biết bức tranh đúng hay sai!</li><li>Trả lời đúng hết → bức tranh bí ẩn hiện ra hoàn chỉnh. Sai câu nào → tranh bị “lỗi” ở đó.</li>'; $('#stSub').textContent += ' · Chế độ thử thách: chấm điểm cuối'; }
document.addEventListener('keydown', e => { if (document.querySelector('.modal.on') || e.target.tagName === 'INPUT') return; const k = 'abcdef'.indexOf(e.key.toLowerCase()); if (k >= 0 && k < D.questions[cur].opts.length) answer(k); else if (e.key >= '1' && e.key <= '6' && +e.key <= D.questions[cur].opts.length) answer(+e.key - 1); else if (e.key === 'ArrowRight') $('#next').click(); else if (e.key === 'ArrowLeft') $('#prev').click(); else if (e.key.toLowerCase() === 'f') $('#bFull').click(); });
if (EXAM) { document.body.classList.add('exam'); ['#bTeam', '#bStartTeam', '#bReset', '#prev'].forEach(x => $(x).style.display = 'none');
  $('#rules').innerHTML = '<li>Nhập <b>họ tên, lớp</b> rồi bấm <b>Bắt đầu</b>.</li>' + (FINAL ? '<li>Trả lời <b>lần lượt</b> từng câu, mỗi câu chỉ chọn <b>một lần</b>. Chọn xong, các ô mang mã đó (VD: <b>1-B</b>) tự tô màu.</li><li>Làm hết câu cuối mới biết bức tranh đúng hay sai.</li>' : '<li>Trả lời <b>lần lượt</b> từng câu. Chọn đúng → các ô mang mã đó (VD: <b>1-A</b>) tự tô màu. Chọn sai thì được thử lại nhưng bị trừ điểm.</li>') + '<li>Hoàn thành câu cuối → nhận <b>điểm</b> và <b>giấy chứng nhận</b> kết quả.</li>'; }
function score10() { let p = 0; D.questions.forEach((q, i) => { const s = st[i]; if (FINAL) { if (s.pick === q.correct) p += 1; } else if (s.done) p += s.tries.length === 1 ? 1 : s.tries.length === 2 ? .5 : 0; }); return Math.round(p / N * 100) / 10; }
function rankOf(x) { return x >= 9 ? ['XUẤT SẮC', 5, 'Tuyệt vời! Em đã chinh phục bức tranh bí ẩn một cách xuất sắc.'] : x >= 8 ? ['GIỎI', 4, 'Rất tốt! Em nắm bài rất chắc.'] : x >= 6.5 ? ['KHÁ', 3, 'Khá lắm! Ôn lại vài câu nữa là hoàn hảo.'] : x >= 5 ? ['ĐẠT', 2, 'Em đã hoàn thành. Hãy xem lại các câu sai nhé!'] : ['CẦN CỐ GẮNG', 1, 'Đừng nản! Ôn lại bài và thử thêm lần nữa nhé.']; }
function picImage(cb) { const c = svg.cloneNode(true); c.querySelectorAll('text').forEach(t => t.remove()); c.querySelectorAll('path').forEach(p => { p.removeAttribute('class'); p.setAttribute('fill', p.style.fill || '#fff'); p.setAttribute('stroke', '#3a3a3a'); p.setAttribute('stroke-width', '.06'); p.removeAttribute('style'); });
  c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.removeAttribute('class'); c.setAttribute('width', 900); c.setAttribute('height', Math.round(900 * (D.H + .8) / (D.W + .8))); const im = new Image(); im.onload = () => cb(im); im.onerror = () => cb(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(c)); }
function wrapTxt(x, t, maxW) { const w = String(t).split(' '); const L = []; let l = ''; w.forEach(z => { const tt = l ? l + ' ' + z : z; if (x.measureText(tt).width > maxW && l) { L.push(l); l = z; } else l = tt; }); if (l) L.push(l); return L; }
function cert(right, wq) { clearInterval(timer); const sc = score10(), rk = rankOf(sc), acc = D.accent || '#1F3A5F', gold = '#b8860b'; const now = new Date(); const pad = n => String(n).padStart(2, '0');
  const code = (Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase().slice(-8);
  picImage(im => { const W = 1600, H = 1130, cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; const x = cv2.getContext('2d'); const serif = '"Times New Roman",Georgia,serif', sans = '"Segoe UI",Roboto,Arial,sans-serif';
    let g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#fffdf6'); g.addColorStop(1, '#f6efdc'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = acc; x.lineWidth = 18; x.strokeRect(26, 26, W - 52, H - 52); x.strokeStyle = gold; x.lineWidth = 4; x.strokeRect(52, 52, W - 104, H - 104); x.lineWidth = 1.5; x.strokeRect(62, 62, W - 124, H - 124);
    [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]].forEach(([a, b]) => { x.save(); x.translate(a, b); x.rotate(Math.PI / 4); x.fillStyle = gold; x.fillRect(-14, -14, 28, 28); x.fillStyle = '#fffdf6'; x.fillRect(-7, -7, 14, 14); x.restore(); });
    const cols = ['#fff', '#ffd166', '#fff', '#ffd166', '#ffd166', '#fff', '#86efac', '#fff', '#7dd3fc']; for (let i = 0; i < 9; i++) { x.fillStyle = acc; x.fillRect(W / 2 - 33 + (i % 3) * 23, 88 + Math.floor(i / 3) * 23, 21, 21); x.fillStyle = cols[i]; x.fillRect(W / 2 - 30 + (i % 3) * 23, 91 + Math.floor(i / 3) * 23, 15, 15); }
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = acc; x.font = '700 26px ' + sans; x.fillText('B Ứ C   T R A N H   B Í   Ẩ N', W / 2, 192);
    x.fillStyle = gold; x.font = '700 76px ' + serif; x.fillText('GIẤY CHỨNG NHẬN', W / 2, 278);
    x.strokeStyle = gold; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 300, 302); x.lineTo(W / 2 - 30, 302); x.moveTo(W / 2 + 30, 302); x.lineTo(W / 2 + 300, 302); x.stroke(); x.fillStyle = gold; x.beginPath(); x.arc(W / 2, 302, 7, 0, 7); x.fill();
    x.fillStyle = '#374151'; x.font = 'italic 30px ' + serif; x.fillText('Chứng nhận học sinh', W / 2, 356);
    let fs = 70; x.font = '700 italic ' + fs + 'px ' + serif; while (x.measureText(player.name).width > 1100 && fs > 36) { fs -= 4; x.font = '700 italic ' + fs + 'px ' + serif; } x.fillStyle = acc; x.fillText(player.name || 'Học sinh', W / 2, 432);
    x.fillStyle = '#374151'; x.font = '28px ' + sans; x.fillText((player.cls ? 'Lớp ' + player.cls.replace(/^l[ớo]p\s*/i, '') + '   •   ' : '') + 'đã hoàn thành thử thách giải mã', W / 2, 480);
    x.fillStyle = '#111827'; x.font = '700 34px ' + serif; wrapTxt(x, '“' + D.title + '”' + (D.subtitle ? ' – ' + D.subtitle : ''), 1300).slice(0, 2).forEach((l, i) => x.fillText(l, W / 2, 526 + i * 40));
    const top = 590, bh = 400, pw = 560; x.fillStyle = '#fff'; x.strokeStyle = '#d6c79a'; x.lineWidth = 2; x.fillRect(130, top, pw, bh); x.strokeRect(130, top, pw, bh);
    if (im) { const r = Math.min((pw - 30) / im.width, (bh - 70) / im.height); const iw = im.width * r, ih = im.height * r; x.drawImage(im, 130 + (pw - iw) / 2, top + 15 + (bh - 70 - ih) / 2, iw, ih); }
    x.fillStyle = '#374151'; x.font = '600 24px ' + sans; x.fillText(right === N || (!FINAL && st.every(s => s.done)) ? 'Bức tranh bí ẩn: ' + (D.pic || '★') : 'Bức tranh chưa hoàn chỉnh', 130 + pw / 2, top + bh - 22);
    const rx = 760, rw = 710; x.textAlign = 'left'; x.fillStyle = acc; x.font = '700 26px ' + sans; x.fillText('ĐIỂM', rx, top + 36);
    x.font = '900 150px ' + sans; const s10 = String(sc).replace('.', ','); x.fillText(s10, rx - 6, top + 176); const sw = x.measureText(s10).width; x.fillStyle = '#6b7280'; x.font = '700 48px ' + sans; x.fillText('/10', rx + sw + 4, top + 176);
    x.fillStyle = gold; x.font = '700 26px ' + sans; x.fillText('XẾP LOẠI', rx + 420, top + 36); x.fillStyle = acc; x.font = '800 ' + (rk[0].length > 8 ? 40 : 54) + 'px ' + sans; x.fillText(rk[0], rx + 420, top + 104);
    x.font = '40px ' + sans; x.fillStyle = '#f59e0b'; x.fillText('★'.repeat(rk[1]) + '☆'.repeat(5 - rk[1]), rx + 420, top + 160);
    x.strokeStyle = '#e5dcc0'; x.lineWidth = 2; x.beginPath(); x.moveTo(rx, top + 210); x.lineTo(rx + rw, top + 210); x.stroke();
    const items = [[FINAL ? 'Số câu đúng' : 'Đúng ngay lần đầu', right + '/' + N], ['Thời gian', $('#time').textContent], [FINAL ? 'Câu sai' : 'Lần chọn sai', FINAL ? String(N - right) : String(wrong)]];
    items.forEach((it, i) => { const xx = rx + i * 240; x.fillStyle = '#6b7280'; x.font = '24px ' + sans; x.fillText(it[0], xx, top + 254); x.fillStyle = '#111827'; x.font = '800 44px ' + sans; x.fillText(it[1], xx, top + 306); });
    x.fillStyle = '#374151'; x.font = 'italic 27px ' + serif; const msg = rk[2] + (wq && wq.length ? ' Cần xem lại: ' + wq.map(i => 'Câu ' + (i + 1)).join(', ') + '.' : ''); wrapTxt(x, msg, rw).slice(0, 2).forEach((l, i) => x.fillText(l, rx, top + 352 + i * 34));
    x.textAlign = 'center'; x.fillStyle = '#6b7280'; x.font = '22px ' + sans; x.fillText('Ngày ' + pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear() + ' – ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + '   •   Mã chứng nhận: ' + code + '   •   ' + (FINAL ? 'Chế độ chấm điểm cuối' : 'Chế độ phản hồi ngay'), W / 2, H - 112);
    x.fillStyle = '#9ca3af'; x.font = '20px ' + sans; x.fillText('© BỨC TRANH BÍ ẨN – Ms. Hằng Đỗ', W / 2, H - 82);
    const url = cv2.toDataURL('image/png'); $('#cImg').src = url; $('#cSave').href = url; $('#cSave').download = 'Chung-nhan_' + (player.name || 'hoc-sinh').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-') + '.png';
    $('#mCert').classList.add('on'); sendResult($('#cSend'), right); }); }
$('#cImg').addEventListener('contextmenu', e => e.stopPropagation(), true);
$('#cSave').onclick = async e => { let dl = null; try { dl = window.__btbaDL || (window.claude && window.claude.use ? await window.claude.use('downloads') : null); } catch (er) { dl = null; } if (!dl) return; e.preventDefault(); try { const b = await (await fetch($('#cImg').src)).blob(); await dl.save({ filename: $('#cSave').download, data: b }); } catch (er) {} };
$('#cView').onclick = () => $('#mCert').classList.remove('on');
$('#cAgain').onclick = () => reset();
update(); show(0);
})();
<\/script></body></html>`;
}

/* ---- Game PowerPoint tương tác (siêu liên kết giữa các slide) ---- */
let PPTX = null;
function hotspot(slide, x, y, w, h, slideNo) { slide.addShape(PPTX.ShapeType.rect, { x, y, w, h, fill: { color: 'FFFFFF', transparency: 100 }, line: { type: 'none' }, hyperlink: { slide: slideNo } }); }
function linkText(slide, runs, opts, slideNo) { slide.addText(runs, opts); hotspot(slide, opts.x, opts.y, opts.w, opts.h, slideNo); }
const IN = mm => +(mm / 25.4).toFixed(4); const H6 = h => h.replace('#', '').toUpperCase();
function pptParaLinked(slide, it, link, mathPng) { // vẽ đoạn văn (có công thức) – mọi phần đều bấm được
  it.lines.forEach(ln => { const by = it.y + ln.base;
    ln.segs.forEach(sg => { const x = it.x + sg.x;
      if (sg.math) { const png = mathPng(sg.math, sg.st.color); if (png) slide.addImage({ data: png, x: IN(x), y: IN(by - sg.asc), w: IN(sg.w), h: IN(sg.asc + sg.desc) }); return; }
      if (!sg.text.trim()) return; const lead = sg.text.match(/^ */)[0].length; const tx = sg.text.trimStart(); const dx = lead ? E.textW(' '.repeat(lead), sg.st.font, sg.st.bold, sg.st.size) : 0;
      const o = { x: IN(x + dx), y: IN(by - it.asc0), w: IN(sg.w - dx + 3), h: IN(it.lineH), margin: 0, valign: 'top', lineSpacing: +(it.lineH / PT).toFixed(1), fit: 'none', wrap: false };
      const r = [{ text: tx, options: { bold: !!sg.st.bold, color: H6(sg.st.color), fontFace: sg.st.font === 'serif' ? 'Times New Roman' : 'Arial', fontSize: sg.st.size } }];
      slide.addText(r, o); }); }); }

async function buildPptGame(pptx, ds, part, pics, mathPng) { PPTX = pptx;
  // pics[k] = PNG tranh khi đã giải k câu đầu; pics.full
  const N = ds.questions.length; const acc = ds.meta.accent || '#1F3A5F'; const W = 338.67, H = 190.5; // 16:9 (mm)
  pptx.defineLayout({ name: 'GAME169', width: 13.333, height: 7.5 }); pptx.layout = 'GAME169';
  const QS = i => 2 + 3 * i, CS = i => QS(i) + 1, WS = i => QS(i) + 2, FINAL = 2 + 3 * N;
  const T = { acc, ink: '#1B2230', mute: '#6B7280', ok: '#16A34A', bad: '#DC2626' };
  const bg = slide => { slide.background = { color: 'EEF1F6' }; slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.62, fill: { color: H6(acc) }, line: { type: 'none' } });
    slide.addText([{ text: (ds.meta.title || 'BỨC TRANH BÍ ẨN'), options: { bold: true, color: 'FFFFFF', fontFace: 'Arial', fontSize: 18 } }, { text: ds.meta.subtitle ? '   ·   ' + ds.meta.subtitle : '', options: { color: 'DDE3EE', fontFace: 'Arial', fontSize: 13 } }], { x: 0.35, y: 0, w: 9.5, h: 0.62, valign: 'middle', margin: 0 }); };
  const picBox = { x: 12, y: 24, w: 168, h: 156 };
  const addPic = (slide, png, aspect) => { slide.addShape(pptx.ShapeType.roundRect, { x: IN(picBox.x - 4), y: IN(picBox.y - 4), w: IN(picBox.w + 8), h: IN(picBox.h + 8), rectRadius: 0.12, fill: { color: 'FFFFFF' }, line: { color: 'DDE2EA', width: 0.75 }, shadow: { type: 'outer', blur: 6, offset: 2, angle: 90, color: '000000', opacity: 0.12 } });
    let w = picBox.w, h = w / aspect; if (h > picBox.h) { h = picBox.h; w = h * aspect; } slide.addImage({ data: png, x: IN(picBox.x + (picBox.w - w) / 2), y: IN(picBox.y + (picBox.h - h) / 2), w: IN(w), h: IN(h) }); };
  const aspect = part.W / part.H; const RX = 194, RW = W - RX - 12;
  const button = (slide, text, x, y, w, h, color, link, fs) => linkText(slide, [{ text, options: { bold: true, color: 'FFFFFF', fontFace: 'Arial', fontSize: fs || 16 } }], { x: IN(x), y: IN(y), w: IN(w), h: IN(h), shape: pptx.ShapeType.roundRect, rectRadius: 0.12, fill: { color: H6(color) }, line: { type: 'none' }, align: 'center', valign: 'middle', margin: 0 }, link);
  // 1. Slide mở đầu
  { const s = pptx.addSlide(); bg(s); addPic(s, pics[0], aspect);
    s.addText('🧩 GIẢI MÃ', { x: IN(RX), y: IN(40), w: IN(RW), h: 0.5, fontFace: 'Arial', fontSize: 16, bold: true, color: H6(T.mute), margin: 0 });
    s.addText(ds.meta.title || 'BỨC TRANH BÍ ẨN', { x: IN(RX), y: IN(52), w: IN(RW), h: 1.3, fontFace: 'Arial', fontSize: 36, bold: true, color: H6(acc), margin: 0, valign: 'top' });
    s.addText([{ text: `${N} câu hỏi · Trả lời đúng để tô màu các mảnh ghép`, options: { breakLine: true } }, { text: 'Bấm vào phương án đúng – bức tranh sẽ hiện dần!' }], { x: IN(RX), y: IN(92), w: IN(RW), h: 1, fontFace: 'Arial', fontSize: 15, color: H6(T.ink), margin: 0, valign: 'top' });
    button(s, '▶  BẮT ĐẦU', RX, 125, 70, 16, acc, QS(0), 20); }
  // 2. Các câu hỏi
  for (let i = 0; i < N; i++) { const q = ds.questions[i]; const col = E.PALETTE[q.color] || E.PALETTE[0]; const fill = (ds._fills && ds._fills[q.color]) || col.hex;
    const head = (s, k) => { s.addText(`Câu ${i + 1}/${N}`, { x: IN(RX), y: IN(26), w: 1.5, h: 0.42, shape: pptx.ShapeType.roundRect, rectRadius: 0.08, fill: { color: H6(acc) }, color: 'FFFFFF', bold: true, fontFace: 'Arial', fontSize: 14, align: 'center', valign: 'middle', margin: 0 });
      s.addShape(pptx.ShapeType.roundRect, { x: IN(RX + 44), y: IN(28.5), w: 0.22, h: 0.22, rectRadius: 0.04, fill: { color: H6(fill) }, line: { color: '333333', width: 0.5 } });
      s.addText([{ text: 'Đáp án đúng tô màu ', options: { color: H6(T.mute) } }, { text: col.name, options: { bold: true, color: H6(T.ink) } }], { x: IN(RX + 51), y: IN(26), w: IN(RW - 51), h: 0.42, fontFace: 'Arial', fontSize: 13, valign: 'middle', margin: 0 }); };
    // slide câu hỏi
    { const s = pptx.addSlide(); bg(s); addPic(s, pics[i], aspect); head(s);
      const p = E.para(RX, 40, RW, [E.R(q.text, { bold: true, size: 20, color: T.ink })], 20 * 1.25 * PT); pptParaLinked(s, p, 0, mathPng); let y = 40 + p.h + 6;
      const n = q.options.length; const bh = Math.max(14, Math.min(22, (H - 12 - y) / n - 4));
      q.options.forEach((o, k) => { const link = k === q.correct ? CS(i) : WS(i); const by = y + k * (bh + 4);
        s.addShape(pptx.ShapeType.roundRect, { x: IN(RX), y: IN(by), w: IN(RW), h: IN(bh), rectRadius: 0.12, fill: { color: 'FFFFFF' }, line: { color: 'D6DBE4', width: 1 } });
        s.addText([{ text: LET[k], options: { bold: true, color: 'FFFFFF', fontFace: 'Arial', fontSize: 16 } }], { x: IN(RX + 3), y: IN(by + bh / 2 - 5), w: IN(10), h: IN(10), shape: pptx.ShapeType.ellipse, fill: { color: H6(acc) }, line: { type: 'none' }, align: 'center', valign: 'middle', margin: 0 });
        const op = E.para(RX + 17, 0, RW - 21, [E.R(o, { size: 17, color: T.ink })], 17 * 1.2 * PT); op.y = by + (bh - op.h) / 2; pptParaLinked(s, op, link, mathPng); hotspot(s, IN(RX), IN(by), IN(RW), IN(bh), link); }); }
    // slide đúng
    { const s = pptx.addSlide(); bg(s); addPic(s, pics[i + 1], aspect); head(s);
      s.addText('✔  CHÍNH XÁC!', { x: IN(RX), y: IN(42), w: IN(RW), h: 0.75, shape: pptx.ShapeType.roundRect, rectRadius: 0.1, fill: { color: 'DCFCE7' }, line: { color: H6(T.ok), width: 1.5 }, color: H6(T.ok), bold: true, fontFace: 'Arial', fontSize: 24, align: 'center', valign: 'middle', margin: 0 });
      const p = E.para(RX, 70, RW, [E.R(`Đáp án ${LET[q.correct]}. `, { font: 'sans', bold: true, size: 17, color: T.ok }), E.R(q.options[q.correct], { bold: true, size: 17, color: T.ink })], 17 * 1.25 * PT); pptParaLinked(s, p, 0, mathPng); let y = 70 + p.h + 3;
      s.addText(`Các ô mã ${i + 1}-${LET[q.correct]} đã được tô màu ${col.name} trên bức tranh.`, { x: IN(RX), y: IN(y), w: IN(RW), h: 0.4, fontFace: 'Arial', fontSize: 13, color: H6(T.mute), margin: 0 }); y += 12;
      if (q.explain) { const e = E.para(RX + 4, y + 3, RW - 8, [E.R('💡 ', { font: 'sans', size: 15, color: T.ink }), E.R(q.explain, { size: 15, color: T.ink })], 15 * 1.25 * PT); s.addShape(pptx.ShapeType.roundRect, { x: IN(RX), y: IN(y), w: IN(RW), h: IN(e.h + 6), rectRadius: 0.1, fill: { color: 'F1F5F9' }, line: { type: 'none' } }); pptParaLinked(s, e, 0, mathPng); }
      button(s, i < N - 1 ? 'Câu tiếp theo  ➜' : 'Xem bức tranh  ➜', RX + RW - 72, H - 30, 72, 15, acc, i < N - 1 ? QS(i + 1) : FINAL); }
    // slide sai
    { const s = pptx.addSlide(); bg(s); addPic(s, pics[i], aspect); head(s);
      s.addText('✘  CHƯA ĐÚNG RỒI!', { x: IN(RX), y: IN(50), w: IN(RW), h: 0.85, shape: pptx.ShapeType.roundRect, rectRadius: 0.1, fill: { color: 'FEE2E2' }, line: { color: H6(T.bad), width: 1.5 }, color: H6(T.bad), bold: true, fontFace: 'Arial', fontSize: 26, align: 'center', valign: 'middle', margin: 0 });
      s.addText('Mảnh ghép có mã này không thuộc bức tranh bí ẩn.\nHãy suy nghĩ kĩ và thử lại nhé!', { x: IN(RX), y: IN(80), w: IN(RW), h: 1, fontFace: 'Arial', fontSize: 16, color: H6(T.ink), align: 'center', margin: 0 });
      button(s, '↩  Làm lại câu ' + (i + 1), RX + (RW - 72) / 2, 115, 72, 15, T.bad, QS(i)); } }
  // 3. Kết thúc
  { const s = pptx.addSlide(); bg(s); addPic(s, pics[N], aspect);
    s.addText('🎉 GIẢI MÃ THÀNH CÔNG!', { x: IN(RX), y: IN(44), w: IN(RW), h: 0.8, fontFace: 'Arial', fontSize: 26, bold: true, color: H6(T.ok), margin: 0 });
    s.addText('Bức tranh bí ẩn là', { x: IN(RX), y: IN(68), w: IN(RW), h: 0.4, fontFace: 'Arial', fontSize: 15, color: H6(T.mute), margin: 0 });
    s.addText(ds.meta.pictureName || '★', { x: IN(RX), y: IN(78), w: IN(RW), h: 1.1, shape: pptx.ShapeType.roundRect, rectRadius: 0.12, fill: { color: H6(acc) }, color: 'FFFFFF', bold: true, fontFace: 'Arial', fontSize: 30, align: 'center', valign: 'middle', margin: 0 });
    button(s, '↺  Chơi lại', RX, 125, 60, 15, '#64748B', 1); }
  const snd = {}; for (let i = 0; i < N; i++) { snd[CS(i)] = 'ok'; snd[WS(i)] = 'bad'; } snd[FINAL] = 'win'; return snd;
}
/* ---- âm thanh WAV tự tổng hợp cho PowerPoint ---- */
function makeWav(kind) { const SR = 22050; const notes = { ok: [[1046, 0, .25, 'tri', .5], [1318, .08, .25, 'tri', .5], [1568, .16, .35, 'tri', .5], [2093, .26, .5, 'sin', .3], [2637, .34, .45, 'sin', .2]],
    bad: [[330, 0, .22, 'sq', .28], [247, .22, .45, 'sq', .28], [110, .22, .4, 'saw', .15]],
    win: [[523, 0, .3, 'tri', .45], [659, .13, .3, 'tri', .45], [784, .26, .3, 'tri', .45], [1046, .39, .35, 'tri', .45], [523, .6, 1.1, 'tri', .25], [659, .6, 1.1, 'tri', .25], [784, .6, 1.1, 'tri', .25], [1046, .6, 1.1, 'tri', .25], [2093, .7, .8, 'sin', .12]] }[kind];
  const len = Math.ceil(SR * Math.max(...notes.map(n => n[1] + n[2])) + SR * 0.05); const buf = new Float32Array(len);
  notes.forEach(([f, st, d, ty, v]) => { const s0 = Math.floor(st * SR), n = Math.floor(d * SR); for (let i = 0; i < n && s0 + i < len; i++) { const t = i / SR, ph = (f * t) % 1; let w = ty === 'sin' ? Math.sin(2 * Math.PI * ph) : ty === 'tri' ? 1 - 4 * Math.abs(ph - 0.5) : ty === 'sq' ? (ph < .5 ? 1 : -1) * 0.6 : (2 * ph - 1) * 0.6; const env = Math.min(1, i / (SR * 0.01)) * Math.exp(-3.2 * t / d); buf[s0 + i] += w * v * env; } });
  const out = new DataView(new ArrayBuffer(44 + len * 2)); const wstr = (o, str) => { for (let i = 0; i < str.length; i++) out.setUint8(o + i, str.charCodeAt(i)); };
  wstr(0, 'RIFF'); out.setUint32(4, 36 + len * 2, true); wstr(8, 'WAVE'); wstr(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, SR, true); out.setUint32(28, SR * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); wstr(36, 'data'); out.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, buf[i])) * 30000, true); return new Uint8Array(out.buffer); }
async function noClickAdvance(blob, sounds) { // tắt "bấm để sang slide" để chỉ đi theo nút bấm
  const zip = await JSZip.loadAsync(blob); const files = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  sounds = sounds || {}; const kinds = [...new Set(Object.values(sounds))]; kinds.forEach(k => zip.file('ppt/media/btba_' + k + '.wav', makeWav(k)));
  if (kinds.length) { let ct = await zip.file('[Content_Types].xml').async('string'); if (!/Extension="wav"/i.test(ct)) ct = ct.replace('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="wav" ContentType="audio/wav"/>'); zip.file('[Content_Types].xml', ct); }
  for (const f of files) { const no = +f.match(/slide(\d+)\.xml$/)[1]; let x = await zip.file(f).async('string'); x = x.replace(/<p:transition[^>]*\/>|<p:transition[\s\S]*?<\/p:transition>/g, ''); let tr = '<p:transition advClick="0"/>';
    const kind = sounds[no]; if (kind) { const rf = 'ppt/slides/_rels/slide' + no + '.xml.rels'; let rels = await zip.file(rf).async('string'); const rid = 'rIdBtbaSnd'; rels = rels.replace('</Relationships>', '<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio" Target="../media/btba_' + kind + '.wav"/></Relationships>'); zip.file(rf, rels);
      tr = '<p:transition advClick="0"><p:sndAc><p:stSnd><p:snd r:embed="' + rid + '" name="' + kind + '.wav"/></p:stSnd></p:sndAc></p:transition>'; }
    x = x.includes('</p:clrMapOvr>') ? x.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + tr) : x.replace('</p:cSld>', '</p:cSld>' + tr); zip.file(f, x); }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}
G.GMBT_GAME = { buildGameData, gameHTML, buildPptGame, noClickAdvance, richHTML };
})(window);

/* ===== Đóng gói game thành link online (nén + mã hóa, không cần máy chủ) ===== */
(function (G) {
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function b62enc(bytes) { let out = ''; for (let i = 0; i < bytes.length; i += 5) { const n = Math.min(5, bytes.length - i); let v = 0; for (let k = 0; k < 5; k++) v = v * 256 + (k < n ? bytes[i + k] : 0); let s = ''; for (let k = 0; k < 7; k++) { s = B62[v % 62] + s; v = Math.floor(v / 62); } out += s; } return out + '-' + (bytes.length % 5); }
function b62dec(str) { const [body, rem] = str.split('-'); const out = []; for (let i = 0; i < body.length; i += 7) { let v = 0; for (let k = 0; k < 7; k++) v = v * 62 + B62.indexOf(body[i + k]); const b = []; for (let k = 0; k < 5; k++) { b.unshift(v % 256); v = Math.floor(v / 256); } out.push(...b); } const r = +rem; if (r) out.length -= 5 - r; return new Uint8Array(out); }
async function zip(bytes) { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(bytes); w.close(); return new Uint8Array(await new Response(cs.readable).arrayBuffer()); }
async function unzip(bytes) { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(bytes); w.close(); return new Uint8Array(await new Response(ds.readable).arrayBuffer()); }
const KEY = [66, 84, 66, 65, 45, 72, 68]; // xáo trộn nhẹ
const xor = b => { for (let i = 0; i < b.length; i++) b[i] ^= KEY[i % KEY.length] ^ (i * 13 & 255); return b; };
function varint(arr, v) { while (v >= 128) { arr.push((v & 127) | 128); v >>>= 7; } arr.push(v); }
async function packGame(o) { // o: {meta, W, H, rid, cls, codes, questions}
  const rle = []; let prev = -1, run = 0; const flush = () => { if (run) { varint(rle, prev + 1); varint(rle, run); } };
  for (let i = 0; i < o.rid.length; i++) { const v = o.rid[i]; if (v === prev) run++; else { flush(); prev = v; run = 1; } } flush();
  const meta = new TextEncoder().encode(JSON.stringify({ m: o.meta, W: o.W, H: o.H, c: o.cls, d: o.codes, q: o.questions }));
  const head = []; varint(head, meta.length); const all = new Uint8Array(head.length + meta.length + rle.length); all.set(head, 0); all.set(meta, head.length); all.set(rle, head.length + meta.length);
  return 'play-' + b62enc(xor(await zip(all))); }
async function unpackGame(hash) { const raw = await unzip(xor(b62dec(hash.replace(/^#?play-/, '')))); let p = 0, len = 0, sh = 0; while (true) { const b = raw[p++]; len |= (b & 127) << sh; if (b < 128) break; sh += 7; }
  const o = JSON.parse(new TextDecoder().decode(raw.slice(p, p + len))); p += len; const rid = new Int32Array(o.W * o.H); let i = 0;
  const rd = () => { let v = 0, s = 0; while (true) { const b = raw[p++]; v |= (b & 127) << s; if (b < 128) return v; s += 7; } };
  while (p < raw.length && i < rid.length) { const v = rd() - 1, n = rd(); for (let k = 0; k < n; k++) rid[i++] = v; } o.rid = rid; return o; }
async function packObj(obj, extra) { const meta = new TextEncoder().encode(JSON.stringify(obj)); const head = []; varint(head, meta.length); const ex = extra || []; const all = new Uint8Array(head.length + meta.length + ex.length); all.set(head, 0); all.set(meta, head.length); all.set(ex, head.length + meta.length); return 'play-' + b62enc(xor(await zip(all))); }
async function unpackObj(hash) { const raw = await unzip(xor(b62dec(hash.replace(/^#?play-/, '')))); let p = 0, len = 0, sh = 0; while (true) { const b = raw[p++]; len |= (b & 127) << sh; if (b < 128) break; sh += 7; } return { obj: JSON.parse(new TextDecoder().decode(raw.slice(p, p + len))), rest: raw.slice(p + len) }; }
function rleEnc(arr, off) { const out = []; let prev = null, run = 0; const flush = () => { if (run) { varint(out, prev + off); varint(out, run); } }; for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v === prev) run++; else { flush(); prev = v; run = 1; } } flush(); return out; }
function rleDec(bytes, n, off) { const a = new Int32Array(n); let p = 0, i = 0; const rd = () => { let v = 0, s = 0; while (true) { const b = bytes[p++]; v |= (b & 127) << s; if (b < 128) return v; s += 7; } }; while (p < bytes.length && i < n) { const v = rd() - off, c = rd(); for (let k = 0; k < c; k++) a[i++] = v; } return a; }
G.GMBT_LINK = { packGame, unpackGame, packObj, unpackObj, rleEnc, rleDec };
})(window);
