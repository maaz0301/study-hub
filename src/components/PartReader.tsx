'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Section } from '@/lib/types';

type Props = { slug: string; partId: string; sections: Section[]; layout: 'qa' | 'lessons' };

const LANG_NAME: Record<string, string> = { csharp: 'C#', javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', sql: 'SQL' };
const LANG_KEY = 'study-hub-code-lang';

export function PartReader({ sections, layout }: Props) {
  const defaultOpen = useCallback(
    (s: Section) => !s.lesson && ((!s.isQuestion && layout !== 'lessons' && sections.length <= 8) || (!!s.hasVisual && !s.isQuestion && layout !== 'lessons')),
    [layout, sections.length],
  );
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(sections.map((s) => [s.id, defaultOpen(s)])));
  const [filter, setFilter] = useState('');
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
    if (!f) return sections;
    return sections.filter((s) => s.title.toLowerCase().includes(f) || s.summary.toLowerCase().includes(f) || s.html.toLowerCase().includes(f));
  }, [sections, filter]);

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
      </div>
      {qCount > 0 && layout !== 'lessons' && (
        <p className="faint" style={{ fontSize: 13, margin: '0 0 12px' }}>
          💡 Self-test: read the question, answer it out loud, then click to open the answer.
        </p>
      )}

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {visible.map((s, i) => {
          const showGroup = s.group && s.group !== lastGroup && s.group !== s.title;
          lastGroup = s.group;
          return (
            <div key={s.id}>
              {showGroup && <div style={{ fontSize: 12, fontWeight: 750, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent)', margin: i ? '18px 4px 8px' : '0 4px 8px' }}>{s.group}</div>}
              <SectionCard s={s} open={!!open[s.id]} flash={flash === s.id} onToggle={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} />
            </div>
          );
        })}
        {!visible.length && <div className="panel muted" style={{ padding: 24, textAlign: 'center' }}>Nothing matches.</div>}
      </div>
    </div>
  );
}

const SectionCard = memo(function SectionCard({ s, open, flash, onToggle }: { s: Section; open: boolean; flash: boolean; onToggle: () => void }) {
  return (
    <article id={s.id} className={`panel sec-card ${flash ? 'flash-target' : ''}`} data-open={open} style={{ overflow: 'hidden' }}>
      <button onClick={onToggle} aria-expanded={open}
        style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', background: 'none', border: 0, padding: '13px 16px', cursor: 'pointer', color: 'var(--text)' }}>
        <span style={{ flex: 1, fontWeight: 650, fontSize: 15.5, lineHeight: 1.45 }}>
          {s.isQuestion && <span className="q-pill">Q</span>}
          {s.title}
          {s.hasVisual && <span className="pic-pill">🖼️ picture</span>}
          {s.html.includes('class="code-tabs"') && <span className="pic-pill" style={{ color: 'color-mix(in oklab, #a855f7 80%, var(--text))', background: 'color-mix(in oklab, #a855f7 15%, transparent)' }}>C# + JS</span>}
        </span>
        <span className="chev faint" style={{ fontSize: 14, marginTop: 3 }}>▶</span>
      </button>
      {open && <Body html={s.html} />}
    </article>
  );
});

export function Body({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    enhance(el);
    // React can re-apply the HTML after this effect (hydration, fast refresh): enhance again when that happens
    const mo = new MutationObserver(() => enhance(el));
    mo.observe(el, { childList: true });
    return () => mo.disconnect();
  }, [html]);
  return <div ref={ref} className="prose-x sec-body sec-pad" dangerouslySetInnerHTML={{ __html: html }} />;
}

function enhance(el: HTMLElement) {
  {
    // copy buttons
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
    // C# / JavaScript tabs (remembers your last choice)
    let preferred = 'csharp';
    try { preferred = localStorage.getItem(LANG_KEY) || 'csharp'; } catch {}
    el.querySelectorAll<HTMLElement>('.code-tabs').forEach((box) => {
      if (box.classList.contains('ready')) return;
      const pres = [...box.querySelectorAll<HTMLElement>(':scope > pre.code-block')];
      if (pres.length < 2) return;
      const bar = document.createElement('div');
      bar.className = 'tab-bar';
      bar.setAttribute('role', 'tablist');
      const show = (lang: string) => {
        const target = pres.find((p) => p.dataset.lang === lang) || pres[0];
        pres.forEach((p) => p.classList.toggle('active', p === target));
        bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.lang === target.dataset.lang)));
      };
      pres.forEach((p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.lang = p.dataset.lang || '';
        b.setAttribute('role', 'tab');
        b.textContent = LANG_NAME[p.dataset.lang || ''] || p.dataset.lang || 'code';
        b.onclick = () => {
          show(b.dataset.lang!);
          try { localStorage.setItem(LANG_KEY, b.dataset.lang!); } catch {}
        };
        bar.appendChild(b);
      });
      box.prepend(bar);
      box.classList.add('ready');
      show(preferred);
    });
  }
}
