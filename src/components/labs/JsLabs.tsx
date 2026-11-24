'use client';
import { useMemo, useState } from 'react';

/* ============ Event loop ============ */
type Task = { label: string; kind: 'sync' | 'micro' | 'macro' | 'nextTick' };
const PUZZLES: { name: string; code: string; tasks: Task[] }[] = [
  {
    name: 'Classic',
    code: `console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");`,
    tasks: [{ label: 'A', kind: 'sync' }, { label: 'B', kind: 'macro' }, { label: 'C', kind: 'micro' }, { label: 'D', kind: 'sync' }],
  },
  {
    name: 'Node: nextTick',
    code: `setTimeout(() => console.log("timeout"), 0);\nPromise.resolve().then(() => console.log("promise"));\nprocess.nextTick(() => console.log("nextTick"));\nconsole.log("sync");`,
    tasks: [{ label: 'timeout', kind: 'macro' }, { label: 'promise', kind: 'micro' }, { label: 'nextTick', kind: 'nextTick' }, { label: 'sync', kind: 'sync' }],
  },
  {
    name: 'async/await',
    code: `async function f() {\n  console.log("1 f start");\n  await null;\n  console.log("2 after await");\n}\nconsole.log("3 script");\nsetTimeout(() => console.log("4 timeout"), 0);\nf();\nqueueMicrotask(() => console.log("5 microtask"));\nconsole.log("6 script end");`,
    tasks: [{ label: '3 script', kind: 'sync' }, { label: '4 timeout', kind: 'macro' }, { label: '1 f start', kind: 'sync' }, { label: '2 after await', kind: 'micro' }, { label: '5 microtask', kind: 'micro' }, { label: '6 script end', kind: 'sync' }],
  },
];

function order(tasks: Task[]) {
  const rank = { sync: 0, nextTick: 1, micro: 2, macro: 3 };
  return tasks.map((t, i) => ({ t, i })).sort((a, b) => rank[a.t.kind] - rank[b.t.kind] || a.i - b.i).map((x) => x.t.label);
}

export function EventLoopLab() {
  const [p, setP] = useState(0);
  const [guess, setGuess] = useState<string[]>([]);
  const [step, setStep] = useState(-1);
  const puzzle = PUZZLES[p];
  const answer = useMemo(() => order(puzzle.tasks), [puzzle]);
  const checked = guess.length === answer.length;
  const right = checked && guess.every((g, i) => g === answer[i]);
  const reset = (k = p) => { setP(k); setGuess([]); setStep(-1); };

  const kindOf = (l: string) => puzzle.tasks.find((t) => t.label === l)!.kind;
  const lanes = { sync: 'Call stack (sync)', nextTick: 'nextTick queue', micro: 'Microtask queue', macro: 'Macrotask / timer queue' } as const;
  const shownOut = step >= 0 ? answer.slice(0, step + 1) : [];

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {PUZZLES.map((x, k) => <button key={x.name} className={`chip ${p === k ? 'on' : ''}`} onClick={() => reset(k)}>{x.name}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 16 }} className="lg:grid-cols-2">
        <div>
          <pre className="code-block" data-lang="javascript" style={{ marginTop: 0 }}><code>{puzzle.code}</code></pre>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Click the logs in the order you think they print:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {puzzle.tasks.map((t) => (
              <button key={t.label} className="btn btn-sm" disabled={guess.includes(t.label)} onClick={() => setGuess((g) => [...g, t.label])} style={{ fontFamily: 'var(--font-mono)' }}>{t.label}</button>
            ))}
            <button className="btn btn-sm btn-ghost" onClick={() => setGuess([])}>Clear</button>
          </div>
          <div style={{ marginTop: 10, minHeight: 34, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="faint" style={{ fontSize: 13 }}>Your guess:</span>
            {guess.map((g, i) => (
              <span key={g} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, padding: '3px 9px', borderRadius: 8, color: 'white',
                background: !checked ? 'var(--accent)' : g === answer[i] ? 'var(--ok)' : 'var(--bad)' }}>{g}</span>
            ))}
          </div>
          {checked && <p style={{ fontWeight: 700, color: right ? 'var(--ok)' : 'var(--bad)' }}>{right ? '🎉 Correct!' : `Not quite. Real order: ${answer.join(' → ')}`}</p>}
        </div>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button className="btn btn-sm btn-primary" onClick={() => setStep((s) => Math.min(answer.length - 1, s + 1))}>Step ▶</button>
            <button className="btn btn-sm" onClick={() => setStep(-1)}>Reset</button>
          </div>
          {(Object.keys(lanes) as (keyof typeof lanes)[]).filter((k) => puzzle.tasks.some((t) => t.kind === k)).map((k) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{lanes[k]}</div>
              <div style={{ display: 'flex', gap: 6, minHeight: 32, padding: 6, borderRadius: 10, background: 'var(--panel-2)', border: '1px dashed var(--border-2)' }}>
                {puzzle.tasks.filter((t) => t.kind === k && !shownOut.includes(t.label)).map((t) => (
                  <span key={t.label} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '3px 8px', borderRadius: 7, background: 'color-mix(in oklab, var(--accent) 18%, var(--panel))' }}>{t.label}</span>
                ))}
              </div>
            </div>
          ))}
          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: '10px 0 4px' }}>Console</div>
          <div style={{ background: 'var(--code-bg)', color: '#c3e88d', borderRadius: 12, padding: 12, minHeight: 90, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {shownOut.map((l) => <div key={l}>&gt; {l} <span style={{ color: "#6b7699" }}>{"// "}{kindOf(l)}</span></div>)}
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Rule: run all sync code → drain nextTick (Node) → drain <b>all</b> microtasks → run <b>one</b> macrotask → repeat.</p>
        </div>
      </div>
    </div>
  );
}

