import Link from 'next/link';
import { categories, getIndex } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { OverallStats, TopicRing } from '@/components/ProgressBits';
import { RandomQuestion } from '@/components/RandomQuestion';

const PATH = [
  { slug: 'csharp', why: 'Learn the language: types, loops, classes, collections.' },
  { slug: 'dotnet', why: 'Build web APIs: DI, middleware, EF Core, async.' },
  { slug: 'postgres', why: 'Relational data: SQL, joins, indexes, transactions.' },
  { slug: 'mongodb', why: 'Document data: CRUD, aggregation, schema design.' },
  { slug: 'react-node', why: 'Full-stack JS: HTTP, React, Node, Express.' },
  { slug: 'ai-fastapi-flask', why: 'Python APIs and AI engineering answers.' },
  { slug: 'genai-rag', why: 'LLMs, embeddings, RAG, agents, vector DBs.' },
  { slug: 'voice-ai', why: 'Put it together: a real-time voice agent.' },
];

export default function Home() {
  const index = getIndex();
  const bySlug = Object.fromEntries(index.map((t) => [t.slug, t]));
  const totals = index.reduce((a, t) => ({ s: a.s + t.stats.sections, q: a.q + t.stats.questions, c: a.c + t.stats.cards }), { s: 0, q: 0, c: 0 });
  const labCount = Object.values(LABS).reduce((n, l) => n + l.length, 0);
  const path = PATH.filter((p) => bySlug[p.slug]);

  return (
    <div className="container-x">
      {/* hero */}
      <section style={{ padding: '56px 0 28px', display: 'grid', gap: 28 }} className="lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <span className="badge" style={{ marginBottom: 16 }}>✨ {index.length} topics · {totals.s} sections · {labCount} hands-on labs</span>
          <h1 style={{ fontSize: 'clamp(34px, 5.4vw, 60px)', lineHeight: 1.04, letterSpacing: '-0.035em', fontWeight: 850, margin: '14px 0 16px' }}>
            Interview prep you can <span className="gradient-text">play with.</span>
          </h1>
          <p className="muted" style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
            Your notes on GenAI, RAG, Voice AI, FastAPI, React, Node, C#, .NET, MongoDB and PostgreSQL, turned into one place to read, test yourself with flashcards and quizzes, and run real code.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="#start" className="btn btn-primary" style={{ padding: '12px 20px', fontSize: 15 }}>🚀 Start learning</Link>
            <Link href="/topics/postgres/lab" className="btn" style={{ padding: '12px 20px', fontSize: 15 }}>🐘 Try real SQL in the browser</Link>
          </div>
        </div>
        <RandomQuestion />
      </section>

      <section style={{ marginBottom: 40 }}>
        <OverallStats total={totals.s} />
      </section>

      {/* start here */}
      <section id="start" style={{ scrollMarginTop: 80, marginBottom: 48 }}>
        <SectionHead kicker="Start here" title="A suggested learning path" sub="Go top to bottom the first time. Each step builds on the one before. Later, jump anywhere with search (press /)." />
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {path.map((p, i) => {
            const t = bySlug[p.slug];
            return (
              <li key={p.slug}>
                <Link href={`/topics/${t.slug}`} className="panel card-hover" style={{ display: 'flex', gap: 14, padding: 16, alignItems: 'flex-start', ['--accent' as string]: t.accent, height: '100%' }}>
                  <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 800, color: 'white', background: t.accent }}>{i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700 }}>{t.emoji} {t.title}</span>
                    <span className="muted" style={{ display: 'block', fontSize: 13.5, marginTop: 3 }}>{p.why}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="panel" style={{ marginTop: 14, padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px 22px', alignItems: 'center', fontSize: 14 }}>
          <b>Daily 30-minute routine:</b>
          <span>① read one part (10 min)</span>
          <span>② 20 flashcards (10 min)</span>
          <span>③ one quiz + one lab (10 min)</span>
        </div>
      </section>

      {/* topics by category */}
      {categories(index).map(([cat, list]) => (
        <section key={cat} style={{ marginBottom: 44 }}>
          <SectionHead kicker={cat} title={catTitle(cat)} />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
            {list.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`} className="panel card-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, ['--accent' as string]: t.accent, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 4, background: `linear-gradient(90deg, ${t.accent}, transparent)` }} />
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 30, width: 54, height: 54, borderRadius: 14, display: 'grid', placeItems: 'center', background: `color-mix(in oklab, ${t.accent} 14%, transparent)`, flexShrink: 0 }}>{t.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 750, letterSpacing: '-0.01em' }}>{t.title}</h3>
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5 }}>{t.subtitle}</p>
                  </div>
                  <TopicRing slug={t.slug} total={t.stats.sections} size={48} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge">{t.stats.sections} sections</span>
                  {t.stats.cards > 0 && <span className="badge">{t.stats.cards} flashcards</span>}
                  {LABS[t.slug] && <span className="badge">🧪 {LABS[t.slug].length} lab{LABS[t.slug].length === 1 ? '' : 's'}</span>}
                  {t.hasQuiz && <span className="badge">✅ quiz</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>➕ Add your own files</h3>
        <p className="muted" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
          Drop any <code>.docx</code>, <code>.html</code> or <code>.md</code> file into <code>content/sources/</code> and restart <code>npm run dev</code>.
          Headings become parts and sections, questions become flashcards and quiz items, and the file shows up in search. Set its title, emoji and colour in <code>content/topics.json</code>.
        </p>
      </section>
    </div>
  );
}

function catTitle(c: string) {
  return ({ 'AI Engineering': 'LLMs, RAG, agents and AI APIs', 'Web Development': 'Frontend and backend JavaScript', '.NET': 'C# and the .NET platform', Databases: 'SQL and NoSQL' } as Record<string, string>)[c] || 'Your notes';
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brand)' }}>{kicker}</div>
      <h2 style={{ margin: '4px 0 0', fontSize: 26, letterSpacing: '-0.02em', fontWeight: 800 }}>{title}</h2>
      {sub && <p className="muted" style={{ margin: '6px 0 0', fontSize: 15 }}>{sub}</p>}
    </div>
  );
}
