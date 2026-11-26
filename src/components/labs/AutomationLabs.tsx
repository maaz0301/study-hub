'use client';
import { useEffect, useMemo, useState } from 'react';

/* =====================================================================
   n8n: step through a small lead-routing workflow with your own data
   ===================================================================== */
export function N8nLab() {
  const [name, setName] = useState('Sara Khan');
  const [budget, setBudget] = useState(1500);
  const [threshold, setThreshold] = useState(1000);
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(false);

  const big = budget > threshold;
  const message = big ? `🔥 Big lead: ${name} (budget $${budget.toLocaleString()})` : `New lead: ${name}`;
  const channel = big ? '#sales-hot' : '#leads';
  const nodes = useMemo(() => [
    { id: 'Webhook', icon: '🪝', color: '#ea4b71', out: { headers: { 'content-type': 'application/json' }, query: {}, body: { name, budget } }, note: 'A POST to /webhook/lead starts the workflow. The request body is under body.' },
    { id: 'IF', icon: '🔀', color: '#f59e0b', out: { branch: big ? 'true' : 'false', checked: `{{ $json.body.budget }} (${budget}) > ${threshold}` }, note: `Condition: budget > ${threshold}. This item leaves through the ${big ? 'TRUE' : 'FALSE'} output.` },
    { id: 'Edit Fields', icon: '✏️', color: '#3b82f6', out: { text: message, channel }, note: 'Builds the message with an expression: {{ $json.body.name }}. The IF branch decides the text and channel.' },
    { id: 'Slack', icon: '💬', color: '#10b981', out: { ok: true, channel, ts: '1764151200.0042', message: { text: message } }, note: `Posts to ${channel}. (Simulated: a real Slack node needs a credential.)` },
  ], [name, budget, threshold, big, message, channel]);

  useEffect(() => { setStep(0); setPlay(false); }, [name, budget, threshold]);
  useEffect(() => {
    if (!play) return;
    if (step >= nodes.length - 1) { setPlay(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [play, step, nodes.length]);

  const cur = nodes[step];
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
        <label className="muted" style={{ fontSize: 13, flex: '1 1 160px' }}>Lead name
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginTop: 4 }} /></label>
        <label className="muted" style={{ fontSize: 13, width: 130 }}>Budget ($)
          <input className="input" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} style={{ marginTop: 4 }} /></label>
        <label className="muted" style={{ fontSize: 13, width: 150 }}>IF threshold
          <input className="input" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value) || 0)} style={{ marginTop: 4 }} /></label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => { setPlay(false); setStep((s) => Math.max(0, s - 1)); }}>◀</button>
          <button className="btn btn-sm btn-primary" onClick={() => { if (step >= nodes.length - 1) setStep(0); setPlay((p) => !p); }}>{play ? '⏸ Pause' : '▶ Run workflow'}</button>
          <button className="btn btn-sm" onClick={() => { setPlay(false); setStep((s) => Math.min(nodes.length - 1, s + 1)); }}>Step ▶</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '8px 2px 14px' }} className="thin-scroll">
        {nodes.map((n, i) => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => { setPlay(false); setStep(i); }} aria-label={n.id}
              style={{ display: 'grid', placeItems: 'center', gap: 2, width: 116, padding: '12px 8px', borderRadius: 16, cursor: 'pointer', color: 'var(--text)', transition: 'all .25s', fontFamily: 'inherit',
                border: `2px solid ${i === step ? n.color : i < step ? `color-mix(in oklab, ${n.color} 50%, var(--border))` : 'var(--border)'}`,
                background: i === step ? `color-mix(in oklab, ${n.color} 22%, var(--panel))` : i < step ? `color-mix(in oklab, ${n.color} 8%, var(--panel))` : 'var(--panel-2)',
                transform: i === step ? 'translateY(-4px)' : undefined, boxShadow: i === step ? `0 12px 26px -14px ${n.color}` : undefined }}>
              <span style={{ fontSize: 26 }}>{n.icon}</span>
              <b style={{ fontSize: 13 }}>{n.id}</b>
              <span style={{ fontSize: 11, color: i <= step ? '#10b981' : 'var(--faint)' }}>{i < step ? '✓ done' : i === step ? '● running' : 'waiting'}</span>
            </button>
            {i < nodes.length - 1 && <span style={{ width: 34, textAlign: 'center', color: i < step ? n.color : 'var(--border-2)', fontWeight: 800, fontSize: 18 }}>→</span>}
          </div>
        ))}
      </div>

      <div key={step} className="sec-body" style={{ display: 'grid', gap: 12 }}>
        <div style={{ padding: '10px 14px', borderRadius: 12, background: `color-mix(in oklab, ${cur.color} 10%, var(--panel))`, border: `1px solid color-mix(in oklab, ${cur.color} 35%, var(--border))`, fontSize: 14.5, lineHeight: 1.55 }}>
          <b>{cur.icon} {cur.id}:</b> {cur.note}
        </div>
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 4 }}>OUTPUT of “{cur.id}” (what the next node receives)</div>
          <pre className="code-block" data-lang="json" style={{ margin: 0 }}><code>{JSON.stringify([{ json: cur.out }], null, 2)}</code></pre>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Change the budget or the IF threshold and run it again: the item takes the other branch. This is exactly what you see when you click a node in n8n.</p>
    </div>
  );
}

