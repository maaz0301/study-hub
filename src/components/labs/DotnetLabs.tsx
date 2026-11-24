'use client';
import { useMemo, useRef, useState } from 'react';

/* ============ Middleware pipeline ============ */
type Mw = { id: string; name: string; code: string; on: boolean; note: string; shortCircuit?: (path: string, auth: boolean) => string | null };

const START: Mw[] = [
  { id: 'ex', name: 'ExceptionHandler', code: 'app.UseExceptionHandler("/error");', on: true, note: 'Wraps everything after it in try/catch and turns crashes into a 500 ProblemDetails.' },
  { id: 'https', name: 'HttpsRedirection', code: 'app.UseHttpsRedirection();', on: true, note: 'Redirects http:// to https:// (307).' },
  { id: 'static', name: 'StaticFiles', code: 'app.UseStaticFiles();', on: true, note: 'Serves files from wwwroot and short-circuits: the rest never runs.', shortCircuit: (p) => (/\.(css|js|png|ico)$/.test(p) ? '200 OK (file from wwwroot)' : null) },
  { id: 'routing', name: 'Routing', code: 'app.UseRouting();', on: true, note: 'Matches the URL to an endpoint so later middleware know which one it is.' },
  { id: 'authn', name: 'Authentication', code: 'app.UseAuthentication();', on: true, note: 'Reads the cookie / JWT and sets HttpContext.User. It does not reject anyone.' },
  { id: 'authz', name: 'Authorization', code: 'app.UseAuthorization();', on: true, note: 'Checks [Authorize] / policies on the matched endpoint. Rejects with 401/403.', shortCircuit: (p, auth) => (p.startsWith('/admin') && !auth ? '401 Unauthorized' : null) },
  { id: 'timing', name: 'Custom timing', code: 'app.Use(async (ctx, next) => { var sw = Stopwatch.StartNew(); await next(); log(sw); });', on: true, note: 'Your own middleware: code before next() runs on the way in, code after it on the way out.' },
];

const ENDPOINTS: Record<string, string> = {
  '/api/products': '200 OK  [{"id":1,"name":"Pen"}]',
  '/admin/users': '200 OK  [{"id":7,"role":"admin"}]',
  '/site.css': '(should be served by StaticFiles)',
  '/boom': '💥 throws InvalidOperationException',
};

