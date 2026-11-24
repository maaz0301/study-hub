'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchIcon } from './Navbar';

// [topic, part, section, title, snippet, partTitle, fullTextWords]
type Row = [string, string, string, string, string, string, string?];
type T = { slug: string; title: string; emoji: string; accent: string };

let cached: Row[] | null = null;

export function CommandPalette({ onClose, topics }: { onClose: () => void; topics: T[] }) {
  const [rows, setRows] = useState<Row[] | null>(cached);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [scope, setScope] = useState<string>('all');
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const tmap = useMemo(() => Object.fromEntries(topics.map((t) => [t.slug, t])), [topics]);

  useEffect(() => {
    input.current?.focus();
    if (!cached) fetch('/search-index.json').then((r) => r.json()).then((d) => { cached = d; setRows(d); });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const results = useMemo(() => {
    if (!rows) return [];
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const pool = scope === 'all' ? rows : rows.filter((r) => r[0] === scope);
    if (!terms.length) return pool.slice(0, 30).map((r) => ({ r, score: 0 }));
    const out: { r: Row; score: number }[] = [];
    for (const r of pool) {
      const title = r[3].toLowerCase();
      const body = r[4].toLowerCase();
      let score = 0;
      let ok = true;
      for (const t of terms) {
        const inT = title.includes(t);
        const inB = body.includes(t) || r[5].toLowerCase().includes(t);
        const inText = !inT && !inB && (r[6] || '').includes(t);
        if (!inT && !inB && !inText) { ok = false; break; }
        score += inT ? (title.startsWith(t) || title.includes(' ' + t) ? 12 : 8) : inB ? 3 : 1;
      }
      if (ok) out.push({ r, score: score - title.length / 200 });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 60);
  }, [rows, q, scope]);

  useEffect(() => setSel(0), [q, scope]);
  useEffect(() => {
    list.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const go = (r: Row) => {
    onClose();
    router.push(`/topics/${r[0]}/${r[1]}#${r[2]}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && results[sel]) go(results[sel].r);
  };

  const hl = (text: string) => {
    const terms = q.trim().split(/\s+/).filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!terms.length) return text;
    const parts = text.split(new RegExp(`(${terms.join('|')})`, 'gi'));
    return parts.map((p, i) => (i % 2 ? <mark key={i} style={{ background: 'color-mix(in oklab, var(--brand) 25%, transparent)', color: 'inherit', borderRadius: 3 }}>{p}</mark> : p));
  };

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgb(5 8 20 / .55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '9vh 12px 12px' }}>
      <div className="panel" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey} role="dialog" aria-label="Search all notes"
        style={{ width: '100%', maxWidth: 720, maxHeight: '78vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <SearchIcon />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 950+ questions and lessons… e.g. “event loop”, “HNSW”, “DbContext”"
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', color: 'var(--text)', fontSize: 16 }} />
          <span className="kbd">Esc</span>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }} className="thin-scroll">
          <button className={`chip ${scope === 'all' ? 'on' : ''}`} onClick={() => setScope('all')}>All</button>
          {topics.map((t) => (
            <button key={t.slug} className={`chip ${scope === t.slug ? 'on' : ''}`} onClick={() => setScope(t.slug)} style={{ flexShrink: 0 }}>
              {t.emoji} {t.title.split(/[,&]/)[0].trim()}
            </button>
          ))}
        </div>
        <div ref={list} style={{ overflowY: 'auto', padding: 8 }} className="thin-scroll">
          {!rows && <div className="muted" style={{ padding: 20 }}>Loading index…</div>}
          {rows && !results.length && <div className="muted" style={{ padding: 20 }}>No matches. Try fewer or different words.</div>}
          {results.map(({ r }, i) => {
            const t = tmap[r[0]];
            return (
              <button key={r[0] + r[1] + r[2]} data-i={i} onClick={() => go(r)} onMouseMove={() => setSel(i)}
                style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: 0, cursor: 'pointer', color: 'var(--text)',
                  background: i === sel ? 'color-mix(in oklab, var(--brand) 12%, var(--panel-2))' : 'transparent' }}>
                <span style={{ fontSize: 20, lineHeight: '24px' }}>{t?.emoji}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14.5 }}>{hl(r[3])}</span>
                  <span className="faint" style={{ display: 'block', fontSize: 12, margin: '2px 0' }}>{t?.title} › {r[5]}</span>
                  {r[4] && <span className="muted" style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hl(r[4])}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="faint" style={{ fontSize: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 14 }}>
          <span><span className="kbd">↑↓</span> move</span><span><span className="kbd">Enter</span> open</span><span><span className="kbd">/</span> or <span className="kbd">Ctrl K</span> anywhere</span>
        </div>
      </div>
    </div>
  );
}
