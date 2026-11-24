'use client';
import { useEffect, useState } from 'react';
import type { VoiceStep } from '@/lib/types';

export function PipelineLab({ steps }: { steps: VoiceStep[] }) {
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => {
      if (i >= steps.length - 1) setPlay(false);
      else setI(i + 1);
    }, 1800);
    return () => clearTimeout(t);
  }, [play, i, steps.length]);
  if (!steps.length) return <div className="panel muted" style={{ padding: 20 }}>No pipeline data.</div>;
  const s = steps[i];
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className="btn btn-sm" onClick={() => { setPlay(false); setI((x) => Math.max(0, x - 1)); }}>◀ Prev</button>
        <button className="btn btn-primary btn-sm" onClick={() => { if (i >= steps.length - 1) setI(0); setPlay((p) => !p); }}>{play ? '⏸ Pause' : '▶ Play'}</button>
        <button className="btn btn-sm" onClick={() => { setPlay(false); setI((x) => Math.min(steps.length - 1, x + 1)); }}>Next ▶</button>
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }} className="thin-scroll">
        {steps.map((x, k) => (
          <button key={k} onClick={() => { setPlay(false); setI(k); }}
            style={{ flex: '0 0 auto', minWidth: 92, padding: '10px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center', color: 'var(--text)', transition: 'all .25s',
              border: `1.5px solid ${k === i ? 'var(--accent)' : 'var(--border)'}`, transform: k === i ? 'translateY(-3px)' : undefined,
              background: k === i ? 'color-mix(in oklab, var(--accent) 16%, var(--panel))' : k < i ? 'color-mix(in oklab, var(--accent) 6%, var(--panel-2))' : 'var(--panel-2)' }}>
            <div style={{ fontSize: 24 }}>{x.ic}</div>
            <div style={{ fontSize: 11.5, fontWeight: 650, marginTop: 4 }}>{x.nm}</div>
          </button>
        ))}
      </div>
      <div className="progress" style={{ margin: '10px 0 16px' }}><i style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
      <div key={i} className="sec-body">
        <h3 style={{ margin: '0 0 10px', fontSize: 19 }}>{s.ic} {s.title}</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 12 }}>
          {[['Tool', s.tool], ['Time', s.ms], ['Input', s.inp], ['Output', s.out]].map(([k, v]) => (
            <div key={k} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--border)', fontSize: 14 }}>
              <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{k}</div>{v}
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'color-mix(in oklab, var(--bad) 8%, var(--panel))', border: '1px solid color-mix(in oklab, var(--bad) 35%, var(--border))', fontSize: 14, marginBottom: 8 }}><b>Risk:</b> {s.risk}</div>
        <div style={{ padding: '10px 14px', borderRadius: 12, background: 'color-mix(in oklab, var(--accent) 8%, var(--panel))', border: '1px solid color-mix(in oklab, var(--accent) 35%, var(--border))', fontSize: 14 }}><b>Say it:</b> “{s.say}”</div>
      </div>
    </div>
  );
}

const STAGES = [
  { k: 'vad', name: 'VAD end-of-turn', min: 100, max: 800, def: 250, color: '#64748b' },
  { k: 'stt', name: 'STT final', min: 50, max: 800, def: 200, color: '#0369a1' },
  { k: 'llm', name: 'LLM first token', min: 100, max: 1500, def: 400, color: '#7c3aed' },
  { k: 'tool', name: 'Tool call', min: 0, max: 2000, def: 150, color: '#b45309' },
  { k: 'tts', name: 'TTS first audio', min: 50, max: 800, def: 150, color: '#15803d' },
];