export function MiddlewareLab() {
  const [mws, setMws] = useState(START);
  const [path, setPath] = useState('/api/products');
  const [auth, setAuth] = useState(false);
  const [trace, setTrace] = useState<{ t: string; kind: 'in' | 'out' | 'end' | 'err' }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const drag = useRef<number | null>(null);

  const move = (from: number, to: number) => setMws((m) => {
    const n = [...m];
    const [x] = n.splice(from, 1);
    n.splice(to, 0, x);
    return n;
  });

  const run = async () => {
    setRunning(true);
    setTrace([]);
    const on = mws.filter((m) => m.on);
    const out: typeof trace = [];
    const push = async (t: string, kind: (typeof trace)[0]['kind'], id: string | null) => {
      out.push({ t, kind });
      setTrace([...out]);
      setActive(id);
      await new Promise((r) => setTimeout(r, 380));
    };
    const routed = on.findIndex((m) => m.id === 'routing');
    const hasEx = on.findIndex((m) => m.id === 'ex');
    let depth = 0;
    let result: string | null = null;
    let threw = false;
    for (; depth < on.length; depth++) {
      const m = on[depth];
      await push(`→ ${m.name}`, 'in', m.id);
      if (m.id === 'authz' && routed === -1) { result = '500: UseAuthorization needs UseRouting before it'; threw = true; break; }
      if (m.id === 'authz' && on.findIndex((x) => x.id === 'authn') > depth && path.startsWith('/admin')) {
        result = '401 Unauthorized (Authentication runs AFTER Authorization, so the user is unknown)';
        break;
      }
      const sc = m.shortCircuit?.(path, auth);
      if (sc) { result = sc; break; }
    }
    if (!result) {
      if (path === '/site.css') result = '404 Not Found (StaticFiles is off or after the endpoint)';
      else if (path === '/boom') { threw = true; result = 'Unhandled exception'; }
      else result = ENDPOINTS[path];
      await push(`⚙ Endpoint: ${result}`, threw ? 'err' : 'end', 'endpoint');
      depth = on.length - 1;
    } else await push(`⛔ short-circuit at ${on[depth].name}: ${result}`, threw ? 'err' : 'end', on[depth].id);
    for (let k = depth; k >= 0; k--) {
      const m = on[k];
      if (threw && m.id === 'ex') { await push(`← ExceptionHandler caught it → 500 ProblemDetails`, 'out', m.id); threw = false; continue; }
      await push(`← ${m.name}${m.id === 'timing' ? ' (logs: took 12 ms)' : ''}`, threw ? 'err' : 'out', m.id);
    }
    if (threw && hasEx === -1) await push('💀 Nobody caught the exception: the server returns a bare 500 / dev error page', 'err', null);
    setActive(null);
    setRunning(false);
  };

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gap: 18 }} className="lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>Drag to reorder · click a toggle to remove a middleware</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {mws.map((m, i) => (
              <div key={m.id} draggable onDragStart={() => (drag.current = i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag.current !== null) move(drag.current, i); drag.current = null; }}
                title={m.note}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'grab',
                  border: `1.5px solid ${active === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: active === m.id ? 'color-mix(in oklab, var(--accent) 14%, var(--panel))' : 'var(--panel-2)', opacity: m.on ? 1 : 0.45, transition: 'all .2s' }}>
                <span className="faint">⋮⋮</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 650, fontSize: 14 }}>{i + 1}. {m.name}</div>
                  <code style={{ fontSize: 11.5 }} className="muted">{m.code.length > 60 ? m.code.slice(0, 58) + '…' : m.code}</code>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">↑</button>
                  <button className="btn btn-ghost btn-sm" disabled={i === mws.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">↓</button>
                </div>
                <input type="checkbox" checked={m.on} onChange={() => setMws((x) => x.map((y) => (y.id === m.id ? { ...y, on: !y.on } : y)))} aria-label={`Enable ${m.name}`} />
              </div>
            ))}
            <div style={{ padding: '8px 10px', borderRadius: 12, border: `1.5px dashed ${active === 'endpoint' ? 'var(--accent)' : 'var(--border-2)'}`, fontWeight: 650, fontSize: 14 }}>
              ⚙ app.MapGet / Controllers (endpoint)
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <select className="input" value={path} onChange={(e) => setPath(e.target.value)} style={{ flex: '1 1 160px', width: 'auto' }}>
              {Object.keys(ENDPOINTS).map((p) => <option key={p}>{p}</option>)}
            </select>
            <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={auth} onChange={(e) => setAuth(e.target.checked)} /> logged in</label>
            <button className="btn btn-primary" onClick={run} disabled={running}>▶ Send GET</button>
          </div>
          <div style={{ background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 14, padding: 14, minHeight: 260, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7 }}>
            {!trace.length && <span style={{ color: '#7b86a8' }}>Pick a URL and press Send. Try: move Authentication below Authorization and request /admin/users. Or turn off ExceptionHandler and hit /boom.</span>}
            {trace.map((t, k) => (
              <div key={k} style={{ color: t.kind === 'in' ? '#82aaff' : t.kind === 'out' ? '#c3e88d' : t.kind === 'err' ? '#ff7a85' : '#ffcb6b', paddingLeft: t.kind === 'end' ? 0 : 0 }}>{t.t}</div>
            ))}
          </div>
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={() => setMws(START)}>Reset order</button>
        </div>
      </div>
    </div>
  );
}

/* ============ DI lifetimes ============ */
export function DiLab() {
  const [life, setLife] = useState<Record<string, 'Singleton' | 'Scoped' | 'Transient'>>({ IClock: 'Singleton', ShopDb: 'Scoped', IEmailSender: 'Transient', CartService: 'Scoped' });
  const services = Object.keys(life);
  const result = useMemo(() => {
    let counter = 0;
    const singletons: Record<string, string> = {};
    const reqs = [1, 2].map((r) => {
      const scoped: Record<string, string> = {};
      const resolves = [`Controller`, `CartService`].map((consumer) => ({
        consumer,
        got: services.filter((s) => s !== consumer).map((s) => {
          let id: string;
          if (life[s] === 'Singleton') id = singletons[s] ||= `${s}#${++counter}`;
          else if (life[s] === 'Scoped') id = scoped[s] ||= `${s}#${++counter}`;
          else id = `${s}#${++counter}`;
          return { s, id };
        }),
      }));
      return { r, resolves };
    });
    const captive = services.filter((s) => life[s] === 'Singleton').flatMap((s) => (s === 'CartService' ? services.filter((d) => d !== s && life[d] === 'Scoped') : []));
    return { reqs, captive };
  }, [life]); // eslint-disable-line react-hooks/exhaustive-deps

  const color = (id: string) => `hsl(${(parseInt(id.split('#')[1]) * 67) % 360} 70% 50%)`;

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div className="code-block" data-lang="csharp" style={{ marginTop: 0 }}>
        <code>{services.map((s) => `builder.Services.Add${life[s]}<${s}>();`).join('\n')}</code>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        {services.map((s) => (
          <div key={s}>
            <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 4 }}>{s}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['Singleton', 'Scoped', 'Transient'] as const).map((l) => (
                <button key={l} className={`chip ${life[s] === l ? 'on' : ''}`} onClick={() => setLife((x) => ({ ...x, [s]: l }))}>{l}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12 }} className="md:grid-cols-2">
        {result.reqs.map((r) => (
          <div key={r.r} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 12, background: 'var(--panel-2)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>HTTP request {r.r} <span className="faint" style={{ fontWeight: 500, fontSize: 12 }}>(one DI scope)</span></div>
            {r.resolves.map((x) => (
              <div key={x.consumer} style={{ marginBottom: 8 }}>
                <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>{x.consumer} asks for:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {x.got.map((g) => (
                    <span key={g.s} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 8, color: 'white', background: color(g.id) }}>{g.id}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 0 }}>
        Same colour and number = same object. <b>Singleton</b>: one for the whole app. <b>Scoped</b>: one per request, shared inside it. <b>Transient</b>: new every time.
      </p>
      {result.captive.length > 0 && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'color-mix(in oklab, var(--bad) 10%, var(--panel))', border: '1px solid color-mix(in oklab, var(--bad) 40%, var(--border))', fontSize: 14 }}>
          ⚠️ <b>Captive dependency:</b> CartService is a Singleton but depends on scoped {result.captive.join(', ')}. That scoped object would be captured forever and shared by every request. ASP.NET Core throws in Development: <i>“Cannot consume scoped service from singleton.”</i>
        </div>
      )}
    </div>
  );
}

