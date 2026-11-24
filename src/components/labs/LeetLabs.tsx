'use client';
import { useEffect, useMemo, useState } from 'react';

/* Algorithm visualizer: type your own input, then step through the algorithm. */
type Frame = { p: Record<string, number>; win?: [number, number]; hot?: number[]; dim?: number[]; vars: Record<string, string | number>; say: string };
type Algo = { id: string; name: string; input: string; hint: string; node?: boolean; extra?: { label: string; value: string }; run: (cells: string[], extra: string) => Frame[]; cs: string; js: string };

const nums = (c: string[]) => c.map(Number);

const ALGOS: Algo[] = [
  {
    id: 'two', name: 'Two pointers (pair sum)', input: '1, 3, 4, 6, 8, 11', hint: 'sorted numbers', extra: { label: 'target', value: '10' },
    run: (c, ex) => {
      const a = nums(c), t = Number(ex), f: Frame[] = [];
      let L = 0, R = a.length - 1;
      while (L < R) {
        const s = a[L] + a[R];
        if (s === t) { f.push({ p: { L, R }, hot: [L, R], vars: { sum: s, target: t }, say: `${a[L]} + ${a[R]} = ${s} ✓ found` }); return f; }
        f.push({ p: { L, R }, vars: { sum: s, target: t }, say: s < t ? `${s} < ${t} → move L right` : `${s} > ${t} → move R left` });
        if (s < t) L++; else R--;
      }
      f.push({ p: {}, vars: { target: t }, say: 'pointers met: no pair adds up to the target' });
      return f;
    },
    cs: 'int L = 0, R = a.Length - 1;\nwhile (L < R) {\n    int s = a[L] + a[R];\n    if (s == target) return new[] { L, R };\n    if (s < target) L++; else R--;\n}',
    js: 'let L = 0, R = a.length - 1;\nwhile (L < R) {\n  const s = a[L] + a[R];\n  if (s === target) return [L, R];\n  if (s < target) L++; else R--;\n}',
  },
  {
    id: 'window', name: 'Sliding window (longest unique substring)', input: 'a, b, c, a, b, c, b, b', hint: 'letters',
    run: (c) => {
      const f: Frame[] = [];
      const last = new Map<string, number>();
      let L = 0, best = 0, bestWin: [number, number] = [0, 0];
      c.forEach((ch, R) => {
        let say = `add "${ch}"`;
        if (last.has(ch) && last.get(ch)! >= L) { L = last.get(ch)! + 1; say = `"${ch}" repeats → move L to ${L}`; }
        last.set(ch, R);
        if (R - L + 1 > best) { best = R - L + 1; bestWin = [L, R]; say += ` → new best ${best}`; }
        f.push({ p: { L, R }, win: [L, R], vars: { window: c.slice(L, R + 1).join(''), best }, say });
      });
      f.push({ p: {}, win: bestWin, hot: Array.from({ length: bestWin[1] - bestWin[0] + 1 }, (_, k) => bestWin[0] + k), vars: { best }, say: `answer: ${best}` });
      return f;
    },
    cs: 'var last = new Dictionary<char, int>();\nint L = 0, best = 0;\nfor (int R = 0; R < s.Length; R++) {\n    if (last.TryGetValue(s[R], out int i) && i >= L) L = i + 1;\n    last[s[R]] = R;\n    best = Math.Max(best, R - L + 1);\n}',
    js: 'const last = new Map();\nlet L = 0, best = 0;\nfor (let R = 0; R < s.length; R++) {\n  if (last.has(s[R]) && last.get(s[R]) >= L) L = last.get(s[R]) + 1;\n  last.set(s[R], R);\n  best = Math.max(best, R - L + 1);\n}',
  },
  {
    id: 'bs', name: 'Binary search', input: '-1, 0, 3, 5, 9, 12, 15, 20', hint: 'sorted numbers', extra: { label: 'find', value: '12' },
    run: (c, ex) => {
      const a = nums(c), t = Number(ex), f: Frame[] = [];
      let lo = 0, hi = a.length - 1;
      const dim = (l: number, h: number) => a.map((_, i) => i).filter((i) => i < l || i > h);
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (a[mid] === t) { f.push({ p: { lo, mid, hi }, hot: [mid], dim: dim(lo, hi), vars: { 'a[mid]': a[mid] }, say: `a[${mid}] = ${t} ✓ found` }); return f; }
        f.push({ p: { lo, mid, hi }, hot: [mid], dim: dim(lo, hi), vars: { 'a[mid]': a[mid] }, say: a[mid] < t ? `${a[mid]} < ${t} → lo = mid + 1` : `${a[mid]} > ${t} → hi = mid - 1` });
        if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
      }
      f.push({ p: {}, dim: a.map((_, i) => i), vars: {}, say: `${t} is not in the array (return -1)` });
      return f;
    },
    cs: 'int lo = 0, hi = a.Length - 1;\nwhile (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n    if (a[mid] == target) return mid;\n    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n}\nreturn -1;',
    js: 'let lo = 0, hi = a.length - 1;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  if (a[mid] === target) return mid;\n  if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n}\nreturn -1;',
  },
  {
    id: 'kadane', name: "Kadane (maximum subarray)", input: '-2, 1, -3, 4, -1, 2, 1, -5, 4', hint: 'numbers',
    run: (c) => {
      const a = nums(c), f: Frame[] = [];
      let cur = a[0], best = a[0], start = 0, bs = 0, be = 0;
      f.push({ p: { i: 0 }, win: [0, 0], vars: { cur, best }, say: `start: cur = best = ${a[0]}` });
      for (let i = 1; i < a.length; i++) {
        let say;
        if (a[i] > cur + a[i]) { cur = a[i]; start = i; say = `start fresh at ${a[i]}`; } else { cur += a[i]; say = `extend: cur = ${cur}`; }
        if (cur > best) { best = cur; bs = start; be = i; say += ` → best = ${best}`; }
        f.push({ p: { i }, win: [start, i], vars: { cur, best }, say });
      }
      f.push({ p: {}, win: [bs, be], hot: Array.from({ length: be - bs + 1 }, (_, k) => bs + k), vars: { best }, say: `answer: ${best}` });
      return f;
    },
    cs: 'int cur = a[0], best = a[0];\nfor (int i = 1; i < a.Length; i++) {\n    cur = Math.Max(a[i], cur + a[i]);\n    best = Math.Max(best, cur);\n}',
    js: 'let cur = a[0], best = a[0];\nfor (let i = 1; i < a.length; i++) {\n  cur = Math.max(a[i], cur + a[i]);\n  best = Math.max(best, cur);\n}',
  },
  {
    id: 'fast', name: 'Fast & slow pointers (middle of a list)', input: '1, 2, 3, 4, 5, 6, 7', hint: 'list values', node: true,
    run: (c) => {
      const f: Frame[] = [];
      let slow = 0, fast = 0;
      f.push({ p: { slow, fast }, vars: {}, say: 'both start at the head' });
      while (fast < c.length - 1) {
        slow += 1; fast = Math.min(fast + 2, c.length);
        if (fast >= c.length) { f.push({ p: { slow }, vars: { 'fast': 'null' }, say: 'fast ran off the end' }); break; }
        f.push({ p: { slow, fast }, vars: {}, say: 'slow +1, fast +2' });
      }
      f.push({ p: { slow }, hot: [slow], vars: { middle: c[slow] }, say: `middle = ${c[slow]}` });
      return f;
    },
    cs: 'ListNode slow = head, fast = head;\nwhile (fast != null && fast.next != null) {\n    slow = slow.next;\n    fast = fast.next.next;\n}\nreturn slow;',
    js: 'let slow = head, fast = head;\nwhile (fast && fast.next) {\n  slow = slow.next;\n  fast = fast.next.next;\n}\nreturn slow;',
  },
  {
    id: 'reverse', name: 'Reverse a linked list', input: '1, 2, 3, 4', hint: 'list values', node: true,
    run: (c) => {
      const f: Frame[] = [];
      for (let k = 0; k <= c.length; k++) {
        const reversed = c.slice(0, k).reverse().join('→') || 'null';
        const rest = c.slice(k).join('→') || 'null';
        f.push({ p: { ...(k > 0 ? { prev: k - 1 } : {}), ...(k < c.length ? { cur: k } : {}) }, dim: [], hot: Array.from({ length: k }, (_, j) => j), vars: { reversed: reversed + (k ? '→null' : ''), rest }, say: k === 0 ? 'prev = null, cur = head' : k === c.length ? `cur = null → return prev (${c[k - 1]})` : `flip ${c[k - 1]} to point back, move prev and cur` });
      }
      return f;
    },
    cs: 'ListNode prev = null, cur = head;\nwhile (cur != null) {\n    var next = cur.next;\n    cur.next = prev;\n    prev = cur;\n    cur = next;\n}\nreturn prev;',
    js: 'let prev = null, cur = head;\nwhile (cur) {\n  const next = cur.next;\n  cur.next = prev;\n  prev = cur;\n  cur = next;\n}\nreturn prev;',
  },
];

