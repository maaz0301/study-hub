'use client';
import { useEffect, useRef, useState } from 'react';
import { KIND_LABEL, type RunKind, reactDoc, runText } from '@/lib/runners';

/** "Try it Yourself": an editable copy of a code snippet that runs in the browser. */
export function TryIt({ kind, initial }: { kind: RunKind; initial: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(initial);
  const [out, setOut] = useState<string | null>(null);
  const [doc, setDoc] = useState('');
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = area.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(420, el.scrollHeight + 2) + 'px'; }
  }, [code, open]);

  const run = async () => {
    if (busy) return;
    if (kind === 'react') { setDoc(reactDoc(code)); setOut(''); return; }
    setBusy(true);
    setOut('Running…');
    try { setOut(await runText(kind, code)); } catch (e) { setOut('❌ ' + (e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="tryit">
      {!open ? (
        <button className="tryit-open" onClick={() => { setOpen(true); setTimeout(run, 60); }}>
          ▶ Try it Yourself <span className="tryit-kind">{KIND_LABEL[kind]}</span>
        </button>
      ) : (
        <div className="tryit-panel sec-body">
          <div className="tryit-bar">
            <b>▶ Try it Yourself</b>
            <span className="tryit-kind">{KIND_LABEL[kind]} · edit the code, then Run</span>
            <span style={{ flex: 1 }} />
            <button className="btn btn-sm btn-primary" onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run ▶'} <span className="kbd" style={{ color: 'white', background: 'transparent' }}>Ctrl+↵</span></button>
            <button className="btn btn-sm" onClick={() => { setCode(initial); setOut(null); setDoc(''); }}>Reset</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="tryit-grid">
            <textarea ref={area} className="tryit-code" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
                if (e.key === 'Tab') { e.preventDefault(); const t = e.currentTarget, s = t.selectionStart; setCode(code.slice(0, s) + '  ' + code.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; }); }
              }} />
            <div className="tryit-result">
              <div className="tryit-label">Result</div>
              {kind === 'react'
                ? (doc ? <iframe title="React preview" sandbox="allow-scripts" srcDoc={doc} className="tryit-frame" /> : <div className="faint" style={{ padding: 12 }}>Press Run to render the component.</div>)
                : <pre className="tryit-out">{out ?? 'Press Run ▶'}</pre>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
