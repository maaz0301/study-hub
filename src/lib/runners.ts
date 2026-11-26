/* eslint-disable @typescript-eslint/no-explicit-any */
// "Try it Yourself" runners: everything executes in the visitor's browser.
//   js     → a sandboxed iframe (console.log is captured)
//   sql    → a real PostgreSQL (PGlite, WebAssembly) with the shop sample database, reset on every run
//   mongo  → mingo with writable sample collections (customers, orders, products)
//   redis  → the tiny in-browser Redis used by the Redis console lab
//   react  → an iframe with React + Babel from a CDN (rendered, not text)

export type RunKind = 'js' | 'react' | 'sql' | 'mongo' | 'redis';
export const KIND_LABEL: Record<RunKind, string> = { js: 'JavaScript', react: 'React', sql: 'PostgreSQL', mongo: 'MongoDB', redis: 'Redis' };

const cut = (s: string, n = 12000) => (s.length > n ? s.slice(0, n) + '\n… (output cut)' : s);

/* ------------------------------ JavaScript ------------------------------ */
const esc = (code: string) => code.replace(/<\/script/gi, '<\\/script');

export function runJs(code: string): Promise<string> {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).slice(2);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    const logs: string[] = [];
    let finished = false;
    const finish = (extra?: string) => {
      if (finished) return;
      finished = true;
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
      iframe.remove();
      if (extra) logs.push(extra);
      resolve(cut(logs.join('\n') || '(no output: use console.log to print something)'));
    };
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow || !e.data || e.data.id !== id) return;
      if (e.data.type === 'log') logs.push(e.data.text);
      else if (e.data.type === 'error') finish('❌ ' + e.data.text);
      else if (e.data.type === 'done') finish();
    };
    const timer = setTimeout(() => finish('⏱ Stopped after 4 seconds (infinite loop?)'), 4000);
    window.addEventListener('message', onMsg);
    iframe.srcdoc = `<script>
const __id = ${JSON.stringify(id)};
const __post = (type, text) => parent.postMessage({ id: __id, type, text }, '*');
const __fmt = (a) => a.map((v) => { if (typeof v === 'string') return v; if (typeof v === 'function') return String(v); try { return JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x + 'n' : x instanceof Map ? Object.fromEntries(x) : x instanceof Set ? [...x] : x), 2) ?? String(v); } catch (e) { return String(v); } }).join(' ');
console.log = (...a) => __post('log', __fmt(a));
console.info = console.log; console.debug = console.log;
console.error = (...a) => __post('log', '⚠ ' + __fmt(a));
console.warn = console.error;
console.table = (d) => __post('log', __fmt([d]));
window.addEventListener('unhandledrejection', (e) => __post('error', String(e.reason && e.reason.stack || e.reason)));
window.addEventListener('error', (e) => __post('error', String(e.message)));
let __pending = 0;
const __st = window.setTimeout.bind(window);
window.setTimeout = (fn, ms, ...args) => { __pending++; return __st(() => { try { typeof fn === 'function' && fn(...args); } finally { __pending--; } }, ms); };
(async () => {
  try {
${esc(code)}
  } catch (e) { __post('error', String((e && e.stack) || e)); }
  // finish once no timers are waiting (the 4 s outer limit still applies)
  const __poll = () => (__pending > 0 ? __st(__poll, 30) : __post('done', ''));
  __st(__poll, 30);
})();
<\/script>`;
    document.body.appendChild(iframe);
  });
}