const PCOL = ['#8b5cf6', '#ec4899', '#06b6d4'];

export function AlgoLab() {
  const [algo, setAlgo] = useState(ALGOS[0]);
  const [input, setInput] = useState(ALGOS[0].input);
  const [extra, setExtra] = useState(ALGOS[0].extra?.value || '');
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const [lang, setLang] = useState<'cs' | 'js'>('cs');

  const cells = useMemo(() => input.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 14), [input]);
  const frames = useMemo(() => {
    try { return cells.length ? algo.run(cells, extra) : []; } catch { return []; }
  }, [algo, cells, extra]);
  useEffect(() => { setI(0); setPlay(false); }, [frames]);
  useEffect(() => {
    if (!play) return;
    if (i >= frames.length - 1) { setPlay(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 1100);
    return () => clearTimeout(t);
  }, [play, i, frames.length]);

  const pick = (a: Algo) => { setAlgo(a); setInput(a.input); setExtra(a.extra?.value || ''); };
  const fr = frames[Math.min(i, frames.length - 1)];
  const ptrs = Object.entries(fr?.p || {});

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {ALGOS.map((a) => <button key={a.id} className={`chip ${algo.id === a.id ? 'on' : ''}`} onClick={() => pick(a)}>{a.name}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label style={{ flex: '1 1 260px', fontSize: 13 }} className="muted">Input ({algo.hint}, comma separated)
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} style={{ marginTop: 4, fontFamily: 'var(--font-mono)' }} />
        </label>
        {algo.extra && (
          <label style={{ width: 120, fontSize: 13 }} className="muted">{algo.extra.label}
            <input className="input" value={extra} onChange={(e) => setExtra(e.target.value)} style={{ marginTop: 4, fontFamily: 'var(--font-mono)' }} />
          </label>
        )}
        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
          <button className="btn btn-sm" onClick={() => { setPlay(false); setI((x) => Math.max(0, x - 1)); }}>◀</button>
          <button className="btn btn-sm btn-primary" onClick={() => { if (i >= frames.length - 1) setI(0); setPlay((p) => !p); }}>{play ? '⏸ Pause' : '▶ Play'}</button>
          <button className="btn btn-sm" onClick={() => { setPlay(false); setI((x) => Math.min(frames.length - 1, x + 1)); }}>Step ▶</button>
        </div>
      </div>

      {fr ? (
        <div style={{ display: 'grid', gap: 16 }} className="lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div style={{ padding: '58px 12px 52px', background: 'var(--panel-2)', borderRadius: 16, border: '1px solid var(--border)', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: algo.node ? 26 : 8, justifyContent: 'center', alignItems: 'center', minWidth: 'fit-content', position: 'relative' }}>
              {cells.map((v, k) => {
                const inWin = fr.win && k >= fr.win[0] && k <= fr.win[1];
                const hot = fr.hot?.includes(k);
                const dim = fr.dim?.includes(k);
                const here = ptrs.filter(([, idx]) => idx === k);
                return (
                  <div key={k} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8, alignItems: 'center' }}>
                      {here.map(([nm]) => (
                        <span key={nm} style={{ fontSize: 11.5, fontWeight: 800, color: 'white', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', background: PCOL[Object.keys(fr.p).indexOf(nm) % 3] }}>{nm} ▾</span>
                      ))}
                    </div>
                    <div style={{
                      width: 50, height: 50, borderRadius: algo.node ? '50%' : 12, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 17, transition: 'all .3s',
                      border: `2px solid ${hot ? '#10b981' : inWin ? '#f59e0b' : 'var(--border-2)'}`,
                      background: hot ? 'color-mix(in oklab, #10b981 35%, var(--panel))' : inWin ? 'color-mix(in oklab, #f59e0b 22%, var(--panel))' : 'var(--panel)',
                      opacity: dim ? 0.3 : 1, transform: here.length ? 'translateY(-3px)' : undefined,
                    }}>{v}</div>
                    {!algo.node && <span className="faint" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: 11, marginTop: 6 }}>{k}</span>}
                    {algo.node && k < cells.length - 1 && <span style={{ position: 'absolute', left: '100%', width: 26, textAlign: 'center', color: 'var(--faint)', fontWeight: 800 }}>{algo.id === 'reverse' && fr.hot?.includes(k + 1) ? '←' : '→'}</span>}
                  </div>
                );
              })}
            </div>
            <div key={i} className="sec-body" style={{ textAlign: 'center', marginTop: 34, fontWeight: 700, fontSize: 15.5 }}>{fr.say}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
              {Object.entries(fr.vars).map(([k, v]) => <span key={k} className="badge" style={{ fontFamily: 'var(--font-mono)' }}>{k} = {String(v)}</span>)}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Step {i + 1} of {frames.length}</div>
            <div className="progress" style={{ marginBottom: 12 }}><i style={{ width: `${((i + 1) / frames.length) * 100}%` }} /></div>
            <div style={{ display: 'flex', gap: 6, marginBottom: -4 }}>
              <button className={`chip ${lang === 'cs' ? 'on' : ''}`} onClick={() => setLang('cs')}>C#</button>
              <button className={`chip ${lang === 'js' ? 'on' : ''}`} onClick={() => setLang('js')}>JavaScript</button>
            </div>
            <pre className="code-block" data-lang={lang === 'cs' ? 'csharp' : 'javascript'}><code>{lang === 'cs' ? algo.cs : algo.js}</code></pre>
          </div>
        </div>
      ) : (
        <div className="muted" style={{ padding: 20 }}>Type some input to start.</div>
      )}
    </div>
  );
}

