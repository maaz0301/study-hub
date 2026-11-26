import { leetcodeDiagrams, LEETCODE_RULES } from './diagrams-leetcode.mjs';
import { extraDiagrams, EXTRA_RULES } from './diagrams-extra.mjs';
import { devopsDiagrams, DEVOPS_RULES } from './diagrams-devops.mjs';

// Animated, theme-aware SVG diagrams ("GIF-style" pictures) injected into sections at build time.
// Generators: flow (pipeline), cycle (loop), hub (star), compare (side by side) + a few custom pictures.

const PAL = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#ef4444', '#84cc16', '#f97316', '#14b8a6'];
let uid = 0;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrapText(text, max) {
  const words = String(text).split(/\s+/);
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}
const tspans = (lines, x, y, lh, attrs = '') => lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" ${attrs}>${esc(l)}</text>`).join('');
const marker = (id) => `<defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="var(--faint)"/></marker>
<filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>`;

function figure(svg, w, h, title, caption) {
  return `<figure class="dg"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`
    + `<figcaption><b>${esc(title)}</b>${caption ? ` — ${esc(caption)}` : ''}</figcaption></figure>`;
}

function box({ x, y, w, h, color, icon, label, sub, delay, dur, maxChars }) {
  const cx = x + w / 2;
  const lab = wrapText(label, maxChars);
  const subl = sub ? wrapText(sub, Math.round(maxChars * 1.25)).slice(0, 3) : [];
  return `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="dg-box" style="--c:${color}"/>
${dur ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="dg-hl" fill="${color}" style="animation-duration:${dur}s;animation-delay:${delay}s"/>` : ''}
<circle cx="${cx}" cy="${y + 25}" r="16" fill="${color}"/>
<text x="${cx}" y="${y + 30.5}" text-anchor="middle" font-size="15">${icon || '•'}</text>
${tspans(lab, cx, y + 58, 15, 'text-anchor="middle" class="dg-label"')}
${tspans(subl, cx, y + 58 + lab.length * 15 + 2, 13, 'text-anchor="middle" class="dg-sub"')}
</g>`;
}

function dotAlong(points, T, closed, color = 'var(--accent)') {
  const pts = closed ? [...points, points[0]] : points;
  const d = 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0) || 1;
  const kp = [0];
  let acc = 0;
  for (const s of seg) { acc += s; kp.push(+(acc / total).toFixed(4)); }
  const n = pts.length - 1;
  let kt = pts.map((_, i) => +(i / (closed ? n : n + 1)).toFixed(4));
  let kpp = kp;
  if (!closed) { kt = [...kt, 1]; kpp = [...kp, 1]; }
  return `<circle r="7" fill="${color}" class="dg-dot"><animateMotion dur="${T}s" repeatCount="indefinite" path="${d}" keyPoints="${kpp.join(';')}" keyTimes="${kt.join(';')}" calcMode="linear"/></circle>`;
}

/** Pipeline: boxes left→right, snaking onto new rows. */
export function flow({ title, caption, steps, perRow, loop = false, step = 1.3 }) {
  const id = `dg${++uid}`;
  const n = steps.length;
  const per = perRow || Math.min(n, n > 6 ? 4 : n);
  const rows = Math.ceil(n / per);
  const W = 760, pad = 18, gap = 34, rowGap = 44;
  const bw = (W - 2 * pad - gap * (per - 1)) / per;
  const bh = 128;
  const H = pad * 2 + rows * bh + (rows - 1) * rowGap;
  const T = +(n * step).toFixed(2);
  const pos = steps.map((_, i) => {
    const r = Math.floor(i / per);
    let c = i % per;
    if (r % 2) c = per - 1 - c;
    return { x: pad + c * (bw + gap), y: pad + r * (bh + rowGap) };
  });
  const centers = pos.map((p) => [p.x + bw / 2, p.y + bh / 2]);
  let arrows = '';
  for (let i = 0; i < n - 1; i++) {
    const a = pos[i], b = pos[i + 1];
    if (Math.abs(a.y - b.y) < 1) {
      const right = b.x > a.x;
      const x1 = right ? a.x + bw + 3 : a.x - 3, x2 = right ? b.x - 4 : b.x + bw + 4;
      arrows += `<line x1="${x1}" y1="${a.y + bh / 2}" x2="${x2}" y2="${b.y + bh / 2}" class="dg-arrow" marker-end="url(#${id})"/>`;
    } else arrows += `<line x1="${a.x + bw / 2}" y1="${a.y + bh + 3}" x2="${b.x + bw / 2}" y2="${b.y - 4}" class="dg-arrow" marker-end="url(#${id})"/>`;
  }
  if (loop && n > 1) {
    const a = pos[n - 1], b = pos[0];
    const yb = Math.max(a.y, b.y) + bh;
    arrows += `<path d="M${a.x + bw / 2},${a.y + bh + 3} L${a.x + bw / 2},${yb + 16} L${b.x + bw / 2},${yb + 16} L${b.x + bw / 2},${b.y + bh + 4}" class="dg-arrow" fill="none" marker-end="url(#${id})" stroke-dasharray="5 5"/>`;
  }
  const Hh = loop ? H + 24 : H;
  const boxes = steps.map((s, i) => box({ ...pos[i], w: bw, h: bh, color: s.c || PAL[i % PAL.length], icon: s.i, label: s.t, sub: s.s, dur: T, delay: +(i * step - 0.2).toFixed(2), maxChars: Math.max(9, Math.floor(bw / 8)) })).join('');
  const svg = `${marker(id)}${arrows}${dotAlong(centers, T, loop)}${boxes}`;
  return figure(svg, W, Hh, title, caption);
}

/** Loop: nodes on a circle with a label in the middle. */
export function cycle({ title, caption, center, steps, step = 1.4 }) {
  const id = `dg${++uid}`;
  const n = steps.length;
  const W = 760, H = 420, cx = W / 2, cy = H / 2 + 4, rx = 270, ry = 150;
  const bw = 150, bh = 104;
  const T = +(n * step).toFixed(2);
  const pts = steps.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
  let arrows = '';
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ox = (mx - cx) * 0.28, oy = (my - cy) * 0.28;
    const sx = x1 + (x2 - x1) * 0.3, sy = y1 + (y2 - y1) * 0.3, ex = x1 + (x2 - x1) * 0.7, ey = y1 + (y2 - y1) * 0.7;
    arrows += `<path d="M${sx},${sy} Q${mx + ox},${my + oy} ${ex},${ey}" class="dg-arrow" fill="none" marker-end="url(#${id})"/>`;
  }
  const boxes = steps.map((s, i) => box({ x: pts[i][0] - bw / 2, y: pts[i][1] - bh / 2, w: bw, h: bh, color: s.c || PAL[i % PAL.length], icon: s.i, label: s.t, sub: s.s, dur: T, delay: +(i * step - 0.2).toFixed(2), maxChars: 17 })).join('');
  const mid = `<circle cx="${cx}" cy="${cy}" r="58" class="dg-center"/><circle cx="${cx}" cy="${cy}" r="58" class="dg-spin" fill="none"/>${tspans(wrapText(center, 12), cx, cy - (wrapText(center, 12).length - 1) * 8 + 5, 16, 'text-anchor="middle" class="dg-label" font-size="14"')}`;
  return figure(`${marker(id)}${arrows}${dotAlong(pts, T, true)}${mid}${boxes}`, W, H, title, caption);
}

/** Star: a centre that talks to several spokes (one at a time). */
export function hub({ title, caption, center, spokes, step = 1.3 }) {
  const id = `dg${++uid}`;
  const n = spokes.length;
  const W = 760, H = 430, cx = W / 2, cy = H / 2, rx = 275, ry = 150;
  const bw = 150, bh = 100;
  const T = +(n * step).toFixed(2);
  const pts = spokes.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
  let lines = '', dots = '';
  pts.forEach(([x, y], i) => {
    lines += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="dg-arrow" stroke-dasharray="4 5"/>`;
    const a = +(i / n).toFixed(4), b = +((i + 1) / n - 0.02).toFixed(4);
    const color = spokes[i].c || PAL[(i + 1) % PAL.length];
    dots += `<circle r="7" fill="${color}" class="dg-dot" opacity="0"><animateMotion dur="${T}s" repeatCount="indefinite" path="M${cx},${cy} L${x},${y} L${cx},${cy}" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1" calcMode="linear"/><animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;${a};${+(a + 0.005).toFixed(4)};${b};${+(b + 0.005).toFixed(4)};1"/></circle>`;
  });
  const boxes = spokes.map((s, i) => box({ x: pts[i][0] - bw / 2, y: pts[i][1] - bh / 2, w: bw, h: bh, color: s.c || PAL[(i + 1) % PAL.length], icon: s.i, label: s.t, sub: s.s, dur: T, delay: +(i * step + step * 0.3).toFixed(2), maxChars: 17 })).join('');
  const c = box({ x: cx - 85, y: cy - 58, w: 170, h: 116, color: center.c || PAL[0], icon: center.i, label: center.t, sub: center.s, maxChars: 19 });
  return figure(`${marker(id)}${lines}${dots}${boxes}<g class="dg-glow">${c}</g>`, W, H, title, caption);
}

