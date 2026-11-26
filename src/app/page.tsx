import Link from 'next/link';
import { categories, getIndex, getTopic } from '@/lib/content';
import { LABS } from '@/lib/labs';
import { RandomQuestion } from '@/components/RandomQuestion';
import { CountUp, RotatingWord, Typer } from '@/components/HomeFx';

const TRY_IT = [
  { slug: 'redis', href: '/topics/redis/lab', emoji: '🔴', title: 'Redis console', blurb: 'Type real Redis commands: lists, streams, consumer groups.', cmd: 'XADD orders * userId 7 total 59', color: '#f43f5e' },
  { slug: 'postgres', href: '/topics/postgres/lab', emoji: '🐘', title: 'Real PostgreSQL', blurb: 'A full Postgres running inside your browser tab.', cmd: 'SELECT city, SUM(total) FROM orders GROUP BY 1', color: '#3b82f6' },
  { slug: 'leetcode', href: '/topics/leetcode/lab', emoji: '🧩', title: 'Algorithm visualizer', blurb: 'Type your own input and watch the pointers move.', cmd: 'L→ 1 3 4 6 8 11 ←R   sum = 10 ✓', color: '#eab308' },
  { slug: 'agentic-langchain', href: '/topics/agentic-langchain/lab', emoji: '🤖', title: 'LangGraph agent run', blurb: 'Step through an agent: tools, failures, human approval.', cmd: 'agent → create_refund → ⏸ approve?', color: '#f97316' },
  { slug: 'dotnet', href: '/topics/dotnet/lab', emoji: '🔷', title: 'Middleware pipeline', blurb: 'Reorder ASP.NET middleware and send a request.', cmd: 'UseAuthentication → UseAuthorization → 200 OK', color: '#6366f1' },
  { slug: 'cicd', href: '/topics/cicd/lab', emoji: '🚀', title: 'CI/CD pipeline simulator', blurb: 'Break a test and see which stages are skipped.', cmd: 'push → lint ✓ test ✗ → build skipped', color: '#0ea5e9' },
  { slug: 'n8n', href: '/topics/n8n/lab', emoji: '⚙️', title: 'n8n workflow runner', blurb: 'Step through a workflow and see every node\'s JSON.', cmd: 'Webhook → IF budget > 1000 → Slack', color: '#ea4b71' },
  { slug: 'mongodb', href: '/topics/mongodb/lab', emoji: '🍃', title: 'MongoDB playground', blurb: 'Run aggregation pipelines on sample data.', cmd: 'db.orders.aggregate([{ $match: … }])', color: '#22c55e' },
];
const FLOATERS = [['🧠', 56, 2, 0], ['📨', 93, 3, 1.2], ['🐘', 97, 50, 2.1], ['🍃', 57, 90, 0.6], ['⚛️', 86, 92, 1.8], ['🔷', 74, 1, 2.7], ['🤖', 47, 94, 3.2], ['🎙️', 98, 80, 0.3]] as const;