/* =====================================================================
   CI/CD: a pipeline you can break
   ===================================================================== */
type Status = 'success' | 'failed' | 'skipped' | 'waiting' | 'pending';
type Stage = { id: string; label: string; icon: string; status: Status; log: string; lane: number };

function runPipeline(event: 'pull_request' | 'push', failLint: boolean, failTest: boolean, approved: boolean, needApproval: boolean): Stage[] {
  const isMain = event === 'push';
  const lint: Stage = { id: 'lint', label: 'lint', icon: '🧹', lane: 0, status: failLint ? 'failed' : 'success', log: failLint ? 'npm run lint → 3 errors (exit 1)' : 'npm run lint → no problems' };
  const test: Stage = { id: 'test', label: 'test', icon: '🧪', lane: 1, status: failTest ? 'failed' : 'success', log: failTest ? 'npm test → 1 failing (adds two numbers)' : 'npm test → 12 passed, coverage 86%' };
  const checksOk = lint.status === 'success' && test.status === 'success';
  const build: Stage = { id: 'build', label: 'build', icon: '🔨', lane: 0, status: checksOk ? 'success' : 'skipped', log: checksOk ? 'docker build → image :3f9c2ab pushed' : 'skipped: needs lint and test to pass' };
  const staging: Stage = { id: 'staging', label: 'deploy staging', icon: '🎭', lane: 0, status: !isMain ? 'skipped' : build.status === 'success' ? 'success' : 'skipped', log: !isMain ? 'skipped: pull requests never deploy' : build.status === 'success' ? 'deployed :3f9c2ab → staging, smoke test OK' : 'skipped: build did not run' };
  let prodStatus: Status = 'skipped', prodLog = 'skipped';
  const approval: Stage = { id: 'approval', label: 'approval', icon: '✋', lane: 0, status: 'skipped', log: 'not needed' };
  if (!isMain) prodLog = 'skipped: pull requests never deploy';
  else if (staging.status !== 'success') prodLog = 'skipped: staging did not succeed';
  else if (needApproval && !approved) { approval.status = 'waiting'; approval.log = 'waiting for a reviewer to approve the production deployment…'; prodStatus = 'pending'; prodLog = 'pending approval'; }
  else { if (needApproval) { approval.status = 'success'; approval.log = 'approved by a required reviewer'; } else approval.log = 'no approval rule on this environment'; prodStatus = 'success'; prodLog = 'deployed :3f9c2ab → production, health check OK'; }
  const prod: Stage = { id: 'prod', label: 'deploy production', icon: '🚀', lane: 0, status: prodStatus, log: prodLog };
  return [lint, test, build, staging, approval, prod];
}