/** Side-by-side comparison card. */
export function compare({ title, caption, left, right, vs = 'vs' }) {
  const W = 760;
  const colW = 330;
  const rowH = 44;
  const n = Math.max(left.items.length, right.items.length);
  const H = 92 + n * rowH + 18;
  const col = (side, x, color) => {
    let s = `<rect x="${x}" y="12" width="${colW}" height="${H - 24}" rx="18" class="dg-box" style="--c:${color}"/>
<rect x="${x}" y="12" width="${colW}" height="62" rx="18" fill="${color}"/><rect x="${x}" y="56" width="${colW}" height="18" fill="${color}"/>
<text x="${x + 24}" y="52" font-size="24">${side.icon || ''}</text><text x="${x + 62}" y="50" class="dg-head">${esc(side.title)}</text>`;
    side.items.forEach((it, i) => {
      const y = 96 + i * rowH;
      s += `<g class="dg-pop" style="animation-delay:${(i * 0.18).toFixed(2)}s"><circle cx="${x + 26}" cy="${y + 4}" r="5" fill="${color}"/>${tspans(wrapText(it, 40).slice(0, 2), x + 42, y + 9, 15, 'class="dg-item"')}</g>`;
    });
    return s;
  };
  const svg = col(left, 20, left.c || '#3b82f6') + col(right, W - 20 - colW, right.c || '#10b981')
    + `<circle cx="${W / 2}" cy="${H / 2}" r="26" fill="var(--panel)" stroke="var(--border-2)"/><text x="${W / 2}" y="${H / 2 + 5}" text-anchor="middle" class="dg-label">${esc(vs)}</text>`;
  return figure(svg, W, H, title, caption);
}

// ---------- custom pictures ----------
function venns() {
  const W = 760, H = 210;
  const kinds = [['INNER', [0, 1, 0]], ['LEFT', [1, 1, 0]], ['RIGHT', [0, 1, 1]], ['FULL', [1, 1, 1]]];
  let s = '';
  kinds.forEach(([k, [l, m, r]], i) => {
    const ox = 20 + i * 185, cy = 92;
    const cid = `vc${++uid}`;
    s += `<defs><clipPath id="${cid}"><circle cx="${ox + 62}" cy="${cy}" r="52"/></clipPath></defs>
<g class="dg-pop" style="animation-delay:${i * 0.15}s">
<circle cx="${ox + 62}" cy="${cy}" r="52" fill="${l ? '#3b82f6' : 'transparent'}" opacity=".75"/>
<circle cx="${ox + 110}" cy="${cy}" r="52" fill="${r ? '#10b981' : 'transparent'}" opacity=".75"/>
<circle cx="${ox + 110}" cy="${cy}" r="52" clip-path="url(#${cid})" fill="${m ? '#8b5cf6' : 'var(--panel)'}"/>
<circle cx="${ox + 62}" cy="${cy}" r="52" fill="none" stroke="var(--text)" stroke-width="1.5"/>
<circle cx="${ox + 110}" cy="${cy}" r="52" fill="none" stroke="var(--text)" stroke-width="1.5"/>
<text x="${ox + 86}" y="${cy + 80}" text-anchor="middle" class="dg-label">${k} JOIN</text></g>`;
  });
  s += `<text x="20" y="196" class="dg-sub">🔵 left table only   🟣 rows that match   🟢 right table only (coloured = returned)</text>`;
  return figure(s, W, H, 'JOINs as pictures', 'coloured areas are the rows you get back');
}

