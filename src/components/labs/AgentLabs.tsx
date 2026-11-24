'use client';
import { useEffect, useMemo, useState } from 'react';

/* ============ LangGraph-style agent run ============ */
type Msg = { role: 'user' | 'ai' | 'tool' | 'human'; text: string; calls?: string };
type Step = { node: 'START' | 'agent' | 'tools' | 'approval' | 'END'; note: string; add?: Msg; status?: string };

const GOALS: Record<'order' | 'refund', { label: string; write: boolean; build: (fail: boolean, approve: boolean) => Step[] }> = {
  order: {
    label: 'Where is my order ORD-1234?',
    write: false,
    build: (fail: boolean) => [
      { node: 'START', note: 'invoke() with thread_id="user-42". State = { messages: [user] }', add: { role: 'user', text: 'Where is my order ORD-1234?' } },
      { node: 'agent', note: 'LLM reads messages + tool schemas and returns a tool call (it does not run it).', add: { role: 'ai', text: '', calls: 'get_order(order_id="ORD-1234")' } },
      { node: 'tools', note: 'route() sees tool_calls → "tools". ToolNode runs get_order in YOUR code.', add: { role: 'tool', text: fail ? 'Error: timeout after 5s. Try again.' : '{"status":"shipped","eta":"Thursday"}' } },
      ...(fail ? [
        { node: 'agent', note: 'The error came back as a tool message, so the model can recover: it retries.', add: { role: 'ai', text: '', calls: 'get_order(order_id="ORD-1234")' } } as Step,
        { node: 'tools', note: 'Second attempt succeeds (retry with backoff).', add: { role: 'tool', text: '{"status":"shipped","eta":"Thursday"}' } } as Step,
      ] : []),
      { node: 'agent', note: 'No more tool calls needed → final answer.', add: { role: 'ai', text: 'Your order ORD-1234 has shipped and should arrive on Thursday.' } },
      { node: 'END', note: 'route() returns END. Checkpointer saved every step under thread "user-42".' },
    ],
  },
  refund: {
    label: 'Refund my last order, it arrived broken.',
    write: true,
    build: (fail: boolean, approve: boolean): Step[] => [
      { node: 'START', note: 'New message on the same thread: earlier history is loaded from the checkpointer.', add: { role: 'user', text: 'Refund my last order, it arrived broken.' } },
      { node: 'agent', note: 'Plan: find the last order first.', add: { role: 'ai', text: '', calls: 'get_last_order(customer_id=42)' } },
      { node: 'tools', note: 'Read-only tool: runs freely.', add: { role: 'tool', text: fail ? 'Error: orders DB unavailable' : '{"id":"ORD-1234","total":79}' } },
      ...(fail ? [{ node: 'agent', note: 'Cannot continue safely without data → explain and stop instead of guessing.', add: { role: 'ai', text: 'Sorry, I can’t reach the orders system right now. I’ve opened a ticket and a person will follow up.' } } as Step, { node: 'END', note: 'Graceful failure: no refund attempted.' } as Step] : [
        { node: 'agent', note: 'Proposes a WRITE action.', add: { role: 'ai', text: '', calls: 'create_refund(order_id="ORD-1234", amount=79)' } },
        { node: 'approval', note: 'interrupt() pauses the graph. State is checkpointed; the UI shows Approve / Reject. Resume with Command(resume=...).', add: { role: 'human', text: approve ? '✅ Approved by support lead' : '❌ Rejected: needs photo evidence' }, status: 'interrupted' },
        { node: 'tools', note: approve ? 'Approved → refund runs with an idempotency key (a retry can never refund twice).' : 'Rejected → tool is NOT executed; the decision goes back to the model.', add: { role: 'tool', text: approve ? '{"refund_id":"RF-77","status":"done"}' : 'Refund rejected by human: ask the customer for a photo.' } },
        { node: 'agent', note: 'Final answer based on what really happened.', add: { role: 'ai', text: approve ? 'Done! A refund of $79 for ORD-1234 is on its way (RF-77).' : 'I need a photo of the damage before I can refund. Could you upload one?' } },
        { node: 'END', note: 'Run finished. Trace (prompts, tools, tokens, latency) visible in LangSmith.' },
      ] as Step[]),
    ],
  },
};

const NODES: { id: Step['node']; x: number; y: number }[] = [
  { id: 'START', x: 60, y: 40 }, { id: 'agent', x: 60, y: 130 }, { id: 'tools', x: 230, y: 130 }, { id: 'approval', x: 230, y: 40 }, { id: 'END', x: 60, y: 220 },
];

