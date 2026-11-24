'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Row = [string, string, string, string, string, string];

export function RandomQuestion() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cur, setCur] = useState<Row | null>(null);
  const [show, setShow] = useState(false);

  const next = useCallback((list: Row[]) => {
    if (!list.length) return;
    setCur(list[Math.floor(Math.random() * list.length)]);
    setShow(false);
  }, []);

  useEffect(() => {
    fetch('/search-index.json').then((r) => r.json()).then((d: Row[]) => {
      const qs = d.filter((r) => /\?$/.test(r[3]) && r[4].length > 40);
      setRows(qs);
      next(qs);
    });
  }, [next]);

  return (
    <div className="panel" style={{ padding: 22, position: 'relative', overflow: 'hidden', minHeight: 250, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in oklab, var(--brand) 30%, transparent), transparent 70%)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="badge">🎲 Quick question</span>
        <span className="faint" style={{ fontSize: 12 }}>{rows.length ? `${rows.length} in the pool` : ''}</span>
      </div>
      {cur ? (
        <>
          <p className="faint" style={{ fontSize: 12.5, margin: '14px 0 4px' }}>{cur[5]}</p>
          <h3 style={{ margin: 0, fontSize: 19, lineHeight: 1.35, fontWeight: 700 }}>{cur[3]}</h3>
          <div style={{ flex: 1, marginTop: 12 }}>
            {show ? (
              <p className="muted sec-body" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>{cur[4]}</p>
            ) : (
              <p className="faint" style={{ margin: 0, fontSize: 14 }}>Say your answer out loud first, then reveal.</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {!show ? <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>Reveal answer</button>
              : <Link className="btn btn-sm" href={`/topics/${cur[0]}/${cur[1]}#${cur[2]}`}>Read full answer →</Link>}
            <button className="btn btn-sm btn-ghost" onClick={() => next(rows)}>Another one ↻</button>
          </div>
        </>
      ) : (
        <p className="muted">Loading a question…</p>
      )}
    </div>
  );
}
