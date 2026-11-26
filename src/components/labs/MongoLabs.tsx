'use client';
import { aggregate, find } from 'mingo';
import { useMemo, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

const customers: Doc[] = [
  { _id: 1, name: 'Ayesha Khan', city: 'Lahore', age: 29, tags: ['vip', 'newsletter'], joined: '2024-02-11' },
  { _id: 2, name: 'Bilal Ahmed', city: 'Karachi', age: 35, tags: ['newsletter'], joined: '2023-11-03' },
  { _id: 3, name: 'Sara Malik', city: 'Islamabad', age: 24, tags: [], joined: '2025-01-20' },
  { _id: 4, name: 'Omar Farooq', city: 'Lahore', age: 41, tags: ['vip'], joined: '2022-06-15' },
  { _id: 5, name: 'Hina Raza', city: 'Karachi', age: 31, tags: ['wholesale'], joined: '2024-08-30' },
  { _id: 6, name: 'Usman Tariq', city: 'Peshawar', age: 27, tags: ['newsletter', 'wholesale'], joined: '2025-03-02' },
];
const products: Doc[] = [
  { _id: 'PEN', name: 'Gel Pen', category: 'office', price: 2.5, stock: 120, specs: { color: 'blue' } },
  { _id: 'NBK', name: 'Notebook', category: 'office', price: 6, stock: 40 },
  { _id: 'LMP', name: 'Desk Lamp', category: 'home', price: 32, stock: 8, specs: { watts: 9 } },
  { _id: 'MUG', name: 'Mug', category: 'home', price: 9, stock: 0 },
  { _id: 'HPH', name: 'Headphones', category: 'tech', price: 79, stock: 15, specs: { wireless: true } },
  { _id: 'USB', name: 'USB-C Cable', category: 'tech', price: 12, stock: 200 },
  { _id: 'KBD', name: 'Keyboard', category: 'tech', price: 49, stock: 5, specs: { wireless: false } },
];
const orders: Doc[] = [
  { _id: 101, customerId: 1, status: 'paid', date: '2025-05-01', items: [{ sku: 'PEN', qty: 10, price: 2.5 }, { sku: 'NBK', qty: 3, price: 6 }] },
  { _id: 102, customerId: 2, status: 'paid', date: '2025-05-03', items: [{ sku: 'HPH', qty: 1, price: 79 }] },
  { _id: 103, customerId: 1, status: 'shipped', date: '2025-05-07', items: [{ sku: 'LMP', qty: 2, price: 32 }] },
  { _id: 104, customerId: 3, status: 'pending', date: '2025-05-08', items: [{ sku: 'USB', qty: 4, price: 12 }, { sku: 'PEN', qty: 2, price: 2.5 }] },
  { _id: 105, customerId: 4, status: 'paid', date: '2025-05-10', items: [{ sku: 'KBD', qty: 1, price: 49 }, { sku: 'HPH', qty: 1, price: 79 }] },
  { _id: 106, customerId: 5, status: 'cancelled', date: '2025-05-11', items: [{ sku: 'MUG', qty: 6, price: 9 }] },
  { _id: 107, customerId: 2, status: 'paid', date: '2025-05-14', items: [{ sku: 'USB', qty: 10, price: 12 }] },
  { _id: 108, customerId: 6, status: 'paid', date: '2025-05-15', items: [{ sku: 'NBK', qty: 20, price: 6 }, { sku: 'PEN', qty: 50, price: 2.5 }] },
  { _id: 109, customerId: 4, status: 'shipped', date: '2025-05-18', items: [{ sku: 'LMP', qty: 1, price: 32 }] },
];
const DB: Record<string, Doc[]> = { customers, products, orders };
export const SAMPLE = { customers, products, orders };

const EXAMPLES: { label: string; code: string }[] = [
  { label: 'find + filter', code: `db.customers.find({ city: "Lahore" })` },
  { label: 'operators', code: `db.products.find(\n  { price: { $gte: 10 }, stock: { $gt: 0 } },\n  { name: 1, price: 1, _id: 0 }\n).sort({ price: -1 })` },
  { label: '$or + $in', code: `db.customers.find({\n  $or: [ { age: { $lt: 26 } }, { tags: { $in: ["vip"] } } ]\n})` },
  { label: 'array $elemMatch', code: `db.orders.find({\n  items: { $elemMatch: { sku: "PEN", qty: { $gte: 10 } } }\n})` },
  { label: 'revenue by product', code: `db.orders.aggregate([\n  { $match: { status: { $in: ["paid", "shipped"] } } },\n  { $unwind: "$items" },\n  { $group: {\n      _id: "$items.sku",\n      units: { $sum: "$items.qty" },\n      revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } }\n  } },\n  { $sort: { revenue: -1 } }\n])` },
  { label: '$lookup (join)', code: `db.orders.aggregate([\n  { $match: { status: "paid" } },\n  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } },\n  { $unwind: "$customer" },\n  { $project: { _id: 1, date: 1, "customer.name": 1, "customer.city": 1 } }\n])` },
  { label: 'spend per city', code: `db.orders.aggregate([\n  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "c" } },\n  { $unwind: "$c" },\n  { $unwind: "$items" },\n  { $group: { _id: "$c.city", spent: { $sum: { $multiply: ["$items.qty", "$items.price"] } }, orders: { $addToSet: "$_id" } } },\n  { $project: { spent: 1, orderCount: { $size: "$orders" } } },\n  { $sort: { spent: -1 } }\n])` },
  { label: '$facet', code: `db.products.aggregate([\n  { $facet: {\n      byCategory: [ { $group: { _id: "$category", n: { $sum: 1 } } } ],\n      outOfStock: [ { $match: { stock: 0 } }, { $project: { name: 1 } } ],\n      priceStats: [ { $group: { _id: null, avg: { $avg: "$price" }, max: { $max: "$price" } } } ]\n  } }\n])` },
  { label: 'countDocuments', code: `db.orders.countDocuments({ status: "paid" })` },
];

class Cursor {
  private _sort?: Doc; private _skip = 0; private _limit = 0;
  constructor(private coll: Doc[], private filter: Doc = {}, private proj?: Doc) {}
  sort(s: Doc) { this._sort = s; return this; }
  skip(n: number) { this._skip = n; return this; }
  limit(n: number) { this._limit = n; return this; }
  toArray() { return this.run(); }
  run() {
    let c = find(this.coll, this.filter, this.proj && Object.keys(this.proj).length ? this.proj : undefined);
    if (this._sort) c = c.sort(this._sort);
    if (this._skip) c = c.skip(this._skip);
    if (this._limit) c = c.limit(this._limit);
    return c.all();
  }
}

function makeDb() {
  const resolveLookups = (pipeline: Doc[]): Doc[] => pipeline.map((st) => {
    if (st.$lookup && typeof st.$lookup.from === 'string') {
      const from = DB[st.$lookup.from];
      if (!from) throw new Error(`Unknown collection in $lookup: ${st.$lookup.from}`);
      return { $lookup: { ...st.$lookup, from } };
    }
    if (st.$facet) return { $facet: Object.fromEntries(Object.entries(st.$facet).map(([k, v]) => [k, resolveLookups(v as Doc[])])) };
    return st;
  });
  return new Proxy({}, {
    get(_, name: string) {
      const coll = DB[name];
      if (!coll) throw new Error(`No collection "${name}". Try customers, orders or products.`);
      return {
        find: (f?: Doc, p?: Doc) => new Cursor(coll, f || {}, p),
        findOne: (f?: Doc, p?: Doc) => new Cursor(coll, f || {}, p).limit(1).run()[0] ?? null,
        aggregate: (pl: Doc[]) => aggregate(coll, resolveLookups(pl)),
        countDocuments: (f?: Doc) => find(coll, f || {}).all().length,
        distinct: (field: string) => [...new Set(coll.map((d) => d[field]))],
        insertOne: () => { throw new Error('This playground is read-only. Try find() or aggregate().'); },
      };
    },
  });
}

export function MongoLab() {
  const [code, setCode] = useState(EXAMPLES[4].code);
  const [view, setView] = useState<'result' | 'data'>('result');
  const [coll, setColl] = useState('orders');
  const out = useMemo(() => {
    const t0 = performance.now();
    try {
      let r = new Function('db', `"use strict"; return (${code.trim().replace(/;$/, '')});`)(makeDb());
      if (r instanceof Cursor) r = r.run();
      return { ok: true, r, ms: performance.now() - t0 };
    } catch (e) {
      return { ok: false, r: (e as Error).message, ms: 0 };
    }
  }, [code]);
  const count = Array.isArray(out.r) ? out.r.length : null;

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {EXAMPLES.map((e) => <button key={e.label} className={`chip ${code === e.code ? 'on' : ''}`} onClick={() => setCode(e.code)}>{e.label}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 14 }} className="lg:grid-cols-2">
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>mongosh — edit freely, results update as you type</div>
          <textarea className="input" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} rows={14}
            style={{ background: 'var(--code-bg)', color: 'var(--code-text)', borderColor: 'transparent', minHeight: 280 }} />
          <p className="faint" style={{ fontSize: 12.5 }}>Collections: <code>customers</code> (6), <code>orders</code> (9), <code>products</code> (7). Supports find / sort / skip / limit / findOne / countDocuments / distinct / aggregate with $lookup.</p>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <button className={`chip ${view === 'result' ? 'on' : ''}`} onClick={() => setView('result')}>Result</button>
            <button className={`chip ${view === 'data' ? 'on' : ''}`} onClick={() => setView('data')}>Browse data</button>
            {view === 'data' && Object.keys(DB).map((c) => <button key={c} className={`chip ${coll === c ? 'on' : ''}`} onClick={() => setColl(c)}>{c}</button>)}
            {view === 'result' && <span className="faint" style={{ fontSize: 12.5, marginLeft: 'auto' }}>{out.ok ? `${count !== null ? `${count} docs · ` : ''}${out.ms.toFixed(1)} ms` : ''}</span>}
          </div>
          <pre className={`code-block ${out.ok ? 'out' : ''}`} data-lang={view === 'data' ? coll : out.ok ? 'result' : 'error'}
            style={{ marginTop: 0, maxHeight: 420, color: out.ok || view === 'data' ? undefined : '#ff9aa2' }}>
            <code>{view === 'data' ? JSON.stringify(DB[coll], null, 2) : out.ok ? JSON.stringify(out.r, null, 2) : `⚠ ${out.r}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ============ Index explain simulator ============ */
export function IndexLab() {
  const N = 1_000_000;
  const [idx, setIdx] = useState<'none' | 'status' | 'status_date' | 'date_status'>('none');
  const [query, setQuery] = useState<'eq' | 'eq_sort' | 'range'>('eq_sort');
  const Q = {
    eq: { label: 'find({ status: "paid" })', match: 0.3 },
    eq_sort: { label: 'find({ status: "paid" }).sort({ date: -1 }).limit(20)', match: 0.3 },
    range: { label: 'find({ status: "paid", date: { $gte: lastWeek } })', match: 0.006 },
  }[query];
  const plan = useMemo(() => {
    const returned = query === 'eq_sort' ? 20 : Math.round(N * Q.match);
    if (idx === 'none') return { stage: query === 'eq_sort' ? 'COLLSCAN → SORT (in memory)' : 'COLLSCAN', keys: 0, docs: N, returned, ms: 900 + (query === 'eq_sort' ? 400 : 0), verdict: 'bad' };
    if (idx === 'status') {
      const keys = Math.round(N * 0.3);
      return { stage: query === 'eq_sort' ? 'IXSCAN {status} → FETCH → SORT (in memory)' : query === 'range' ? 'IXSCAN {status} → FETCH (filter date)' : 'IXSCAN {status} → FETCH', keys, docs: keys, returned, ms: query === 'eq' ? 320 : 420, verdict: query === 'eq' ? 'ok' : 'meh' };
    }
    if (idx === 'status_date') {
      const keys = query === 'eq_sort' ? 20 : query === 'range' ? returned : Math.round(N * 0.3);
      return { stage: 'IXSCAN {status: 1, date: -1} → FETCH', keys, docs: keys, returned, ms: query === 'eq' ? 300 : 2, verdict: query === 'eq' ? 'ok' : 'great' };
    }
    const keys = query === 'range' ? Math.round(N * 0.02) : N;
    return { stage: query === 'range' ? 'IXSCAN {date, status} (scans all statuses in range)' : query === 'eq_sort' ? 'IXSCAN {date, status} (walks whole index in date order, filters status)' : 'COLLSCAN (index prefix not usable)', keys, docs: query === 'eq' ? N : Math.round(keys * 0.3), returned, ms: query === 'range' ? 25 : query === 'eq_sort' ? 6 : 900, verdict: query === 'eq' ? 'bad' : 'meh' };
  }, [idx, query]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number) => n.toLocaleString();
  const vc = { bad: 'var(--bad)', meh: 'var(--warn)', ok: 'var(--accent)', great: 'var(--ok)' }[plan.verdict];
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'grid', gap: 12 }} className="md:grid-cols-2">
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Query on <code>orders</code> ({fmt(N)} docs, 30% are paid)</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {(['eq', 'eq_sort', 'range'] as const).map((q) => (
              <button key={q} className={`chip ${query === q ? 'on' : ''}`} style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 12 }} onClick={() => setQuery(q)}>
                {{ eq: 'find({ status: "paid" })', eq_sort: 'find({ status }).sort({ date: -1 }).limit(20)', range: 'find({ status, date: { $gte: lastWeek } })' }[q]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Index on the collection</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {([['none', 'No index (only _id)'], ['status', 'createIndex({ status: 1 })'], ['status_date', 'createIndex({ status: 1, date: -1 })  ← ESR'], ['date_status', 'createIndex({ date: -1, status: 1 })']] as const).map(([k, l]) => (
              <button key={k} className={`chip ${idx === k ? 'on' : ''}`} style={{ justifyContent: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 12 }} onClick={() => setIdx(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: 16, borderRadius: 14, border: `1.5px solid ${vc}`, background: `color-mix(in oklab, ${vc} 7%, var(--panel))` }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>winningPlan: {plan.stage}</div>
        {[['totalKeysExamined', plan.keys], ['totalDocsExamined', plan.docs], ['nReturned', plan.returned]].map(([k, v]) => (
          <div key={k as string} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 90px', gap: 10, alignItems: 'center', fontSize: 13, marginBottom: 6 }}>
            <code>{k}</code>
            <div className="progress" style={{ height: 10 }}><i style={{ width: `${Math.max(0.4, ((v as number) / N) * 100)}%`, background: vc }} /></div>
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(v as number)}</span>
          </div>
        ))}
        <div style={{ fontSize: 14, marginTop: 8 }}>≈ <b>{plan.ms} ms</b> (illustrative). Ideal: docs examined ≈ docs returned.</div>
      </div>
    </div>
  );
}