const COLORS: Record<Status, string> = { success: '#10b981', failed: '#ef4444', skipped: '#64748b', waiting: '#f59e0b', pending: '#64748b' };
const ICONS: Record<Status, string> = { success: '✓', failed: '✕', skipped: '–', waiting: '⏸', pending: '…' };

export function CicdLab() {
  const [event, setEvent] = useState<'pull_request' | 'push'>('push');
  const [failLint, setFailLint] = useState(false);
  const [failTest, setFailTest] = useState(false);
  const [needApproval, setNeedApproval] = useState(true);
  const [approved, setApproved] = useState(false);
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0);

  const stages = useMemo(() => runPipeline(event, failLint, failTest, approved, needApproval), [event, failLint, failTest, approved, needApproval]);
  useEffect(() => { setApproved(false); }, [event, failLint, failTest, needApproval]);
  useEffect(() => {
    setShown(0);
    const t = setInterval(() => setShown((s) => (s >= stages.length ? s : s + 1)), 650);
    return () => clearInterval(t);
  }, [event, failLint, failTest, needApproval, run, stages.length]);

  const visible = (i: number) => i < shown;
  const row1 = stages.slice(0, 2), rest = stages.slice(2);
  const box = (s: Stage, i: number) => {
    const on = visible(i);
    const c = on ? COLORS[s.status] : 'var(--border-2)';
    return (
      <div key={s.id} style={{ flex: '1 1 130px', minWidth: 120, padding: '10px 12px', borderRadius: 14, border: `2px solid ${c}`, transition: 'all .3s',
        background: on ? `color-mix(in oklab, ${COLORS[s.status]} 11%, var(--panel))` : 'var(--panel-2)', opacity: on ? 1 : 0.55 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{s.icon}</span>
          <b style={{ fontSize: 13.5, flex: 1 }}>{s.label}</b>
          <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12, color: 'white', background: on ? COLORS[s.status] : 'var(--border-2)' }}>{on ? ICONS[s.status] : '…'}</span>
        </div>
      </div>
    );
  };
  const failed = stages.find((s) => s.status === 'failed');
  const waiting = stages.find((s) => s.status === 'waiting');
  const done = shown >= stages.length;

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <button className={`chip ${event === 'pull_request' ? 'on' : ''}`} onClick={() => setEvent('pull_request')}>🔀 Pull request</button>
        <button className={`chip ${event === 'push' ? 'on' : ''}`} onClick={() => setEvent('push')}>⬆️ Push to main</button>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={failLint} onChange={(e) => setFailLint(e.target.checked)} /> lint fails</label>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={failTest} onChange={(e) => setFailTest(e.target.checked)} /> a test fails</label>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={needApproval} onChange={(e) => setNeedApproval(e.target.checked)} /> production needs approval</label>
        <button className="btn btn-sm btn-primary" onClick={() => setRun((r) => r + 1)} style={{ marginLeft: 'auto' }}>↻ Run again</button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div className="faint" style={{ fontSize: 12.5 }}>① checks run in parallel</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{row1.map((s, i) => box(s, i))}</div>
        <div className="faint" style={{ fontSize: 12.5 }}>② stages with <code>needs:</code> wait for the ones before</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{rest.map((s, i) => box(s, i + 2))}</div>
      </div>

      <div style={{ background: 'var(--code-bg)', color: '#e5e9f5', borderRadius: 14, padding: 14, marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, minHeight: 130 }}>
        <div style={{ color: '#7b86a8' }}># event: {event} · commit 3f9c2ab</div>
        {stages.map((s, i) => visible(i) && (
          <div key={s.id} style={{ color: s.status === 'failed' ? '#fca5a5' : s.status === 'success' ? '#a7f3d0' : s.status === 'waiting' ? '#fcd34d' : '#94a3b8' }}>
            {ICONS[s.status]} {s.label.padEnd(18, ' ')} {s.log}
          </div>
        ))}
      </div>

      {done && (
        <div className="sec-body" style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, fontWeight: 650, border: `1.5px solid ${failed ? 'var(--bad)' : waiting ? 'var(--warn)' : 'var(--ok)'}`, background: `color-mix(in oklab, ${failed ? 'var(--bad)' : waiting ? 'var(--warn)' : 'var(--ok)'} 10%, var(--panel))` }}>
          {failed ? `❌ The pipeline failed at “${failed.label}”. Nothing after it ran, so the broken code never reaches users.`
            : waiting ? <span>⏸ Staging is live. Production waits for a person. <button className="btn btn-sm btn-primary" style={{ marginLeft: 8 }} onClick={() => setApproved(true)}>✅ Approve deployment</button></span>
            : event === 'pull_request' ? '✅ Checks passed. The pull request can be merged (deploys only happen from main).'
            : '🚀 Released: tested, built once, deployed to staging, then production.'}
        </div>
      )}
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Try: make a test fail (the build is skipped), switch to “Pull request” (no deploys), or turn the approval rule off.</p>
    </div>
  );
}

