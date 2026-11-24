import { notFound } from 'next/navigation';
import { getIndex } from '@/lib/content';

export const metadata = { title: 'Original page' };

export default async function OriginalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getIndex().find((x) => x.slug === slug);
  if (!t?.original) notFound();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Your original interactive page, with all its demos, running unchanged.</p>
        <a className="btn btn-sm" href={t.original} target="_blank" rel="noreferrer">Open full screen ↗</a>
      </div>
      <iframe src={t.original} title={t.title} className="panel"
        style={{ width: '100%', height: 'calc(100vh - 230px)', minHeight: 520, background: 'white' }}
        sandbox="allow-scripts allow-same-origin allow-popups" />
    </div>
  );
}