/* ============ LINQ lab ============ */
type P = { Name: string; Category: string; Price: number; Stock: number };
const PRODUCTS: P[] = [
  { Name: 'Pen', Category: 'Office', Price: 2.5, Stock: 120 }, { Name: 'Notebook', Category: 'Office', Price: 6, Stock: 40 },
  { Name: 'Desk Lamp', Category: 'Home', Price: 32, Stock: 8 }, { Name: 'Mug', Category: 'Home', Price: 9, Stock: 0 },
  { Name: 'Headphones', Category: 'Tech', Price: 79, Stock: 15 }, { Name: 'USB-C Cable', Category: 'Tech', Price: 12, Stock: 200 },
  { Name: 'Keyboard', Category: 'Tech', Price: 49, Stock: 5 }, { Name: 'Stapler', Category: 'Office', Price: 14, Stock: 22 },
];
type Op = { op: string; arg: string };
const OPS: Record<string, { args: string[]; cs: (a: string) => string; run: (d: any[], a: string) => any[] | any }> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  Where: { args: ['p.Price < 20', 'p.Stock > 0', 'p.Category == "Tech"'], cs: (a) => `.Where(p => ${a})`,
    run: (d, a) => d.filter((p) => (a.includes('Price') ? p.Price < 20 : a.includes('Stock') ? p.Stock > 0 : p.Category === 'Tech')) },
  OrderBy: { args: ['p.Price', 'p.Name'], cs: (a) => `.OrderBy(p => ${a})`, run: (d, a) => [...d].sort((x, y) => (a.includes('Price') ? x.Price - y.Price : String(x.Name).localeCompare(y.Name))) },
  OrderByDescending: { args: ['p.Price', 'p.Stock'], cs: (a) => `.OrderByDescending(p => ${a})`, run: (d, a) => [...d].sort((x, y) => (a.includes('Price') ? y.Price - x.Price : y.Stock - x.Stock)) },
  Select: { args: ['new { p.Name, p.Price }', 'p.Name.ToUpper()'], cs: (a) => `.Select(p => ${a})`, run: (d, a) => d.map((p) => (a.startsWith('new') ? { Name: p.Name, Price: p.Price } : String(p.Name ?? p).toUpperCase())) },
  GroupBy: { args: ['p.Category'], cs: () => `.GroupBy(p => p.Category)\n    .Select(g => new { Category = g.Key, Count = g.Count(), Avg = g.Average(p => p.Price) })`,
    run: (d) => Object.entries(d.reduce((m: Record<string, P[]>, p: P) => ((m[p.Category] ||= []).push(p), m), {})).map(([k, v]) => ({ Category: k, Count: (v as P[]).length, Avg: +((v as P[]).reduce((s, p) => s + p.Price, 0) / (v as P[]).length).toFixed(2) })) },
  Take: { args: ['3', '1'], cs: (a) => `.Take(${a})`, run: (d, a) => d.slice(0, Number(a)) },
  Skip: { args: ['2'], cs: (a) => `.Skip(${a})`, run: (d, a) => d.slice(Number(a)) },
  Count: { args: [''], cs: () => `.Count()`, run: (d) => d.length },
  Sum: { args: ['p.Price'], cs: () => `.Sum(p => p.Price)`, run: (d) => +d.reduce((s: number, p: P) => s + (p.Price || 0), 0).toFixed(2) },
  Any: { args: ['p.Stock == 0'], cs: () => `.Any(p => p.Stock == 0)`, run: (d) => d.some((p: P) => p.Stock === 0) },
  First: { args: [''], cs: () => `.First()`, run: (d) => { if (!d.length) throw new Error('InvalidOperationException: Sequence contains no elements'); return d[0]; } },
  FirstOrDefault: { args: [''], cs: () => `.FirstOrDefault()`, run: (d) => d[0] ?? null },
};

