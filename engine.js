/* ===== BỨC TRANH BÍ ẨN – Ms. Hằng Đỗ – lõi xử lý: chia mảnh, gán mã, dàn trang, xuất SVG/PDF/PPTX ===== */
(function (G) {
'use strict';
const PT = 0.352778; // mm per point
const LET = 'ABCDEF';
const PALETTE = [
  { key: 'red', name: 'đỏ', hex: '#E53935' },
  { key: 'blue', name: 'xanh dương', hex: '#1E5BD6' },
  { key: 'green', name: 'xanh lá', hex: '#2E9E44' },
  { key: 'orange', name: 'cam', hex: '#F57C00' },
  { key: 'purple', name: 'tím', hex: '#8E44AD' },
  { key: 'yellow', name: 'vàng', hex: '#F2C200' },
  { key: 'pink', name: 'hồng', hex: '#E84393' },
  { key: 'brown', name: 'nâu', hex: '#8B5A2B' },
  { key: 'teal', name: 'xanh ngọc', hex: '#0EA5A5' },
  { key: 'black', name: 'đen', hex: '#2B2B2B' },
  { key: 'gray', name: 'xám', hex: '#9AA0A6' },
];
const DEFAULT_PAL = PALETTE.map(p => Object.assign({}, p));
function applyPalette(ov) { PALETTE.forEach((p, i) => { const d = DEFAULT_PAL[i], o = (ov && ov[i]) || {}; p.hex = /^#[0-9a-fA-F]{6}$/.test(o.hex || '') ? o.hex.toUpperCase() : d.hex; p.name = (o.name || '').trim() || d.name; }); }
function lum(hex) { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function textOn(hex) { return lum(hex) > 0.55 ? '#111111' : '#FFFFFF'; }

function rng(seed) { let a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, r) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

/* ---------- min-heap ---------- */
class Heap { constructor() { this.k = []; this.v = []; } get size() { return this.k.length; }
  push(key, val) { const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val); while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; } k[i] = key; v[i] = val; }
  pop() { const k = this.k, v = this.v; const rk = k[0], rv = v[0]; const lk = k.pop(), lv = v.pop(); const n = k.length; if (n) { let i = 0; while (true) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; } k[i] = lk; v[i] = lv; } this.lastKey = rk; return rv; } }

/* ---------- PARTITION ---------- */
function partition(mask, W, H, opt) {
  const r = rng(opt.seed || 1);
  const N = W * H;
  const comp = new Int32Array(N).fill(-1);
  const comps = [];
  const q = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    if (comp[i] >= 0) continue;
    const cls = mask[i], id = comps.length, cells = [];
    let h = 0, t = 0; q[t++] = i; comp[i] = id;
    while (h < t) { const c = q[h++]; cells.push(c); const x = c % W, y = (c / W) | 0;
      if (x > 0 && comp[c - 1] < 0 && mask[c - 1] === cls) { comp[c - 1] = id; q[t++] = c - 1; }
      if (x < W - 1 && comp[c + 1] < 0 && mask[c + 1] === cls) { comp[c + 1] = id; q[t++] = c + 1; }
      if (y > 0 && comp[c - W] < 0 && mask[c - W] === cls) { comp[c - W] = id; q[t++] = c - W; }
      if (y < H - 1 && comp[c + W] < 0 && mask[c + W] === cls) { comp[c + W] = id; q[t++] = c + W; } }
    comps.push({ cls, cells });
  }
  comps.forEach(c => { const T = c.cls < 0 ? opt.bgSize : opt.fgSize; c.k = Math.max(1, Math.round(c.cells.length / T)); });
  // đảm bảo đủ số mảnh cho mỗi màu (≥ số câu hỏi của màu đó)
  const need = opt.need || {};
  Object.keys(need).forEach(clsS => { const cls = +clsS; const list = comps.filter(c => c.cls === cls); if (!list.length) return;
    let sum = list.reduce((a, c) => a + c.k, 0);
    while (sum < need[cls]) { let best = null, bv = 0; list.forEach(c => { const v = c.cells.length / (c.k + 1); if (v >= 2 && v > bv) { bv = v; best = c; } }); if (!best) break; best.k++; sum++; } });

  const rid = new Int32Array(N).fill(-1);
  const regions = [];
  const local = new Int32Array(N).fill(-1);
  for (const c of comps) {
    const lab = splitComp(c, W, H, comp, local, r, c.cls < 0 ? opt.minBg || 4 : opt.minFg || 3);
    const base = regions.length; let maxL = -1;
    c.cells.forEach((cell, j) => { rid[cell] = base + lab[j]; if (lab[j] > maxL) maxL = lab[j]; });
    for (let l = 0; l <= maxL; l++) regions.push({ id: base + l, cls: c.cls, cells: [] });
  }
  return rebuild(W, H, rid, regions.map(g => g.cls));
}
function rebuild(W, H, rid, clsOf) {
  const N = W * H; const regions = clsOf.map((cls, id) => ({ id, cls, cells: [] }));
  for (let i = 0; i < N; i++) regions[rid[i]].cells.push(i);
  // nén id (phòng nhãn rỗng)
  const remap = new Int32Array(regions.length).fill(-1); const R2 = [];
  regions.forEach(g => { if (g.cells.length) { remap[g.id] = R2.length; g.id = R2.length; R2.push(g); } });
  for (let i = 0; i < N; i++) rid[i] = remap[rid[i]];
  R2.forEach(g => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; g.cells.forEach(c => { const x = c % W, y = (c / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }); g.bbox = [x0, y0, x1 + 1, y1 + 1]; });
  // kề nhau
  R2.forEach(g => g.adj = new Map());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, a = rid[i];
    if (x < W - 1) { const b = rid[i + 1]; if (a !== b) { R2[a].adj.set(b, (R2[a].adj.get(b) || 0) + 1); R2[b].adj.set(a, (R2[b].adj.get(a) || 0) + 1); } }
    if (y < H - 1) { const b = rid[i + W]; if (a !== b) { R2[a].adj.set(b, (R2[a].adj.get(b) || 0) + 1); R2[b].adj.set(a, (R2[b].adj.get(a) || 0) + 1); } } }
  R2.forEach(g => { g.poly = outerContour(g, rid, W, H); });
  return { W, H, rid, regions: R2 };
}

function mergeTight(part) { const { W, H, rid } = part; let n = 0;
  for (const g of part.regions) { if (!g.lab || g.lab.fit) continue; let best = -1, bv = 0; g.adj.forEach((v, a) => { const o = part.regions[a]; if (o.cls === g.cls && o.cells.length && v > bv) { bv = v; best = a; } }); if (best < 0) continue; g.cells.forEach(c => rid[c] = best); part.regions[best].cells = part.regions[best].cells.concat(g.cells); g.cells = []; n++; }
  if (!n) return 0; const np = rebuild(W, H, rid, part.regions.map(g => g.cls)); part.regions = np.regions; part.rid = np.rid; return n; }
function splitComp(c, W, H, comp, local, r, minSize) {
  const cells = c.cells, n = cells.length, id = comp[cells[0]];
  const lab = new Int32Array(n);
  if (c.k <= 1 || n < 2) return lab;
  cells.forEach((cell, j) => local[cell] = j);
  const nb4 = (cell, f) => { const x = cell % W, y = (cell / W) | 0;
    if (x > 0 && comp[cell - 1] === id) f(cell - 1); if (x < W - 1 && comp[cell + 1] === id) f(cell + 1);
    if (y > 0 && comp[cell - W] === id) f(cell - W); if (y < H - 1 && comp[cell + W] === id) f(cell + W); };
  // farthest point seeds
  const k = Math.min(c.k, n);
  const mind = new Float64Array(n).fill(Infinity);
  const bfs = (s) => { const d = new Int32Array(n).fill(-1); const qq = [s]; d[local[s]] = 0; for (let h = 0; h < qq.length; h++) { const cc = qq[h]; nb4(cc, nb => { const j = local[nb]; if (d[j] < 0) { d[j] = d[local[cc]] + 1; qq.push(nb); } }); } for (let j = 0; j < n; j++) if (d[j] < mind[j]) mind[j] = d[j]; };
  const seeds = [cells[Math.floor(r() * n)]]; bfs(seeds[0]);
  while (seeds.length < k) { let mx = 0; for (let j = 0; j < n; j++) if (mind[j] > mx) mx = mind[j]; if (mx <= 0) break;
    const cand = []; for (let j = 0; j < n; j++) if (mind[j] >= mx * 0.8) cand.push(cells[j]);
    const s = cand[Math.floor(r() * cand.length)]; seeds.push(s); bfs(s); }
  // tăng trưởng Dijkstra có nhiễu (Chebyshev → mảnh vuông vức)
  const wgt = new Float64Array(n); for (let j = 0; j < n; j++) wgt[j] = 0.55 + r() * 0.9;
  const sx = seeds.map(() => 0.75 + r() * 0.5), sy = seeds.map(() => 0.75 + r() * 0.5); // dị hướng theo mảnh
  const dist = new Float64Array(n).fill(Infinity); lab.fill(-1);
  const hp = new Heap();
  seeds.forEach((s, si) => { dist[local[s]] = 0; lab[local[s]] = si; hp.push(0, s); });
  while (hp.size) { const cell = hp.pop(); const dk = hp.lastKey; const j = local[cell]; if (dk > dist[j]) continue; const L = lab[j];
    const x = cell % W, y = (cell / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const nc = ny * W + nx; if (comp[nc] !== id) continue;
      if (dx && dy && comp[y * W + nx] !== id && comp[ny * W + x] !== id) continue;
      const jj = local[nc]; const step = (dx && dy ? 1 : (dx ? sx[L] : sy[L])) * wgt[jj]; const nd = dk + step;
      if (nd < dist[jj]) { dist[jj] = nd; lab[jj] = L; hp.push(nd, nc); } } }
  for (let j = 0; j < n; j++) if (lab[j] < 0) lab[j] = 0;
  // làm mượt
  for (let it = 0; it < 2; it++) { const nl = lab.slice(); for (let j = 0; j < n; j++) { const cnt = {}; let tot = 0; nb4(cells[j], nb => { const l = lab[local[nb]]; cnt[l] = (cnt[l] || 0) + 1; tot++; }); for (const l in cnt) if (+l !== lab[j] && cnt[l] >= 3) nl[j] = +l; } lab.set(nl); }
  // sửa liên thông + gộp mảnh nhỏ
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    const seen = new Uint8Array(n); const groups = {};
    for (let j = 0; j < n; j++) { if (seen[j]) continue; const L = lab[j]; const part = [j]; seen[j] = 1; for (let h = 0; h < part.length; h++) nb4(cells[part[h]], nb => { const jj = local[nb]; if (!seen[jj] && lab[jj] === L) { seen[jj] = 1; part.push(jj); } }); (groups[L] = groups[L] || []).push(part); }
    const labels = Object.keys(groups);
    for (const L of labels) { const parts = groups[L].sort((a, b) => b.length - a.length);
      const reassign = (part) => { const cnt = {}; part.forEach(j => nb4(cells[j], nb => { const l = lab[local[nb]]; if (l !== +L) cnt[l] = (cnt[l] || 0) + 1; })); let best = -1, bv = -1; for (const l in cnt) if (cnt[l] > bv) { bv = cnt[l]; best = +l; } if (best >= 0) { part.forEach(j => lab[j] = best); changed = true; } };
      for (let p = 1; p < parts.length; p++) reassign(parts[p]);
      if (parts[0].length < minSize && labels.length > 1) reassign(parts[0]); }
    if (!changed) break;
  }
  // nén nhãn
  const m = {}; let nx = 0; for (let j = 0; j < n; j++) { if (m[lab[j]] === undefined) m[lab[j]] = nx++; lab[j] = m[lab[j]]; }
  return lab;
}