const PATH = [
  { slug: 'csharp', why: 'Learn the language: types, loops, classes, collections.' },
  { slug: 'leetcode', why: 'Practice coding problems in C# and JavaScript.' },
  { slug: 'dotnet', why: 'Build web APIs: DI, middleware, EF Core, async.' },
  { slug: 'postgres', why: 'Relational data: SQL, joins, indexes, transactions.' },
  { slug: 'redis', why: 'Pub/Sub, queues and Streams with Node.js.' },
  { slug: 'mqtt', why: 'The IoT messaging protocol: topics, QoS, sessions.' },
  { slug: 'kafka', why: 'Event streaming: partitions and consumer groups.' },
  { slug: 'messaging', why: 'Compare them and learn the patterns.' },
  { slug: 'cicd', why: 'Automate build, test and release with GitHub Actions.' },
  { slug: 'n8n', why: 'Automate work between apps with workflows.' },
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
  const totalQuestions = index.reduce((n, t) => n + t.stats.questions, 0);
  const tryIt = TRY_IT.filter((x) => bySlug[x.slug]);
  const stats = [
    { n: index.length, label: 'topics', icon: '📚', c: '#8b5cf6' },
    { n: totals.s, label: 'sections', icon: '🧩', c: '#06b6d4' },
    { n: totalQuestions, label: 'interview questions', icon: '🎯', c: '#f59e0b' },
    { n: totalVisuals, label: 'animated diagrams', icon: '🖼️', c: '#ec4899' },
    { n: labCount, label: 'hands-on labs', icon: '🧪', c: '#10b981' },
  ];

  return (
    <div className="container-x">
      {/* hero */}
      <section style={{ padding: '56px 0 28px', display: 'grid', gap: 28, position: 'relative' }} className="lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div className="floaters" aria-hidden>
          {FLOATERS.map(([e, x, y, d], k) => <span key={k} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }}>{e}</span>)}
        </div>
        <div style={{ position: 'relative' }}>
          <span className="badge" style={{ marginBottom: 16 }}>✨ {index.length} topics · {totals.s} sections · {labCount} hands-on labs</span>
          <h1 style={{ fontSize: 'clamp(34px, 5.4vw, 60px)', lineHeight: 1.04, letterSpacing: '-0.035em', fontWeight: 850, margin: '14px 0 16px' }}>
            Interview prep you can <RotatingWord words={['play with', 'run live', 'see in motion', 'actually master']} />
          </h1>
          <p className="muted" style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
            Your notes on GenAI, RAG, agents & LangChain, Voice AI, Redis/MQTT/Kafka, n8n, CI/CD, FastAPI, React, Node, C#, .NET, MongoDB and PostgreSQL, turned into one place to read, watch as animated diagrams, test yourself with quizzes, and run as real code in your browser.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="#start" className="btn btn-primary" style={{ padding: '12px 20px', fontSize: 15 }}>🚀 Start learning</Link>
            <Link href="/topics/postgres/lab" className="btn" style={{ padding: '12px 20px', fontSize: 15 }}>🐘 Try real SQL in the browser</Link>
            <Link href="/topics/cicd" className="btn" style={{ padding: '12px 20px', fontSize: 15 }}>🚀 New: n8n · CI/CD · Kafka</Link>
          </div>
        </div>
        <RandomQuestion />
      </section>

      {/* topic ticker */}
      <div className="marquee" aria-label="All topics">
        <div className="marquee-track">
          {[...index, ...index].map((t, k) => (
            <Link key={k} href={`/topics/${t.slug}`} className="marquee-chip" style={{ ['--accent' as string]: t.accent }} tabIndex={k >= index.length ? -1 : 0}>
              <span>{t.emoji}</span>{t.title}
            </Link>
          ))}
        </div>
      </div>

      {/* animated stats */}
      <section className="stat-strip" aria-label="Site statistics">
        {stats.map((x) => (
          <div key={x.label} className="stat-tile" style={{ ['--accent' as string]: x.c }}>
            <div className="stat-ico">{x.icon}</div>
            <div className="stat-num"><CountUp to={x.n} /></div>
            <div className="stat-label">{x.label}</div>
          </div>
        ))}
      </section>

      {/* try it now */}
      <section style={{ marginBottom: 48 }}>
        <SectionHead kicker="Try it now" title="Don’t just read it. Run it." sub="Real tools running in your browser: no install, no sign-up." />
        <div className="try-grid">
          {tryIt.map((x, i) => (
            <Link key={x.slug} href={x.href} className="try-card" style={{ ['--accent' as string]: x.color, animationDelay: `${i * 0.07}s` }}>
              <div className="try-top">
                <span className="try-emoji">{x.emoji}</span>
                <span className="try-go">Open lab →</span>
              </div>
              <h3>{x.title}</h3>
              <p>{x.blurb}</p>
              <div className="try-term"><span className="try-prompt">$</span> <Typer text={x.cmd} /></div>
            </Link>
          ))}
        </div>
      </section>

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
          <span>② a 10-question quiz (10 min)</span>
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
                  {(t.lessonCount || 0) >= 3 && <span className="badge">📖 {t.lessonCount} lessons</span>}
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
          Headings become parts and sections, questions become quiz items, and the file shows up in search. Set its title, emoji and colour in <code>content/topics.json</code>.
        </p>
      </section>
    </div>
  );
}

function catTitle(c: string) {
  return ({ 'AI Engineering': 'LLMs, RAG, agents and AI APIs', 'Web Development': 'Frontend and backend JavaScript', '.NET': 'C# and the .NET platform', Databases: 'SQL and NoSQL', Messaging: 'Queues, pub/sub and event streams', Automation: 'Automate work between your apps', DevOps: 'Build, test and ship automatically', 'Coding Interviews': 'Practice problems in C# and JavaScript' } as Record<string, string>)[c] || 'Your notes';
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