function btree() {
  const W = 760, H = 330;
  const T = 5;
  const node = (x, y, label, hot, d) => `<rect x="${x - 54}" y="${y - 20}" width="108" height="40" rx="10" class="dg-box" style="--c:${hot ? '#f59e0b' : '#64748b'}"/>${hot ? `<rect x="${x - 54}" y="${y - 20}" width="108" height="40" rx="10" class="dg-hl" fill="#f59e0b" style="animation-duration:${T}s;animation-delay:${d}s"/>` : ''}<text x="${x}" y="${y + 5}" text-anchor="middle" class="dg-label" font-size="13">${label}</text>`;
  let s = `<text x="20" y="26" class="dg-head2">Index (B-tree): find id = 42 in 3 hops</text>`;
  s += `<line x1="380" y1="70" x2="200" y2="140" class="dg-arrow"/><line x1="380" y1="70" x2="560" y2="140" class="dg-arrow"/><line x1="200" y1="140" x2="110" y2="208" class="dg-arrow"/><line x1="200" y1="140" x2="290" y2="208" class="dg-arrow"/><line x1="560" y1="140" x2="470" y2="208" class="dg-arrow"/><line x1="560" y1="140" x2="650" y2="208" class="dg-arrow"/>`;
  s += node(380, 70, '< 50 | ≥ 50', true, 0) + node(200, 140, '< 25 | ≥ 25', true, 0.9) + node(560, 140, '< 75 | ≥ 75', false)
    + node(110, 208, '1 … 24', false) + node(290, 208, '25 … 49  ✓42', true, 1.8) + node(470, 208, '50 … 74', false) + node(650, 208, '75 … 99', false);
  s += `<text x="20" y="262" class="dg-head2">No index (sequential scan): read every row</text>`;
  for (let i = 0; i < 20; i++) s += `<rect x="${20 + i * 36}" y="276" width="30" height="30" rx="6" class="dg-box" style="--c:#ef4444"/><rect x="${20 + i * 36}" y="276" width="30" height="30" rx="6" class="dg-hl" fill="#ef4444" style="animation-duration:${T}s;animation-delay:${(i * 0.22).toFixed(2)}s"/>`;
  return figure(s, W, H, 'Index lookup vs full scan', 'an index jumps to the row; without one the database checks every row');
}

function embeddings() {
  const W = 760, H = 330;
  const groups = [
    { c: '#8b5cf6', l: 'money back', pts: [[150, 90, 'refund'], [190, 125, 'money back'], [120, 140, 'return item']] },
    { c: '#06b6d4', l: 'login', pts: [[560, 80, 'reset password'], [610, 120, 'forgot login'], [530, 135, '2FA code']] },
    { c: '#f59e0b', l: 'shipping', pts: [[420, 250, 'delivery days'], [480, 280, 'shipping time'], [380, 290, 'track parcel']] },
  ];
  let s = `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="18" class="dg-box" style="--c:#64748b"/>`;
  groups.forEach((g, gi) => {
    const [mx, my] = g.pts.reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]);
    s += `<ellipse cx="${mx}" cy="${my}" rx="105" ry="55" fill="${g.c}" opacity=".12"/>`;
    g.pts.forEach(([x, y, t], i) => { s += `<g class="dg-pop" style="animation-delay:${(gi * 0.3 + i * 0.1).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="7" fill="${g.c}"/><text x="${x + 11}" y="${y + 4}" class="dg-item">${t}</text></g>`; });
  });
  s += `<line x1="240" y1="180" x2="190" y2="125" stroke="#8b5cf6" stroke-width="2" class="dg-dash"/><line x1="240" y1="180" x2="150" y2="90" stroke="#8b5cf6" stroke-width="2" class="dg-dash"/>`;
  s += `<circle cx="240" cy="180" r="11" fill="#ec4899" class="dg-ping"/><circle cx="240" cy="180" r="9" fill="#ec4899"/><text x="256" y="200" class="dg-label">“can I get my money back?”</text>`;
  s += `<text x="560" y="300" class="dg-sub">similar meaning → close together</text>`;
  return figure(s, W, H, 'Embeddings: meaning becomes a position', 'the query lands next to the refund sentences, so they are retrieved');
}

function chunking() {
  const W = 760, H = 210;
  const colors = PAL;
  let s = `<rect x="20" y="20" width="720" height="40" rx="10" class="dg-box" style="--c:#64748b"/><text x="34" y="45" class="dg-item">📄 One long document …………………………………………………………………………………………</text>`;
  for (let i = 0; i < 5; i++) {
    const x = 20 + i * 140;
    s += `<g class="dg-pop" style="animation-delay:${(0.3 + i * 0.35).toFixed(2)}s"><rect x="${x}" y="${92 + (i % 2) * 44}" width="170" height="36" rx="9" fill="${colors[i]}" opacity=".85"/><text x="${x + 85}" y="${115 + (i % 2) * 44}" text-anchor="middle" fill="white" font-weight="700" font-size="13">chunk ${i + 1}</text>`
      + (i ? `<rect x="${x}" y="${92 + (i % 2) * 44}" width="30" height="36" rx="6" fill="#facc15" opacity=".9"/>` : '') + `</g>`;
  }
  s += `<text x="20" y="196" class="dg-sub">🟨 overlap = the end of one chunk is repeated at the start of the next, so facts on a boundary are not cut in half</text>`;
  return figure(s, W, H, 'Chunking with overlap', 'split long text into small, slightly overlapping pieces before embedding');
}

