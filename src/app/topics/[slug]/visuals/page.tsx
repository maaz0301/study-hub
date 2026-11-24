import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTopic } from '@/lib/content';

export const metadata = { title: 'Visual guide' };

export default async function VisualsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTopic(slug);
  const visuals = t?.extras.visuals || [];
  if (!t || !visuals.length) notFound();

  return (
    <div style={{ display: 'grid', gap: 24 }} className="grid-cols-[minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <nav style={{ position: 'sticky', top: 84, display: 'grid', gap: 2 }}>
          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Pictures</div>
          {visuals.map((v, i) => (
            <a key={v.name} href={`#v-${v.name}`} className="tab-pill" style={{ fontSize: 13, borderRadius: 10, whiteSpace: 'normal' }}>
              {i + 1}. {v.svg.match(/<figcaption><b>([^<]*)<\/b>/)?.[1] || v.name}
            </a>
          ))}
        </nav>
      </aside>
      <div style={{ minWidth: 0 }}>
        <p className="muted" style={{ margin: '0 0 18px', fontSize: 15.5, maxWidth: 760 }}>
          🖼️ Learn {t.title} through <b style={{ color: 'var(--text)' }}>{visuals.length} animated diagrams</b>. Watch the moving dot and the glowing boxes to follow each flow, then open the section to read the details.
        </p>
        <div style={{ display: 'grid', gap: 26 }}>
          {visuals.map((v, i) => (
            <section key={v.name} id={`v-${v.name}`} style={{ scrollMarginTop: 84 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <span className="q-pill">{i + 1}</span>
                <span className="faint" style={{ fontSize: 13 }}>{v.partTitle}</span>
              </div>
              <div className="prose-x" dangerouslySetInnerHTML={{ __html: v.svg }} />
              <Link className="btn btn-sm" style={{ whiteSpace: 'normal', textAlign: 'left' }} href={`/topics/${slug}/${v.part}#${v.section}`}>📖 Read: {v.sectionTitle.length > 70 ? v.sectionTitle.slice(0, 68) + '…' : v.sectionTitle} →</Link>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