/* ============ HTTP status explorer ============ */
const CASES = [
  { s: 'A new user was created by POST /users', a: 201 }, { s: 'DELETE succeeded, nothing to return', a: 204 },
  { s: 'Request has no or an invalid token', a: 401 }, { s: 'Logged in, but not allowed (not an admin)', a: 403 },
  { s: 'GET /users/999 — no such user', a: 404 }, { s: 'Body fails validation (email missing)', a: 422 },
  { s: 'Email already registered (unique conflict)', a: 409 }, { s: 'Client sent too many requests', a: 429 },
  { s: 'Unhandled exception on the server', a: 500 }, { s: 'Upstream service is down (bad gateway)', a: 502 },
  { s: 'Resource moved permanently to a new URL', a: 301 }, { s: 'Cached copy is still fresh (ETag matched)', a: 304 },
  { s: 'Malformed JSON in the request', a: 400 }, { s: 'Everything fine, here is the data', a: 200 }, { s: 'Server overloaded / in maintenance', a: 503 },
];
const CODES = [200, 201, 204, 301, 304, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503];

export function StatusLab() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const c = CASES[i % CASES.length];
  const choose = (code: number) => {
    if (pick !== null) return;
    setPick(code);
    setScore((s) => ({ ok: s.ok + (code === c.a ? 1 : 0), n: s.n + 1 }));
  };
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{c.s}</h3>
        <span className="badge">Score {score.ok}/{score.n}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6, margin: '14px 0' }}>
        {CODES.map((code) => {
          const st = pick === null ? '' : code === c.a ? 'var(--ok)' : code === pick ? 'var(--bad)' : '';
          return (
            <button key={code} onClick={() => choose(code)} className="btn btn-sm" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, background: st || undefined, color: st ? 'white' : undefined, borderColor: st || undefined }}>{code}</button>
          );
        })}
      </div>
      {pick !== null && <button className="btn btn-primary btn-sm" onClick={() => { setI((x) => x + 1); setPick(null); }}>Next situation →</button>}
      <p className="faint" style={{ fontSize: 12.5, marginBottom: 0 }}>2xx success · 3xx redirect/cache · 4xx the client did something wrong · 5xx the server failed.</p>
    </div>
  );
}

/* ============ C#: predict the output ============ */
export function PredictLab({ items }: { items: { id: string; title: string; code: string; out: string }[] }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [guess, setGuess] = useState('');
  if (!items.length) return <div className="panel muted" style={{ padding: 20 }}>No programs found.</div>;
  const it = items[i];
  const go = (d: number) => { setI((x) => (x + d + items.length) % items.length); setShow(false); setGuess(''); };
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="btn btn-sm" onClick={() => go(-1)}>◀</button>
        <select className="input" value={i} onChange={(e) => { setI(+e.target.value); setShow(false); setGuess(''); }} style={{ flex: '1 1 220px', width: 'auto', padding: '6px 10px' }}>
          {items.map((x, k) => <option key={x.id} value={k}>{x.title}</option>)}
        </select>
        <button className="btn btn-sm" onClick={() => go(1)}>▶</button>
        <button className="btn btn-sm btn-ghost" onClick={() => { setI(Math.floor(Math.random() * items.length)); setShow(false); setGuess(''); }}>🎲 Random</button>
      </div>
      <div style={{ display: 'grid', gap: 14 }} className="lg:grid-cols-[1.3fr_1fr]">
        <div className="prose-x" style={{ maxHeight: 480, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: it.code }} />
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>What will it print? Type your guess (optional), then reveal.</div>
          <textarea className="input" rows={6} value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Hello, World!…" />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setShow(true)}>Reveal output</button>
          {show && <div className="prose-x sec-body" dangerouslySetInnerHTML={{ __html: it.out }} />}
        </div>
      </div>
    </div>
  );
}
