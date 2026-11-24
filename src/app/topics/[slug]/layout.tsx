import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getIndex } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { TopicTabs } from '@/components/TopicTabs';

export function generateStaticParams() {
  return getIndex().map((t) => ({ slug: t.slug }));
}

export default async function TopicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getIndex().find((x) => x.slug === slug);
  if (!t) notFound();
  const tabs = [
    { href: `/topics/${slug}`, label: 'Overview', icon: '📚', exact: true },
    { href: `/topics/${slug}/visuals`, label: 'Visual guide', icon: '🖼️', hide: !t.visualCount },
    { href: `/topics/${slug}/flashcards`, label: 'Flashcards', icon: '🃏', hide: !t.stats.cards },
    { href: `/topics/${slug}/quiz`, label: 'Quiz', icon: '✅', hide: t.stats.cards < 4 && !t.hasQuiz },
    { href: `/topics/${slug}/lab`, label: 'Playground', icon: '🧪', hide: !LABS[slug] },
    { href: `/topics/${slug}/original`, label: 'Original page', icon: '📄', hide: !t.original },
  ].filter((x) => !x.hide);

  return (
    <div style={{ ['--accent' as string]: t.accent }}>
      <div className="topic-hero">
        <div className="container-x" style={{ paddingTop: 22 }}>
          <div className="faint" style={{ fontSize: 13, marginBottom: 10 }}>
            <Link href="/" className="hover:underline">Home</Link> <span>›</span> <span>{t.category}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span className="emoji-tile" style={{ fontSize: 36, width: 68, height: 68, borderRadius: 20, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{t.emoji}</span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(24px, 3.8vw, 36px)', fontWeight: 850, letterSpacing: '-0.03em', lineHeight: 1.12 }}>{t.title}</h1>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 2px' }}>
                <span className="badge">{t.stats.sections} sections</span>
                {t.stats.cards > 0 && <span className="badge">{t.stats.cards} flashcards</span>}
                {!!t.visualCount && <span className="badge">🖼️ {t.visualCount} animated diagrams</span>}
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 15 }}>{t.subtitle}</p>
            </div>
          </div>
          <TopicTabs tabs={tabs} />
        </div>
      </div>
      <div className="container-x" style={{ paddingTop: 24 }}>{children}</div>
    </div>
  );
}