function diLifetimes() {
  const W = 760, H = 270;
  const rows = [['Singleton', '#8b5cf6', [1, 1, 1, 1]], ['Scoped', '#06b6d4', [2, 2, 3, 3]], ['Transient', '#f59e0b', [4, 5, 6, 7]]];
  let s = `<text x="250" y="30" text-anchor="middle" class="dg-head2">HTTP request 1</text><text x="560" y="30" text-anchor="middle" class="dg-head2">HTTP request 2</text>
<rect x="150" y="42" width="200" height="${rows.length * 70 + 6}" rx="14" fill="none" stroke="var(--border-2)" stroke-dasharray="5 5"/><rect x="460" y="42" width="200" height="${rows.length * 70 + 6}" rx="14" fill="none" stroke="var(--border-2)" stroke-dasharray="5 5"/>`;
  rows.forEach(([name, c, ids], r) => {
    const y = 56 + r * 70;
    s += `<text x="20" y="${y + 30}" class="dg-label">${name}</text>`;
    ids.forEach((id, k) => {
      const x = (k < 2 ? 170 : 480) + (k % 2) * 90;
      const hue = ['', '#8b5cf6', '#06b6d4', '#0ea5e9', '#f59e0b', '#f97316', '#ef4444', '#ec4899'][id];
      s += `<g class="dg-pop" style="animation-delay:${(r * 0.4 + k * 0.12).toFixed(2)}s"><rect x="${x}" y="${y}" width="72" height="46" rx="10" fill="${hue}"/><text x="${x + 36}" y="${y + 29}" text-anchor="middle" fill="white" font-weight="800" font-size="14">#${id}</text></g>`;
    });
  });
  s += `<text x="20" y="${H - 12}" class="dg-sub">same number = same object · Singleton: 1 for the app · Scoped: 1 per request · Transient: new every time</text>`;
  return figure(s, W, H, 'DI lifetimes as pictures', 'each box is an object the container hands out when a class asks for it twice per request');
}

function stackHeap() {
  const W = 760, H = 250;
  const s = `<rect x="20" y="20" width="250" height="210" rx="16" class="dg-box" style="--c:#06b6d4"/><text x="40" y="48" class="dg-head2">Stack (variables)</text>
<rect x="40" y="66" width="210" height="40" rx="8" fill="#06b6d4" opacity=".85"/><text x="54" y="91" fill="white" font-weight="700">int a = 5</text>
<rect x="40" y="116" width="210" height="40" rx="8" fill="#06b6d4" opacity=".85"/><text x="54" y="141" fill="white" font-weight="700">int b = a  (copy: 5)</text>
<rect x="40" y="166" width="210" height="40" rx="8" fill="#8b5cf6" opacity=".9"/><text x="54" y="191" fill="white" font-weight="700">Person p  → ref</text>
<rect x="470" y="20" width="270" height="210" rx="16" class="dg-box" style="--c:#8b5cf6"/><text x="490" y="48" class="dg-head2">Heap (objects)</text>
<rect x="500" y="110" width="210" height="64" rx="12" fill="#8b5cf6"/><text x="605" y="138" text-anchor="middle" fill="white" font-weight="800">Person</text><text x="605" y="158" text-anchor="middle" fill="white" font-size="12">Name = "Ali"</text>
<rect x="40" y="216" width="0" height="0"/>
<path d="M250,186 C350,186 400,142 498,142" stroke="#8b5cf6" stroke-width="3" fill="none" class="dg-dash"/>
<text x="290" y="120" class="dg-sub">Person q = p;</text><text x="290" y="136" class="dg-sub">→ both arrows point</text><text x="290" y="152" class="dg-sub">to the SAME object</text>`;
  return figure(s, W, H, 'Value types vs reference types', 'value types copy the value; reference types copy the arrow (reference)');
}

function mvcc() {
  const W = 760, H = 230;
  let s = `<line x1="40" y1="120" x2="720" y2="120" class="dg-arrow" marker-end="url(#mv${++uid})"/>${marker('mv' + uid)}<text x="690" y="145" class="dg-sub">time</text>`;
  const v = [[80, 'v1: price = 10', '#64748b'], [330, 'v2: price = 12', '#8b5cf6'], [560, 'v3: price = 15', '#10b981']];
  v.forEach(([x, t, c], i) => { s += `<g class="dg-pop" style="animation-delay:${i * 0.5}s"><rect x="${x}" y="96" width="150" height="48" rx="10" fill="${c}"/><text x="${x + 75}" y="125" text-anchor="middle" fill="white" font-weight="700" font-size="13">${t}</text></g>`; });
  s += `<rect x="80" y="30" width="400" height="34" rx="8" fill="#06b6d4" opacity=".85"/><text x="94" y="52" fill="white" font-weight="700" font-size="13">Reader (snapshot at start) keeps seeing v1 → no locks</text>
<rect x="330" y="176" width="390" height="34" rx="8" fill="#f59e0b" opacity=".9"/><text x="344" y="198" fill="white" font-weight="700" font-size="13">Writers add NEW versions; VACUUM removes dead ones</text>`;
  return figure(s, W, H, 'MVCC: many versions of a row', 'readers never block writers and writers never block readers');
}