/* -------------------------------- React -------------------------------- */
export function reactDoc(code: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,sans-serif;margin:14px;color:#111;background:#fff}
button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid #bbb;background:#f3f4f6;cursor:pointer}
button:hover{background:#e5e7eb} input{font:inherit;padding:6px 8px;border:1px solid #bbb;border-radius:8px}
#err{color:#b91c1c;white-space:pre-wrap;font-family:monospace;font-size:13px}
</style></head><body><div id="root"></div><pre id="err"></pre>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7.26.4/babel.min.js"><\/script>
<script>window.addEventListener('error', function (e) { document.getElementById('err').textContent = e.message; });<\/script>
<script type="text/babel" data-presets="react">
const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
${esc(code)}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
<\/script></body></html>`;
}

/* ------------------------------- PostgreSQL ------------------------------- */
let pgPromise: Promise<any> | null = null;
async function getPg() {
  if (!pgPromise) {
    pgPromise = (async () => {
      const local = '/pglite/index.js';
      const cdn = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.6.0/dist/index.js';
      let mod: any;
      try { mod = await import(/* webpackIgnore: true */ local); } catch { mod = await import(/* webpackIgnore: true */ cdn); }
      return mod.PGlite.create();
    })();
  }
  return pgPromise;
}

function table(fields: string[], rows: any[][]): string {
  const cell = (v: any) => (v === null || v === undefined ? 'NULL' : v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'object' ? JSON.stringify(v) : String(v));
  const data = rows.map((r) => r.map(cell));
  const w = fields.map((f, i) => Math.min(48, Math.max(f.length, ...data.map((r) => r[i].length))));
  const pad = (s: string, i: number) => (s.length > w[i] ? s.slice(0, w[i] - 1) + '…' : s.padEnd(w[i]));
  const head = fields.map((f, i) => ' ' + pad(f, i) + ' ').join('|');
  const line = w.map((x) => '-'.repeat(x + 2)).join('+');
  const body = data.map((r) => r.map((c, i) => ' ' + pad(c, i) + ' ').join('|')).join('\n');
  return `${head}\n${line}\n${body}${body ? '\n' : ''}(${rows.length} row${rows.length === 1 ? '' : 's'})`;
}

export async function runSql(code: string): Promise<string> {
  const [{ SEED }, pg] = await Promise.all([import('./sqlSeed'), getPg()]);
  try {
    await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');   // every run starts from the same shop database
    await pg.exec(SEED);
    const res: any[] = await pg.exec(code);
    const parts = res.filter((r) => r.fields?.length || r.affectedRows).map((r) =>
      r.fields.length ? table(r.fields.map((f: any) => f.name), r.rows.map((row: any) => r.fields.map((f: any) => row[f.name]))) : `${r.affectedRows} row(s) affected`);
    return cut(parts.join('\n\n') || 'OK (no rows returned)');
  } catch (e) {
    return '❌ ERROR: ' + (e as Error).message;
  }
}

/* -------------------------------- MongoDB -------------------------------- */
type Doc = Record<string, any>;
const oid = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

function getPath(o: Doc, p: string) { return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
function setPath(o: Doc, p: string, v: any) {
  const ks = p.split('.');
  let cur = o;
  ks.slice(0, -1).forEach((k) => { if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}; cur = cur[k]; });
  cur[ks[ks.length - 1]] = v;
}
function delPath(o: Doc, p: string) {
  const ks = p.split('.');
  let cur: any = o;
  for (const k of ks.slice(0, -1)) { cur = cur?.[k]; if (cur == null) return; }
  delete cur[ks[ks.length - 1]];
}

function applyUpdate(doc: Doc, upd: Doc, query: any) {
  for (const [op, spec] of Object.entries<any>(upd)) {
    for (const [path, val] of Object.entries<any>(spec)) {
      const cur = getPath(doc, path);
      switch (op) {
        case '$set': setPath(doc, path, val); break;
        case '$unset': delPath(doc, path); break;
        case '$inc': setPath(doc, path, Number(cur ?? 0) + Number(val)); break;
        case '$mul': setPath(doc, path, Number(cur ?? 0) * Number(val)); break;
        case '$min': if (cur === undefined || val < cur) setPath(doc, path, val); break;
        case '$max': if (cur === undefined || val > cur) setPath(doc, path, val); break;
        case '$rename': setPath(doc, val, cur); delPath(doc, path); break;
        case '$push': { const arr = Array.isArray(cur) ? cur : []; setPath(doc, path, [...arr, ...(val && typeof val === 'object' && '$each' in val ? val.$each : [val])]); break; }
        case '$addToSet': { const arr = Array.isArray(cur) ? [...cur] : []; for (const v of (val && typeof val === 'object' && '$each' in val ? val.$each : [val])) if (!arr.some((x) => JSON.stringify(x) === JSON.stringify(v))) arr.push(v); setPath(doc, path, arr); break; }
        case '$pull': { const arr: any[] = Array.isArray(cur) ? cur : []; setPath(doc, path, arr.filter((x) => (val && typeof val === 'object' && !Array.isArray(val) ? !query(val, x) : JSON.stringify(x) !== JSON.stringify(val)))); break; }
        case '$currentDate': setPath(doc, path, new Date().toISOString()); break;
        default: throw new Error(`Unsupported update operator ${op} in this playground`);
      }
    }
  }
}

function splitStatements(code: string): string[] {
  const out: string[] = [];
  let cur = '', depth = 0, str = '';
  const lines = code.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (str) { if (c === '\\') i++; else if (c === str) str = ''; continue; }
      if (c === '/' && line[i + 1] === '/') break;
      if (c === '"' || c === "'" || c === '`') str = c;
      else if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
    }
    cur += (cur ? '\n' : '') + line;
    const next = (lines.slice(li + 1).find((l) => l.trim()) || '').trim();
    if (depth <= 0 && !str && !next.startsWith('.') && cur.trim()) { out.push(cur.trim().replace(/;$/, '')); cur = ''; depth = 0; }
  }
  if (cur.trim()) out.push(cur.trim().replace(/;$/, ''));
  return out.filter((s) => !/^\/\//.test(s));
}

