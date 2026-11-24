import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getIndex } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { PartProgress, TopicRing } from '@/components/ProgressBits';
import { ContinueButton } from '@/components/ContinueButton';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getIndex().find((x) => x.slug === slug);
  return { title: t?.title, description: t?.subtitle };
}

export default async function TopicOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getIndex().find((x) => x.slug === slug);
  if (!t) notFound();
  const labs = LABS[slug] || [];

  return (
    <div style={{ display: 'grid', gap: 24 }} className="lg:grid-cols-[1fr_320px] lg:items-start">
      <div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {t.partList.map((p, i) => (
            <Link key={p.id} href={`/topics/${slug}/${p.id}`} className="panel card-hover" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>{p.title}</h3>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.blurb}</p>
              <div style={{ marginTop: 'auto' }}><PartProgress prefix={`${slug}/${p.id}/`} total={p.count} /></div>
            </Link>
          ))}
        </div>
      </div>

      <aside style={{ display: 'grid', gap: 14, position: 'sticky', top: 84 }}>
        <div className="panel" style={{ padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
          <TopicRing slug={slug} total={t.stats.sections} size={74} />
          <div>
            <div style={{ fontWeight: 700 }}>Your progress</div>
            <div className="muted" style={{ fontSize: 13.5 }}>{t.stats.parts} parts · {t.stats.sections} sections{t.stats.questions ? ` · ${t.stats.questions} questions` : ''}</div>
            <ContinueButton slug={slug} parts={t.partList.map((p) => p.id)} />
          </div>
        </div>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Practice</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {t.stats.cards > 0 && <Link className="btn" style={{ justifyContent: 'flex-start' }} href={`/topics/${slug}/flashcards`}>🃏 {t.stats.cards} flashcards</Link>}
            {(t.stats.cards >= 4 || t.hasQuiz) && <Link className="btn" style={{ justifyContent: 'flex-start' }} href={`/topics/${slug}/quiz`}>✅ Take a quiz</Link>}
            {t.original && <Link className="btn" style={{ justifyContent: 'flex-start' }} href={`/topics/${slug}/original`}>🖼️ Original interactive page</Link>}
          </div>
        </div>
        {labs.length > 0 && (
          <Link href={`/topics/${slug}/lab`} className="panel card-hover" style={{ padding: 18, display: 'block', background: `linear-gradient(135deg, color-mix(in oklab, var(--accent) 12%, var(--panel)), var(--panel))` }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🧪 Playground</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }} className="muted">
              {labs.map((l) => <li key={l.title}><b style={{ color: 'var(--text)' }}>{l.title}</b> — {l.blurb}</li>)}
            </ul>
          </Link>
        )}
        <div className="faint" style={{ fontSize: 12 }}>Source: {t.source}</div>
      </aside>
    </div>
  );
}
