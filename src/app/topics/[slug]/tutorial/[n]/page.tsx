import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getIndex, getTopic } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { Body } from '@/components/PartReader';
import { DoneButton, ProgressBar, SideMark, SyncBox } from '@/components/ProgressUI';

export function generateStaticParams() {
  return getIndex().flatMap((t) => Array.from({ length: (t.lessonCount || 0) >= 3 ? t.lessonCount! : 0 }, (_, i) => ({ slug: t.slug, n: String(i + 1) })));
}

function collect(slug: string) {
  const topic = getTopic(slug);
  if (!topic) return null;
  const lessons = topic.parts.flatMap((p) => p.sections.filter((s) => s.lesson).map((s) => ({ ...s, partTitle: p.title })));
  return { topic, lessons };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; n: string }> }): Promise<Metadata> {
  const { slug, n } = await params;
  const c = collect(slug);
  const l = c?.lessons[Number(n) - 1];
  return { title: l ? `${l.title} — ${c!.topic.title}` : 'Tutorial' };
}

export default async function TutorialPage({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;
  const c = collect(slug);
  const i = Number(n) - 1;
  if (!c || !c.lessons[i]) notFound();
  const { topic, lessons } = c;
  const cur = lessons[i];
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const hasLab = !!LABS[slug];
  const href = (k: number) => `/topics/${slug}/tutorial/${k + 1}`;
  const groups: { title: string; items: { k: number; title: string }[] }[] = [];
  lessons.forEach((l, k) => {
    if (!groups.length || groups[groups.length - 1].title !== l.partTitle) groups.push({ title: l.partTitle, items: [] });
    groups[groups.length - 1].items.push({ k, title: l.title });
  });

  const Nav = ({ bottom }: { bottom?: boolean }) => (
    <div className="tut-nav" data-bottom={bottom}>
      {prev ? <Link href={href(i - 1)} className="tut-btn tut-prev">❮ Previous</Link> : <span />}
      <span className="faint" style={{ fontSize: 13 }}>{i + 1} of {lessons.length}</span>
      {next ? <Link href={href(i + 1)} className="tut-btn tut-next">Next ❯</Link> : <Link href={`/topics/${slug}/quiz`} className="tut-btn tut-next">Finish: take the quiz ❯</Link>}
    </div>
  );

  const sidebar = (
    <nav aria-label={`${topic.title} lessons`}>
      <div className="tut-side-title">{topic.emoji} {topic.title}</div>
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 10 }}>
          <div className="tut-side-group">{g.title.replace(/\s*\(lessons? [\d–]+\)\s*$/, '')}</div>
          {g.items.map((it) => (
            <Link key={it.k} href={href(it.k)} className="tut-side-link" aria-current={it.k === i ? 'page' : undefined}>{it.title}<SideMark slug={slug} n={it.k + 1} /></Link>
          ))}
        </div>
      ))}
      <SyncBox />
    </nav>
  );

  return (
    <div className="tut-grid">
      <aside className="tut-side hidden lg:block thin-scroll">{sidebar}</aside>
      <div style={{ minWidth: 0 }}>
        <details className="panel lg:hidden" style={{ marginBottom: 14 }}>
          <summary style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 650, fontSize: 14 }}>☰ All {lessons.length} lessons</summary>
          <div style={{ padding: '0 10px 10px' }}>{sidebar}</div>
        </details>

        <div className="faint" style={{ fontSize: 13, marginBottom: 6 }}>{topic.title} › Tutorial › {cur.partTitle.replace(/\s*\(lessons? [\d–]+\)\s*$/, '')}</div>
        <ProgressBar slug={slug} total={lessons.length} />
        <Nav />
        <h2 className="tut-title">{cur.title}</h2>
        <div className="panel tut-body">
          <Body html={cur.html} />
        </div>
        {hasLab && (
          <Link href={`/topics/${slug}/lab`} className="tut-try">
            <span style={{ fontSize: 26 }}>🧪</span>
            <span style={{ flex: 1 }}><b>Try it yourself</b><span style={{ display: 'block', fontSize: 13.5, opacity: .85 }}>Open the Playground to experiment in your browser.</span></span>
            <span className="tut-go">Open →</span>
          </Link>
        )}
        <DoneButton slug={slug} n={i + 1} total={lessons.length} nextHref={next ? href(i + 1) : undefined} />
        <Nav bottom />
      </div>
    </div>
  );
}
