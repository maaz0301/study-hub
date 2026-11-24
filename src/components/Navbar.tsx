'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CommandPalette } from './CommandPalette';

type T = { slug: string; title: string; emoji: string; accent: string; category: string; subtitle: string };

const HEADER_H = 64;

export function Navbar({ topics }: { topics: T[] }) {
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const path = usePathname() || '';
  const current = topics.find((t) => path.split('/')[2] === t.slug);

  // group topics by category, keeping the order they appear in
  const groups = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const t of topics) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return [...map.entries()];
  }, [topics]);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || null);
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMenu(false);
        setSearch((o) => !o);
      } else if (e.key === '/' && !/input|textarea|select/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setMenu(false);
        setSearch(true);
      } else if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  const toggleTheme = () => {
    const dark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('study-hub-theme', next); } catch {}
    setTheme(next);
  };

  return (
    <>
      <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderWidth: '0 0 1px 0' }}>
        <div className="container-x" style={{ display: 'flex', alignItems: 'center', gap: 10, height: HEADER_H }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', flexShrink: 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand), var(--brand-2))', color: 'white', fontSize: 17, boxShadow: '0 6px 16px -6px var(--brand)' }}>◆</span>
            <span>Study<span className="gradient-text">Hub</span></span>
          </Link>

          <button className="nav-topics" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="true" style={{ marginLeft: 6 }}>
            <GridIcon />
            <span>Topics</span>
            <span style={{ fontSize: 10, transition: 'transform .2s', transform: menu ? 'rotate(180deg)' : undefined }}>▼</span>
          </button>

          {current && (
            <Link href={`/topics/${current.slug}`} className="nav-current hidden md:inline-flex" style={{ ['--accent' as string]: current.accent }} title={current.title}>
              <span>{current.emoji}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.title}</span>
            </Link>
          )}

          <div style={{ flex: 1 }} />

          <button className="btn btn-sm" onClick={() => { setMenu(false); setSearch(true); }} aria-label="Search" style={{ minWidth: 0, flexShrink: 0 }}>
            <SearchIcon />
            <span className="hidden sm:inline muted" style={{ fontWeight: 500 }}>Search</span>
            <span className="kbd hidden sm:inline">Ctrl K</span>
          </button>
          <button className="btn btn-sm btn-ghost" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme" style={{ flexShrink: 0 }}>
            <span className="dark:hidden">🌙</span><span className="hidden dark:inline">☀️</span>
          </button>
        </div>
      </header>

      {menu && (
        <>
          <div onClick={() => setMenu(false)} aria-hidden style={{ position: 'fixed', inset: `${HEADER_H}px 0 0 0`, zIndex: 48, background: 'rgb(5 8 20 / .5)', backdropFilter: 'blur(4px)' }} />
          <div role="menu" aria-label="All topics" style={{ position: 'fixed', top: HEADER_H, left: 0, right: 0, zIndex: 49, padding: '10px 0 0' }}>
            <div className="container-x">
              <div className="panel mega thin-scroll" style={{ padding: 18, maxHeight: `calc(100vh - ${HEADER_H + 24}px)`, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                <div className="mega-grid">
                  {groups.map(([cat, list]) => (
                    <section key={cat}>
                      <div className="mega-cat">{cat}</div>
                      <div style={{ display: 'grid', gap: 2 }}>
                        {list.map((t) => (
                          <Link key={t.slug} href={`/topics/${t.slug}`} role="menuitem" className="mega-link" data-on={current?.slug === t.slug} style={{ ['--accent' as string]: t.accent }}>
                            <span className="mega-ico">{t.emoji}</span>
                            <span style={{ minWidth: 0 }}>
                              <span className="mega-title">{t.title}</span>
                              <span className="mega-sub">{t.subtitle}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <Link href="/" className="btn btn-sm">🏠 Home</Link>
                  <button className="btn btn-sm" onClick={() => { setMenu(false); setSearch(true); }}>🔎 Search everything</button>
                  <span className="faint" style={{ fontSize: 12.5, marginLeft: 'auto' }}>{topics.length} topics · press <span className="kbd">Esc</span> to close</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {search && <CommandPalette onClose={() => setSearch(false)} topics={topics} />}
    </>
  );
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}
