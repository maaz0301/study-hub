'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Section } from '@/lib/types';
import { progress, useProgress } from '@/lib/progress';

type Props = { slug: string; partId: string; sections: Section[]; layout: 'qa' | 'lessons' };

export function PartReader({ slug, partId, sections, layout }: Props) {
  const p = useProgress();
  const key = (s: Section) => `${slug}/${partId}/${s.id}`;
  const defaultOpen = useCallback(
    (s: Section) => !s.isQuestion && layout !== 'lessons' && sections.length <= 8,
    [layout, sections.length],
  );
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(sections.map((s) => [s.id, defaultOpen(s)])));
  const [filter, setFilter] = useState('');
  const [hideDone, setHideDone] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // open + scroll to #hash (search results, deep links)
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id || !sections.some((s) => s.id === id)) return;
      setOpen((o) => ({ ...o, [id]: true }));
      setFlash(id);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
      setTimeout(() => setFlash(null), 1700);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [sections]);

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return sections.filter((s) => {
      if (hideDone && p.done[key(s)]) return false;
      if (!f) return true;
      return s.title.toLowerCase().includes(f) || s.summary.toLowerCase().includes(f) || s.html.toLowerCase().includes(f);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, filter, hideDone, p.done]);

  const doneCount = sections.filter((s) => p.done[key(s)]).length;
  const allOpen = visible.every((s) => open[s.id]);
  const qCount = sections.filter((s) => s.isQuestion).length;

  let lastGroup: string | null | undefined;
  return (
    <div>
      <div className="panel" style={{ padding: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14, position: 'sticky', top: 72, zIndex: 5 }}>
        <input className="input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Filter ${sections.length} sections…`} style={{ flex: '1 1 200px', padding: '7px 12px' }} />
        <button className="btn btn-sm" onClick={() => setOpen(Object.fromEntries(sections.map((s) => [s.id, !allOpen])))}>
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
        <button className={`chip ${hideDone ? 'on' : ''}`} onClick={() => setHideDone((h) => !h)}>Hide learned</button>
        <span className="faint" style={{ fontSize: 12.5, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          ✔ {doneCount}/{sections.length} learned
        </span>
      </div>
      {qCount > 0 && layout !== 'lessons' && (
        <p className="faint" style={{ fontSize: 13, margin: '0 0 12px' }}>
          💡 Self-test: read the question, answer it out loud, then click to open the answer. Tick ✔ when you know it.
        </p>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {visible.map((s, i) => {
          const showGroup = s.group && s.group !== lastGroup && s.group !== s.title;
          lastGroup = s.group;
          return (
            <div key={s.id}>
              {showGroup && <div style={{ fontSize: 12, fontWeight: 750, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent)', margin: i ? '18px 4px 8px' : '0 4px 8px' }}>{s.group}</div>}
              <SectionCard
                s={s}
                open={!!open[s.id]}
                done={!!p.done[key(s)]}
                flash={flash === s.id}
                onToggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                onDone={() => progress.toggleDone(key(s))}
              />
            </div>
          );
        })}
        {!visible.length && <div className="panel muted" style={{ padding: 24, textAlign: 'center' }}>Nothing matches. {hideDone && 'You may have hidden learned sections.'}</div>}
      </div>
      {sections.length > 1 && doneCount < sections.length && (
        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <button className="btn btn-sm btn-ghost" onClick={() => progress.markMany(sections.map(key), true)}>Mark whole part as learned</button>
        </div>
      )}
    </div>
  );
}

const SectionCard = memo(function SectionCard({ s, open, done, flash, onToggle, onDone }: {
  s: Section; open: boolean; done: boolean; flash: boolean; onToggle: () => void; onDone: () => void;
}) {
  return (
    <article id={s.id} className={`panel sec-card ${flash ? 'flash-target' : ''}`} data-open={open}
      style={{ overflow: 'hidden', borderColor: done ? 'color-mix(in oklab, var(--ok) 40%, var(--border))' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px' }}>
        <button onClick={onDone} aria-pressed={done} title={done ? 'Learned — click to undo' : 'Mark as learned'}
          style={{ flexShrink: 0, width: 24, height: 24, marginTop: 1, borderRadius: 8, cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800,
            border: `1.5px solid ${done ? 'var(--ok)' : 'var(--border-2)'}`, background: done ? 'var(--ok)' : 'transparent', color: 'white', transition: 'all .15s' }}>
          {done ? '✓' : ''}
        </button>
        <button onClick={onToggle} aria-expanded={open}
          style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--text)' }}>
          <span style={{ flex: 1, fontWeight: 650, fontSize: 15.5, lineHeight: 1.45 }}>
            {s.isQuestion && <span style={{ color: 'var(--accent)', marginRight: 6 }}>Q</span>}
            {s.title}
          </span>
          <span className="chev faint" style={{ fontSize: 14, marginTop: 3 }}>▶</span>
        </button>
      </div>
      {open && <Body html={s.html} />}
    </article>
  );
});

function Body({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('pre.code-block').forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;
      const b = document.createElement('button');
      b.className = 'copy-btn';
      b.textContent = 'Copy';
      b.onclick = async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || '');
          b.textContent = 'Copied ✓';
        } catch {
          b.textContent = 'Press Ctrl+C';
        }
        setTimeout(() => (b.textContent = 'Copy'), 1400);
      };
      pre.appendChild(b);
    });
  }, [html]);
  return <div ref={ref} className="prose-x sec-body sec-pad" dangerouslySetInnerHTML={{ __html: html }} />;
}