function outerContour(g, rid, W, H) {
  const id = g.id; const E = []; const out = new Map();
  const add = (x0, y0, x1, y1) => { const e = { x0, y0, x1, y1, used: false }; const key = y0 * (W + 1) + x0; if (!out.has(key)) out.set(key, []); out.get(key).push(E.length); E.push(e); };
  for (const c of g.cells) { const x = c % W, y = (c / W) | 0;
    if (y === 0 || rid[c - W] !== id) add(x, y, x + 1, y);
    if (x === W - 1 || rid[c + 1] !== id) add(x + 1, y, x + 1, y + 1);
    if (y === H - 1 || rid[c + W] !== id) add(x + 1, y + 1, x, y + 1);
    if (x === 0 || rid[c - 1] !== id) add(x, y + 1, x, y); }
  const loops = [];
  for (let s = 0; s < E.length; s++) { if (E[s].used) continue; const pts = []; let cur = s; const sv = E[s].y0 * (W + 1) + E[s].x0; let guard = 0;
    while (guard++ < E.length + 5) { const e = E[cur]; e.used = true; pts.push([e.x0, e.y0]); const v = e.y1 * (W + 1) + e.x1; if (v === sv) break;
      const cand = (out.get(v) || []).filter(i => !E[i].used); if (!cand.length) break;
      if (cand.length === 1) cur = cand[0]; else { const dx = e.x1 - e.x0, dy = e.y1 - e.y0; const rx = -dy, ry = dx; let pick = cand[0];
        for (const i of cand) { const f = E[i]; if (f.x1 - f.x0 === rx && f.y1 - f.y0 === ry) { pick = i; break; } } cur = pick; } }
    loops.push(pts); }
  let best = null, ba = -1; for (const L of loops) { let a = 0; for (let i = 0; i < L.length; i++) { const p = L[i], q2 = L[(i + 1) % L.length]; a += p[0] * q2[1] - q2[0] * p[1]; } a = Math.abs(a); if (a > ba) { ba = a; best = L; } }
  // bỏ điểm thẳng hàng
  const P = best || []; const res = [];
  for (let i = 0; i < P.length; i++) { const a = P[(i - 1 + P.length) % P.length], b = P[i], c = P[(i + 1) % P.length]; if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) !== 0) res.push(b); }
  return res;
}

/* ---------- gán mã ---------- */
function assignCodes(part, questions, r) {
  // questions: [{color, correct, options}] ; trả về code cho mỗi vùng: {q, o}
  const byColor = {}; questions.forEach((q, i) => { if (q.correct >= 0 && q.correct < q.options.length) (byColor[q.color] = byColor[q.color] || []).push(i); });
  const wrong = []; questions.forEach((q, i) => q.options.forEach((_, o) => { if (o !== q.correct) wrong.push({ q: i, o }); }));
  const use = new Map(); const keyOf = c => c.q * 10 + c.o;
  const order = part.regions.slice().sort((a, b) => b.cells.length - a.cells.length);
  // vùng màu: xoay vòng để mọi câu đều xuất hiện
  const fgByColor = {}; order.forEach(g => { if (g.cls >= 0) (fgByColor[g.cls] = fgByColor[g.cls] || []).push(g); });
  for (const cls in fgByColor) { const qs = byColor[cls]; const list = fgByColor[cls];
    if (!qs || !qs.length) { list.forEach(g => g.orphan = true); continue; }
    const pool = shuffle(qs.slice(), r); let pi = 0;
    // vòng 1: mỗi câu ít nhất 1 mảnh
    const sh = shuffle(list.slice(), r);
    sh.forEach(g => { let tries = 0, qi; do { qi = pool[pi % pool.length]; pi++; tries++; } while (tries < pool.length && [...g.adj.keys()].some(a => part.regions[a].code && part.regions[a].code.q === qi && part.regions[a].cls >= 0));
      g.code = { q: qi, o: questions[qi].correct, ok: true }; }); }
  const bg = order.filter(g => g.cls < 0 || g.orphan);
  shuffle(bg, r);
  for (const g of bg) { if (!wrong.length) { g.code = null; continue; }
    const nbCodes = new Set(); g.adj.forEach((_, a) => { const c = part.regions[a].code; if (c) nbCodes.add(keyOf(c)); });
    let minU = Infinity; const cand = []; for (const w of wrong) { if (nbCodes.has(keyOf(w))) continue; const u = use.get(keyOf(w)) || 0; if (u < minU) { minU = u; cand.length = 0; } if (u === minU) cand.push(w); }
    const pick = cand.length ? cand[Math.floor(r() * cand.length)] : wrong[Math.floor(r() * wrong.length)];
    use.set(keyOf(pick), (use.get(keyOf(pick)) || 0) + 1); g.code = { q: pick.q, o: pick.o, ok: false }; }
  part.regions.forEach(g => { g.label = g.code ? `${g.code.q + 1}-${LET[g.code.o]}` : ''; });
}

/* ---------- đặt nhãn ---------- */
function placeLabels(part, cellMM, maxPt, minPt, measure) {
  const { W, rid } = part;
  for (const g of part.regions) {
    if (!g.label) { g.lab = null; continue; }
    const [x0, y0, x1, y1] = g.bbox; const bw = x1 - x0, bh = y1 - y0;
    const P = new Int32Array((bw + 1) * (bh + 1));
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const inR = rid[(y0 + y) * W + x0 + x] === g.id ? 1 : 0; P[(y + 1) * (bw + 1) + x + 1] = inR + P[y * (bw + 1) + x + 1] + P[(y + 1) * (bw + 1) + x] - P[y * (bw + 1) + x]; }
    const full = (cx0, cy0, cx1, cy1) => { if (cx0 < 0 || cy0 < 0 || cx1 > bw || cy1 > bh) return false; const s = P[cy1 * (bw + 1) + cx1] - P[cy0 * (bw + 1) + cx1] - P[cy1 * (bw + 1) + cx0] + P[cy0 * (bw + 1) + cx0]; return s === (cx1 - cx0) * (cy1 - cy0); };
    // tâm: trọng tâm
    let mx = 0, my = 0; g.cells.forEach(c => { mx += c % W + 0.5; my += ((c / W) | 0) + 0.5; }); mx = mx / g.cells.length - x0; my = my / g.cells.length - y0;
    let done = false;
    for (let pt = maxPt; pt >= minPt - 1e-6 && !done; pt -= 0.5) {
      const tw = (measure(g.label, pt) + 0.9) / cellMM, th = (pt * PT * 0.78 + 0.9) / cellMM;
      let best = null, bd = Infinity;
      for (let yy = 0; yy + th <= bh + 1e-9; yy += 0.25) for (let xx = 0; xx + tw <= bw + 1e-9; xx += 0.25) {
        if (!full(Math.floor(xx), Math.floor(yy), Math.ceil(xx + tw - 1e-9), Math.ceil(yy + th - 1e-9))) continue;
        const cx = xx + tw / 2, cy = yy + th / 2; const d = (cx - mx) ** 2 + (cy - my) ** 2; if (d < bd) { bd = d; best = [cx, cy]; } }
      if (best) { g.lab = { x: x0 + best[0], y: y0 + best[1], pt, fit: true }; done = true; }
    }
    if (!done) { // vị trí ô sâu nhất
      let bc = g.cells[0], bv = -1; g.cells.forEach(c => { const x = c % W, y = (c / W) | 0; let d = 0; while (d < 6 && rid[y * W + Math.min(W - 1, x + d + 1)] === g.id && rid[y * W + Math.max(0, x - d - 1)] === g.id) d++; const v = d - Math.hypot(x + 0.5 - x0 - mx, y + 0.5 - y0 - my) * 0.01; if (v > bv) { bv = v; bc = c; } });
      g.lab = { x: bc % W + 0.5, y: ((bc / W) | 0) + 0.5, pt: Math.max(4, minPt - 1), fit: false };
    }
  }
}