/* Big O feel: how many steps for a given n. */
export function BigOLab() {
  const [n, setN] = useState(1000);
  const rows: [string, string, (n: number) => number, string][] = [
    ['O(1)', '#10b981', () => 1, 'array index, hash lookup'],
    ['O(log n)', '#06b6d4', (x) => Math.ceil(Math.log2(Math.max(2, x))), 'binary search'],
    ['O(n)', '#3b82f6', (x) => x, 'one loop'],
    ['O(n log n)', '#f59e0b', (x) => Math.round(x * Math.log2(Math.max(2, x))), 'good sorting'],
    ['O(n²)', '#ef4444', (x) => x * x, 'loop inside a loop'],
    ['O(2ⁿ)', '#8b5cf6', (x) => Math.pow(2, Math.min(x, 1024)), 'naive recursion (fib)'],
  ];
  const fmt = (v: number) => (!isFinite(v) || v > 1e15 ? '∞ (never finishes)' : v.toLocaleString());
  const max = Math.log10(1e15);
  return (
    <div className="panel" style={{ padding: 18 }}>
      <label style={{ display: 'block', fontSize: 14, marginBottom: 12 }}>Input size <b>n = {n.toLocaleString()}</b>
        <input type="range" min={1} max={6} step={0.01} value={Math.log10(n)} onChange={(e) => setN(Math.round(Math.pow(10, +e.target.value)))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
      </label>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map(([nm, c, f, ex]) => {
          const v = f(n);
          const w = Math.min(100, (Math.log10(Math.max(1, v)) / max) * 100);
          return (
            <div key={nm} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 150px', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
              <b style={{ color: c }}>{nm}</b>
              <div className="progress" style={{ height: 14 }}><i style={{ width: `${Math.max(1, w)}%`, background: c }} /></div>
              <span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }} title={ex}>{fmt(v)}{isFinite(v) && v <= 1e15 ? (v === 1 ? ' step' : ' steps') : ''}</span>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Bars use a log scale. At 1 million items, O(n²) is a trillion steps: that is why interviewers ask you to remove the inner loop.</p>
    </div>
  );
}
