// LeetCode pictures: arrays / lists with moving pointers and windows (discrete SMIL frames that loop like a GIF).
let uid = 1000;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function figure(svg, w, h, title, caption) {
  return `<figure class="dg"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`
    + `<figcaption><b>${esc(title)}</b>${caption ? ` — ${esc(caption)}` : ''}</figcaption></figure>`;
}

export function arrayAnim({ title, caption, values, frames, step = 1.7, node = false }) {
  const id = `la${++uid}`;
  const n = values.length;
  const W = 760, gap = node ? 30 : 8;
  const cw = Math.min(70, (W - 60 - gap * (n - 1)) / n);
  const total = n * cw + (n - 1) * gap;
  const x0 = (W - total) / 2, y0 = 74, ch = 52, H = 236;
  const T = +(frames.length * step).toFixed(2);
  const kt = frames.map((_, i) => +(i / frames.length).toFixed(4)).join(';');
  const disc = (vals) => ` values="${vals.join(';')}" keyTimes="${kt}" dur="${T}s" calcMode="discrete" repeatCount="indefinite"`;
  const left = (i) => x0 + i * (cw + gap);
  const cx = (i) => left(i) + cw / 2;
  let svg = `<defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="var(--faint)"/></marker></defs>`;

  if (frames.some((f) => f.win)) {
    const xs = frames.map((f) => (f.win ? left(f.win[0]) - 5 : -999));
    const ws = frames.map((f) => (f.win ? (f.win[1] - f.win[0] + 1) * (cw + gap) - gap + 10 : 0));
    svg += `<rect y="${y0 - 7}" height="${ch + 14}" rx="13" fill="#f59e0b" fill-opacity=".2" stroke="#f59e0b" stroke-width="2"><animate attributeName="x"${disc(xs)}/><animate attributeName="width"${disc(ws)}/></rect>`;
  }
  values.forEach((v, i) => {
    const hot = frames.map((f) => ((f.hot || []).includes(i) ? 0.55 : 0));
    const dim = frames.map((f) => ((f.done || []).includes(i) ? 0.3 : 1));
    const r = node ? ch / 2 : 10;
    if (node && i < n - 1) svg += `<line x1="${left(i) + cw + 2}" y1="${y0 + ch / 2}" x2="${left(i + 1) - 4}" y2="${y0 + ch / 2}" class="dg-arrow" marker-end="url(#${id})"/>`;
    svg += `<g><rect x="${left(i)}" y="${y0}" width="${cw}" height="${ch}" rx="${r}" class="dg-box" style="--c:#3b82f6"><animate attributeName="opacity"${disc(dim)}/></rect>`
      + `<rect x="${left(i)}" y="${y0}" width="${cw}" height="${ch}" rx="${r}" fill="#10b981" opacity="0"><animate attributeName="opacity"${disc(hot)}/></rect>`
      + `<text x="${cx(i)}" y="${y0 + ch / 2 + 6}" text-anchor="middle" class="dg-label" font-size="17">${esc(v)}</text>`
      + (node ? '' : `<text x="${cx(i)}" y="${y0 + ch + 17}" text-anchor="middle" class="dg-sub">${i}</text>`) + `</g>`;
  });
  if (node) svg += `<text x="${left(n - 1) + cw + 8}" y="${y0 + ch / 2 + 5}" class="dg-sub">null</text>`;

  const names = [...new Set(frames.flatMap((f) => Object.keys(f.p || {})))];
  const colors = ['#8b5cf6', '#ec4899', '#06b6d4'];
  names.forEach((nm, k) => {
    const xs = frames.map((f) => (f.p && f.p[nm] != null ? cx(f.p[nm]) - 24 : -999));
    const y = k === 1 ? y0 + ch + 26 : k === 2 ? y0 - 66 : y0 - 38;
    svg += `<g><rect y="${y}" width="48" height="24" rx="7" fill="${colors[k % 3]}"><animate attributeName="x"${disc(xs)}/></rect>`
      + `<text y="${y + 16.5}" text-anchor="middle" fill="#fff" font-weight="800" font-size="12">${esc(nm)}<animate attributeName="x"${disc(xs.map((x) => x + 24))}/></text></g>`;
  });
  frames.forEach((f, i) => {
    const op = frames.map((_, j) => (j === i ? 1 : 0));
    svg += `<text x="${W / 2}" y="${H - 12}" text-anchor="middle" class="dg-label" font-size="14.5" opacity="0">${esc(f.say || '')}<animate attributeName="opacity"${disc(op)}/></text>`;
  });
  svg += `<text x="16" y="22" class="dg-sub">step-by-step · loops automatically</text>`;
  return figure(svg, W, H, title, caption);
}

