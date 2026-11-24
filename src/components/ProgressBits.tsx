'use client';
import { countDone, useProgress } from '@/lib/progress';

export function Ring({ value, size = 54, stroke = 6, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(v * 100)}% done`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ring-track" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="var(--accent)" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .5s ease' }} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.24} fontWeight={700} fill="var(--text)">
        {label ?? `${Math.round(v * 100)}%`}
      </text>
    </svg>
  );
}

export function TopicRing({ slug, total, size }: { slug: string; total: number; size?: number }) {
  const p = useProgress();
  return <Ring value={total ? countDone(p, `${slug}/`) / total : 0} size={size} />;
}

export function PartProgress({ prefix, total }: { prefix: string; total: number }) {
  const p = useProgress();
  const n = countDone(p, prefix);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="progress" style={{ flex: 1 }}><i style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></div>
      <span className="faint" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{n}/{total}</span>
    </div>
  );
}

export function OverallStats({ total }: { total: number }) {
  const p = useProgress();
  const done = Object.keys(p.done).length;
  const cards = Object.values(p.cards);
  const mastered = cards.filter((c) => c.box >= 3).length;
  const quizzes = Object.values(p.quiz);
  const items = [
    { k: 'Sections learned', v: `${done}`, sub: `of ${total}` },
    { k: 'Flashcards mastered', v: `${mastered}`, sub: `${cards.length} reviewed` },
    { k: 'Quizzes taken', v: `${quizzes.length}`, sub: quizzes.length ? `best avg ${Math.round((quizzes.reduce((a, q) => a + q.best / q.total, 0) / quizzes.length) * 100)}%` : 'none yet' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
      {items.map((i) => (
        <div key={i.k} className="panel" style={{ padding: '14px 16px' }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{i.k}</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{i.v} <span className="faint" style={{ fontSize: 13, fontWeight: 500 }}>{i.sub}</span></div>
        </div>
      ))}
    </div>
  );
}