const D = {
  // ---------- AI ----------
  'rag-pipeline': () => flow({ title: 'RAG, step by step', caption: 'prepare the book once, then answer every question from it', perRow: 4, steps: [
    { i: '📄', t: 'Documents', s: 'PDFs, pages, DB rows' }, { i: '✂️', t: 'Chunk', s: 'small passages' }, { i: '🔢', t: 'Embed', s: 'text → vectors' }, { i: '🗄️', t: 'Vector DB', s: 'store + metadata' },
    { i: '❓', t: 'Question', s: 'embed the query' }, { i: '🔍', t: 'Search', s: 'top-k similar' }, { i: '🏅', t: 'Re-rank', s: 'keep best 3–8' }, { i: '🤖', t: 'LLM answers', s: 'with citations' }] }),
  'agent-loop': () => cycle({ title: 'The agent loop (ReAct)', caption: 'think → act → observe, repeated until done or a limit is hit', center: 'Agent = LLM in a loop', steps: [
    { i: '🧠', t: 'Think', s: 'what next?' }, { i: '🛠️', t: 'Act', s: 'call a tool (JSON)' }, { i: '⚙️', t: 'Your code runs it', s: 'validate + execute' }, { i: '👀', t: 'Observe', s: 'read the result' }, { i: '✅', t: 'Done?', s: 'answer or loop' }] }),
  'tool-calling': () => flow({ title: 'Tool (function) calling', caption: 'the model only asks; your code decides and runs', perRow: 6, steps: [
    { i: '🙋', t: 'User asks', s: 'Where is ORD-1?' }, { i: '🤖', t: 'LLM picks tool', s: 'get_order({id})' }, { i: '🛡️', t: 'Validate', s: 'schema + permission' }, { i: '⚙️', t: 'Run tool', s: 'your API / DB' }, { i: '📥', t: 'Result back', s: 'tool message' }, { i: '💬', t: 'Final answer', s: 'grounded reply' }] }),
  embeddings, chunking,
  'hybrid-search': () => flow({ title: 'Hybrid search', caption: 'keyword search + meaning search, merged with RRF', perRow: 5, steps: [
    { i: '❓', t: 'Query', s: 'user question' }, { i: '🔤', t: 'Keyword (BM25)', s: 'exact words' }, { i: '🧭', t: 'Vector search', s: 'similar meaning' }, { i: '🔀', t: 'RRF merge', s: '1/(k + rank)' }, { i: '🏅', t: 'Re-rank → top k', s: 'best passages' }] }),
  'transformer': () => flow({ title: 'How an LLM writes text', caption: 'one token at a time, each token attending to all previous ones', perRow: 5, loop: true, steps: [
    { i: '✍️', t: 'Prompt', s: 'text in' }, { i: '🧩', t: 'Tokens', s: 'pieces of words' }, { i: '🔭', t: 'Self-attention', s: 'every token looks at every other' }, { i: '🎲', t: 'Next-token odds', s: 'temperature, top-p' }, { i: '➕', t: 'Append token', s: 'repeat until stop' }] }),
  'voice-pipeline': () => flow({ title: 'Voice agent pipeline', caption: 'stream every stage so the first audio comes back in about a second', perRow: 6, loop: true, steps: [
    { i: '🎙️', t: 'Mic audio', s: '20 ms frames' }, { i: '📏', t: 'VAD', s: 'end of turn' }, { i: '👂', t: 'Speech → text', s: 'STT' }, { i: '🧠', t: 'LLM + tools', s: 'decide / act' }, { i: '✍️', t: 'Reply text', s: 'short sentences' }, { i: '🗣️', t: 'Text → speech', s: 'TTS streams' }] }),
  'lcel': () => flow({ title: 'LCEL: prompt | model | parser', caption: 'each step’s output is the next step’s input', perRow: 4, steps: [
    { i: '🧾', t: 'Input dict', s: '{"topic": "RAG"}' }, { i: '📝', t: 'Prompt', s: 'fills the template' }, { i: '🤖', t: 'Chat model', s: 'AIMessage' }, { i: '🧹', t: 'Parser', s: 'string / JSON / Pydantic' }] }),
  'langgraph': () => cycle({ title: 'A LangGraph agent', caption: 'nodes update shared state; edges decide what runs next; a checkpointer saves every step', center: 'State + checkpointer', steps: [
    { i: '▶️', t: 'START', s: 'messages in' }, { i: '🤖', t: 'agent node', s: 'LLM decides' }, { i: '🔀', t: 'route()', s: 'tool_calls?' }, { i: '🛠️', t: 'tools node', s: 'run, append result' }, { i: '⏹️', t: 'END', s: 'final answer' }] }),
  'hitl': () => flow({ title: 'Human-in-the-loop with interrupt()', caption: 'the run pauses safely (checkpointed) until a person decides', perRow: 5, steps: [
    { i: '🤖', t: 'Agent proposes', s: 'create_refund($79)' }, { i: '⏸️', t: 'interrupt()', s: 'state saved' }, { i: '🧑‍💼', t: 'Human reviews', s: 'approve / edit / reject' }, { i: '▶️', t: 'Command(resume)', s: 'continue run' }, { i: '✅', t: 'Tool runs (or not)', s: 'idempotent' }] }),
  'supervisor': () => hub({ title: 'Supervisor multi-agent', caption: 'a manager routes work to specialists and decides when it is finished', center: { i: '🧑‍✈️', t: 'Supervisor', s: 'who acts next?' }, spokes: [
    { i: '🔎', t: 'Researcher', s: 'web + docs' }, { i: '💻', t: 'Coder', s: 'runs code' }, { i: '✍️', t: 'Writer', s: 'drafts report' }, { i: '🧪', t: 'Reviewer', s: 'checks quality' }] }),
  'mcp': () => hub({ title: 'MCP: one plug for every tool', caption: 'an AI app (client) connects to many MCP servers the same way', center: { i: '🤖', t: 'AI app / agent', s: 'MCP client' }, spokes: [
    { i: '🗂️', t: 'Files server', s: 'resources' }, { i: '🐙', t: 'GitHub server', s: 'tools' }, { i: '🐘', t: 'Postgres server', s: 'query tool' }, { i: '📅', t: 'Calendar server', s: 'tools' }, { i: '🌐', t: 'Web search', s: 'tool' }] }),
  'agent-blocks': () => hub({ title: 'What an agent is made of', center: { i: '🧠', t: 'Model', s: 'reasoning engine' }, spokes: [
    { i: '🛠️', t: 'Tools', s: 'APIs, search, SQL' }, { i: '💾', t: 'Memory', s: 'short + long term' }, { i: '🗺️', t: 'Planning', s: 'ReAct, plan-execute' }, { i: '📜', t: 'Instructions', s: 'system prompt' }, { i: '🛡️', t: 'Guardrails', s: 'limits, approvals' }, { i: '🔁', t: 'Orchestration', s: 'the loop / graph' }] }),
  'workflow-vs-agent': () => compare({ title: 'Workflow vs agent', left: { icon: '🛤️', title: 'Workflow', c: '#3b82f6', items: ['Your code fixes the steps', 'Predictable and cheap', 'Easy to test and debug', 'Best when the path is known'] }, right: { icon: '🧭', title: 'Agent', c: '#f97316', items: ['The LLM chooses the steps', 'Flexible for open-ended goals', 'Needs limits, evals, tracing', 'Best when the path depends on results'] } }),
  'memory': () => compare({ title: 'Agent memory', left: { icon: '📝', title: 'Short-term', c: '#06b6d4', items: ['Messages of this conversation', 'Lives in the thread / state', 'Limited by the context window', 'Trim or summarize old turns'] }, right: { icon: '🗄️', title: 'Long-term', c: '#8b5cf6', items: ['Facts across sessions', 'Store / DB / vector DB', 'Per user: preferences, history', 'Write deliberately, let users delete'] } }),
  // ---------- web ----------
  'event-loop': () => cycle({ title: 'The JavaScript event loop', caption: 'microtasks always run before the next macrotask', center: 'Event loop', steps: [
    { i: '📚', t: 'Run sync code', s: 'call stack empties' }, { i: '⚡', t: 'process.nextTick', s: 'Node only' }, { i: '🟣', t: 'ALL microtasks', s: 'promises, queueMicrotask' }, { i: '🎨', t: 'Render', s: 'browser paints' }, { i: '⏱️', t: 'ONE macrotask', s: 'setTimeout, I/O' }] }),
  'url-flow': () => flow({ title: 'What happens when you open a URL', perRow: 4, steps: [
    { i: '⌨️', t: 'Type URL', s: 'example.com' }, { i: '📖', t: 'DNS lookup', s: 'name → IP' }, { i: '🤝', t: 'TCP + TLS', s: 'secure connection' }, { i: '📤', t: 'HTTP request', s: 'GET / + headers' },
    { i: '🖥️', t: 'Server works', s: 'routes, DB, cache' }, { i: '📥', t: 'Response', s: '200 + HTML' }, { i: '🧱', t: 'Parse', s: 'DOM + CSSOM' }, { i: '🎨', t: 'Render', s: 'layout + paint' }] }),
  'http-methods': () => flow({ title: 'HTTP methods on one resource', perRow: 5, steps: [
    { i: '📥', t: 'GET', s: 'read /users/7', c: '#10b981' }, { i: '➕', t: 'POST', s: 'create /users', c: '#3b82f6' }, { i: '♻️', t: 'PUT', s: 'replace /users/7', c: '#f59e0b' }, { i: '✏️', t: 'PATCH', s: 'change some fields', c: '#8b5cf6' }, { i: '🗑️', t: 'DELETE', s: 'remove /users/7', c: '#ef4444' }] }),
  'react-render': () => cycle({ title: 'How React updates the screen', caption: 'React re-renders in memory and only touches the DOM where something changed', center: 'React render cycle', steps: [
    { i: '🖱️', t: 'Event', s: 'click, fetch done' }, { i: '🔄', t: 'setState', s: 'state changes' }, { i: '🧩', t: 'Re-render', s: 'component runs again' }, { i: '🌳', t: 'New virtual DOM', s: 'JS objects' }, { i: '🔍', t: 'Diff', s: 'reconciliation' }, { i: '✅', t: 'Commit', s: 'patch real DOM' }] }),
  'express-middleware': () => flow({ title: 'Express middleware chain', caption: 'each middleware calls next() or ends the response', perRow: 5, steps: [
    { i: '📨', t: 'Request', s: 'GET /api/orders' }, { i: '📝', t: 'logger', s: 'next()' }, { i: '🔐', t: 'auth', s: '401 or next()' }, { i: '✅', t: 'validate', s: '400 or next()' }, { i: '🎯', t: 'route handler', s: 'res.json(data)' }] }),
  'jwt': () => flow({ title: 'JWT authentication', perRow: 5, steps: [
    { i: '🔑', t: 'Login', s: 'email + password' }, { i: '🏷️', t: 'Server signs JWT', s: 'header.payload.sig' }, { i: '💾', t: 'Client stores it', s: 'cookie / memory' }, { i: '📤', t: 'Sends with requests', s: 'Authorization: Bearer' }, { i: '✅', t: 'Server verifies', s: 'signature + expiry' }] }),
  'cache-aside': () => flow({ title: 'Cache-aside with Redis', caption: 'check the cache first; on a miss read the DB and fill the cache', perRow: 5, steps: [
    { i: '📨', t: 'Request', s: 'get user 7' }, { i: '⚡', t: 'Check Redis', s: 'hit → return fast' }, { i: '🐢', t: 'Miss → DB', s: 'slower read' }, { i: '💾', t: 'SET with TTL', s: 'fill the cache' }, { i: '📤', t: 'Return', s: 'next time is a hit' }] }),
  'docker': () => flow({ title: 'Docker in one picture', perRow: 5, steps: [
    { i: '📜', t: 'Dockerfile', s: 'recipe' }, { i: '🔨', t: 'docker build', s: 'layers' }, { i: '📦', t: 'Image', s: 'read-only template' }, { i: '▶️', t: 'docker run', s: 'start it' }, { i: '🐳', t: 'Container', s: 'isolated process' }] }),
  'promise': () => flow({ title: 'A Promise’s life', perRow: 4, steps: [
    { i: '⏳', t: 'pending', s: 'work started' }, { i: '✅', t: 'fulfilled', s: '.then(value)', c: '#10b981' }, { i: '❌', t: 'rejected', s: '.catch(error)', c: '#ef4444' }, { i: '🧹', t: '.finally()', s: 'always runs' }] }),
  'redux': () => cycle({ title: 'Redux data flow', caption: 'one-way: view → action → reducer → store → view', center: 'One store', steps: [
    { i: '🖥️', t: 'View', s: 'user clicks' }, { i: '📣', t: 'dispatch(action)', s: '{type, payload}' }, { i: '🧮', t: 'Reducer', s: 'pure: new state' }, { i: '🏪', t: 'Store', s: 'single source of truth' }] }),
  // ---------- .NET ----------
  'dotnet-compile': () => flow({ title: 'How a .NET program runs', perRow: 5, steps: [
    { i: '📝', t: 'C# code', s: 'Program.cs' }, { i: '⚙️', t: 'Roslyn compiler', s: 'dotnet build' }, { i: '📦', t: 'IL in a .dll', s: 'CPU-neutral' }, { i: '🔥', t: 'JIT (CLR)', s: 'IL → machine code' }, { i: '🚀', t: 'Runs', s: 'GC cleans up' }] }),
  'aspnet-pipeline': () => flow({ title: 'ASP.NET Core middleware pipeline', caption: 'request flows down in order, response flows back up in reverse', perRow: 6, loop: true, steps: [
    { i: '📨', t: 'Request', s: 'Kestrel' }, { i: '🧯', t: 'Exception handler', s: 'catches errors' }, { i: '🔒', t: 'HTTPS / static', s: 'may short-circuit' }, { i: '🧭', t: 'Routing', s: 'find endpoint' }, { i: '🪪', t: 'AuthN → AuthZ', s: 'who? allowed?' }, { i: '🎯', t: 'Endpoint', s: 'controller / MapGet' }] }),
  'di-lifetimes': diLifetimes,
  'async-await': () => flow({ title: 'async / await: the thread is freed while waiting', perRow: 5, steps: [
    { i: '▶️', t: 'Method starts', s: 'on a thread' }, { i: '⏳', t: 'await I/O', s: 'HTTP, DB, file' }, { i: '🔓', t: 'Thread released', s: 'serves other work' }, { i: '📬', t: 'I/O completes', s: 'callback queued' }, { i: '⏭️', t: 'Continues', s: 'rest of the method' }] }),
  'ef-core': () => flow({ title: 'EF Core: LINQ becomes SQL', perRow: 5, steps: [
    { i: '🧑‍💻', t: 'LINQ query', s: 'db.Orders.Where(...)' }, { i: '🌳', t: 'Expression tree', s: 'IQueryable' }, { i: '🔤', t: 'SQL generated', s: 'provider (Npgsql)' }, { i: '🐘', t: 'Database runs it', s: 'rows back' }, { i: '📦', t: 'Entities', s: 'tracked objects' }] }),
  'clean-arch': () => hub({ title: 'Clean Architecture', caption: 'dependencies point inward to the domain', center: { i: '💎', t: 'Domain', s: 'entities + rules' }, spokes: [
    { i: '🧠', t: 'Application', s: 'use cases' }, { i: '🌐', t: 'API', s: 'controllers' }, { i: '🗄️', t: 'Infrastructure', s: 'EF Core, email' }, { i: '🧪', t: 'Tests', s: 'no DB needed' }] }),
  'stack-heap': stackHeap,
  'if-flow': () => flow({ title: 'if / else as a picture', perRow: 4, steps: [
    { i: '❓', t: 'Check condition', s: 'age >= 18 ?' }, { i: '✅', t: 'true → if block', s: '"Adult"', c: '#10b981' }, { i: '❌', t: 'false → else', s: '"Minor"', c: '#ef4444' }, { i: '➡️', t: 'Continue', s: 'next line' }] }),
  'for-loop': () => cycle({ title: 'A for loop', caption: 'for (int i = 0; i < 3; i++) { … }', center: 'for loop', steps: [
    { i: '0️⃣', t: 'Init', s: 'int i = 0' }, { i: '❓', t: 'Check', s: 'i < 3 ?' }, { i: '🏃', t: 'Run body', s: 'Console.WriteLine(i)' }, { i: '➕', t: 'Update', s: 'i++' }] }),
  'oop': () => hub({ title: 'The 4 pillars of OOP', center: { i: '🧱', t: 'Class', s: 'blueprint → objects' }, spokes: [
    { i: '💊', t: 'Encapsulation', s: 'hide data, expose methods' }, { i: '🧬', t: 'Inheritance', s: 'Dog : Animal' }, { i: '🎭', t: 'Polymorphism', s: 'virtual / override' }, { i: '🧩', t: 'Abstraction', s: 'interfaces, abstract' }] }),
  'collections': () => compare({ title: 'Array vs List', left: { icon: '🧱', title: 'Array', c: '#06b6d4', items: ['Fixed size: new int[5]', 'Fastest index access', 'Size never changes'] }, right: { icon: '📋', title: 'List<T>', c: '#10b981', items: ['Grows: list.Add(x)', 'Remove, Insert, Contains', 'Use when size changes'] } }),
  'exceptions': () => flow({ title: 'try / catch / finally', perRow: 4, steps: [
    { i: '🧪', t: 'try', s: 'risky code' }, { i: '💥', t: 'Exception thrown', s: 'e.g. FormatException', c: '#ef4444' }, { i: '🧯', t: 'catch', s: 'handle / log' }, { i: '🧹', t: 'finally', s: 'always runs' }] }),
  // ---------- databases ----------
  joins: venns, btree, mvcc,
  'sql-order': () => flow({ title: 'The order SQL really runs in', perRow: 4, steps: [
    { i: '📂', t: 'FROM / JOIN', s: 'build rows' }, { i: '🔍', t: 'WHERE', s: 'filter rows' }, { i: '🗂️', t: 'GROUP BY', s: 'make groups' }, { i: '🧮', t: 'HAVING', s: 'filter groups' },
    { i: '🎯', t: 'SELECT', s: 'compute columns' }, { i: '🧼', t: 'DISTINCT', s: 'drop duplicates' }, { i: '↕️', t: 'ORDER BY', s: 'sort' }, { i: '✂️', t: 'LIMIT', s: 'take n' }] }),
  'transaction': () => flow({ title: 'A transaction (all or nothing)', perRow: 5, steps: [
    { i: '🟢', t: 'BEGIN', s: 'start' }, { i: '➖', t: 'UPDATE A', s: 'balance - 100' }, { i: '➕', t: 'UPDATE B', s: 'balance + 100' }, { i: '✅', t: 'COMMIT', s: 'both saved (WAL)', c: '#10b981' }, { i: '↩️', t: 'or ROLLBACK', s: 'neither saved', c: '#ef4444' }] }),
  'doc-vs-table': () => compare({ title: 'Table rows vs documents', left: { icon: '🐘', title: 'SQL table', c: '#3b82f6', items: ['Fixed columns, typed', 'Related data in other tables', 'JOIN to combine', 'Strong constraints'] }, right: { icon: '🍃', title: 'MongoDB document', c: '#22c55e', items: ['JSON-like, flexible shape', 'Nested objects and arrays', 'Read it all in one go', 'Schema validation optional'] } }),
  'embed-vs-ref': () => compare({ title: 'Embedding vs referencing', left: { icon: '📦', title: 'Embed', c: '#22c55e', items: ['Child lives inside the parent', 'One read gets everything', 'Bounded lists (addresses, items)', 'Atomic single-document writes'] }, right: { icon: '🔗', title: 'Reference', c: '#f59e0b', items: ['Store the other _id', 'Large, shared or unbounded data', 'Needs $lookup or 2 queries', 'Updated independently'] } }),
  'mongo-agg': () => flow({ title: 'Aggregation pipeline', caption: 'documents flow through stages like an assembly line', perRow: 5, steps: [
    { i: '📚', t: 'orders', s: 'all documents' }, { i: '🔍', t: '$match', s: 'status: "paid"' }, { i: '🧨', t: '$unwind', s: 'one doc per item' }, { i: '🧮', t: '$group', s: 'sum by sku' }, { i: '↕️', t: '$sort + $limit', s: 'top 5' }] }),
  'replica-set': () => hub({ title: 'MongoDB replica set', caption: 'the primary takes writes; secondaries copy its oplog and one is elected if it fails', center: { i: '👑', t: 'Primary', s: 'all writes' }, spokes: [
    { i: '📄', t: 'Secondary 1', s: 'copies oplog' }, { i: '📄', t: 'Secondary 2', s: 'copies oplog' }, { i: '🧑‍💻', t: 'App (driver)', s: 'writes + reads' }] }),
  'sharding': () => hub({ title: 'Sharding', caption: 'mongos routes each query to the shards that hold the data', center: { i: '🧭', t: 'mongos router', s: 'uses shard key' }, spokes: [
    { i: '🗄️', t: 'Shard A', s: 'tenant 1–100' }, { i: '🗄️', t: 'Shard B', s: 'tenant 101–200' }, { i: '🗄️', t: 'Shard C', s: 'tenant 201–300' }, { i: '📋', t: 'Config servers', s: 'chunk map' }] }),
  'fastapi-flow': () => flow({ title: 'A FastAPI request', perRow: 6, steps: [
    { i: '📨', t: 'Uvicorn', s: 'ASGI server' }, { i: '🧅', t: 'Middleware', s: 'CORS, timing' }, { i: '🧭', t: 'Routing', s: 'path → function' }, { i: '🔌', t: 'Depends()', s: 'DB, user' }, { i: '✅', t: 'Pydantic', s: '422 if invalid' }, { i: '📤', t: 'Response model', s: 'JSON out' }] }),
};