export function LatencyCostLab() {
  const [ms, setMs] = useState<Record<string, number>>(Object.fromEntries(STAGES.map((s) => [s.k, s.def])));
  const [stream, setStream] = useState(true);
  const [c, setC] = useState({ min: 10000, stt: 0.006, tin: 3000, lin: 3, tout: 300, lout: 15, chars: 900, tts: 0.03 });
  // without streaming you wait for full STT, the whole LLM answer and full TTS synthesis
  const total = STAGES.reduce((a, s) => a + ms[s.k], 0) + (stream ? 0 : 1800);
  const verdict = total <= 1000 ? ['Feels natural', 'var(--ok)'] : total <= 1600 ? ['Noticeable pause', 'var(--warn)'] : ['Users think the call dropped', 'var(--bad)'];
  const stt = c.min * c.stt;
  const llm = c.min * ((c.tin / 1e6) * c.lin + (c.tout / 1e6) * c.lout);
  const tts = c.min * (c.chars / 1000) * c.tts;
  const sum = stt + llm + tts;
  const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={{ display: 'grid', gap: 16 }} className="lg:grid-cols-2">
      <div className="panel" style={{ padding: 18 }}>
        <h3 style={{ margin: '0 0 4px' }}>⏱ Latency budget</h3>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13.5 }}>User stops talking → first audio back. Target ≈ 1 second.</p>
        <div style={{ display: 'flex', height: 34, borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
          {STAGES.map((s) => ms[s.k] > 0 && <div key={s.k} style={{ flex: ms[s.k], background: s.color, color: 'white', fontSize: 11, fontWeight: 650, display: 'grid', placeItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', transition: 'flex .2s' }}>{ms[s.k] > 120 ? `${s.k.toUpperCase()} ${ms[s.k]}` : ''}</div>)}
          {!stream && <div style={{ flex: 1800, background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 6px, #dc2626 6px, #dc2626 12px)', color: 'white', fontSize: 11, display: 'grid', placeItems: 'center' }}>waiting for full answer +1800</div>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 12px' }}>{total.toLocaleString()} ms <span style={{ fontSize: 14, color: verdict[1] }}>· {verdict[0]}</span></div>
        {STAGES.map((s) => (
          <label key={s.k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 60px', gap: 10, alignItems: 'center', fontSize: 13.5, marginBottom: 4 }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: s.color, marginRight: 6 }} />{s.name}</span>
            <input type="range" min={s.min} max={s.max} step={10} value={ms[s.k]} onChange={(e) => setMs((m) => ({ ...m, [s.k]: +e.target.value }))} style={{ accentColor: s.color }} />
            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{ms[s.k]} ms</span>
          </label>
        ))}
        <label className="chip" style={{ marginTop: 10, cursor: 'pointer' }}><input type="checkbox" checked={stream} onChange={(e) => setStream(e.target.checked)} /> Stream everything (STT partials → LLM tokens → TTS per sentence)</label>
      </div>
      <div className="panel" style={{ padding: 18 }}>
        <h3 style={{ margin: '0 0 4px' }}>💸 Monthly cost</h3>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13.5 }}>Change the prices to match your providers.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([['min', 'Call minutes / month', 100], ['stt', 'STT $ / audio minute', 0.001], ['tin', 'LLM input tokens / min', 100], ['lin', 'LLM $ / 1M input', 0.1], ['tout', 'LLM output tokens / min', 10], ['lout', 'LLM $ / 1M output', 0.1], ['chars', 'Spoken chars / min', 10], ['tts', 'TTS $ / 1K chars', 0.001]] as const).map(([k, l, step]) => (
            <label key={k} style={{ fontSize: 12.5 }} className="muted">{l}
              <input className="input" type="number" step={step} value={c[k]} onChange={(e) => setC((x) => ({ ...x, [k]: Number(e.target.value) || 0 }))} style={{ padding: '6px 10px', marginTop: 3 }} />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', margin: '16px 0 8px' }}>
          <div style={{ flex: stt || 0.001, background: '#0369a1' }} /><div style={{ flex: llm || 0.001, background: '#7c3aed' }} /><div style={{ flex: tts || 0.001, background: '#15803d' }} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5 }}>
          <span>🔵 STT {money(stt)}</span><span>🟣 LLM {money(llm)}</span><span>🟢 TTS {money(tts)}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>{money(sum)} <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>/ month · {(sum / Math.max(1, c.min) * 100).toFixed(1)}¢ per minute</span></div>
      </div>
    </div>
  );
}
