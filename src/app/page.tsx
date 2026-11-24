import Link from 'next/link';
import { categories, getIndex, getTopic } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { RandomQuestion } from '@/components/RandomQuestion';

const PATH = [
  { slug: 'csharp', why: 'Learn the language: types, loops, classes, collections.' },
  { slug: 'leetcode', why: 'Practice coding problems in C# and JavaScript.' },
  { slug: 'dotnet', why: 'Build web APIs: DI, middleware, EF Core, async.' },
  { slug: 'postgres', why: 'Relational data: SQL, joins, indexes, transactions.' },
  { slug: 'messaging', why: 'Redis, MQTT and Kafka: queues, pub/sub and streams.' },
  { slug: 'leetcode-js', why: 'More coding problems, all in JavaScript.' },
  { slug: 'mongodb', why: 'Document data: CRUD, aggregation, schema design.' },
  { slug: 'react-node', why: 'Full-stack JS: HTTP, React, Node, Express.' },
  { slug: 'ai-fastapi-flask', why: 'Python APIs and AI engineering answers.' },
  { slug: 'genai-rag', why: 'LLMs, embeddings, RAG, agents, vector DBs.' },
  { slug: 'agentic-langchain', why: 'Agents, tools, memory, LangChain and LangGraph.' },
  { slug: 'voice-ai', why: 'Put it together: a real-time voice agent.' },
];

export default function Home() {
  const index = getIndex();
  const bySlug = Object.fromEntries(index.map((t) => [t.slug, t]));
  const totals = index.reduce((a, t) => ({ s: a.s + t.stats.sections, q: a.q + t.stats.questions, c: a.c + t.stats.cards }), { s: 0, q: 0, c: 0 });
  const labCount = Object.values(LABS).reduce((n, l) => n + l.length, 0);
  const path = PATH.filter((p) => bySlug[p.slug]);
  const showcase = ['genai-rag:rag-pipeline', 'agentic-langchain:agent-loop', 'react-node:event-loop', 'dotnet:aspnet-pipeline']
    .map((k) => { const [slug, name] = k.split(':'); const v = getTopic(slug)?.extras.visuals?.find((x) => x.name === name); return v && { slug, v, t: bySlug[slug] }; })
    .filter(Boolean) as { slug: string; v: { name: string; svg: string }; t: (typeof index)[0] }[];
  const totalVisuals = index.reduce((n, t) => n + (t.visualCount || 0), 0);

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
            Your notes on GenAI, RAG, agents & LangChain, Voice AI, Redis/MQTT/Kafka, FastAPI, React, Node, C#, .NET, MongoDB and PostgreSQL, turned into one place to read, test yourself with flashcards and quizzes, and run real code.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="#start" className="btn btn-primary" style={{ padding: '12px 20px', fontSize: 15 }}>🚀 Start learning</Link>
            <Link href="/topics/postgres/lab" className="btn" style={{ padding: '12px 20px', fontSize: 15 }}>🐘 Try real SQL in the browser</Link>
          </div>
        </div>
        <RandomQuestion />
      </section>

      <div style={{ height: 24 }} />

      {/* learn with pictures */}
      {showcase.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <SectionHead kicker="Learn with pictures" title={`${totalVisuals} animated diagrams`} sub="Every big idea has a moving picture. Watch the dot travel and the boxes light up, then open the Visual guide of any topic." />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))' }}>
            {showcase.map(({ slug, v, t }) => (
              <Link key={slug} href={`/topics/${slug}/visuals#v-${v.name}`} className="card-hover" style={{ display: 'block', borderRadius: 20, ['--accent' as string]: t.accent }}>
                <div className="prose-x" style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: v.svg.replace('<figcaption>', `<figcaption>${t.emoji} `) }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* start here */}
      <section id="start" style={{ scrollMarginTop: 80, marginBottom: 48 }}>
        <SectionHead kicker="Start here" title="A suggested learning path" sub="Go top to bottom the first time. Each step builds on the one before. Later, jump anywhere with search (press /)." />
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {path.map((p, i) => {
            const t = bySlug[p.slug];
            return (
              <li key={p.slug}>
                <Link href={`/topics/${t.slug}`} className="panel card-hover" style={{ display: 'flex', gap: 14, padding: 16, alignItems: 'flex-start', ['--accent' as string]: t.accent, height: '100%' }}>
                  <span className="part-num" style={{ background: `linear-gradient(135deg, ${t.accent}, color-mix(in oklab, ${t.accent} 50%, white))` }}>{i + 1}</span>
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
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 5, background: `linear-gradient(90deg, ${t.accent}, color-mix(in oklab, ${t.accent} 40%, var(--brand-2)), transparent)` }} />
                <div style={{ position: 'absolute', right: -40, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in oklab, ${t.accent} 22%, transparent), transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span className="emoji-tile" style={{ fontSize: 30, width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{t.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 750, letterSpacing: '-0.01em' }}>{t.title}</h3>
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.about || t.subtitle}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge">{t.stats.sections} sections</span>
                  {t.stats.cards > 0 && <span className="badge">{t.stats.cards} flashcards</span>}
                  {LABS[t.slug] && <span className="badge">🧪 {LABS[t.slug].length} lab{LABS[t.slug].length === 1 ? '' : 's'}</span>}
                  {t.hasQuiz && <span className="badge">✅ quiz</span>}
                  {!!t.visualCount && <span className="badge">🖼️ {t.visualCount} diagrams</span>}
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
  return ({ 'AI Engineering': 'LLMs, RAG, agents and AI APIs', 'Web Development': 'Frontend and backend JavaScript', '.NET': 'C# and the .NET platform', Databases: 'SQL and NoSQL', Messaging: 'Queues, pub/sub and event streams', 'Coding Interviews': 'Practice problems in C# and JavaScript' } as Record<string, string>)[c] || 'Your notes';
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
