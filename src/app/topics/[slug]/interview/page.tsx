import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getIndex, getTopic } from '@/lib/content';
import { TopicDrill } from '@/components/TopicDrill';

export const metadata = { title: 'Interview Q&A' };

export function generateStaticParams() {
  return getIndex().filter((t) => t.stats.questions >= 8).map((t) => ({ slug: t.slug }));
}

export default async function InterviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTopic(slug);
  if (!t) notFound();
  const parts = t.parts.filter((p) => !p.sections.some((s) => s.lesson) && p.sections.some((s) => s.isQuestion));
  const total = parts.reduce((n, p) => n + p.sections.filter((s) => s.isQuestion).length, 0);
  const pool = t.cards
    .filter((c) => c.part !== 'Lessons' && parts.some((p) => p.title === c.part))
    .map((c) => ({ q: c.q, a: c.a.length > 420 ? c.a.slice(0, 420).replace(/\s+\S*$/, '') + '…' : c.a, part: c.part, id: c.id }));
  const step = Math.max(1, Math.ceil(pool.length / 120));
  const drill = pool.filter((_, i) => i % step === 0);

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="tut-cta" style={{ margin: 0, cursor: 'default' }}>
        <span style={{ fontSize: 30 }}>🎯</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <b style={{ display: 'block', fontSize: 17 }}>{total} interview questions on {t.title}</b>
          <span style={{ fontSize: 13.5, opacity: 0.85 }}>Read the question, answer it out loud, then open the answer. Use the quick drill or pick a section.</span>
        </span>
        <Link href={`/topics/${slug}/quiz`} className="tut-go">Take the quiz →</Link>
      </div>

      <TopicDrill items={drill} slug={slug} />

      <div>
        <h3 className="ov-head">Question sections</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {parts.map((p, i) => {
            const qs = p.sections.filter((s) => s.isQuestion);
            return (
              <Link key={p.id} href={`/topics/${slug}/${p.id}`} className="panel card-hover" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="part-num">{i + 1}</span>
                  <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {qs.slice(0, 3).map((s) => <li key={s.id}>{s.title.replace(/^Q\s*\d+\s*[.):-]\s*/i, '')}</li>)}
                </ul>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 'auto' }}>{qs.length} question{qs.length === 1 ? '' : 's'} →</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
