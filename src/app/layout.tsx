import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { getIndex } from '@/lib/content';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: { default: 'Study Hub — interview prep you can play with', template: '%s · Study Hub' },
  description: 'Interactive study guides for GenAI & RAG, Voice AI, FastAPI, React & Node, C#, .NET, MongoDB and PostgreSQL.',
};

const themeScript = `(function(){var t=null;try{t=localStorage.getItem('study-hub-theme')}catch(e){}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const topics = getIndex().map((t) => ({ slug: t.slug, title: t.title, emoji: t.emoji, accent: t.accent }));
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Navbar topics={topics} />
        <main>{children}</main>
        <footer className="container-x" style={{ padding: '48px 16px 40px' }}>
          <div className="faint" style={{ fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            Study Hub · built from your own notes
          </div>
        </footer>
      </body>
    </html>
  );
}