/* ---------- đo & ngắt dòng ---------- */
let mctx = null; const mcache = new Map();
function textW(t, font, bold, size) {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  const key = font + (bold ? 1 : 0) + '|' + t; let w = mcache.get(key);
  if (w === undefined) { mctx.font = `${bold ? 'bold ' : ''}100px ${font === 'serif' ? 'LibSerif' : 'LibSans'}`; w = mctx.measureText(t).width / 100; if (mcache.size > 20000) mcache.clear(); mcache.set(key, w); }
  return w * size * PT;
}
const MATH_RE = /(\$[^$\n]+\$|\\\([\s\S]+?\\\))/g;
let mathInfo = () => null;
function setMathInfo(f) { mathInfo = f; }
function splitMath(text) { text = String(text == null ? '' : text); const out = []; let last = 0; text.replace(MATH_RE, (m, g, off) => { if (off > last) out.push({ t: text.slice(last, off) }); out.push({ m: m.startsWith('$') ? m.slice(1, -1) : m.slice(2, -2) }); last = off + m.length; return m; }); if (last < text.length) out.push({ t: text.slice(last) }); return out; }
function mathList(text) { return splitMath(text).filter(p => p.m != null).map(p => p.m.trim()); }
function wrapRuns(runs, maxW) {
  const toks = [];
  runs.forEach(r => splitMath(r.text).forEach(part => {
    if (part.m != null) { const mi = mathInfo(part.m.trim()); if (mi) { const k = r.size * PT; toks.push({ math: part.m.trim(), st: r, w: mi.w * k, asc: mi.asc * k, desc: mi.desc * k, mi, glued: toks.length && !toks[toks.length - 1].space && !toks[toks.length - 1].br }); return; } part.t = part.m; }
    part.t.split(/(\n| +)/).forEach(p => { if (!p) return; if (p === '\n') toks.push({ br: true }); else toks.push({ text: p, st: r, space: /^ +$/.test(p), glued: toks.length && !toks[toks.length - 1].space && !toks[toks.length - 1].br }); }); }));
  const lines = []; let cur = [], w = 0;
  const push = () => { while (cur.length && cur[cur.length - 1].space) w -= cur.pop().w; lines.push({ segs: cur, w }); cur = []; w = 0; };
  for (const t of toks) {
    if (t.br) { push(); continue; }
    if (t.math) { if (w + t.w > maxW && cur.length && !(t.glued && t.w < maxW * 0.12)) push(); cur.push(t); w += t.w; continue; }
    let tw = textW(t.text, t.st.font, t.st.bold, t.st.size);
    if (t.space) { if (cur.length) { const sw = textW(' ', t.st.font, t.st.bold, t.st.size); cur.push({ text: ' ', st: t.st, w: sw, space: true }); w += sw; } continue; }
    if (w + tw > maxW && cur.length && !(t.glued && tw < maxW * 0.12)) push();
    if (tw > maxW) { let chunk = ''; for (const ch of t.text) { const cw = textW(chunk + ch, t.st.font, t.st.bold, t.st.size); if (cw > maxW && chunk) { const ww = textW(chunk, t.st.font, t.st.bold, t.st.size); cur.push({ text: chunk, st: t.st, w: ww }); w += ww; push(); chunk = ch; } else chunk += ch; } t.text = chunk; tw = textW(chunk, t.st.font, t.st.bold, t.st.size); }
    cur.push({ text: t.text, st: t.st, w: tw }); w += tw;
  }
  if (cur.length || !lines.length) push();
  lines.forEach(l => { let x = 0; const segs = []; l.segs.forEach(s => { const last = segs[segs.length - 1];
    if (s.math) segs.push({ math: s.math, mi: s.mi, st: s.st, x, w: s.w, asc: s.asc, desc: s.desc });
    else if (last && !last.math && last.st === s.st) { last.text += s.text; last.w += s.w; }
    else segs.push({ text: s.text, st: s.st, x, w: s.w }); x += s.w; }); l.segs = segs; l.hasMath = segs.some(g => g.math); });
  return lines;
}
function para(x, y, w, runs, lineH, align) { const lines = wrapRuns(runs, w); const size = runs[0].size; const asc0 = lineH * 0.5 + 0.35 * size * PT, desc0 = lineH - asc0; let top = 0;
  lines.forEach(l => { let a = asc0, d = desc0; l.segs.forEach(g => { if (g.math) { a = Math.max(a, g.asc + 0.45); d = Math.max(d, g.desc + 0.45); } }); l.top = top; l.base = top + a; top += a + d; });
  return { t: 'para', x, y, w, runs, lines, lineH, asc0, h: top, align: align || 'left', hasMath: lines.some(l => l.hasMath) }; }
const R = (text, o) => Object.assign({ text, font: 'serif', bold: false, size: 11, color: '#111111' }, o || {});

/* ---------- dàn trang ---------- */
const PAPERS = { A3: [297, 420], A4: [210, 297], A5: [148, 210], B4: [250, 353], B5: [176, 250], Letter: [215.9, 279.4], Legal: [215.9, 355.6] };
function pageGeom(orient, paper) { const P = PAPERS[paper] || PAPERS.A4;
  if (orient === 'portrait') { const W = P[0], H = P[1], f = W / 210, m = 10 * f, top = 21 * f, bot = H - 11 * f; const pic = { x: m, y: top, w: W - 2 * m, h: Math.min(W - 2 * m, H * 0.56) }; const y2 = pic.y + pic.h + 5 * f, cw = (W - 2 * m - 7 * f) / 2;
    return { W, H, f, m, pic, header: { x: m, y: 6 * f, w: W * 0.56, h: 11 * f }, right: W - m, footY: H - 7 * f, col1: [{ x: m, y: y2, w: cw, h: bot - y2 }, { x: m + cw + 7 * f, y: y2, w: cw, h: bot - y2 }], more: [{ x: m, y: top, w: cw, h: bot - top }, { x: m + cw + 7 * f, y: top, w: cw, h: bot - top }] }; }
  const W = P[1], H = P[0], f = H / 210, m = 8 * f, top = 21 * f, bot = H - 11 * f; const pw = W * 0.593; const pic = { x: m, y: top, w: pw, h: bot - top }; const cx = m + pw + 7 * f, cw2 = (W - 2 * m - 9 * f) / 2;
  return { W, H, f, m, pic, header: { x: m, y: 6 * f, w: pw, h: 11 * f }, right: W - m, footY: H - 7 * f, col1: [{ x: cx, y: top, w: W - m - cx, h: bot - top }], more: [{ x: m, y: top, w: cw2, h: bot - top }, { x: m + cw2 + 9 * f, y: top, w: cw2, h: bot - top }] }; }
function gridDims(orient, cols, paper) { const g = pageGeom(orient, paper).pic; return { W: cols, H: Math.max(10, Math.round(cols * g.h / g.w)) }; }

