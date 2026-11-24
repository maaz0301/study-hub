'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Card, QuizItem } from '@/lib/types';

type Q = QuizItem & { kind: 'authored' | 'match'; from?: string };

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** "Which answer matches this question?" built from the topic's own flashcards. */
function fromCards(cards: Card[], n: number): Q[] {
  const usable = cards.filter((c) => c.a.length > 30);
  return shuffle(usable).slice(0, n).map((c) => {
    const samePart = usable.filter((x) => x.id !== c.id && x.part === c.part && x.a !== c.a);
    const others = usable.filter((x) => x.id !== c.id && x.part !== c.part && x.a !== c.a);
    const wrong = [...shuffle(samePart), ...shuffle(others)].slice(0, 3).map((x) => x.a);
    const options = shuffle([c.a, ...wrong]);
    return { kind: 'match', q: c.q, options, answer: options.indexOf(c.a), from: c.part };
  });
}

export function Quiz({ authored, cards }: { slug: string; authored: QuizItem[]; cards: Card[] }) {
  const [len, setLen] = useState(10);
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<boolean[]>([]);

  const start = useCallback(() => {
    const a: Q[] = shuffle(authored).slice(0, Math.ceil(len / 2)).map((x) => {
      const order = shuffle(x.options.map((_, k) => k));
      return { ...x, kind: 'authored' as const, options: order.map((k) => x.options[k]), answer: order.indexOf(x.answer) };
    });
    const rest = fromCards(cards, len - a.length);
    setQs(shuffle([...a, ...rest]).slice(0, len));
    setI(0);
    setPicked(null);
    setScore(0);
    setLog([]);
  }, [authored, cards, len]);

  useEffect(() => start(), [start]);

  const q = qs[i];
  const done = qs.length > 0 && i >= qs.length;

  const choose = (k: number) => {
    if (picked !== null || !q) return;
    setPicked(k);
    const ok = k === q.answer;
    if (ok) setScore((s) => s + 1);
    setLog((l) => [...l, ok]);
  };
  const next = () => {
    setI((x) => x + 1);
    setPicked(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || /^(SELECT|INPUT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) return;
      if (/^[1-4]$/.test(e.key)) choose(Number(e.key) - 1);
      else if (e.key === 'Enter' && picked !== null) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });


  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <span className="muted" style={{ fontSize: 14 }}>Questions:</span>
        {[5, 10, 20].map((n) => <button key={n} className={`chip ${len === n ? 'on' : ''}`} onClick={() => setLen(n)}>{n}</button>)}
        <button className="btn btn-sm" onClick={start}>↻ Restart</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {qs.map((_, k) => (
          <div key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < log.length ? (log[k] ? 'var(--ok)' : 'var(--bad)') : k === i ? 'var(--accent)' : 'var(--border)' }} />
        ))}
      </div>

      {done ? (
        <div className="panel" style={{ padding: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>{score / qs.length >= 0.8 ? '🏆' : score / qs.length >= 0.5 ? '💪' : '📖'}</div>
          <h3 style={{ fontSize: 26, margin: '8px 0' }}>{score} / {qs.length}</h3>
          <p className="muted">{score / qs.length >= 0.8 ? 'Excellent — interview ready on this topic.' : score / qs.length >= 0.5 ? 'Good. Review the ones you missed and go again.' : 'Read the parts again, then retry. You will get there.'}</p>
          <button className="btn btn-primary" onClick={start}>Another round →</button>
        </div>
      ) : q ? (
        <div className="panel" style={{ padding: 'clamp(18px, 3vw, 30px)' }}>
          <div className="faint" style={{ fontSize: 13, marginBottom: 8 }}>
            Question {i + 1} of {qs.length} · {q.kind === 'match' ? `Pick the answer that fits · ${q.from}` : 'Multiple choice'}
          </div>
          <h3 style={{ margin: '0 0 18px', fontSize: 'clamp(17px, 2.2vw, 21px)', lineHeight: 1.4 }}>{q.q}</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {q.options.map((o, k) => {
              const state = picked === null ? 'idle' : k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim';
              return (
                <button key={k} onClick={() => choose(k)} disabled={picked !== null}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: picked === null ? 'pointer' : 'default', display: 'flex', gap: 12,
                    fontSize: q.kind === 'match' ? 14 : 15, lineHeight: 1.5, color: 'var(--text)', transition: 'all .15s',
                    border: `1.5px solid ${state === 'right' ? 'var(--ok)' : state === 'wrong' ? 'var(--bad)' : 'var(--border)'}`,
                    background: state === 'right' ? 'color-mix(in oklab, var(--ok) 10%, var(--panel))' : state === 'wrong' ? 'color-mix(in oklab, var(--bad) 9%, var(--panel))' : 'var(--panel-2)',
                    opacity: state === 'dim' ? 0.55 : 1,
                  }}>
                  <span className="kbd" style={{ height: 'fit-content' }}>{k + 1}</span>
                  <span style={{ flex: 1 }}>{o}</span>
                  {state === 'right' && <span>✅</span>}
                  {state === 'wrong' && <span>❌</span>}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="sec-body" style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14.5 }}>
                <b style={{ color: picked === q.answer ? 'var(--ok)' : 'var(--bad)' }}>{picked === q.answer ? 'Correct! ' : 'Not quite. '}</b>
                <span className="muted">{q.explain || ''}</span>
              </span>
              <button className="btn btn-primary" onClick={next}>{i + 1 >= qs.length ? 'See score' : 'Next →'} <span className="kbd" style={{ color: 'white', background: 'transparent' }}>Enter</span></button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
