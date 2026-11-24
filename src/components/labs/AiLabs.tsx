'use client';
import { useMemo, useRef, useState } from 'react';

/* ============ Chunking ============ */
const SAMPLE = `Refund policy. Customers can return any item within 30 days of delivery for a full refund. Items must be unused and in the original packaging. Digital products cannot be refunded once downloaded.

Shipping. Standard shipping takes 3 to 5 business days. Express shipping takes 1 to 2 business days and costs extra. We ship to all cities in Pakistan, and international orders take 7 to 14 days.

Accounts. To reset your password, click "Forgot password" on the login page and follow the email link. The link expires after 30 minutes. For security, we never ask for your password by phone or email.`;

export function ChunkLab() {
  const [text, setText] = useState(SAMPLE);
  const [size, setSize] = useState(160);
  const [overlap, setOverlap] = useState(30);
  const [mode, setMode] = useState<'chars' | 'sentences'>('chars');
  const chunks = useMemo(() => {
    const out: { start: number; end: number }[] = [];
    if (mode === 'chars') {
      const step = Math.max(1, size - overlap);
      for (let i = 0; i < text.length; i += step) { out.push({ start: i, end: Math.min(text.length, i + size) }); if (i + size >= text.length) break; }
    } else {
      const sents = [...text.matchAll(/[^.!?\n]+[.!?]?\s*/g)].map((m) => ({ s: m.index!, e: m.index! + m[0].length }));
      let i = 0;
      while (i < sents.length) {
        let j = i;
        while (j + 1 < sents.length && sents[j + 1].e - sents[i].s <= size) j++;
        out.push({ start: sents[i].s, end: sents[j].e });
        // overlap: step back one sentence if overlap > 0
        const next = overlap > 0 && j > i ? j : j + 1;
        i = next === i ? i + 1 : next;
      }
    }
    return out;
  }, [text, size, overlap, mode]);
  const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#3b82f6'];

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gap: 14 }} className="md:grid-cols-3">
        <label style={{ fontSize: 13.5 }}>Chunk size: <b>{size}</b> characters
          <input type="range" min={60} max={500} value={size} onChange={(e) => setSize(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} /></label>
        <label style={{ fontSize: 13.5 }}>Overlap: <b>{overlap}</b> characters {mode === 'sentences' && <span className="faint">(1 sentence if &gt; 0)</span>}
          <input type="range" min={0} max={Math.min(150, size - 10)} value={overlap} onChange={(e) => setOverlap(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} /></label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className={`chip ${mode === 'chars' ? 'on' : ''}`} onClick={() => setMode('chars')}>Fixed characters</button>
          <button className={`chip ${mode === 'sentences' ? 'on' : ''}`} onClick={() => setMode('sentences')}>Sentence-aware</button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 14, marginTop: 12 }} className="lg:grid-cols-2">
        <textarea className="input" rows={12} value={text} onChange={(e) => setText(e.target.value)} style={{ fontFamily: 'var(--font-sans)', fontSize: 14 }} />
        <div style={{ display: 'grid', gap: 8, maxHeight: 420, overflowY: 'auto' }} className="thin-scroll">
          {chunks.map((c, i) => {
            const prevEnd = i ? chunks[i - 1].end : 0;
            const ov = Math.max(0, prevEnd - c.start);
            const body = text.slice(c.start, c.end);
            const cut = /\w$/.test(body) && /^\w/.test(text.slice(c.end, c.end + 1));
            return (
              <div key={i} style={{ borderLeft: `4px solid ${colors[i % colors.length]}`, padding: '8px 12px', borderRadius: 10, background: 'var(--panel-2)', fontSize: 13.5, lineHeight: 1.55 }}>
                <div className="faint" style={{ fontSize: 11.5, marginBottom: 3 }}>chunk {i + 1} · {body.length} chars{ov ? ` · ${ov} overlap` : ''}{cut ? ' · ⚠ cuts a word' : ''}</div>
                {ov > 0 && <mark style={{ background: 'color-mix(in oklab, #facc15 45%, transparent)', color: 'inherit' }}>{body.slice(0, ov)}</mark>}
                {body.slice(ov)}
              </div>
            );
          })}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginBottom: 0 }}>{chunks.length} chunks. Small chunks lose context; big ones mix topics and dilute the embedding. Overlap (yellow) keeps facts that sit on a boundary. Real systems measure in tokens and split on paragraphs or sentences.</p>
    </div>
  );
}