/* ---------- giao diện (theme) ---------- */
function mix(hex, t, to) { const a = hexRGB(hex), b = hexRGB(to || '#FFFFFF'); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase(); }
const GRAYS = ['#262626', '#B0B0B0', '#6E6E6E', '#DCDCDC', '#4A4A4A', '#939393', '#C8C8C8', '#3A3A3A'];
function makeTheme(st) { const m = st.meta; const bw = m.printMode === 'bw'; const acc = bw ? '#1A1A1A' : (/^#[0-9a-fA-F]{6}$/.test(m.accent || '') ? m.accent.toUpperCase() : '#1F3A5F');
  const T = { bw, acc, soft: bw ? '#EFEFEF' : mix(acc, 0.9), soft2: bw ? '#F6F6F6' : mix(acc, 0.95), ink: '#1A1A1A', muted: bw ? '#404040' : '#5A6270', line: bw ? '#8A8A8A' : '#C5CBD3', fill: {} };
  const used = []; st.questions.forEach(q => { if (!used.includes(q.color)) used.push(q.color); }); (st._colors || []).forEach(c => { if (!used.includes(c)) used.push(c); });
  used.sort((a, b) => a - b).forEach((c, i) => { T.fill[c] = bw ? GRAYS[i % GRAYS.length] : (PALETTE[c] || PALETTE[0]).hex; });
  T.colorOf = c => T.fill[c] || (bw ? '#777777' : (PALETTE[c] || PALETTE[0]).hex); return T; }

function headerItems(geo, st, T, answer, pageNo, pageTot) {
  const meta = st.meta, f = geo.f, it = []; const h = geo.header;
  it.push({ t: 'rect', x: h.x, y: h.y, w: h.w, h: h.h, fill: T.acc, rx: 1.6 * f });
  const ts = 15 * f; const title = answer ? meta.answerTitle : meta.title;
  const sub = (meta.subtitle || '').trim(); const subW = sub ? Math.min(h.w * 0.45, textW(sub, 'sans', false, 9.5 * f) + 2) : 0;
  it.push(para(h.x + 4 * f, h.y + (h.h - ts * 1.15 * PT) / 2, h.w - 8 * f - subW, [R(title, { font: 'sans', bold: true, size: ts, color: '#FFFFFF' })], ts * 1.15 * PT));
  if (sub) it.push(para(h.x + h.w - 4 * f - subW, h.y + (h.h - 9.5 * f * 1.2 * PT) / 2, subW, [R(sub, { font: 'sans', size: 9.5 * f, color: '#FFFFFF' })], 9.5 * f * 1.2 * PT, 'right'));
  const bx = h.x + h.w + 4 * f, bw = geo.right - bx;
  const rt = answer ? meta.teacherNote : (meta.showName ? meta.nameLine : '');
  if (rt && bw > 20) { const fs = 10.5 * f;
    if (answer) { it.push({ t: 'rect', x: bx, y: h.y, w: bw, h: h.h, fill: T.soft, rx: 1.6 * f }); it.push(para(bx + 3 * f, h.y + (h.h - fs * 1.2 * PT) / 2, bw - 6 * f, [R(rt, { font: 'sans', bold: true, size: fs, color: T.acc })], fs * 1.2 * PT, 'center')); }
    else { it.push({ t: 'rect', x: bx, y: h.y, w: bw, h: h.h, stroke: T.line, lw: 0.3, rx: 1.6 * f });
      // kéo dài dòng chấm của ô Họ và tên cho đầy khung
      let txt = rt; const avail = bw - 6.5 * f; const runs = [...txt.matchAll(/\.{3,}/g)];
      if (runs.length && textW(txt, 'sans', false, fs) < avail) { const dw = textW('.', 'sans', false, fs); const extra = Math.floor((avail - textW(txt, 'sans', false, fs)) / dw); const first = runs[0]; const give0 = runs.length > 1 ? Math.round(extra * 0.8) : extra; const give1 = extra - give0;
        let out = txt.slice(0, first.index) + first[0] + '.'.repeat(give0) + txt.slice(first.index + first[0].length); if (give1 > 0) { const r2 = [...out.matchAll(/\.{3,}/g)]; const last = r2[r2.length - 1]; out = out.slice(0, last.index) + last[0] + '.'.repeat(give1) + out.slice(last.index + last[0].length); } txt = out; }
      const p = para(bx + 3 * f, 0, bw - 6 * f, [R(txt, { font: 'sans', size: fs, color: T.ink })], fs * 1.25 * PT); p.y = h.y + (h.h - p.h) / 2; it.push(p); } }
  // chân trang: chỉ hiện khi người dùng tự nhập nội dung
  const foot = (meta.footer || '').trim();
  if (foot) { const fy = geo.footY, fsz = 8 * f; it.push({ t: 'line', x1: geo.m, y1: fy - 1.2 * f, x2: geo.right, y2: fy - 1.2 * f, stroke: T.line, lw: 0.25 }); it.push(para(geo.m, fy, geo.right - geo.m, [R(foot, { font: 'sans', size: fsz, color: T.muted })], fsz * 1.2 * PT)); }
  return it;
}

function studentBlocks(st, cw, sz, T) {
  const blocks = []; const meta = st.meta; const LS = meta.lineSpacing || 1.2;
  if (meta.instruction) { const is = sz * 0.9, pad = 2.6; const p = para(pad + 1.6, pad, cw - pad * 2 - 1.6, [R('Hướng dẫn: ', { font: 'sans', bold: true, size: is, color: T.acc }), R(meta.instruction, { font: 'sans', size: is, color: T.ink })], is * LS * PT); const hh = p.h + pad * 2;
    blocks.push({ items: [{ t: 'rect', x: 0, y: 0, w: cw, h: hh, fill: T.soft, rx: 1.4 }, { t: 'rect', x: 0, y: 0, w: 1.4, h: hh, fill: T.acc }, p], h: hh }); }
  st.questions.forEach((q, i) => {
    const items = []; let y = 0; const lh = sz * LS * PT; const pg = 0.7 * LS / 1.2;
    const p1 = para(0, y, cw, [R(`Câu ${i + 1}. `, { bold: true, size: sz, color: T.acc }), R(q.text, { bold: true, size: sz, color: T.ink })], lh); items.push(p1); y += p1.h + pg;
    if (meta.showColorHint && q.hint !== false) { const col = PALETTE[q.color] || PALETTE[0]; const hs = sz * 0.86; const sw = hs * PT * 0.78;
      const tpl = String(meta.hintTpl || 'Đáp án đúng của câu này: tô màu {màu}').replace(/\{câu\}/gi, String(i + 1)); const parts = tpl.split(/\{màu\}/i); const runs = [];
      parts.forEach((pt, k) => { if (pt) runs.push(R(pt, { font: 'sans', size: hs, color: T.muted })); if (k < parts.length - 1) runs.push(R(col.name, { font: 'sans', bold: true, size: hs, color: T.ink })); });
      const p2 = para(sw + 1.8, y, cw - sw - 1.8, runs.length ? runs : [R(' ', { font: 'sans', size: hs })], hs * LS * PT); const cy = y + p2.lines[0].base - hs * PT * 0.36;
      items.push({ t: 'rect', x: 0.2, y: cy - sw / 2, w: sw, h: sw, fill: T.colorOf(q.color), stroke: '#333333', lw: 0.2, rx: 0.5 }); items.push(p2); y += p2.h + pg; }
    const os = sz * 0.95; const n = q.options.length; const ws = q.options.map((o, k) => Math.max(...wrapRuns([R(`${LET[k]}. `, { size: os, bold: true }), R(o, { size: os })], 1e6).map(l => l.w)));
    const mx = Math.max(...ws, 1); let nc = 1; for (const c of [n <= 4 ? n : 0, 2]) { if (c >= 2 && mx <= cw / c - 3) { nc = c; break; } }
    const colW = cw / nc;
    for (let k = 0; k < n; k += nc) { let rh = 0; for (let j = 0; j < nc && k + j < n; j++) { const p = para(j * colW, y, colW - 2, [R(`${LET[k + j]}. `, { size: os, bold: true, color: T.acc }), R(q.options[k + j], { size: os, color: T.ink })], os * LS * PT); items.push(p); rh = Math.max(rh, p.h); } y += rh + 0.3 * LS / 1.2; }
    blocks.push({ items, h: y, sep: true });
  });
  return blocks;
}
function answerBlocks(st, cw, sz, T) {
  const LS = st.meta.lineSpacing || 1.2; const blocks = []; const lh = sz * LS * PT;
  if (st.meta.pictureName) { const p = para(0, 0, cw, [R('Bức tranh: ', { font: 'sans', size: sz * 1.05, color: T.muted }), R(st.meta.pictureName, { font: 'sans', bold: true, size: sz * 1.15, color: T.acc })], sz * 1.15 * LS * PT); blocks.push({ items: [p], h: p.h }); }
  // chip mã đúng
  { const cs = sz * 0.88, ch = cs * PT * 1.75, items = []; const lab = para(0, 0, cw, [R('Mã đúng:', { font: 'sans', bold: true, size: cs, color: T.ink })], ch); items.push(lab); let x = textW('Mã đúng:', 'sans', true, cs) + 2.5, y = 0;
    st.questions.forEach((q, i) => { const code = `${i + 1}-${q.correct >= 0 ? LET[q.correct] : '?'}`; const w = textW(code, 'sans', true, cs) + 4; if (x + w > cw) { x = 0; y += ch + 1.4; } const fc = T.colorOf(q.color);
      items.push({ t: 'rect', x, y, w, h: ch, fill: fc, stroke: T.bw ? '#222222' : null, lw: 0.2, rx: ch / 2 }); items.push(para(x, y, w, [R(code, { font: 'sans', bold: true, size: cs, color: textOn(fc) })], ch, 'center')); x += w + 1.4; });
    blocks.push({ items, h: y + ch }); }
  // bảng đáp án
  const hs = sz * 0.82, c1 = textW('Câu 10', 'sans', true, hs) + 4, swz = sz * PT * 0.75; const names = st.questions.map(q => (PALETTE[q.color] || PALETTE[0]).name); const c3 = Math.min(cw * 0.32, Math.max(textW('Màu tô', 'sans', true, hs), ...names.map(n => textW(n, 'sans', false, hs))) + swz + 6); const c2 = cw - c1 - c3;
  { const hh = hs * PT * 2.1; const ph = (t, x, w, al) => para(x, (hh - hs * 1.2 * PT) / 2, w, [R(t, { font: 'sans', bold: true, size: hs, color: '#FFFFFF' })], hs * 1.2 * PT, al);
    blocks.push({ items: [{ t: 'rect', x: 0, y: 0, w: cw, h: hh, fill: T.acc, rx: 1 }, ph('Câu', 0, c1, 'center'), ph('Đáp án đúng', c1 + 2, c2 - 4), ph('Màu tô', c1 + c2 + 2, c3 - 4)], h: hh, gap: 0 }); }
  st.questions.forEach((q, i) => { const items = []; const pad = 1.6; let y = pad;
    const ans = q.correct >= 0 ? q.options[q.correct] : '(chưa chọn đáp án)'; const L = q.correct >= 0 ? LET[q.correct] + '. ' : '';
    const p1 = para(c1 + 2, y, c2 - 4, [R(L, { bold: true, size: sz, color: T.acc }), R(ans, { bold: true, size: sz, color: T.ink })], lh); items.push(p1); y += p1.h;
    if (q.explain) { const es = sz * 0.88; const p2 = para(c1 + 2, y + 0.4, c2 - 4, [R(q.explain, { size: es, color: T.muted })], es * LS * PT); items.push(p2); y += p2.h + 0.4; }
    const rh = y + pad; const col = PALETTE[q.color] || PALETTE[0];
    const pc = para(0, 0, c1, [R(String(i + 1), { font: 'sans', bold: true, size: sz, color: T.acc })], lh, 'center'); pc.y = pad + (p1.lines[0].base - pc.lines[0].base);
    const pn = para(c1 + c2 + swz + 3.5, 0, c3 - swz - 4.5, [R(col.name, { font: 'sans', size: hs, color: T.ink })], hs * 1.2 * PT); pn.y = pad + (p1.lines[0].base - pn.lines[0].base);
    items.unshift({ t: 'rect', x: 0, y: 0, w: cw, h: rh, fill: i % 2 ? T.soft2 : '#FFFFFF' });
    items.push(pc, { t: 'rect', x: c1 + c2 + 2, y: pad + p1.lines[0].base - hs * PT * 0.36 - swz / 2, w: swz, h: swz, fill: T.colorOf(q.color), stroke: '#333333', lw: 0.2, rx: 0.5 }, pn, { t: 'line', x1: 0, y1: rh, x2: cw, y2: rh, stroke: T.line, lw: 0.2 });
    blocks.push({ items, h: rh, gap: 0 }); });
  return blocks;
}
function flow(blocksFn, geo, sz, gap) {
  const cols = [...geo.col1.map(c => ({ ...c, page: 0 }))];
  const blocks = blocksFn(sz, geo.col1[0].w);
  const placed = []; let ci = 0, y = cols[0].y, pageCount = 1;
  const ensureCol = (i) => { while (cols.length <= i) { const p = pageCount++; geo.more.forEach(c => cols.push({ ...c, page: p })); } };
  let curBlocks = blocks; let rebuilt = false;
  for (let b = 0; b < curBlocks.length; b++) { let blk = curBlocks[b]; ensureCol(ci); let col = cols[ci];
    if (y + blk.h > col.y + col.h && y > col.y + 0.01) { ci++; ensureCol(ci); col = cols[ci]; y = col.y; }
    if (Math.abs(col.w - geo.col1[0].w) > 0.5 && !rebuilt) { curBlocks = curBlocks.slice(0, b).concat(blocksFn(sz, col.w).slice(b)); rebuilt = true; blk = curBlocks[b]; }
    placed.push({ page: col.page, x: col.x, y, w: col.w, top: y <= col.y + 0.01, blk, gap }); y += blk.h + (blk.gap != null ? blk.gap : gap); }
  return { placed, pages: pageCount };
}
function layoutDoc(st, answer) {
  const geo = pageGeom(st.meta.orientation, st.meta.paper); const T = makeTheme(st);
  const fn = (sz, cw) => answer ? answerBlocks(st, cw, sz, T) : studentBlocks(st, cw, sz, T);
  const qg = st.meta.qGap != null ? st.meta.qGap : 3.5; const gapOf = sz => qg * sz / 11;
  let sz = st.meta.qSize || 0, res;
  if (!sz) { const f = geo.f; const hi = Math.round(11.5 * f * 2) / 2, lo = Math.max(7, Math.round(8.5 * f * 2) / 2); for (sz = hi; sz >= lo; sz -= 0.5) { res = flow(fn, geo, sz, gapOf(sz)); if (res.pages === 1) break; } if (res.pages > 1) { sz = Math.max(lo, Math.round(11 * f * 2) / 2); res = flow(fn, geo, sz, gapOf(sz)); } }
  else res = flow(fn, geo, sz, gapOf(sz));
  const pages = []; for (let p = 0; p < res.pages; p++) pages.push({ w: geo.W, h: geo.H, items: headerItems(geo, st, T, answer, p + 1, res.pages).concat(p === 0 ? [{ t: 'picture', ...geo.pic, answer, fills: T.fill, frame: T.acc, bw: T.bw, f: geo.f }] : []) });
  res.placed.forEach(pl => { if (pl.blk.sep && !pl.top) pages[pl.page].items.push({ t: 'line', x1: pl.x, y1: pl.y - pl.gap / 2, x2: pl.x + pl.w, y2: pl.y - pl.gap / 2, stroke: T.line, lw: 0.2, dash: true });
    pl.blk.items.forEach(it => { const c = Object.assign({}, it); if (c.t === 'circle') { c.cx += pl.x; c.cy += pl.y; } else if (c.t === 'line') { c.x1 += pl.x; c.x2 += pl.x; c.y1 += pl.y; c.y2 += pl.y; } else { c.x += pl.x; c.y += pl.y; } pages[pl.page].items.push(c); }); });
  return pages;
}


/* ---------- TRANG HƯỚNG DẪN GIÁO VIÊN ---------- */
function guideData(st) {
  const qs = st.questions, N = qs.length || 1, meta = st.meta;
  const cols = []; qs.forEach(q => { const n = (PALETTE[q.color] || PALETTE[0]).name; if (!cols.includes(n)) cols.push(n); });
  const codes = qs.map((q, i) => `${i + 1}-${q.correct >= 0 ? LET[q.correct] : '?'}`).join(', ');
  const topic = (meta.subtitle || '').trim() || 'nội dung bài học'; const pic = (meta.pictureName || '').trim() || 'bức tranh bí ẩn';
  const tWork = Math.max(6, Math.round(N * 1.6)); const k = Math.max(1, Math.ceil(N / 4)); const tThink = Math.max(4, k * 2), tDisc = Math.max(5, Math.round(N * 1.1));
  const T1 = 3 + tWork + 2 + 6 + 3, T2 = 3 + tThink + tDisc + 6 + 6 + 2;
  return { N, cols, codes, topic, pic, tWork, k, tThink, tDisc, T1, T2,
    info: [
      ['Mục tiêu', `Củng cố, luyện tập kiến thức “${topic}” qua ${N} câu hỏi trắc nghiệm; phát triển năng lực tự học, giải quyết vấn đề và hợp tác; tạo hứng thú nhờ yếu tố “giải mã” – bức tranh chỉ hiện ra khi trả lời đúng, giúp học sinh tự kiểm tra kết quả.`],
      ['Thời điểm', 'Hoạt động Luyện tập/Củng cố cuối bài, tiết ôn tập chương hoặc khởi động tiết ôn tập.'],
      ['Chuẩn bị', `Giáo viên: phiếu học tập (mỗi HS 1 bản khổ A4 hoặc mỗi nhóm 1 bản A3), trang đáp án, bài trình chiếu, đồng hồ đếm ngược. Học sinh: bút chì, bút màu ${cols.join(', ')}.`],
      ['Đáp án nhanh', `Mã đúng: ${codes}. Bức tranh: ${pic}.`],
    ],
    c1: { title: 'CÁCH 1 · THỬ THÁCH GIẢI MÃ CÁ NHÂN', style: 'Phong cách thi đua – trò chơi hóa, nhịp nhanh, đánh giá từng học sinh', time: T1, steps: [
      ['Khởi động & giao nhiệm vụ', 3, `Chiếu khung tranh còn trống, đặt câu hỏi gợi tò mò: “Bức tranh bí ẩn này là gì?”. Phổ biến luật: trả lời từng câu → tìm các mảnh ghép có mã đúng (VD: câu 1 chọn A → tô mọi mảnh “1-A”) → tô đúng màu yêu cầu. Chỉ tô mảnh có mã đúng, không đoán hình để tô.`],
      ['Làm bài cá nhân', tWork, 'HS làm độc lập, ghi đáp án ra lề phiếu trước rồi mới tô. GV đi vòng quanh lớp, quan sát, hỗ trợ bằng câu hỏi gợi mở (không nói đáp án), ghi nhận các lỗi sai phổ biến để chữa bài.'],
      ['Đoán tranh – về đích', 2, 'HS đầu tiên đoán đúng tên bức tranh và có phiếu tô chính xác được “về đích”. Tranh bị “lỗi hình” nghĩa là còn câu sai – HS tự rà soát lại: đây là cơ hội tự điều chỉnh rất giá trị.'],
      ['Chữa bài & công bố tranh', 6, `Chiếu trang đáp án. HS tự đối chiếu mã đúng (${codes}). Với câu nhiều HS sai, mời HS giải thích cách làm, phân tích vì sao phương án nhiễu sai → GV chốt kiến thức trọng tâm.`],
      ['Củng cố – khen thưởng', 3, 'Mỗi HS nêu 1 điều đã học và 1 lỗi cần tránh. Tuyên dương HS về đích sớm, phiếu tô đẹp; chụp ảnh các bức tranh đẹp để trưng bày.'],
    ], plus: 'Đánh giá chính xác năng lực từng HS; HS tự kiểm tra kết quả qua hình hiện ra; không khí sôi nổi, tập trung cao.' },
    c2: { title: 'CÁCH 2 · TRẠM GIẢI MÃ HỢP TÁC', style: 'Phong cách học tập hợp tác – kĩ thuật khăn trải bàn & mảnh ghép', time: T2, steps: [
      ['Chia nhóm & phân vai', 3, 'Nhóm 4 HS, mỗi nhóm 1 phiếu A3. Phân vai: Trưởng nhóm (điều phối, giữ thời gian) – Thư kí (ghi đáp án) – Kiểm tra viên (đối chiếu mã) – Họa sĩ (tô màu). Các vai luân phiên ở lần sau.'],
      ['Suy nghĩ cá nhân', tThink, `Mỗi thành viên nhận khoảng ${k} câu (chia đều ${N} câu), tự suy nghĩ và ghi đáp án kèm lí do ngắn gọn vào phần của mình trên giấy “khăn trải bàn”.`],
      ['Thảo luận thống nhất', tDisc, 'Lần lượt từng bạn trình bày lập luận, cả nhóm phản biện và thống nhất đáp án. Kiểm tra viên xác nhận mã đúng trước khi cho phép tô.'],
      ['Ghép tranh', 6, 'Cả nhóm cùng tô: mỗi bạn tô các mảnh thuộc câu mình phụ trách → bức tranh hiện dần lên. Nhóm đoán tên bức tranh và đặt một câu chốt kiến thức gắn với bức tranh.'],
      ['Trình bày & phản biện', 6, 'Mời 1–2 nhóm trình bày bức tranh và giải thích câu khó nhất; các nhóm khác nhận xét, đặt câu hỏi. GV chiếu đáp án, chốt kiến thức, sửa các lỗi sai điển hình.'],
      ['Đánh giá đồng đẳng', 2, 'Các nhóm chấm chéo theo bảng kiểm: đúng tranh – đúng đáp án – lập luận rõ ràng – hợp tác tốt. GV tổng hợp, khen thưởng nhóm xuất sắc.'],
    ], plus: 'Phát triển năng lực giao tiếp và hợp tác; HS khá hỗ trợ HS chưa vững; giảm áp lực, tăng hiệu quả ghi nhớ nhờ giải thích cho nhau.' },
    extra: [
      ['Dạy học phân hóa', ['HS chưa vững: phát thẻ gợi ý (công thức, từ khóa), cho phép xem SGK ở 1–2 câu khó.', 'HS khá, giỏi: yêu cầu giải thích vì sao các phương án còn lại sai; tự đặt thêm 1 câu hỏi mới cho bạn.', 'HS hoàn thành sớm: làm “trợ giảng”, hỗ trợ bạn bằng gợi ý (không nói đáp án).']],
      ['Mẹo tổ chức hiệu quả', ['Không công bố tên bức tranh trước; chọn tranh gắn với nội dung bài để làm “điểm chốt” kiến thức.', 'Dùng 2 phiên bản phiếu có vị trí đáp án khác nhau (chức năng nhảy/trộn đáp án) cho 2 dãy bàn để tránh nhìn bài.', 'Yêu cầu ghi đáp án trước khi tô để dễ chữa bài; dùng đồng hồ đếm ngược trên màn chiếu.', 'Phiếu in trắng đen: cho HS tô bằng bút chì đậm hoặc gạch chéo theo màu ghi trên phiếu.']],
      ['Tiêu chí đánh giá', ['Hoàn thành tốt: đúng ≥ 90% câu, bức tranh rõ, giải thích được các câu khó.', 'Hoàn thành: đúng 70–89% câu, tranh nhận ra được, còn sai sót nhỏ.', 'Cần cố gắng: đúng dưới 70% câu → GV giao bài tập củng cố bổ sung.']],
      ['Mở rộng', ['Giao về nhà: mỗi HS thiết kế 1 câu hỏi 4 phương án về nội dung bài; GV chọn câu hay để làm “bức tranh bí ẩn” cho tiết sau.']],
    ] };
}
function guideDoc(st) {
  const geo = pageGeom(st.meta.orientation, st.meta.paper); const T = makeTheme(st); const f = geo.f, m = geo.m; const D = guideData(st);
  const acc2 = T.bw ? '#555555' : mix(T.acc, 0.35, '#0EA5A5'); const W = geo.W, H = geo.H;
  const build = (sz) => { const pages = [[]]; const LS = 1.25, lh = sz * LS * PT; let pg = 0;
    const add = it => pages[pg].push(it);
    // tiêu đề
    const hh = 11 * f; add({ t: 'rect', x: m, y: 6 * f, w: W - 2 * m, h: hh, fill: T.acc, rx: 1.6 * f });
    const ts = 14 * f; add(para(m + 4 * f, 6 * f + (hh - ts * 1.15 * PT) / 2, (W - 2 * m) * 0.62, [R('HƯỚNG DẪN TỔ CHỨC HOẠT ĐỘNG · BỨC TRANH BÍ ẨN', { font: 'sans', bold: true, size: ts, color: '#FFFFFF' })], ts * 1.15 * PT));
    const sub = `Dành cho giáo viên · ${D.topic === 'nội dung bài học' ? '' : D.topic + ' · '}${D.N} câu hỏi`; add(para(W - m - (W - 2 * m) * 0.36 - 4 * f, 6 * f + (hh - 9.5 * f * 1.2 * PT) / 2, (W - 2 * m) * 0.36, [R(sub, { font: 'sans', size: 9.5 * f, color: '#FFFFFF' })], 9.5 * f * 1.2 * PT, 'right'));
    let y = 6 * f + hh + 4 * f;
    // thông tin chung: 2 cột
    const cw = (W - 2 * m - 6 * f) / 2; const infoP = D.info.map(([k, v]) => para(0, 0, cw - 5, [R(k + ': ', { font: 'sans', bold: true, size: sz, color: T.acc }), R(v, { size: sz, color: T.ink })], lh));
    const left = infoP.slice(0, 2), right = infoP.slice(2); const hL = left.reduce((a, p) => a + p.h + 1.2, 0), hR = right.reduce((a, p) => a + p.h + 1.2, 0); const ih = Math.max(hL, hR) + 4;
    add({ t: 'rect', x: m, y, w: W - 2 * m, h: ih, fill: T.soft2, stroke: T.line, lw: 0.25, rx: 1.4 });
    let yy = y + 2.4; left.forEach(p => { p.x = m + 3; p.y = yy; add(p); yy += p.h + 1.2; }); yy = y + 2.4; right.forEach(p => { p.x = m + cw + 6 * f + 2; p.y = yy; add(p); yy += p.h + 1.2; });
    y += ih + 4 * f;
    // 2 thẻ cách tổ chức
    const card = (C, x, color) => { let cy = y; const items = []; const th = 9 * f; items.push({ t: 'rect', x, y: cy, w: cw, h: th, fill: color, rx: 1.4 });
      const tsz = 10.5 * f; items.push(para(x + 3, cy + (th - tsz * 1.15 * PT) / 2, cw - 30 * f, [R(C.title, { font: 'sans', bold: true, size: tsz, color: '#FFFFFF' })], tsz * 1.15 * PT));
      items.push(para(x + cw - 28 * f, cy + (th - 9 * f * 1.2 * PT) / 2, 25 * f, [R(`${C.time} phút`, { font: 'sans', bold: true, size: 9 * f, color: '#FFFFFF' })], 9 * f * 1.2 * PT, 'right'));
      cy += th + 1.6; const ps = para(x, cy, cw, [R(C.style, { font: 'sans', size: sz * 0.92, color: T.muted, bold: false })], sz * 0.92 * LS * PT); items.push(ps); cy += ps.h + 1.6;
      C.steps.forEach(([name, mins, txt], i) => { const r = sz * PT * 0.75; items.push({ t: 'circle', cx: x + r + 0.3, cy: cy + r + 0.4, r, fill: color }); const nn = para(x, cy + 0.4 + r - sz * 0.9 * 1.2 * PT / 2, r * 2 + 0.6, [R(String(i + 1), { font: 'sans', bold: true, size: sz * 0.9, color: '#FFFFFF' })], sz * 0.9 * 1.2 * PT, 'center'); items.push(nn);
        const tx = x + r * 2 + 2.2; const p1 = para(tx, cy, cw - (tx - x), [R(name, { font: 'sans', bold: true, size: sz, color: T.ink }), R(`  (${mins} phút)`, { font: 'sans', size: sz * 0.9, color: color })], lh); items.push(p1); cy += p1.h + 0.3;
        const p2 = para(tx, cy, cw - (tx - x), [R(txt, { size: sz, color: T.ink })], lh); items.push(p2); cy += p2.h + 1.8; });
      const pp = para(x + 3, cy + 1.6, cw - 6, [R('Ưu điểm: ', { font: 'sans', bold: true, size: sz * 0.95, color: color }), R(C.plus, { size: sz * 0.95, color: T.ink })], sz * 0.95 * LS * PT); items.push({ t: 'rect', x, y: cy, w: cw, h: pp.h + 3.2, fill: T.bw ? '#F2F2F2' : mix(color, 0.9), rx: 1.2 }); items.push(pp); cy += pp.h + 3.2;
      return { items, h: cy - y }; };
    const A = card(D.c1, m, T.acc), B = card(D.c2, m + cw + 6 * f, acc2);
    A.items.forEach(add); B.items.forEach(add); y += Math.max(A.h, B.h) + 5 * f;
    // phần bổ sung: lưới 2 cột
    const bottom = H - 8 * f; const ex = D.extra.map(([title, list]) => { const items = []; let h = 0; const p0 = para(0, 0, cw, [R(title.toUpperCase(), { font: 'sans', bold: true, size: sz * 0.95, color: T.acc })], sz * 0.95 * 1.3 * PT); items.push(p0); h += p0.h + 0.8;
      list.forEach(t => { const p = para(3.2, h, cw - 3.2, [R(t, { size: sz, color: T.ink })], lh); items.push({ t: 'circle', cx: 1.2, cy: h + p.lines[0].base - sz * PT * 0.3, r: 0.55, fill: T.acc }); items.push(p); h += p.h + 0.6; }); return { items, h: h + 2 }; });
    let colY = [y, y], col = 0; const placeBlock = (blk) => { if (colY[col] + blk.h > bottom) { if (col === 0 && colY[1] + blk.h <= bottom) col = 1; else { pages.push([]); pg++; colY = [20 * f, 20 * f]; col = 0; } } const x = m + col * (cw + 6 * f);
      blk.items.forEach(it => { const c = Object.assign({}, it); if (c.t === 'circle') { c.cx += x; c.cy += colY[col]; } else { c.x += x; c.y += colY[col]; } add(c); }); colY[col] += blk.h + 2 * f; col = colY[0] <= colY[1] ? 0 : 1; };
    ex.forEach(placeBlock);
    return { pages, over: y > bottom }; };
  let res; for (let sz = 10 * f; sz >= 7.5 * f; sz -= 0.25 * f) { res = build(sz); if (res.pages.length === 1 && !res.over) break; }
  return res.pages.map(items => ({ w: W, h: H, items }));
}

/* ---------- hình học tranh ---------- */
function picGeom(item, part) { const s = Math.min(item.w / part.W, item.h / part.H); return { s, ox: item.x + (item.w - part.W * s) / 2, oy: item.y + (item.h - part.H * s) / 2 }; }
function drawOrder(part) { return part.regions.slice().sort((a, b) => (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]) - (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1])); }
function regionFill(g, it) { if (it.onlyQ && g.code && !it.onlyQ.has(g.code.q)) return '#FFFFFF'; return it.answer && g.cls >= 0 && g.code && g.code.ok ? ((it.fills && it.fills[g.cls]) || PALETTE[g.cls].hex) : '#FFFFFF'; }
const BASE_ASC = 0.716; // cap height (Arial)