/** Which diagram goes where: [section-title regex, diagram] per topic. The first match wins per diagram per topic. */
export const RULES = {
  'genai-rag': [[/big picture/i, 'rag-pipeline'], [/big picture/i, 'agent-loop'], [/^Q16\./, 'embeddings'], [/^Embedding$/i, 'embeddings'], [/^Q25\./, 'chunking'], [/^Q29\./, 'rag-pipeline'], [/^Q34\./, 'hybrid-search'], [/^Q69\./, 'agent-loop'], [/^Q5\./, 'transformer'], [/^Q2\./, 'transformer'], [/^AI agent$/i, 'agent-blocks'], [/^Q80\./, 'lcel']],
  'agentic-langchain': [[/in one minute/i, 'workflow-vs-agent'], [/agent loop/i, 'agent-loop'], [/building blocks/i, 'agent-blocks'], [/what is tool \(function\) calling/i, 'tool-calling'], [/what is MCP/i, 'mcp'], [/short-term vs long-term/i, 'memory'], [/multi-agent architectures/i, 'supervisor'], [/human-in-the-loop/i, 'hitl'], [/what is LCEL/i, 'lcel'], [/build RAG with LangChain/i, 'rag-pipeline'], [/what is LangGraph/i, 'langgraph'], [/add human approval/i, 'hitl']],
  'voice-ai': [[/pitch/i, 'voice-pipeline']],
  'ai-fastapi-flask': [[/^Q5\./, 'rag-pipeline'], [/^Q8\./, 'chunking'], [/^Q9\./, 'hybrid-search'], [/^Q29\./, 'fastapi-flow'], [/^Q37\./, 'jwt'], [/agent/i, 'agent-loop']],
  'react-node': [[/^Q1\./, 'http-methods'], [/^Q35\./, 'event-loop'], [/^Q64\./, 'event-loop'], [/^Q37\./, 'promise'], [/^Q44\./, 'react-render'], [/^Q54\./, 'redux'], [/^Q78\./, 'express-middleware'], [/^Q84\./, 'cache-aside'], [/^Q336\./, 'cache-aside'], [/^Q143\./, 'btree'], [/^Q144\./, 'mongo-agg'], [/^Q161\./, 'joins'], [/^Q160\./, 'joins'], [/^Q170\./, 'btree'], [/^Q216\./, 'url-flow'], [/^Q224\./, 'jwt'], [/^Q256\./, 'transaction'], [/^Q341\./, 'docker'], [/^Q344\./, 'docker']],
  csharp: [[/^1\. Hello world/, 'dotnet-compile'], [/^13\. If/, 'if-flow'], [/^15\. For loops/, 'for-loop'], [/^37\. Lists/, 'collections'], [/^48\. Reference parameters/, 'stack-heap'], [/^52\. Try/, 'exceptions'], [/^60\. Classes/, 'stack-heap'], [/^66\. OOP/, 'oop'], [/^91\. ADVANCED: async/, 'async-await'], [/^99\. ADVANCED: Dependency/, 'di-lifetimes']],
  dotnet: [[/how a \.NET program runs/i, 'dotnet-compile'], [/value types and reference types/i, 'stack-heap'], [/how do async and await work/i, 'async-await'], [/middleware and why does order matter/i, 'aspnet-pipeline'], [/dependency injection and what are the three lifetimes/i, 'di-lifetimes'], [/what is EF Core/i, 'ef-core'], [/clean architecture/i, 'clean-arch']],
  mongodb: [[/in one minute/i, 'doc-vs-table'], [/why do indexes matter/i, 'btree'], [/what is the aggregation pipeline/i, 'mongo-agg'], [/embedding vs referencing/i, 'embed-vs-ref'], [/replica set/i, 'replica-set'], [/sharding and how/i, 'sharding']],
  postgres: [[/order SQL actually runs/i, 'sql-order'], [/types of JOIN/i, 'joins'], [/how do indexes work/i, 'btree'], [/what does ACID mean/i, 'transaction'], [/what is MVCC/i, 'mvcc'], [/pgvector/i, 'rag-pipeline']],
};

Object.assign(D, leetcodeDiagrams({ flow, cycle }));
RULES.leetcode = LEETCODE_RULES;
Object.assign(D, extraDiagrams({ flow, cycle, hub, compare }));
Object.assign(RULES, EXTRA_RULES);
Object.assign(D, devopsDiagrams({ flow, cycle, hub, compare }));
Object.assign(RULES, DEVOPS_RULES);

export function renderDiagram(name) {
  const f = D[name];
  return f ? f() : '';
}
export const DIAGRAM_NAMES = Object.keys(D);
