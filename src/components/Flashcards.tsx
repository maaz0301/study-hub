'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Card } from '@/lib/types';
import { progress, useProgress } from '@/lib/progress';

const BOXES = ['New / again', 'Learning', 'Getting there', 'Known', 'Mastered'];

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function Flashcards({ slug, cards }: { slug: string; cards: Card[] }) {
  const p = useProgress();
  const parts = useMemo(() => [...new Set(cards.map((c) => c.part))], [cards]);
  const [part, setPart] = useState('all');
  const [mode, setMode] = useState<'due' | 'all'>('due');
  const [deck, setDeck] = useState<Card[]>([]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState({ knew: 0, again: 0 });

  const cid = (c: Card) => `${slug}:${c.id}`;

  const build = useCallback(() => {
    let pool = part === 'all' ? cards : cards.filter((c) => c.part === part);
    if (mode === 'due') {
      // weakest boxes first; mastered cards only show up occasionally
      const st = progress.get().cards;
      pool = pool.filter((c) => (st[cid(c)]?.box ?? 0) < 4 || Math.random() < 0.15);
      pool = shuffle(pool).sort((a, b) => (st[cid(a)]?.box ?? 0) - (st[cid(b)]?.box ?? 0));
    } else pool = shuffle(pool);
    setDeck(pool.slice(0, 20));
    setI(0);
    setFlipped(false);
    setSession({ knew: 0, again: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, part, mode]);

  useEffect(() => build(), [build]);

  const card = deck[i];
  const finished = deck.length > 0 && i >= deck.length;

  const rate = useCallback((knew: boolean) => {
    if (!card) return;
    progress.rateCard(cid(card), knew);
    setSession((s) => (knew ? { ...s, knew: s.knew + 1 } : { ...s, again: s.again + 1 }));
    setFlipped(false);
    setTimeout(() => setI((x) => x + 1), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(SELECT|INPUT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && e.key === 'ArrowRight') rate(true);
      else if (flipped && e.key === 'ArrowLeft') rate(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  const boxCounts = useMemo(() => {
    const out = [0, 0, 0, 0, 0];
    for (const c of cards) out[p.cards[cid(c)]?.box ?? 0]++;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, p.cards]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select className="input" value={part} onChange={(e) => setPart(e.target.value)} style={{ width: 'auto', maxWidth: '100%', flex: '1 1 220px' }}>
          <option value="all">All parts ({cards.length} cards)</option>
          {parts.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className={`chip ${mode === 'due' ? 'on' : ''}`} onClick={() => setMode('due')}>Weakest first</button>
        <button className={`chip ${mode === 'all' ? 'on' : ''}`} onClick={() => setMode('all')}>Random</button>
        <button className="btn btn-sm" onClick={build}>↻ New deck</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }} title="Cards in each Leitner box">
        {boxCounts.map((n, b) => (
          <div key={b} style={{ flex: Math.max(n, 0.3), minWidth: 0 }}>
            <div style={{ height: 8, borderRadius: 4, background: `color-mix(in oklab, var(--accent) ${20 + b * 20}%, var(--border))` }} />
            <div className="faint" style={{ fontSize: 11, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{BOXES[b]} · {n}</div>
          </div>
        ))}
      </div>

      {finished ? (
        <div className="panel" style={{ padding: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <h3 style={{ fontSize: 22, margin: '8px 0' }}>Deck done!</h3>
          <p className="muted">You knew <b style={{ color: 'var(--ok)' }}>{session.knew}</b> and will see <b style={{ color: 'var(--warn)' }}>{session.again}</b> again soon.</p>
          <button className="btn btn-primary" onClick={build}>Next deck →</button>
        </div>
      ) : card ? (
        <>
          <div className="faint" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Card {i + 1} / {deck.length} · {card.part}</span>
            <span>Box: {BOXES[p.cards[cid(card)]?.box ?? 0]}</span>
          </div>
          <div className="progress" style={{ marginBottom: 14 }}><i style={{ width: `${(i / deck.length) * 100}%` }} /></div>
          <div className={`flip ${flipped ? 'flipped' : ''}`} style={{ height: 'min(56vh, 420px)', cursor: 'pointer' }} onClick={() => setFlipped((f) => !f)}>
            <div className="flip-inner">
              <div className="flip-face panel thin-scroll" style={{ padding: 'clamp(20px, 4vw, 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                background: `linear-gradient(145deg, color-mix(in oklab, var(--accent) 10%, var(--panel)), var(--panel))` }}>
                <span className="badge" style={{ marginBottom: 18 }}>Question</span>
                <div style={{ fontSize: 'clamp(19px, 2.6vw, 26px)', fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.01em' }}>{card.q}</div>
                <div className="faint" style={{ marginTop: 24, fontSize: 13 }}>Click or press <span className="kbd">Space</span> to flip</div>
              </div>
              <div className="flip-face flip-back panel thin-scroll" style={{ padding: 'clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column' }}>
                <span className="badge" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>Answer</span>
                <div className="faint" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>{card.q}</div>
                <div style={{ fontSize: 'clamp(15px, 1.9vw, 17.5px)', lineHeight: 1.65, flex: 1 }}>{card.a}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            {flipped ? (
              <>
                <button className="btn" style={{ minWidth: 150, borderColor: 'color-mix(in oklab, var(--warn) 60%, var(--border))' }} onClick={() => rate(false)}>😬 Again <span className="kbd">←</span></button>
                <button className="btn btn-primary" style={{ minWidth: 150, background: 'var(--ok)' }} onClick={() => rate(true)}>😎 I knew it <span className="kbd" style={{ color: 'white', background: 'transparent' }}>→</span></button>
              </>
            ) : (
              <button className="btn btn-primary" style={{ minWidth: 200 }} onClick={() => setFlipped(true)}>Show answer</button>
            )}
          </div>
        </>
      ) : (
        <div className="panel muted" style={{ padding: 30, textAlign: 'center' }}>No cards here yet.</div>
      )}
    </div>
  );
}
