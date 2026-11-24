import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getIndex, getTopic } from '@/lib/content';
import { PartReader } from '@/components/PartReader';
import { PartProgress } from '@/components/ProgressBits';

export function generateStaticParams() {
  return getIndex().flatMap((t) => t.partList.map((p) => ({ slug: t.slug, part: p.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; part: string }> }): Promise<Metadata> {
  const { slug, part } = await params;
  const t = getIndex().find((x) => x.slug === slug);
  const p = t?.partList.find((x) => x.id === part);
  return { title: p ? `${p.title} — ${t!.title}` : 'Not found' };
}

export default async function PartPage({ params }: { params: Promise<{ slug: string; part: string }> }) {
  const { slug, part } = await params;
  const topic = getTopic(slug);
  const idx = topic?.parts.findIndex((p) => p.id === part) ?? -1;
  if (!topic || idx < 0) notFound();
  const p = topic.parts[idx];
  const prev = topic.parts[idx - 1];
  const next = topic.parts[idx + 1];

  return (
    <div style={{ display: 'grid', gap: 24 }} className="lg:grid-cols-[270px_1fr]">
      <aside className="hidden lg:block">
        <div style={{ position: 'sticky', top: 84, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: 6 }} className="thin-scroll">
          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', margin: '4px 0 10px' }}>Parts</div>
          <nav style={{ display: 'grid', gap: 2 }}>
            {topic.parts.map((x, i) => {
              const on = x.id === p.id;
              return (
                <Link key={x.id} href={`/topics/${slug}/${x.id}`}
                  style={{ padding: '8px 10px', borderRadius: 10, fontSize: 13.5, lineHeight: 1.35, fontWeight: on ? 650 : 500,
                    background: on ? 'color-mix(in oklab, var(--accent) 12%, var(--panel))' : 'transparent', color: on ? 'var(--text)' : 'var(--muted)',
                    border: on ? '1px solid color-mix(in oklab, var(--accent) 30%, var(--border))' : '1px solid transparent' }}>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <span className="faint" style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, paddingTop: 1 }}>{i + 1}</span>
                    <span style={{ flex: 1 }}>{x.title}</span>
                  </span>
                  {on && <div style={{ marginTop: 6 }}><PartProgress prefix={`${slug}/${x.id}/`} total={x.sections.length} /></div>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div style={{ minWidth: 0 }}>
        <details className="panel lg:hidden" style={{ marginBottom: 14 }}>
          <summary style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 650, fontSize: 14 }}>☰ All parts ({topic.parts.length})</summary>
          <nav style={{ display: 'grid', padding: '0 8px 8px' }}>
            {topic.parts.map((x, i) => (
              <Link key={x.id} href={`/topics/${slug}/${x.id}`} style={{ padding: '8px 8px', borderRadius: 8, fontSize: 14, fontWeight: x.id === p.id ? 700 : 500, color: x.id === p.id ? 'var(--accent)' : 'var(--text)' }}>
                {i + 1}. {x.title}
              </Link>
            ))}
          </nav>
        </details>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <span className="badge">Part {idx + 1} of {topic.parts.length}</span>
          <span className="faint" style={{ fontSize: 13 }}>{p.sections.length} sections</span>
        </div>
        <h2 style={{ margin: '6px 0 16px', fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em' }}>{p.title}</h2>

        <PartReader slug={slug} partId={p.id} sections={p.sections} layout={topic.layout} />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          {prev ? <Link className="btn" href={`/topics/${slug}/${prev.id}`}>← {prev.title}</Link> : <span />}
          {next ? <Link className="btn btn-primary" href={`/topics/${slug}/${next.id}`}>{next.title} →</Link>
            : <Link className="btn btn-primary" href={`/topics/${slug}/flashcards`}>Finished! Test yourself with flashcards →</Link>}
        </div>
      </div>
    </div>
  );
}
