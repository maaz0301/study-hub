'use client';
import { useMemo, useState } from 'react';

const L = [{ id: 1, name: 'Ayesha' }, { id: 2, name: 'Bilal' }, { id: 3, name: 'Sara' }, { id: 4, name: 'Omar' }];
const R = [{ oid: 'A', customer_id: 1, total: 40 }, { oid: 'B', customer_id: 1, total: 15 }, { oid: 'C', customer_id: 2, total: 79 }, { oid: 'D', customer_id: 9, total: 22 }];
const TYPES = ['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS', 'ANTI (LEFT … IS NULL)'] as const;
type T = (typeof TYPES)[number];

export function JoinLab() {
  const [t, setT] = useState<T>('LEFT');
  const rows = useMemo(() => {
    const out: { c?: (typeof L)[0]; o?: (typeof R)[0] }[] = [];
    if (t === 'CROSS') { for (const c of L) for (const o of R) out.push({ c, o }); return out; }
    const matchedR = new Set<string>();
    for (const c of L) {
      const ms = R.filter((o) => o.customer_id === c.id);
      ms.forEach((o) => matchedR.add(o.oid));
      if (t === 'ANTI (LEFT … IS NULL)') { if (!ms.length) out.push({ c }); continue; }
      if (ms.length) ms.forEach((o) => out.push({ c, o }));
      else if (t === 'LEFT' || t === 'FULL') out.push({ c });
    }
    if (t === 'RIGHT') return R.flatMap((o) => { const c = L.find((x) => x.id === o.customer_id); return [{ c, o }]; });
    if (t === 'FULL') R.filter((o) => !matchedR.has(o.oid)).forEach((o) => out.push({ o }));
    return out;
  }, [t]);
  const usedL = new Set(rows.filter((r) => r.c).map((r) => r.c!.id));
  const usedR = new Set(rows.filter((r) => r.o).map((r) => r.o!.oid));
  const sql = t === 'CROSS' ? 'SELECT * FROM customers c CROSS JOIN orders o;'
    : t.startsWith('ANTI') ? 'SELECT c.* FROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.oid IS NULL;'
    : `SELECT * FROM customers c\n${t} JOIN orders o ON o.customer_id = c.id;`;

  const Venn = () => {
    const fillL = ['LEFT', 'FULL', 'ANTI (LEFT … IS NULL)'].includes(t) || t === 'CROSS';
    const fillR = ['RIGHT', 'FULL'].includes(t) || t === 'CROSS';
    const fillMid = !t.startsWith('ANTI');
    return (
      <svg viewBox="0 0 220 130" width="220" height="130" aria-label={`${t} join diagram`}>
        <defs>
          <clipPath id="cl"><circle cx="85" cy="65" r="52" /></clipPath>
        </defs>
        <circle cx="85" cy="65" r="52" fill={fillL ? 'var(--accent)' : 'transparent'} opacity=".55" />
        <circle cx="135" cy="65" r="52" fill={fillR ? 'var(--accent)' : 'transparent'} opacity=".55" />
        <circle cx="135" cy="65" r="52" clipPath="url(#cl)" fill={fillMid ? 'var(--accent)' : 'var(--panel)'} opacity={fillMid ? 0.95 : 1} />
        <circle cx="85" cy="65" r="52" fill="none" stroke="var(--text)" strokeWidth="1.5" />
        <circle cx="135" cy="65" r="52" fill="none" stroke="var(--text)" strokeWidth="1.5" />
        <text x="55" y="69" fontSize="12" fill="var(--text)" fontWeight="700">customers</text>
        <text x="140" y="69" fontSize="12" fill="var(--text)" fontWeight="700">orders</text>
      </svg>
    );
  };

  const cell = (on: boolean): React.CSSProperties => ({ padding: '5px 10px', borderRadius: 8, fontSize: 13, background: on ? 'color-mix(in oklab, var(--accent) 16%, var(--panel))' : 'var(--panel-2)', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, opacity: on ? 1 : 0.5, transition: 'all .2s' });

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {TYPES.map((x) => <button key={x} className={`chip ${t === x ? 'on' : ''}`} onClick={() => setT(x)}>{x}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 16, alignItems: 'start' }} className="lg:grid-cols-[auto_1fr_1.2fr]">
        <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
          <Venn />
          <pre className="code-block" data-lang="sql" style={{ margin: 0, fontSize: 12 }}><code>{sql}</code></pre>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>customers</div>
            <div style={{ display: 'grid', gap: 4 }}>{L.map((c) => <div key={c.id} style={cell(usedL.has(c.id))}>{c.id} · {c.name}</div>)}</div></div>
          <div><div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>orders</div>
            <div style={{ display: 'grid', gap: 4 }}>{R.map((o) => <div key={o.oid} style={cell(usedR.has(o.oid))}>{o.oid} · cust {o.customer_id} · ${o.total}</div>)}</div></div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Result: {rows.length} rows</div>
          <div className="prose-x"><div className="table-wrap" style={{ margin: 0, maxHeight: 300, overflow: 'auto' }}>
            <table><thead><tr><th>c.id</th><th>c.name</th><th>o.oid</th><th>o.total</th></tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={i}><td>{r.c?.id ?? <i className="faint">NULL</i>}</td><td>{r.c?.name ?? <i className="faint">NULL</i>}</td><td>{r.o?.oid ?? <i className="faint">NULL</i>}</td><td>{r.o ? `$${r.o.total}` : <i className="faint">NULL</i>}</td></tr>
              ))}</tbody></table>
          </div></div>
          <p className="muted" style={{ fontSize: 13 }}>
            {{ INNER: 'Only pairs that match. Omar and Sara (no orders) and order D (customer 9 does not exist) disappear.', LEFT: 'Every customer, plus matching orders. No match → NULLs on the right.', RIGHT: 'Every order, plus its customer. Order D has no customer → NULLs on the left.', FULL: 'Everything from both sides, NULL where there is no partner.', CROSS: 'Every customer × every order (4 × 4 = 16). No ON clause.', 'ANTI (LEFT … IS NULL)': 'Customers with no orders: LEFT JOIN, then keep rows where the right side is NULL.' }[t]}
          </p>
        </div>
      </div>
    </div>
  );
}