export function bigO() {
  const W = 760, H = 330, ox = 60, oy = 290, w = 640, h = 250;
  const curves = [
    ['O(1)', '#10b981', () => 0.06],
    ['O(log n)', '#06b6d4', (x) => 0.06 + Math.log2(1 + x * 15) / 14],
    ['O(n)', '#3b82f6', (x) => x * 0.55],
    ['O(n log n)', '#f59e0b', (x) => (x * Math.log2(1 + x * 15)) / 6.5],
    ['O(n²)', '#ef4444', (x) => x * x * 1.4],
    ['O(2ⁿ)', '#8b5cf6', (x) => (Math.pow(2, x * 9) - 1) / 140],
  ];
  let s = `<line x1="${ox}" y1="${oy}" x2="${ox + w}" y2="${oy}" class="dg-arrow"/><line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy - h}" class="dg-arrow"/>`
    + `<text x="${ox + w - 90}" y="${oy + 24}" class="dg-sub">input size n →</text><text x="${ox - 50}" y="${oy - h - 8}" class="dg-sub">time ↑</text>`;
  curves.forEach(([nm, c, fn], k) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const x = i / 60;
      const y = Math.min(1, fn(x));
      pts.push(`${(ox + x * w).toFixed(1)},${(oy - y * h).toFixed(1)}`);
      if (y >= 1) break;
    }
    const [lx, ly] = pts[pts.length - 1].split(',').map(Number);
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" class="dg-draw" style="animation-delay:${k * 0.35}s"/>`
      + `<text x="${Math.min(lx + 6, ox + w - 70)}" y="${ly - 7}" fill="${c}" font-weight="800" font-size="13" class="dg-pop" style="animation-delay:${k * 0.35 + 0.6}s">${nm}</text>`;
  });
  return figure(s, W, H, 'Big O: how running time grows', 'aim for the lower curves; a loop inside a loop pushes you to O(n²)');
}