export function LinqLab() {
  const [chain, setChain] = useState<Op[]>([{ op: 'Where', arg: 'p.Stock > 0' }, { op: 'OrderBy', arg: 'p.Price' }, { op: 'Select', arg: 'new { p.Name, p.Price }' }]);
  const steps = useMemo(() => {
    let cur: any = PRODUCTS; // eslint-disable-line @typescript-eslint/no-explicit-any
    const out: { op: Op; value: unknown; error?: string }[] = [];
    for (const o of chain) {
      if (!Array.isArray(cur)) { out.push({ op: o, value: null, error: 'Previous step returned a single value, not a sequence.' }); break; }
      try { cur = OPS[o.op].run(cur, o.arg); out.push({ op: o, value: cur }); } catch (e) { out.push({ op: o, value: null, error: (e as Error).message }); break; }
    }
    return out;
  }, [chain]);
  const final = steps.at(-1);
  const cs = `var result = products${chain.map((o) => '\n    ' + OPS[o.op].cs(o.arg)).join('')};`;

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <span className="faint" style={{ fontSize: 13, alignSelf: 'center' }}>Add:</span>
        {Object.keys(OPS).map((k) => <button key={k} className="chip" onClick={() => setChain((c) => [...c, { op: k, arg: OPS[k].args[0] }])}>+ {k}</button>)}
        <button className="btn btn-sm btn-ghost" onClick={() => setChain([])}>Clear</button>
      </div>
      <div style={{ display: 'grid', gap: 14 }} className="lg:grid-cols-2">
        <div>
          <div style={{ display: 'grid', gap: 6 }}>
            {chain.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
                <b style={{ fontSize: 13.5, minWidth: 120 }}>.{o.op}</b>
                {OPS[o.op].args.length > 1 ? (
                  <select className="input" style={{ padding: '4px 8px', fontSize: 13 }} value={o.arg} onChange={(e) => setChain((c) => c.map((x, k) => (k === i ? { ...x, arg: e.target.value } : x)))}>
                    {OPS[o.op].args.map((a) => <option key={a}>{a}</option>)}
                  </select>
                ) : <code className="muted" style={{ fontSize: 12.5, flex: 1 }}>{o.arg}</code>}
                <span className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{Array.isArray(steps[i]?.value) ? `${(steps[i].value as unknown[]).length} items` : steps[i]?.error ? '⚠' : '1 value'}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setChain((c) => c.filter((_, k) => k !== i))} aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
          <pre className="code-block" data-lang="csharp"><code>{cs}</code></pre>
        </div>
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Result</div>
          <pre className="code-block out" data-lang="output" style={{ marginTop: 0, maxHeight: 380 }}><code>{final?.error ? `❌ ${final.error}` : JSON.stringify(final ? final.value : PRODUCTS, null, 2)}</code></pre>
        </div>
      </div>
    </div>
  );
}