/* ============ Cosine similarity ============ */
const WORDS = [
  { w: 'refund my order', x: 0.92, y: 0.35 }, { w: 'money back', x: 0.85, y: 0.48 }, { w: 'return policy', x: 0.78, y: 0.3 },
  { w: 'reset password', x: -0.2, y: 0.95 }, { w: 'forgot login', x: -0.32, y: 0.88 },
  { w: 'shipping time', x: 0.15, y: -0.9 }, { w: 'delivery days', x: 0.28, y: -0.85 }, { w: 'pizza recipe', x: -0.9, y: -0.35 },
];

export function CosineLab() {
  const [q, setQ] = useState({ x: 0.8, y: 0.45 });
  const svg = useRef<SVGSVGElement>(null);
  const S = 150;
  const cos = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  const ranked = WORDS.map((w) => ({ ...w, s: cos(q, w) })).sort((a, b) => b.s - a.s);
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1 || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    if (Math.hypot(x, y) > 0.08) setQ({ x, y });
  };
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gap: 18, alignItems: 'center' }} className="md:grid-cols-[320px_1fr]">
        <svg ref={svg} viewBox={`${-S} ${-S} ${2 * S} ${2 * S}`} style={{ width: '100%', maxWidth: 320, touchAction: 'none', cursor: 'crosshair', background: 'var(--panel-2)', borderRadius: 16, border: '1px solid var(--border)' }}
          onPointerDown={onMove} onPointerMove={onMove}>
          <line x1={-S} y1={0} x2={S} y2={0} stroke="var(--border-2)" /><line x1={0} y1={-S} x2={0} y2={S} stroke="var(--border-2)" />
          {WORDS.map((w) => {
            const s = cos(q, w);
            return (
              <g key={w.w}>
                <line x1={0} y1={0} x2={w.x * S * 0.9} y2={-w.y * S * 0.9} stroke={`hsl(${(s + 1) * 60} 70% 50%)`} strokeWidth={1 + Math.max(0, s) * 2.5} opacity={0.5 + Math.max(0, s) / 2} />
                <circle cx={w.x * S * 0.9} cy={-w.y * S * 0.9} r={4} fill={`hsl(${(s + 1) * 60} 70% 50%)`} />
                <text x={w.x * S * 0.9 + 6} y={-w.y * S * 0.9 + 4} fontSize="10" fill="var(--text)">{w.w}</text>
              </g>
            );
          })}
          <line x1={0} y1={0} x2={q.x * S * 0.9} y2={-q.y * S * 0.9} stroke="var(--accent)" strokeWidth={3.5} />
          <circle cx={q.x * S * 0.9} cy={-q.y * S * 0.9} r={8} fill="var(--accent)" stroke="white" strokeWidth={2} />
          <text x={q.x * S * 0.9 + 10} y={-q.y * S * 0.9 - 8} fontSize="11" fontWeight={700} fill="var(--accent)">your query</text>
        </svg>
        <div>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Drag on the map to move <b style={{ color: 'var(--accent)' }}>your query</b>. Cosine similarity = the angle between arrows (length ignored). The top results are what a vector database returns for k = 3.</p>
          <div style={{ display: 'grid', gap: 5 }}>
            {ranked.map((w, i) => (
              <div key={w.w} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 54px', gap: 10, alignItems: 'center', fontSize: 13.5, fontWeight: i < 3 ? 700 : 400 }}>
                <span>{i < 3 ? '⭐ ' : ''}{w.w}</span>
                <div className="progress" style={{ height: 8 }}><i style={{ width: `${((w.s + 1) / 2) * 100}%`, background: `hsl(${(w.s + 1) * 60} 70% 50%)` }} /></div>
                <span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{w.s.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <pre className="code-block" data-lang="javascript"><code>{`const cosine = (a, b) =>\n  dot(a, b) / (norm(a) * norm(b));   // -1 … 1, higher = closer`}</code></pre>
        </div>
      </div>
    </div>
  );
}

/* ============ FastAPI request lifecycle ============ */
const STAGES = [
  { k: 'ASGI server', d: 'Uvicorn/Hypercorn receives the HTTP request and hands an ASGI scope to Starlette.', code: 'uvicorn main:app --workers 4' },
  { k: 'Middleware', d: 'CORS, GZip, timing, auth headers… wraps the whole call (before and after).', code: '@app.middleware("http")\nasync def timing(request, call_next):\n    start = time.perf_counter()\n    response = await call_next(request)\n    response.headers["X-Time"] = str(time.perf_counter() - start)\n    return response' },
  { k: 'Routing', d: 'The path and method are matched to a path operation function.', code: '@app.post("/items/{item_id}")' },
  { k: 'Dependencies', d: 'Depends() run first: DB session, current user, settings. They can be cached per request and use yield for cleanup.', code: 'async def get_db():\n    async with SessionLocal() as db:\n        yield db          # cleanup after the response\n\nasync def current_user(token: str = Depends(oauth2)): ...' },
  { k: 'Validation', d: 'Path, query and body are parsed and validated by Pydantic. Bad input → automatic 422 with details, your code never runs.', code: 'class Item(BaseModel):\n    name: str = Field(min_length=1)\n    price: float = Field(gt=0)' },
  { k: 'Your handler', d: 'async def runs on the event loop (await I/O!). Plain def runs in a thread pool so blocking code does not freeze the loop.', code: 'async def update(item_id: int, item: Item,\n                 db=Depends(get_db), user=Depends(current_user)):\n    return await repo.save(db, item_id, item)' },
  { k: 'Response model', d: 'The return value is filtered/serialized through response_model (hide password fields), then JSON-encoded.', code: '@app.post("/items/{item_id}", response_model=ItemOut, status_code=201)' },
  { k: 'Background tasks', d: 'BackgroundTasks run after the response is sent (emails, logs). For heavy work use Celery/RQ/Arq.', code: 'background.add_task(send_email, user.email)' },
];

export function LifecycleLab() {
  const [i, setI] = useState(0);
  const [bad, setBad] = useState(false);
  const stopAt = bad ? 4 : STAGES.length - 1;
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <button className="btn btn-sm" onClick={() => setI((x) => Math.max(0, x - 1))}>◀ Prev</button>
        <button className="btn btn-primary btn-sm" onClick={() => setI((x) => Math.min(stopAt, x + 1))}>Next ▶</button>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={bad} onChange={(e) => { setBad(e.target.checked); setI(0); }} /> send invalid body (price = -5)</label>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {STAGES.map((s, k) => (
          <button key={s.k} onClick={() => setI(Math.min(k, stopAt))}
            style={{ flex: '1 1 110px', padding: '8px 6px', borderRadius: 10, fontSize: 12.5, fontWeight: 650, cursor: 'pointer', color: k === i ? 'white' : 'var(--text)',
              border: '1px solid var(--border)', background: k === i ? (bad && k === 4 ? 'var(--bad)' : 'var(--accent)') : k < i ? 'color-mix(in oklab, var(--accent) 15%, var(--panel))' : 'var(--panel-2)', opacity: k > stopAt ? 0.35 : 1 }}>
            {k + 1}. {s.k}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 14 }} className="md:grid-cols-2">
        <div>
          <h3 style={{ margin: '0 0 6px' }}>{STAGES[i].k}</h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{STAGES[i].d}</p>
          {bad && i === 4 && (
            <pre className="code-block" data-lang="response 422" style={{ color: '#ff9aa2' }}><code>{`{\n  "detail": [{\n    "type": "greater_than",\n    "loc": ["body", "price"],\n    "msg": "Input should be greater than 0",\n    "input": -5\n  }]\n}`}</code></pre>
          )}
        </div>
        <pre className="code-block" data-lang="python" style={{ margin: 0 }}><code>{STAGES[i].code}</code></pre>
      </div>
    </div>
  );
}