/** Diagram factories that need the generic generators from diagrams.mjs. */
export function leetcodeDiagrams({ flow, cycle }) {
  return {
    bigo: bigO,
    'two-pointers': () => arrayAnim({ title: 'Two pointers (sorted array, target = 10)', caption: 'too small → move L right; too big → move R left', values: [1, 3, 4, 6, 8, 11],
      frames: [{ p: { L: 0, R: 5 }, say: '1 + 11 = 12 > 10 → move R left' }, { p: { L: 0, R: 4 }, say: '1 + 8 = 9 < 10 → move L right' }, { p: { L: 1, R: 4 }, say: '3 + 8 = 11 > 10 → move R left' }, { p: { L: 1, R: 3 }, say: '3 + 6 = 9 < 10 → move L right' }, { p: { L: 2, R: 3 }, hot: [2, 3], say: '4 + 6 = 10 ✓ found in one pass, O(n)' }] }),
    'sliding-window': () => arrayAnim({ title: 'Sliding window: longest substring without repeats', caption: 'grow on the right; when a letter repeats, move the left edge past it', values: ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b'],
      frames: [{ win: [0, 0], p: { L: 0, R: 0 }, say: '"a" → best 1' }, { win: [0, 1], p: { L: 0, R: 1 }, say: '"ab" → best 2' }, { win: [0, 2], p: { L: 0, R: 2 }, say: '"abc" → best 3' }, { win: [1, 3], p: { L: 1, R: 3 }, say: '"a" repeats → L jumps past it: "bca"' }, { win: [2, 4], p: { L: 2, R: 4 }, say: '"b" repeats → "cab"' }, { win: [3, 5], p: { L: 3, R: 5 }, say: '"abc" → best stays 3' }, { win: [5, 6], p: { L: 5, R: 6 }, say: '"b" repeats → "cb"' }, { win: [7, 7], p: { L: 7, R: 7 }, say: 'done: answer = 3' }] }),
    'binary-search': () => arrayAnim({ title: 'Binary search for 9', caption: 'every step throws away half the array: O(log n)', values: [-1, 0, 3, 5, 9, 12, 15],
      frames: [{ p: { lo: 0, hi: 6 }, say: 'search the whole array' }, { p: { lo: 0, hi: 6, mid: 3 }, hot: [3], say: 'mid = 3 → 5 < 9 → keep the right half' }, { p: { lo: 4, hi: 6 }, done: [0, 1, 2, 3], say: 'lo = mid + 1 = 4' }, { p: { lo: 4, hi: 6, mid: 5 }, hot: [5], done: [0, 1, 2, 3], say: 'mid = 5 → 12 > 9 → keep the left half' }, { p: { lo: 4, hi: 4, mid: 4 }, hot: [4], done: [0, 1, 2, 3, 5, 6], say: 'mid = 4 → 9 ✓ found' }] }),
    kadane: () => arrayAnim({ title: "Kadane's algorithm (maximum subarray)", caption: 'extend the current run, or start fresh when the run would be worse than the number alone', values: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      frames: [{ p: { i: 0 }, win: [0, 0], say: 'cur = -2, best = -2' }, { p: { i: 1 }, win: [1, 1], say: 'start fresh at 1 → best = 1' }, { p: { i: 2 }, win: [1, 2], say: 'cur = 1 - 3 = -2' }, { p: { i: 3 }, win: [3, 3], say: 'start fresh at 4 → best = 4' }, { p: { i: 4 }, win: [3, 4], say: 'cur = 3' }, { p: { i: 5 }, win: [3, 5], say: 'cur = 5 → best = 5' }, { p: { i: 6 }, win: [3, 6], hot: [3, 4, 5, 6], say: 'cur = 6 → best = 6  ([4, -1, 2, 1])' }, { p: { i: 8 }, win: [3, 8], say: 'nothing beats 6 → answer 6' }] }),
    'fast-slow': () => arrayAnim({ title: 'Fast and slow pointers: find the middle', caption: 'slow moves 1 node, fast moves 2; when fast hits the end, slow is in the middle', node: true, values: [1, 2, 3, 4, 5],
      frames: [{ p: { slow: 0, fast: 0 }, say: 'both start at the head' }, { p: { slow: 1, fast: 2 }, say: 'slow +1, fast +2' }, { p: { slow: 2, fast: 4 }, hot: [2], say: 'fast is at the last node → slow is the middle (3)' }] }),
    'reverse-list': () => cycle({ title: 'Reverse a linked list: 4 moves per node', caption: 'start with prev = null, cur = head; when cur is null, prev is the new head', center: 'while (cur != null)', steps: [
      { i: '💾', t: 'Save next', s: 'next = cur.next' }, { i: '↩️', t: 'Flip the arrow', s: 'cur.next = prev' }, { i: '⬅️', t: 'Move prev', s: 'prev = cur' }, { i: '➡️', t: 'Move cur', s: 'cur = next' }] }),
    'hashmap-two-sum': () => flow({ title: 'Two Sum with a hash map (target 9)', caption: 'one pass: for each number, look up the complement you still need', perRow: 4, steps: [
      { i: '2️⃣', t: 'See 2', s: 'need 7: not seen → store {2: 0}' }, { i: '7️⃣', t: 'See 7', s: 'need 2: seen at index 0!' }, { i: '🎯', t: 'Answer', s: '[0, 1]' }, { i: '⏱️', t: 'O(n) time', s: 'O(n) extra space' }] }),
    'stack-parens': () => flow({ title: 'Valid parentheses with a stack', caption: 'push openers; every closer must match the top of the stack', perRow: 5, steps: [
      { i: '📥', t: 'push (', s: 'stack: (' }, { i: '📥', t: 'push [', s: 'stack: ( [' }, { i: '✔️', t: '] matches [', s: 'pop → (' }, { i: '✔️', t: ') matches (', s: 'pop → empty' }, { i: '✅', t: 'Empty = valid', s: '"([])" is valid' }] }),
    'dummy-merge': () => flow({ title: 'Merge with a dummy head', caption: 'a placeholder node removes the special case for the first node; return dummy.next', perRow: 5, steps: [
      { i: '🪆', t: 'dummy, tail', s: 'tail = dummy' }, { i: '⚖️', t: 'Compare heads', s: 'take the smaller' }, { i: '🔗', t: 'tail.next = it', s: 'advance that list' }, { i: '➡️', t: 'tail = tail.next', s: 'repeat' }, { i: '🧷', t: 'Attach the rest', s: 'return dummy.next' }] }),
  };
}

export const LEETCODE_RULES = [
  [/^206\./, 'reverse-list'], [/^21\./, 'dummy-merge'], [/^141\./, 'fast-slow'], [/^876\./, 'fast-slow'], [/^1\. Two Sum/, 'hashmap-two-sum'],
  [/^125\./, 'two-pointers'], [/^11\./, 'two-pointers'], [/^15\./, 'two-pointers'], [/^3\. Longest/, 'sliding-window'], [/^704\./, 'binary-search'],
  [/^53\./, 'kadane'], [/^20\./, 'stack-parens'], [/Big O quick reference/i, 'bigo'],
];
