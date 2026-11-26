'use client';
import Link from 'next/link';
import { useState } from 'react';

type Item = { slug: string; why: string; title: string; emoji: string; accent: string };
type Stage = { stage: string; note: string; items: Item[] };
export type Track = { id: string; label: string; icon: string; blurb: string; stages: Stage[] };

/** A numbered learning path with a switch between tracks (Full Stack, AI Engineer, or both combined). */
export function Roadmap({ tracks }: { tracks: Track[] }) {
  const [id, setId] = useState(tracks[0].id);
  const track = tracks.find((t) => t.id === id) ?? tracks[0];
  let n = 0;
  const total = track.stages.reduce((a, s) => a + s.items.length, 0);

  return (
    <div>
      <div className="road-tabs" role="tablist" aria-label="Learning path">
        {tracks.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === id} className="road-tab" data-on={t.id === id} onClick={() => setId(t.id)}>
            <span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <p className="muted" style={{ margin: '0 0 18px', fontSize: 14.5 }}>{track.blurb} <b style={{ color: 'var(--text)' }}>{total} steps.</b></p>

      <ol className="road" key={track.id}>
        {track.stages.map((g, gi) => (
          <li key={g.stage} className="road-stage">
            <div className="road-dot">{gi + 1}</div>
            <div className="road-head"><b>{g.stage}</b><span className="muted"> · {g.note}</span></div>
            <div className="road-row">
              {g.items.map((p, k) => (
                <div key={p.slug} className="road-item">
                  <Link href={`/topics/${p.slug}`} className="panel card-hover road-card" style={{ ['--accent' as string]: p.accent }}>
                    <span className="part-num" style={{ background: `linear-gradient(135deg, ${p.accent}, color-mix(in oklab, ${p.accent} 50%, white))` }}>{++n}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700 }}>{p.emoji} {p.title}</span>
                      <span className="muted" style={{ display: 'block', fontSize: 13.5, marginTop: 3 }}>{p.why}</span>
                    </span>
                  </Link>
                  {k < g.items.length - 1 && <span className="road-arrow" aria-hidden>➜</span>}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