/* ---------- SVG ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function fam(f) { return f === 'serif' ? "LibSerif, 'Times New Roman', serif" : "LibSans, Arial, sans-serif"; }
function svgPage(page, part) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.w} ${page.h}" width="100%" style="background:#fff;display:block" text-rendering="geometricPrecision">`;
  for (const it of page.items) {
    if (it.t === 'rect') s += `<rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}"${it.rx ? ` rx="${it.rx}"` : ''} fill="${it.fill || 'none'}"${it.stroke ? ` stroke="${it.stroke}" stroke-width="${it.lw || 0.3}"` : ''}/>`;
    else if (it.t === 'line') s += `<line x1="${it.x1}" y1="${it.y1}" x2="${it.x2}" y2="${it.y2}" stroke="${it.stroke}" stroke-width="${it.lw || 0.25}"${it.dash ? ' stroke-dasharray="0.8 0.8"' : ''}/>`;
    else if (it.t === 'circle') s += `<circle cx="${it.cx}" cy="${it.cy}" r="${it.r}" fill="${it.fill}"/>`;
    else if (it.t === 'para') s += svgPara(it);
    else if (it.t === 'picture' && part) s += svgPicture(it, part);
  }
  return s + '</svg>';
}
function paraBase(it, i) { return it.y + it.lines[i].base; }
function svgPara(it) { let s = ''; it.lines.forEach((ln, i) => { const by = paraBase(it, i); let off = it.align === 'right' ? it.w - ln.w : it.align === 'center' ? (it.w - ln.w) / 2 : 0;
  ln.segs.forEach(sg => { if (sg.math) { s += `<svg x="${(it.x + off + sg.x).toFixed(2)}" y="${(by - sg.asc).toFixed(2)}" width="${sg.w.toFixed(2)}" height="${(sg.asc + sg.desc).toFixed(2)}" viewBox="${sg.mi.vb}" overflow="visible" style="color:${sg.st.color}">${sg.mi.inner}</svg>`; return; } s += `<text x="${(it.x + off + sg.x).toFixed(2)}" y="${by.toFixed(2)}" font-family="${fam(sg.st.font)}" font-size="${(sg.st.size * PT).toFixed(3)}" font-weight="${sg.st.bold ? 700 : 400}" fill="${sg.st.color}" xml:space="preserve">${esc(sg.text)}</text>`; }); }); return s; }
function svgPicture(it, part) {
  const { s, ox, oy } = picGeom(it, part); let out = '';
  for (const g of drawOrder(part)) { if (!g.poly.length) continue; out += `<path d="M${g.poly.map(p => (ox + p[0] * s).toFixed(2) + ' ' + (oy + p[1] * s).toFixed(2)).join('L')}Z" fill="${regionFill(g, it)}" stroke="#2a2a2a" stroke-width="${Math.max(0.2, Math.min(0.3, s * 0.085)).toFixed(3)}" stroke-linejoin="miter" shape-rendering="crispEdges"/>`; }
  out += `<rect x="${ox}" y="${oy}" width="${part.W * s}" height="${part.H * s}" fill="none" stroke="#222" stroke-width="0.45"/>`;
  if (it.frame) { const g2 = 1.3 * (it.f || 1); out += `<rect x="${ox - g2}" y="${oy - g2}" width="${part.W * s + 2 * g2}" height="${part.H * s + 2 * g2}" rx="${1.6 * (it.f || 1)}" fill="none" stroke="${it.frame}" stroke-width="0.6"/>`; }
  for (const g of part.regions) { if (!g.lab) continue; const col = it.answer && g.code && g.code.ok ? textOn(regionFill(g, it)) : '#111111';
    out += `<text x="${(ox + g.lab.x * s).toFixed(2)}" y="${(oy + g.lab.y * s + g.lab.pt * PT * BASE_ASC / 2).toFixed(2)}" text-anchor="middle" font-family="${fam('sans')}" font-weight="700" font-size="${(g.lab.pt * PT).toFixed(3)}" fill="${col}">${g.label}</text>`; }
  return out;
}

/* ---------- PDF (jsPDF) ---------- */
function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function pdfFonts(doc) { const F = G.__FONTS; doc.addFileToVFS('LS-R.ttf', F.sansR); doc.addFont('LS-R.ttf', 'LibSans', 'normal'); doc.addFileToVFS('LS-B.ttf', F.sansB); doc.addFont('LS-B.ttf', 'LibSans', 'bold'); doc.addFileToVFS('LSe-R.ttf', F.serifR); doc.addFont('LSe-R.ttf', 'LibSerif', 'normal'); doc.addFileToVFS('LSe-B.ttf', F.serifB); doc.addFont('LSe-B.ttf', 'LibSerif', 'bold'); }
async function pdfPages(doc, pages, part, first) {
  for (let pi = 0; pi < pages.length; pi++) { const page = pages[pi]; if (!(first && pi === 0)) doc.addPage([page.w, page.h], page.w > page.h ? 'landscape' : 'portrait');
    for (const it of page.items) {
      if (it.t === 'rect') { const st2 = it.fill && it.stroke ? 'FD' : it.fill ? 'F' : 'S'; if (it.fill) doc.setFillColor(...hexRGB(it.fill)); if (it.stroke) { doc.setDrawColor(...hexRGB(it.stroke)); doc.setLineWidth(it.lw || 0.3); } doc.setLineDashPattern([], 0); if (it.rx) doc.roundedRect(it.x, it.y, it.w, it.h, Math.min(it.rx, it.w / 2, it.h / 2), Math.min(it.rx, it.w / 2, it.h / 2), st2); else doc.rect(it.x, it.y, it.w, it.h, st2); }
      else if (it.t === 'line') { doc.setDrawColor(...hexRGB(it.stroke)); doc.setLineWidth(it.lw || 0.25); doc.setLineDashPattern(it.dash ? [0.8, 0.8] : [], 0); doc.line(it.x1, it.y1, it.x2, it.y2); doc.setLineDashPattern([], 0); }
      else if (it.t === 'circle') { doc.setFillColor(...hexRGB(it.fill)); doc.circle(it.cx, it.cy, it.r, 'F'); }
      else if (it.t === 'para') { for (let i = 0; i < it.lines.length; i++) { const ln = it.lines[i]; const by = paraBase(it, i); const off = it.align === 'right' ? it.w - ln.w : it.align === 'center' ? (it.w - ln.w) / 2 : 0;
        for (const sg of ln.segs) { if (sg.math) { await pdfMath(doc, sg, it.x + off + sg.x, by - sg.asc); continue; } doc.setFont(sg.st.font === 'serif' ? 'LibSerif' : 'LibSans', sg.st.bold ? 'bold' : 'normal'); doc.setFontSize(sg.st.size); doc.setTextColor(...hexRGB(sg.st.color)); doc.text(sg.text, it.x + off + sg.x, by); } } }
      else if (it.t === 'picture') pdfPicture(doc, it, part);
    } }
}
function mathSvgString(mi, color, w, h) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mi.vb}" width="${w}" height="${h}">${mi.inner.replace(/currentColor/g, color)}</svg>`; }
async function pdfMath(doc, sg, x, y) { const el = new DOMParser().parseFromString(mathSvgString(sg.mi, sg.st.color, sg.w, sg.asc + sg.desc), 'image/svg+xml').documentElement; await doc.svg(el, { x, y, width: sg.w, height: sg.asc + sg.desc }); }
function pdfPicture(doc, it, part) {
  const { s, ox, oy } = picGeom(it, part); doc.setDrawColor(42, 42, 42); doc.setLineWidth(Math.max(0.2, Math.min(0.3, s * 0.085))); doc.setLineJoin('miter');
  for (const g of drawOrder(part)) { const P = g.poly; if (!P.length) continue; const d = []; for (let i = 1; i < P.length; i++) d.push([(P[i][0] - P[i - 1][0]) * s, (P[i][1] - P[i - 1][1]) * s]);
    doc.setFillColor(...hexRGB(regionFill(g, it))); doc.lines(d, ox + P[0][0] * s, oy + P[0][1] * s, [1, 1], 'FD', true); }
  doc.setDrawColor(34, 34, 34); doc.setLineWidth(0.45); doc.rect(ox, oy, part.W * s, part.H * s, 'S');
  if (it.frame) { const g2 = 1.3 * (it.f || 1); doc.setDrawColor(...hexRGB(it.frame)); doc.setLineWidth(0.6); doc.roundedRect(ox - g2, oy - g2, part.W * s + 2 * g2, part.H * s + 2 * g2, 1.6 * (it.f || 1), 1.6 * (it.f || 1), 'S'); }
  doc.setFont('LibSans', 'bold');
  for (const g of part.regions) { if (!g.lab) continue; const col = it.answer && g.code && g.code.ok ? textOn(regionFill(g, it)) : '#111111'; doc.setTextColor(...hexRGB(col)); doc.setFontSize(g.lab.pt); doc.text(g.label, ox + g.lab.x * s, oy + g.lab.y * s + g.lab.pt * PT * BASE_ASC / 2, { align: 'center' }); }
}