export function AgentGraphLab() {
  const [goal, setGoal] = useState<keyof typeof GOALS>('order');
  const [fail, setFail] = useState(false);
  const [approve, setApprove] = useState(true);
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);
  const steps = useMemo(() => GOALS[goal].build(fail, approve), [goal, fail, approve]);
  useEffect(() => { setI(0); setPlay(false); }, [goal, fail, approve]);
  useEffect(() => {
    if (!play) return;
    if (i >= steps.length - 1) { setPlay(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 1300);
    return () => clearTimeout(t);
  }, [play, i, steps.length]);

  const s = steps[i];
  const msgs = steps.slice(0, i + 1).filter((x) => x.add).map((x) => x.add!);
  const visited = new Set(steps.slice(0, i + 1).map((x) => x.node));
  const agentCalls = steps.slice(0, i + 1).filter((x) => x.node === 'agent').length;

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {(Object.keys(GOALS) as (keyof typeof GOALS)[]).map((k) => <button key={k} className={`chip ${goal === k ? 'on' : ''}`} onClick={() => setGoal(k)}>💬 {GOALS[k].label}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> make the tool fail</label>
        {goal === 'refund' && !fail && <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} /> human approves</label>}
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={() => { setPlay(false); setI((x) => Math.max(0, x - 1)); }}>◀</button>
        <button className="btn btn-sm btn-primary" onClick={() => { if (i >= steps.length - 1) setI(0); setPlay((p) => !p); }}>{play ? '⏸ Pause' : '▶ Run'}</button>
        <button className="btn btn-sm" onClick={() => { setPlay(false); setI((x) => Math.min(steps.length - 1, x + 1)); }}>Step ▶</button>
      </div>

      <div style={{ display: 'grid', gap: 16 }} className="lg:grid-cols-[300px_1fr_1fr]">
        <svg viewBox="0 0 300 260" style={{ width: '100%', maxWidth: 300, background: 'var(--panel-2)', borderRadius: 14, border: '1px solid var(--border)' }} aria-label="Agent graph">
          <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--faint)" /></marker></defs>
          {/* edges: [x1, y1, x2, y2, label, lx, ly] */}
          {([
            [60, 57, 60, 111, '', 0, 0],
            [105, 124, 183, 124, 'tool_calls', 144, 117],
            [185, 138, 107, 138, 'result', 146, 151],
            [60, 147, 60, 201, 'no calls', 86, 178],
            ...(goal === 'refund' ? [[95, 115, 190, 55, 'write call', 128, 78], [230, 57, 230, 111, 'resume', 254, 88]] : []),
          ] as [number, number, number, number, string, number, number][]).map(([x1, y1, x2, y2, l, lx, ly], k) => (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--faint)" strokeWidth="1.5" markerEnd="url(#arr)" />
              {l && <text x={lx} y={ly} fontSize="9" fill="var(--faint)" textAnchor="middle">{l}</text>}
            </g>
          ))}
          {NODES.filter((n) => goal === 'refund' || n.id !== 'approval').map((n) => {
            const on = s.node === n.id;
            const seen = visited.has(n.id);
            return (
              <g key={n.id}>
                <rect x={n.x - 45} y={n.y - 17} width="90" height="34" rx={n.id === 'START' || n.id === 'END' ? 17 : 9}
                  fill={on ? 'var(--accent)' : seen ? 'color-mix(in oklab, var(--accent) 18%, var(--panel))' : 'var(--panel)'} stroke={on ? 'var(--accent)' : 'var(--border-2)'} strokeWidth="1.5"
                  style={{ transition: 'all .3s' }} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={on ? 'white' : 'var(--text)'}>{n.id === 'approval' ? '⏸ approval' : n.id}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ minWidth: 0 }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Step {i + 1}/{steps.length} · node: {s.node}</div>
          <div key={i} className="sec-body" style={{ padding: '10px 14px', borderRadius: 12, background: s.status === 'interrupted' ? 'color-mix(in oklab, var(--warn) 12%, var(--panel))' : 'color-mix(in oklab, var(--accent) 9%, var(--panel))', border: '1px solid var(--border)', fontSize: 14, lineHeight: 1.55 }}>{s.note}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 13 }} className="muted">
            <span>LLM calls: <b style={{ color: 'var(--text)' }}>{agentCalls}</b></span>
            <span>recursion_limit: <b style={{ color: 'var(--text)' }}>25</b></span>
            <span>thread: <code>user-42</code></span>
          </div>
          <pre className="code-block" data-lang="python" style={{ fontSize: 12 }}><code>{goal === 'refund'
            ? `def approval(state):\n    call = state["messages"][-1].tool_calls[0]\n    ok = interrupt({"approve?": call})   # pauses + checkpoints\n    return {"approved": ok}\n\napp.invoke(Command(resume=${approve ? 'True' : 'False'}), cfg)`
            : `def route(state):\n    last = state["messages"][-1]\n    return "tools" if last.tool_calls else END\n\ng.add_conditional_edges("agent", route)\ng.add_edge("tools", "agent")   # the loop`}</code></pre>
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>state[&quot;messages&quot;] (add_messages appends)</div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 330, overflowY: 'auto' }} className="thin-scroll">
            {msgs.map((m, k) => (
              <div key={k} className={k === msgs.length - 1 ? 'sec-body' : ''} style={{ padding: '7px 10px', borderRadius: 10, fontSize: 13, lineHeight: 1.45, border: '1px solid var(--border)',
                background: m.role === 'user' ? 'var(--panel-2)' : m.role === 'ai' ? 'color-mix(in oklab, var(--accent) 8%, var(--panel))' : m.role === 'tool' ? 'color-mix(in oklab, #10b981 9%, var(--panel))' : 'color-mix(in oklab, var(--warn) 12%, var(--panel))' }}>
                <b style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>{m.role === 'ai' ? 'AIMessage' : m.role === 'tool' ? 'ToolMessage' : m.role === 'human' ? 'Human decision' : 'HumanMessage'}</b>
                {m.calls && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>tool_calls: {m.calls}</div>}
                {m.text && <div style={{ fontFamily: m.role === 'tool' ? 'var(--font-mono)' : undefined, fontSize: m.role === 'tool' ? 12 : 13 }}>{m.text}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Agentic patterns explorer ============ */
type Pattern = { id: string; name: string; when: string; cost: string; flow: string[][]; code: string };
const PATTERNS: Pattern[] = [
  { id: 'chain', name: 'Prompt chaining', when: 'Fixed steps known in advance (outline → draft → polish). Add a check (gate) between steps.', cost: '💲 low · ⚡ predictable',
    flow: [['Input'], ['LLM: outline'], ['Gate: valid?'], ['LLM: write'], ['Output']],
    code: 'chain = outline_prompt | model | parser | check_gate | write_prompt | model' },
  { id: 'route', name: 'Routing', when: 'Inputs fall into clear categories that need different prompts, tools or models (cheap model for FAQs).', cost: '💲 low',
    flow: [['Input'], ['Router LLM'], ['Billing agent', 'Tech agent', 'FAQ (small model)'], ['Output']],
    code: 'g.add_conditional_edges("router", lambda s: s["category"],\n    {"billing": "billing", "tech": "tech", "faq": "faq"})' },
  { id: 'parallel', name: 'Parallelization', when: 'Independent subtasks (sectioning) or several attempts to vote on (guardrail + answer in parallel).', cost: '💲💲 · ⚡ fast',
    flow: [['Input'], ['LLM A', 'LLM B', 'LLM C'], ['Aggregate / vote'], ['Output']],
    code: 'RunnableParallel(summary=sum_chain, risks=risk_chain, tone=tone_chain)\n# LangGraph: fan-out edges + operator.add reducer' },
  { id: 'orch', name: 'Orchestrator–workers', when: 'You cannot know the subtasks in advance (changes across many files, research on a new topic).', cost: '💲💲💲',
    flow: [['Task'], ['Orchestrator LLM plans'], ['Worker 1', 'Worker 2', 'Worker n'], ['Synthesizer'], ['Output']],
    code: 'plan = planner.with_structured_output(Plan).invoke(task)\nresults = [Send("worker", {"sub": s}) for s in plan.subtasks]  # dynamic fan-out' },
  { id: 'eval', name: 'Evaluator–optimizer', when: 'Clear quality criteria and iterative refinement helps (translation, code that must pass tests).', cost: '💲💲 · loops',
    flow: [['Input'], ['Generator LLM'], ['Evaluator LLM'], ['pass → Output', 'fail → feedback ↺ Generator']],
    code: 'g.add_conditional_edges("evaluate",\n    lambda s: END if s["grade"] == "pass" or s["tries"] >= 3 else "generate")' },
  { id: 'agent', name: 'Autonomous agent', when: 'Open-ended problems with an unknown number of steps; needs a sandbox, limits and evals.', cost: '💲💲💲 · less predictable',
    flow: [['Goal'], ['LLM decides'], ['Tool call', 'Final answer'], ['Observe result ↺']],
    code: 'agent = create_agent(model, tools=[search, run_code, write_file],\n                     system_prompt="...")' },
  { id: 'super', name: 'Supervisor multi-agent', when: 'Distinct specialist roles, each with its own tools and prompt; a manager routes and decides when done.', cost: '💲💲💲💲',
    flow: [['User'], ['Supervisor'], ['Researcher', 'Coder', 'Writer'], ['back to Supervisor ↺'], ['FINISH']],
    code: 'supervisor → Route(next="researcher"|"coder"|"FINISH")\nworkers → add_edge(worker, "supervisor")' },
];

export function PatternsLab() {
  const [p, setP] = useState(PATTERNS[0]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    const t = setInterval(() => setTick((x) => x + 1), 700);
    return () => clearInterval(t);
  }, [p]);
  const active = tick % (p.flow.length + 1);
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {PATTERNS.map((x) => <button key={x.id} className={`chip ${p.id === x.id ? 'on' : ''}`} onClick={() => setP(x)}>{x.name}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 18 }} className="lg:grid-cols-[1.2fr_1fr]">
        <div style={{ display: 'grid', gap: 8, justifyItems: 'center', padding: 14, background: 'var(--panel-2)', borderRadius: 14, border: '1px solid var(--border)' }}>
          {p.flow.map((row, r) => (
            <div key={r} style={{ display: 'grid', justifyItems: 'center', gap: 6, width: '100%' }}>
              {r > 0 && <div style={{ color: r <= active ? 'var(--accent)' : 'var(--faint)', fontSize: 16, lineHeight: 1, transition: 'color .3s' }}>▼</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {row.map((n) => (
                  <span key={n} style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 650, transition: 'all .3s',
                    border: `1.5px solid ${r === active ? 'var(--accent)' : 'var(--border-2)'}`,
                    background: r === active ? 'var(--accent)' : r < active ? 'color-mix(in oklab, var(--accent) 15%, var(--panel))' : 'var(--panel)',
                    color: r === active ? 'white' : 'var(--text)', transform: r === active ? 'scale(1.05)' : undefined }}>{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: 19 }}>{p.name}</h3>
          <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}><b>Use when:</b> <span className="muted">{p.when}</span></p>
          <span className="badge">{p.cost}</span>
          <pre className="code-block" data-lang="python" style={{ fontSize: 12.5 }}><code>{p.code}</code></pre>
        </div>
      </div>
    </div>
  );
}

/* ============ GenAI: mock interview with timer ============ */
export function MockInterviewLab({ items }: { items: { id: string; q: string; points: string[] }[] }) {
  const [i, setI] = useState(0);
  const [secs, setSecs] = useState(120);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, secs]);
  if (!items.length) return <div className="panel muted" style={{ padding: 20 }}>No scenarios found.</div>;
  const it = items[i];
  const next = () => { let n = i; while (items.length > 1 && n === i) n = Math.floor(Math.random() * items.length); setI(n); setSecs(120); setRunning(false); setChecked([]); setReveal(false); };
  const mm = `${Math.floor(Math.max(0, secs) / 60)}:${String(Math.max(0, secs) % 60).padStart(2, '0')}`;
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-sm" onClick={next}>🎲 New scenario</button>
        <button className="btn btn-sm btn-primary" onClick={() => setRunning((r) => !r)}>{running ? '⏸ Pause' : '▶ Start 2-min timer'}</button>
        <button className="btn btn-sm btn-ghost" onClick={() => { setSecs(120); setRunning(false); setChecked([]); setReveal(false); }}>Reset</button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: secs <= 20 ? 'var(--bad)' : 'var(--text)' }}>{mm}</span>
      </div>
      <div className="progress" style={{ margin: '12px 0' }}><i style={{ width: `${(secs / 120) * 100}%` }} /></div>
      <h3 style={{ margin: '4px 0 12px', fontSize: 20 }}><span style={{ color: 'var(--accent)' }}>{it.id}.</span> {it.q}</h3>
      <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>Answer out loud. Tick each key point as you mention it, then reveal the ones you missed.</p>
      <div style={{ display: 'grid', gap: 6 }}>
        {it.points.map((pt, k) => {
          const on = checked.includes(k);
          return (
            <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)',
              background: on ? 'color-mix(in oklab, var(--ok) 10%, var(--panel))' : 'var(--panel-2)' }}>
              <input type="checkbox" checked={on} onChange={() => setChecked((c) => (on ? c.filter((x) => x !== k) : [...c, k]))} style={{ marginTop: 4 }} />
              <span style={{ filter: reveal || on ? 'none' : 'blur(5px)', transition: 'filter .3s', fontSize: 14.5 }} title={reveal ? undefined : 'Hidden until you reveal or tick it'}>{pt}</span>
            </label>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
        <button className="btn btn-sm" onClick={() => setReveal((r) => !r)}>{reveal ? 'Hide points' : 'Reveal key points'}</button>
        <b>Key points mentioned: {checked.length} / {it.points.length}</b>
      </div>
    </div>
  );
}
