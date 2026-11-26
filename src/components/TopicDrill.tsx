'use client';
import Link from 'next/link';
import { useState } from 'react';

type Item = { q: string; a: string; part: string; id: string };

/** A random-question drill for one topic: answer out loud, reveal, next. */
export function TopicDrill({ items, slug }: { items: Item[]; slug: string }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [seen, setSeen] = useState(0);
  const cur = items[i];
  if (!cur) return null;
  const next = () => {
    let n = i;
    while (items.length > 1 && n === i) n = Math.floor(Math.random() * items.length);
    setI(n);
    setShow(false);
    setSeen((s) => s + 1);
  };
  const [partId, secId] = cur.id.split('/');
  return (
    <div className="panel" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 28%, transparent), transparent 70%)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, position: 'relative' }}>
        <span className="badge">🎲 Quick drill</span>
        <span className="faint" style={{ fontSize: 12.5 }}>{seen} done this session</span>
      </div>
      <div className="faint" style={{ fontSize: 12.5, margin: '12px 0 4px' }}>{cur.part}</div>
      <h3 style={{ margin: 0, fontSize: 'clamp(18px, 2.2vw, 22px)', lineHeight: 1.35, position: 'relative' }}>{cur.q}</h3>
      <div style={{ marginTop: 12, minHeight: 56, position: 'relative' }}>
        {show ? <p className="sec-body" style={{ margin: 0, lineHeight: 1.65, fontSize: 15 }}>{cur.a}</p> : <p className="faint" style={{ margin: 0, fontSize: 14 }}>Say your answer out loud first, then reveal it.</p>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, position: 'relative' }}>
        {!show ? <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>Reveal answer</button> : <button className="btn btn-primary btn-sm" onClick={next}>Next question →</button>}
        {show && <Link className="btn btn-sm" href={`/topics/${slug}/${partId}#${secId ?? ''}`}>Read the full answer</Link>}
        {!show && <button className="btn btn-sm btn-ghost" onClick={next}>Skip ↻</button>}
      </div>
    </div>
  );
}
