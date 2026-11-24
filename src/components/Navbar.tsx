'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommandPalette } from './CommandPalette';

type T = { slug: string; title: string; emoji: string; accent: string };

export function Navbar({ topics }: { topics: T[] }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const path = usePathname();

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || null);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !/input|textarea/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setMenu(false), [path]);

  const toggleTheme = () => {
    const dark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('study-hub-theme', next); } catch {}
    setTheme(next);
  };

  return (
    <>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 40, borderWidth: '0 0 1px 0' }}>
        <div className="container-x" style={{ display: 'flex', alignItems: 'center', gap: 12, height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: 'white', fontSize: 17 }}>◆</span>
            <span>Study<span className="gradient-text">Hub</span></span>
          </Link>
          <nav className="hidden lg:flex" style={{ gap: 2, marginLeft: 12 }}>
            {topics.map((t) => {
              const on = path?.startsWith(`/topics/${t.slug}`);
              return (
                <Link key={t.slug} href={`/topics/${t.slug}`} className="btn btn-ghost btn-sm" title={t.title}
                  style={on ? { background: 'var(--panel-2)', borderColor: 'var(--border)' } : undefined}>
                  <span>{t.emoji}</span>
                  <span className="hidden xl:inline">{short(t.title)}</span>
                </Link>
              );
            })}
          </nav>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={() => setOpen(true)} aria-label="Search" style={{ minWidth: 0 }}>
            <SearchIcon />
            <span className="hidden sm:inline muted" style={{ fontWeight: 500 }}>Search</span>
            <span className="kbd hidden sm:inline">Ctrl K</span>
          </button>
          <button className="btn btn-sm btn-ghost" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
            <span className="dark:hidden">🌙</span><span className="hidden dark:inline">☀️</span>
          </button>
          <button className="btn btn-sm btn-ghost lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Topics menu">☰</button>
        </div>
        {menu && (
          <div className="container-x lg:hidden" style={{ paddingBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 6 }}>
            {topics.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`} className="btn btn-sm" style={{ justifyContent: 'flex-start' }}>
                {t.emoji} {t.title}
              </Link>
            ))}
          </div>
        )}
      </header>
      {open && <CommandPalette onClose={() => setOpen(false)} topics={topics} />}
    </>
  );
}

function short(t: string) {
  return t.replace(/ & .*| ,.*|,.*| Lessons.*| Agents$/, '').replace('GenAI', 'GenAI').slice(0, 16);
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}