/* ---------- PPTX (PptxGenJS) ---------- */
const IN = mm => +(mm / 25.4).toFixed(4); const H6 = h => h.replace('#', '').toUpperCase();
function pptSlides(pptx, pages, part) {
  pages.forEach(page => { const slide = pptx.addSlide(); slide.background = { color: 'FFFFFF' };
    for (const it of page.items) {
      if (it.t === 'rect') slide.addShape(it.rx ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, Object.assign({ x: IN(it.x), y: IN(it.y), w: IN(it.w), h: IN(it.h), fill: it.fill ? { color: H6(it.fill) } : { type: 'none' }, line: it.stroke ? { color: H6(it.stroke), width: +((it.lw || 0.3) / PT).toFixed(2) } : { type: 'none' } }, it.rx ? { rectRadius: IN(Math.min(it.rx, it.w / 2, it.h / 2)) } : {}));
      else if (it.t === 'line') slide.addShape(pptx.ShapeType.line, { x: IN(Math.min(it.x1, it.x2)), y: IN(Math.min(it.y1, it.y2)), w: IN(Math.max(0.01, Math.abs(it.x2 - it.x1))), h: IN(Math.abs(it.y2 - it.y1)), line: { color: H6(it.stroke), width: +((it.lw || 0.25) / PT).toFixed(2), dashType: it.dash ? 'dash' : 'solid' } });
      else if (it.t === 'circle') slide.addShape(pptx.ShapeType.ellipse, { x: IN(it.cx - it.r), y: IN(it.cy - it.r), w: IN(it.r * 2), h: IN(it.r * 2), fill: { color: H6(it.fill) }, line: { color: H6(it.fill), width: 0 } });
      else if (it.t === 'para' && it.hasMath) pptMathPara(slide, it);
      else if (it.t === 'para') { const runs = it.runs.map(r => ({ text: r.text, options: { bold: !!r.bold, color: H6(r.color), fontFace: r.font === 'serif' ? 'Times New Roman' : 'Arial', fontSize: r.size } }));
        slide.addText(runs, { x: IN(it.x), y: IN(it.y), w: IN(it.w * 1.03 + 0.5), h: IN(Math.max(it.h, it.lineH)), margin: 0, valign: 'top', align: it.align, lineSpacing: +(it.lineH / PT).toFixed(1), fit: 'none', wrap: true, paraSpaceBefore: 0, paraSpaceAfter: 0 }); }
      else if (it.t === 'picture') pptPicture(pptx, slide, it, part);
    } });
}
let mathPng = () => null; function setMathPng(f) { mathPng = f; }
function pptMathPara(slide, it) { it.lines.forEach((ln, i) => { const by = paraBase(it, i); const off = it.align === 'right' ? it.w - ln.w : it.align === 'center' ? (it.w - ln.w) / 2 : 0;
  ln.segs.forEach(sg => { const x = it.x + off + sg.x;
    if (sg.math) { const png = mathPng(sg.math, sg.st.color); if (png) slide.addImage({ data: png, x: IN(x), y: IN(by - sg.asc), w: IN(sg.w), h: IN(sg.asc + sg.desc) }); return; }
    if (!sg.text.trim()) return; const lead = sg.text.match(/^ */)[0].length; const tx = sg.text.trimStart(); const dx = lead ? textW(' '.repeat(lead), sg.st.font, sg.st.bold, sg.st.size) : 0;
    slide.addText(tx, { x: IN(x + dx), y: IN(by - it.asc0), w: IN(sg.w - dx + 3), h: IN(it.lineH), margin: 0, valign: 'top', lineSpacing: +(it.lineH / PT).toFixed(1), fit: 'none', wrap: false, bold: !!sg.st.bold, color: H6(sg.st.color), fontFace: sg.st.font === 'serif' ? 'Times New Roman' : 'Arial', fontSize: sg.st.size }); }); }); }
