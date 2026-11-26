import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { getIndex } from '@/lib/content';
import { ScrollTop } from '@/components/ScrollTop';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: 'Study Hub — interview prep you can play with', template: '%s · Study Hub' },
  description: 'Interactive study guides for GenAI & RAG, Voice AI, FastAPI, React & Node, C#, .NET, MongoDB and PostgreSQL.',
};

const themeScript = `(function(){var t=null;try{t=localStorage.getItem('study-hub-theme')}catch(e){}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const topics = getIndex().map((t) => ({ slug: t.slug, title: t.title, emoji: t.emoji, accent: t.accent, category: t.category, subtitle: t.subtitle }));
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Navbar topics={topics} />
        <main>{children}</main>
        <ScrollTop />
        <footer className="container-x" style={{ padding: '56px 16px 40px' }}>
          <div className="site-foot">
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Study<span className="gradient-text">Hub</span></div>
              <div className="faint" style={{ fontSize: 13, marginTop: 4 }}>{topics.length} topics · interview prep you can play with</div>
            </div>
            <nav className="foot-links" aria-label="Footer">
              <Link href="/">Home</Link>
              {topics.slice(0, 5).map((t) => <Link key={t.slug} href={`/topics/${t.slug}`}>{t.emoji} {t.title.split(/[,&:(]/)[0].trim()}</Link>)}
              <a href="https://github.com/maaz0301/study-hub" target="_blank" rel="noreferrer">GitHub ↗</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
