'use client';
import { useEffect, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
const SEED = `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, city TEXT, created_at DATE NOT NULL);
CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price NUMERIC(10,2) NOT NULL CHECK (price >= 0), stock INT NOT NULL DEFAULT 0, attrs JSONB);
CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), status TEXT NOT NULL, created_at DATE NOT NULL);
CREATE TABLE order_items (order_id INT REFERENCES orders(id), product_id INT REFERENCES products(id), qty INT NOT NULL, price NUMERIC(10,2) NOT NULL, PRIMARY KEY (order_id, product_id));
CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, title TEXT, manager_id INT REFERENCES employees(id), salary INT);

INSERT INTO customers (name, email, city, created_at) VALUES
 ('Ayesha Khan','ayesha@example.com','Lahore','2024-02-11'), ('Bilal Ahmed','bilal@example.com','Karachi','2023-11-03'),
 ('Sara Malik','sara@example.com','Islamabad','2025-01-20'), ('Omar Farooq','omar@example.com','Lahore','2022-06-15'),
 ('Hina Raza','hina@example.com','Karachi','2024-08-30'), ('Usman Tariq','usman@example.com','Peshawar','2025-03-02'),
 ('Zara Iqbal','zara@example.com','Lahore','2025-04-18');
INSERT INTO products (name, category, price, stock, attrs) VALUES
 ('Gel Pen','office',2.50,120,'{"color":"blue","brand":"Inko"}'), ('Notebook','office',6.00,40,'{"pages":120}'),
 ('Desk Lamp','home',32.00,8,'{"watts":9,"brand":"Lumo"}'), ('Mug','home',9.00,0,'{"color":"white"}'),
 ('Headphones','tech',79.00,15,'{"wireless":true,"brand":"Sonic"}'), ('USB-C Cable','tech',12.00,200,'{"length_m":1}'),
 ('Keyboard','tech',49.00,5,'{"wireless":false,"brand":"Sonic"}'), ('Stapler','office',14.00,22,null);
INSERT INTO orders (customer_id, status, created_at) VALUES
 (1,'paid','2025-05-01'),(2,'paid','2025-05-03'),(1,'shipped','2025-05-07'),(3,'pending','2025-05-08'),(4,'paid','2025-05-10'),
 (5,'cancelled','2025-05-11'),(2,'paid','2025-05-14'),(6,'paid','2025-05-15'),(4,'shipped','2025-05-18'),(1,'paid','2025-05-21');
INSERT INTO order_items VALUES
 (1,1,10,2.50),(1,2,3,6.00),(2,5,1,79.00),(3,3,2,32.00),(4,6,4,12.00),(4,1,2,2.50),(5,7,1,49.00),(5,5,1,79.00),
 (6,4,6,9.00),(7,6,10,12.00),(8,2,20,6.00),(8,1,50,2.50),(9,3,1,32.00),(10,8,2,14.00),(10,5,1,79.00);
INSERT INTO employees (name, title, manager_id, salary) VALUES
 ('Nadia','CEO',NULL,250000),('Kamran','CTO',1,200000),('Fatima','CFO',1,190000),('Ali','Eng Manager',2,150000),
 ('Rabia','Senior Engineer',4,120000),('Hamza','Engineer',4,95000),('Iqra','Engineer',4,95000),('Saad','Accountant',3,80000);
`;

const EXAMPLES: { label: string; sql: string }[] = [
  { label: 'SELECT basics', sql: `SELECT name, city, created_at\nFROM customers\nWHERE city = 'Lahore'\nORDER BY created_at DESC;` },
  { label: 'INNER JOIN', sql: `SELECT o.id AS order_id, c.name, o.status, o.created_at\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nORDER BY o.id;` },
  { label: 'LEFT JOIN anti-join', sql: `-- customers who never ordered\nSELECT c.name, c.city\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;` },
  { label: 'GROUP BY + HAVING', sql: `SELECT c.name, COUNT(DISTINCT o.id) AS orders, SUM(oi.qty * oi.price) AS spent\nFROM customers c\nJOIN orders o ON o.customer_id = c.id AND o.status IN ('paid','shipped')\nJOIN order_items oi ON oi.order_id = o.id\nGROUP BY c.name\nHAVING SUM(oi.qty * oi.price) > 50\nORDER BY spent DESC;` },
  { label: 'Window functions', sql: `SELECT name, title, salary,\n  RANK()       OVER (ORDER BY salary DESC) AS rank,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank,\n  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,\n  salary - LAG(salary) OVER (ORDER BY salary DESC) AS diff_vs_prev\nFROM employees;` },
  { label: '2nd highest salary', sql: `SELECT name, salary FROM (\n  SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r\n  FROM employees\n) t\nWHERE r = 2;` },
  { label: 'Recursive CTE', sql: `-- management chain above Hamza\nWITH RECURSIVE chain AS (\n  SELECT id, name, title, manager_id, 0 AS level FROM employees WHERE name = 'Hamza'\n  UNION ALL\n  SELECT e.id, e.name, e.title, e.manager_id, c.level + 1\n  FROM employees e JOIN chain c ON e.id = c.manager_id\n)\nSELECT level, name, title FROM chain;` },
  { label: 'JSONB', sql: `SELECT name, attrs->>'brand' AS brand, attrs\nFROM products\nWHERE attrs @> '{"brand": "Sonic"}'\n   OR (attrs->>'wireless')::boolean IS TRUE;` },
  { label: 'Running total', sql: `SELECT o.created_at, o.id,\n  SUM(oi.qty * oi.price) AS order_total,\n  SUM(SUM(oi.qty * oi.price)) OVER (ORDER BY o.created_at) AS running_total\nFROM orders o JOIN order_items oi ON oi.order_id = o.id\nWHERE o.status <> 'cancelled'\nGROUP BY o.id, o.created_at\nORDER BY o.created_at;` },
  { label: 'Transaction + UPSERT', sql: `BEGIN;\nUPDATE products SET stock = stock - 1 WHERE name = 'Keyboard' AND stock > 0;\nINSERT INTO products (name, category, price, stock) VALUES ('Mouse','tech',25,30);\nCOMMIT;\n\nSELECT name, stock FROM products WHERE category = 'tech' ORDER BY name;` },
  { label: 'EXPLAIN + index', sql: `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);\nSET enable_seqscan = off;  -- tiny table: force the planner to show the index\nEXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 1;` },
];

type Result = { fields: string[]; rows: any[][]; affected?: number; ms: number; notice?: string };

export function SqlLab() {
  const db = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadErr, setLoadErr] = useState('');
  const [sql, setSql] = useState(EXAMPLES[1].sql);
  const [results, setResults] = useState<Result[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState('');

  const boot = async () => {
    setStatus('loading');
    try {
      // served from /public/pglite (copied by scripts/build-content.mjs); CDN as a fallback
      let PGlite: any;
      const local = '/pglite/index.js';
      const cdn = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.6.0/dist/index.js';
      try {
        ({ PGlite } = await import(/* webpackIgnore: true */ local));
      } catch {
        ({ PGlite } = await import(/* webpackIgnore: true */ cdn));
      }
      const pg = await PGlite.create();
      await pg.exec(SEED);
      const v = await pg.query('select version()');
      setVersion(String(v.rows[0].version).split(' on ')[0].split(',')[0]);
      db.current = pg;
      setStatus('ready');
    } catch (e) {
      setLoadErr((e as Error).message);
      setStatus('error');
    }
  };
  useEffect(() => { boot(); }, []);

  const run = async () => {
    if (!db.current || busy) return;
    setBusy(true);
    setErr('');
    const t0 = performance.now();
    try {
      const res: any[] = await db.current.exec(sql);
      const ms = performance.now() - t0;
      setResults(res.filter((r) => r.fields?.length || r.affectedRows).map((r) => ({ fields: r.fields.map((f: any) => f.name), rows: r.rows.map((row: any) => r.fields.map((f: any) => row[f.name])), affected: r.affectedRows, ms })));
    } catch (e) {
      setResults([]);
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  const reset = async () => {
    await db.current?.close?.();
    db.current = null;
    setResults([]);
    setErr('');
    await boot();
  };

  const show = (v: any) => (v === null || v === undefined ? <span className="faint">NULL</span> : typeof v === 'object' ? (v instanceof Date ? v.toISOString().slice(0, 10) : JSON.stringify(v)) : String(v));

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {EXAMPLES.map((e) => <button key={e.label} className={`chip ${sql === e.sql ? 'on' : ''}`} onClick={() => setSql(e.sql)}>{e.label}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 14 }} className="lg:grid-cols-[1fr_250px]">
        <div style={{ minWidth: 0 }}>
          <textarea className="input" spellCheck={false} rows={10} value={sql} onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } }}
            style={{ background: 'var(--code-bg)', color: 'var(--code-text)', borderColor: 'transparent', minHeight: 200 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={run} disabled={status !== 'ready' || busy}>▶ Run <span className="kbd" style={{ color: 'white', background: 'transparent' }}>Ctrl+Enter</span></button>
            <button className="btn btn-sm" onClick={reset} disabled={status === 'loading'}>Reset database</button>
            <span className="faint" style={{ fontSize: 12.5 }}>
              {status === 'loading' && '⏳ Starting PostgreSQL in your browser (≈3 MB, first time only)…'}
              {status === 'ready' && `🟢 ${version} (WebAssembly) — changes stay until you reset`}
              {status === 'error' && <span style={{ color: 'var(--bad)' }}>Could not start PostgreSQL: {loadErr}</span>}
            </span>
          </div>
          {err && <pre className="code-block" data-lang="error" style={{ color: '#ff9aa2' }}><code>ERROR: {err}</code></pre>}
          {results.map((r, k) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>{r.fields.length ? `${r.rows.length} row${r.rows.length === 1 ? '' : 's'}` : `${r.affected} row(s) affected`} · {r.ms.toFixed(1)} ms</div>
              {r.fields.length > 0 && (
                <div className="prose-x"><div className="table-wrap" style={{ maxHeight: 380, overflow: 'auto', margin: 0 }}>
                  <table>
                    <thead><tr>{r.fields.map((f, i) => <th key={i}>{f}</th>)}</tr></thead>
                    <tbody>{r.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j} style={{ fontFamily: r.fields[0] === 'QUERY PLAN' ? 'var(--font-mono)' : undefined, whiteSpace: r.fields[0] === 'QUERY PLAN' ? 'pre' : undefined, fontSize: 13.5 }}>{show(v)}</td>)}</tr>)}</tbody>
                  </table>
                </div></div>
              )}
            </div>
          ))}
        </div>
        <aside style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Schema</div>
          {[['customers', 'id, name, email, city, created_at'], ['products', 'id, name, category, price, stock, attrs JSONB'], ['orders', 'id, customer_id → customers, status, created_at'], ['order_items', 'order_id → orders, product_id → products, qty, price'], ['employees', 'id, name, title, manager_id → employees, salary']].map(([t, c]) => (
            <div key={t} style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--border)', marginBottom: 6 }}>
              <button className="btn-ghost" style={{ all: 'unset', cursor: 'pointer', fontWeight: 650, fontFamily: 'var(--font-mono)' }} onClick={() => setSql(`SELECT * FROM ${t} LIMIT 20;`)}>{t}</button>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{c}</div>
            </div>
          ))}
          <p className="faint" style={{ fontSize: 12 }}>Click a table name to preview it. Try writing your own INSERT, UPDATE, CREATE INDEX…</p>
        </aside>
      </div>
    </div>
  );
}
