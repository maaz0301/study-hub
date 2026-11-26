'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getDevice, setDone, restoreDevice, useProgress } from '@/lib/progress';

const key = (slug: string, n: number) => `${slug}:${n}`;

export function SideMark({ slug, n }: { slug: string; n: number }) {
  const { done } = useProgress();
  return done.has(key(slug, n)) ? <span className="pg-tick" aria-label="completed">✓</span> : null;
}

export function DoneButton({ slug, n, total, nextHref }: { slug: string; n: number; total: number; nextHref?: string }) {
  const { done } = useProgress();
  const on = done.has(key(slug, n));
  return (
    <div className="pg-done">
      <button className={`btn ${on ? '' : 'btn-primary'}`} onClick={() => setDone(key(slug, n), !on)} aria-pressed={on}>
        {on ? '✓ Completed (click to undo)' : '☐ Mark lesson as complete'}
      </button>
      {on && nextHref && <Link href={nextHref} className="btn btn-primary">Next lesson →</Link>}
      {on && !nextHref && n === total && <span className="faint">🎉 You finished the tutorial!</span>}
    </div>
  );
}

export function ProgressBar({ slug, total, compact }: { slug: string; total: number; compact?: boolean }) {
  const { done } = useProgress();
  let count = 0, first = 0;
  for (let i = 1; i <= total; i++) { if (done.has(key(slug, i))) count++; else if (!first) first = i; }
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="pg-bar" data-compact={compact}>
      <div className="pg-track"><div className="pg-fill" style={{ width: `${pct}%` }} /></div>
      <span className="pg-text">{count} of {total} lessons done · {pct}%</span>
      {count > 0 && first > 0 && <Link className="pg-cont" href={`/topics/${slug}/tutorial/${first}`}>Continue: lesson {first} →</Link>}
    </div>
  );
}

export function SyncBox() {
  const { synced, user, ready, configured } = useProgress();
  const path = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const label = synced === 'ok' ? (user ? `☁️ Saved to ${user.email}` : '☁️ Saved online (this device)') : synced === 'syncing' ? '☁️ Syncing…' : synced === 'local' ? '💾 Saved in this browser only' : '';
  return (
    <div className="pg-sync">
      <div className="faint" style={{ fontSize: 12 }}>{label}</div>
      {ready && configured && !user && <Link className="pg-link" href={`/login?next=${encodeURIComponent(path)}`}>Log in to keep your progress →</Link>}
      {!user && <div><button className="pg-link" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Use a sync code instead'}</button></div>}
      {open && !user && (
        <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
          <div style={{ fontSize: 12 }}>Your sync code (keep it private):</div>
          <code style={{ fontSize: 11, wordBreak: 'break-all', userSelect: 'all' }}>{getDevice()}</code>
          <input className="input" placeholder="Paste a code from another device" value={code} onChange={(e) => setCode(e.target.value.trim())} style={{ padding: '6px 8px', fontSize: 12 }} />
          <button className="btn btn-sm" onClick={async () => setMsg((await restoreDevice(code)) ? 'Loaded ✓' : 'That code is not valid')}>Load it</button>
          {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}