export async function runMongo(code: string): Promise<string> {
  const [mingo, { SAMPLE }] = await Promise.all([import('mingo'), import('@/components/labs/MongoLabs')]);
  const data: Record<string, Doc[]> = structuredClone(SAMPLE) as any;
  const test = (filter: Doc, doc: any) => new mingo.Query(filter).test(doc);

  class Cursor {
    private _s?: Doc; private _skip = 0; private _lim = 0;
    constructor(private coll: Doc[], private filter: Doc = {}, private proj?: Doc) {}
    sort(s: Doc) { this._s = s; return this; }
    skip(n: number) { this._skip = n; return this; }
    limit(n: number) { this._lim = n; return this; }
    count() { return this.toArray().length; }
    toArray() {
      let c = mingo.find(this.coll, this.filter, this.proj && Object.keys(this.proj).length ? this.proj : undefined);
      if (this._s) c = c.sort(this._s);
      if (this._skip) c = c.skip(this._skip);
      if (this._lim) c = c.limit(this._lim);
      return c.all();
    }
  }
  const lookups = (pl: Doc[]): Doc[] => pl.map((st) => (st.$lookup && typeof st.$lookup.from === 'string' ? { $lookup: { ...st.$lookup, from: data[st.$lookup.from] ?? [] } } : st.$facet ? { $facet: Object.fromEntries(Object.entries<any>(st.$facet).map(([k, v]) => [k, lookups(v)])) } : st));

  const db = new Proxy({}, {
    get(_, name: string) {
      if (typeof name !== 'string') return undefined;
      const coll = (data[name] ||= []);
      const upd = (filter: Doc, update: Doc, opts: Doc = {}, many: boolean) => {
        let matched = 0, modified = 0;
        for (const d of coll) {
          if (!test(filter, d)) continue;
          matched++;
          const before = JSON.stringify(d);
          applyUpdate(d, update, test);
          if (JSON.stringify(d) !== before) modified++;
          if (!many) break;
        }
        if (!matched && opts.upsert) { const d: Doc = { _id: oid(), ...Object.fromEntries(Object.entries(filter).filter(([k, v]) => !k.startsWith('$') && typeof v !== 'object')) }; applyUpdate(d, update, test); coll.push(d); return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: d._id }; }
        return { acknowledged: true, matchedCount: matched, modifiedCount: modified };
      };
      return {
        find: (f?: Doc, p?: Doc) => new Cursor(coll, f || {}, p),
        findOne: (f?: Doc, p?: Doc) => new Cursor(coll, f || {}, p).limit(1).toArray()[0] ?? null,
        countDocuments: (f?: Doc) => mingo.find(coll, f || {}).all().length,
        distinct: (field: string, f?: Doc) => [...new Set(mingo.find(coll, f || {}).all().map((d: Doc) => getPath(d, field)))],
        aggregate: (pl: Doc[]) => mingo.aggregate(coll, lookups(pl)),
        insertOne: (d: Doc) => { const doc = { _id: oid(), ...d }; coll.push(doc); return { acknowledged: true, insertedId: doc._id }; },
        insertMany: (ds: Doc[]) => { const ids = ds.map((d) => { const doc = { _id: oid(), ...d }; coll.push(doc); return doc._id; }); return { acknowledged: true, insertedIds: ids }; },
        updateOne: (f: Doc, u: Doc, o?: Doc) => upd(f, u, o, false),
        updateMany: (f: Doc, u: Doc, o?: Doc) => upd(f, u, o, true),
        deleteOne: (f: Doc) => { const i = coll.findIndex((d) => test(f, d)); if (i >= 0) coll.splice(i, 1); return { acknowledged: true, deletedCount: i >= 0 ? 1 : 0 }; },
        deleteMany: (f: Doc) => { const keep = coll.filter((d) => !test(f, d)); const n = coll.length - keep.length; coll.splice(0, coll.length, ...keep); return { acknowledged: true, deletedCount: n }; },
        createIndex: (spec: Doc) => Object.entries(spec).map(([k, v]) => `${k}_${v}`).join('_'),
      };
    },
  });

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const stmts = splitStatements(code);
    let result: any;
    for (let i = 0; i < stmts.length; i++) {
      const last = i === stmts.length - 1;
      result = await new AsyncFunction('db', last ? `return (${stmts[i]});` : stmts[i])(db);
    }
    if (result instanceof Cursor) result = result.toArray();
    else if (result && typeof result.all === 'function') result = result.all();
    return cut(result === undefined ? '(no result)' : JSON.stringify(result, null, 2));
  } catch (e) {
    return '❌ ' + (e as Error).message;
  }
}

/* --------------------------------- Redis --------------------------------- */
export async function runRedis(code: string): Promise<string> {
  const { MiniRedis } = await import('@/components/labs/MessagingLabs');
  const r = new MiniRedis();
  return cut(code.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => `127.0.0.1:6379> ${l}\n${r.run(l)}`).join('\n'));
}

export async function runText(kind: Exclude<RunKind, 'react'>, code: string): Promise<string> {
  if (kind === 'js') return runJs(code);
  if (kind === 'sql') return runSql(code);
  if (kind === 'mongo') return runMongo(code);
  return runRedis(code);
}