/* =====================================================================
   CI/CD: canary rollout with an automatic rollback
   ===================================================================== */
export function CanaryLab() {
  const [pct, setPct] = useState(10);
  const [bug, setBug] = useState(false);
  const [limit, setLimit] = useState(2);
  const canaryErr = bug ? 8 : 0.3;
  const stableErr = 0.3;
  const overall = (pct * canaryErr + (100 - pct) * stableErr) / 100;
  const tripped = pct > 0 && canaryErr > limit;
  const live = tripped ? 0 : pct;

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label style={{ fontSize: 13.5, flex: '1 1 220px' }}>Traffic to the new version (v2): <b>{pct}%</b>
          <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ display: 'block', width: '100%', accentColor: 'var(--accent)' }} /></label>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={bug} onChange={(e) => setBug(e.target.checked)} /> 🐛 v2 has a bug (8% errors)</label>
        <label style={{ fontSize: 13.5, width: 170 }}>Rollback if errors &gt; <b>{limit}%</b>
          <input type="range" min={1} max={10} step={1} value={limit} onChange={(e) => setLimit(+e.target.value)} style={{ display: 'block', width: '100%', accentColor: 'var(--accent)' }} /></label>
      </div>

      <div style={{ display: 'flex', height: 46, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ flex: Math.max(100 - live, 0.001), background: '#3b82f6', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, transition: 'flex .5s' }}>v1 stable {100 - live}%</div>
        {live > 0 && <div style={{ flex: live, background: bug ? '#ef4444' : '#10b981', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, transition: 'flex .5s', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>{live >= 12 ? `v2 canary ${live}%` : `${live}%`}</div>}
      </div>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginTop: 14 }}>
        {[['v1 error rate', `${stableErr}%`, '#3b82f6'], ['v2 error rate', pct ? `${canaryErr}%` : '–', bug ? '#ef4444' : '#10b981'], ['users affected overall', `${(tripped ? stableErr : overall).toFixed(2)}%`, tripped ? '#10b981' : overall > limit ? '#ef4444' : '#f59e0b']].map(([k, v, c]) => (
          <div key={k} style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
            <div className="faint" style={{ fontSize: 12 }}>{k}</div>
            <div style={{ fontSize: 24, fontWeight: 850, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="sec-body" style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, fontWeight: 650, border: `1.5px solid ${tripped ? 'var(--bad)' : 'var(--ok)'}`, background: `color-mix(in oklab, ${tripped ? 'var(--bad)' : 'var(--ok)'} 10%, var(--panel))` }}>
        {pct === 0 ? 'No traffic on v2 yet. Start with a small percentage.'
          : tripped ? `🚨 v2 error rate (${canaryErr}%) is above ${limit}%: automatic rollback! All traffic goes back to v1 and only ${pct}% of users saw errors for a short time.`
          : pct < 100 ? `✅ v2 looks healthy (${canaryErr}% errors). Increase the percentage step by step: 10% → 25% → 50% → 100%.`
          : '🎉 Fully rolled out. v1 can be removed (keep it for a while for rollback).'}
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Tick the bug box and raise the traffic: the canary protects most users because only a few ever reach v2. A big-bang release would have sent the bug to everyone.</p>
    </div>
  );
}