function collectMath(pages) { const out = new Map(); pages.forEach(p => p.items.forEach(it => { if (it.t === 'para' && it.hasMath) it.lines.forEach(l => l.segs.forEach(g => { if (g.math) { const k = g.math + '|' + g.st.color; const prev = out.get(k); if (!prev || prev.w < g.w) out.set(k, { tex: g.math, color: g.st.color, mi: g.mi, w: g.w, h: g.asc + g.desc }); } })); })); return [...out.values()]; }
function pptPicture(pptx, slide, it, part) {
  const { s, ox, oy } = picGeom(it, part);
  for (const g of drawOrder(part)) { const P = g.poly; if (!P.length) continue; const [bx0, by0, bx1, by1] = g.bbox;
    const pts = P.map((p, i) => ({ x: IN((p[0] - bx0) * s), y: IN((p[1] - by0) * s), ...(i === 0 ? { moveTo: true } : {}) })); pts.push({ close: true });
    slide.addShape(pptx.ShapeType.custGeom, { x: IN(ox + bx0 * s), y: IN(oy + by0 * s), w: IN((bx1 - bx0) * s), h: IN((by1 - by0) * s), points: pts, fill: { color: H6(regionFill(g, it)) }, line: { color: '2A2A2A', width: +(Math.max(0.2, Math.min(0.3, s * 0.085)) / PT).toFixed(2) } }); }
  slide.addShape(pptx.ShapeType.rect, { x: IN(ox), y: IN(oy), w: IN(part.W * s), h: IN(part.H * s), fill: { type: 'none' }, line: { color: '222222', width: 1.25 } });
  if (it.frame) { const g2 = 1.3 * (it.f || 1); slide.addShape(pptx.ShapeType.roundRect, { x: IN(ox - g2), y: IN(oy - g2), w: IN(part.W * s + 2 * g2), h: IN(part.H * s + 2 * g2), rectRadius: IN(1.6 * (it.f || 1)), fill: { type: 'none' }, line: { color: H6(it.frame), width: 1.7 } }); }
  for (const g of part.regions) { if (!g.lab) continue; const col = it.answer && g.code && g.code.ok ? textOn(regionFill(g, it)) : '#111111'; const w = 12, h = g.lab.pt * PT * 1.25;
    slide.addText(g.label, { x: IN(ox + g.lab.x * s - w / 2), y: IN(oy + g.lab.y * s - h / 2), w: IN(w), h: IN(h), margin: 0, align: 'center', valign: 'middle', fontFace: 'Arial', bold: true, fontSize: g.lab.pt, color: H6(col), fit: 'none' }); }
}

G.GMBT = { rebuild, R, para, makeTheme, guideDoc, PAPERS, mergeTight, PT, LET, PALETTE, DEFAULT_PAL, applyPalette, setMathInfo, setMathPng, mathList, splitMath, collectMath, mathSvgString, rng, shuffle, partition, assignCodes, placeLabels, textW, layoutDoc, gridDims, pageGeom, svgPage, pdfFonts, pdfPages, pptSlides, textOn };
})(window);
