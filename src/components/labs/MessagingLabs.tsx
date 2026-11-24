'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

/* =====================================================================
   1. A tiny Redis you can type commands into (strings, lists, hashes,
      sets, sorted sets, TTL, Pub/Sub, Streams + consumer groups)
   ===================================================================== */
type Stream = { entries: { id: string; f: string[] }[]; groups: Map<string, { next: number; pending: Map<string, string> }>; seq: number };
type Val =
  | { t: 'string'; v: string }
  | { t: 'list'; v: string[] }
  | { t: 'hash'; v: Map<string, string> }
  | { t: 'set'; v: Set<string> }
  | { t: 'zset'; v: Map<string, number> }
  | { t: 'stream'; v: Stream };

function tokenize(line: string) {
  const out: string[] = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push(m[1] !== undefined ? m[1].replace(/\\"/g, '"') : m[2] !== undefined ? m[2] : m[3]);
  return out;
}
const q = (s: string) => `"${s}"`;
const arr = (a: string[]) => (a.length ? a.map((x, i) => `${i + 1}) ${q(x)}`).join('\n') : '(empty array)');
const WRONG = '(error) WRONGTYPE Operation against a key holding the wrong kind of value';

class MiniRedis {
  db = new Map<string, Val>();
  exp = new Map<string, number>();
  now = 0;
  subs = ['client-A', 'client-B', 'client-C'];
  get(key: string) {
    const e = this.exp.get(key);
    if (e !== undefined && e <= this.now) { this.db.delete(key); this.exp.delete(key); }
    return this.db.get(key);
  }
  run(line: string): string {
    const a = tokenize(line);
    if (!a.length) return '';
    const cmd = a[0].toUpperCase();
    const k = a[1];
    const need = (n: number) => (a.length < n ? `(error) ERR wrong number of arguments for '${cmd.toLowerCase()}' command` : null);
    const bad = need(cmd === 'KEYS' || cmd === 'PING' ? 1 : 2);
    if (bad && cmd !== 'PING' && cmd !== 'KEYS') return bad;
    const typed = <T extends Val['t']>(t: T, create: () => Extract<Val, { t: T }>) => {
      const cur = this.get(k);
      if (!cur) { const nv = create(); this.db.set(k, nv); return nv; }
      return cur.t === t ? (cur as Extract<Val, { t: T }>) : null;
    };
    switch (cmd) {
      case 'PING': return 'PONG';
      case 'SET': {
        this.db.set(k, { t: 'string', v: a[2] ?? '' });
        this.exp.delete(k);
        const ex = a.findIndex((x) => x.toUpperCase() === 'EX');
        if (ex > 0) this.exp.set(k, this.now + Number(a[ex + 1]));
        return 'OK';
      }
      case 'GET': { const v = this.get(k); return !v ? '(nil)' : v.t === 'string' ? q(v.v) : WRONG; }
      case 'DEL': { let n = 0; for (const key of a.slice(1)) if (this.get(key)) { this.db.delete(key); this.exp.delete(key); n++; } return `(integer) ${n}`; }
      case 'EXISTS': return `(integer) ${this.get(k) ? 1 : 0}`;
      case 'INCR': case 'DECR': case 'INCRBY': case 'DECRBY': {
        const cur = this.get(k);
        if (cur && cur.t !== 'string') return WRONG;
        const by = cmd.endsWith('BY') ? Number(a[2]) : 1;
        const n = Number(cur ? cur.v : 0) + (cmd.startsWith('INCR') ? by : -by);
        if (!Number.isFinite(n)) return '(error) ERR value is not an integer or out of range';
        this.db.set(k, { t: 'string', v: String(n) });
        return `(integer) ${n}`;
      }
      case 'EXPIRE': { if (!this.get(k)) return '(integer) 0'; this.exp.set(k, this.now + Number(a[2])); return '(integer) 1'; }
      case 'TTL': { if (!this.get(k)) return '(integer) -2'; const e = this.exp.get(k); return `(integer) ${e === undefined ? -1 : e - this.now}`; }
      case 'KEYS': { [...this.db.keys()].forEach((x) => this.get(x)); return arr([...this.db.keys()].sort()); }
      case 'TYPE': return this.get(k)?.t ?? 'none';
      // lists
      case 'LPUSH': case 'RPUSH': {
        const l = typed('list', () => ({ t: 'list', v: [] }));
        if (!l) return WRONG;
        for (const x of a.slice(2)) {
          if (cmd === 'LPUSH') l.v.unshift(x);
          else l.v.push(x);
        }
        return `(integer) ${l.v.length}`;
      }
      case 'LPOP': case 'RPOP': {
        const l = this.get(k);
        if (!l) return '(nil)';
        if (l.t !== 'list') return WRONG;
        const x = cmd === 'LPOP' ? l.v.shift() : l.v.pop();
        if (!l.v.length) this.db.delete(k);
        return x === undefined ? '(nil)' : q(x);
      }
      case 'LLEN': { const l = this.get(k); return !l ? '(integer) 0' : l.t === 'list' ? `(integer) ${l.v.length}` : WRONG; }
      case 'LRANGE': {
        const l = this.get(k);
        if (!l) return '(empty array)';
        if (l.t !== 'list') return WRONG;
        let s = Number(a[2]), e = Number(a[3]);
        if (s < 0) s += l.v.length;
        if (e < 0) e += l.v.length;
        return arr(l.v.slice(Math.max(0, s), e + 1));
      }
      // hashes
      case 'HSET': {
        const h = typed('hash', () => ({ t: 'hash', v: new Map() }));
        if (!h) return WRONG;
        let added = 0;
        for (let i = 2; i + 1 < a.length; i += 2) { if (!h.v.has(a[i])) added++; h.v.set(a[i], a[i + 1]); }
        return `(integer) ${added}`;
      }
      case 'HGET': { const h = this.get(k); return !h ? '(nil)' : h.t !== 'hash' ? WRONG : h.v.has(a[2]) ? q(h.v.get(a[2])!) : '(nil)'; }
      case 'HGETALL': { const h = this.get(k); return !h ? '(empty array)' : h.t !== 'hash' ? WRONG : arr([...h.v].flat()); }
      // sets
      case 'SADD': {
        const s = typed('set', () => ({ t: 'set', v: new Set() }));
        if (!s) return WRONG;
        let n = 0;
        for (const x of a.slice(2)) if (!s.v.has(x)) { s.v.add(x); n++; }
        return `(integer) ${n}`;
      }
      case 'SMEMBERS': { const s = this.get(k); return !s ? '(empty array)' : s.t !== 'set' ? WRONG : arr([...s.v]); }
      case 'SISMEMBER': { const s = this.get(k); return !s ? '(integer) 0' : s.t !== 'set' ? WRONG : `(integer) ${s.v.has(a[2]) ? 1 : 0}`; }
      // sorted sets
      case 'ZADD': {
        const z = typed('zset', () => ({ t: 'zset', v: new Map() }));
        if (!z) return WRONG;
        let n = 0;
        for (let i = 2; i + 1 < a.length; i += 2) { if (!z.v.has(a[i + 1])) n++; z.v.set(a[i + 1], Number(a[i])); }
        return `(integer) ${n}`;
      }
      case 'ZRANGE': {
        const z = this.get(k);
        if (!z) return '(empty array)';
        if (z.t !== 'zset') return WRONG;
        const sorted = [...z.v].sort((x, y) => x[1] - y[1] || x[0].localeCompare(y[0]));
        let s = Number(a[2]), e = Number(a[3]);
        if (s < 0) s += sorted.length;
        if (e < 0) e += sorted.length;
        const part = sorted.slice(Math.max(0, s), e + 1);
        return arr(a.some((x) => x.toUpperCase() === 'WITHSCORES') ? part.flatMap(([m, sc]) => [m, String(sc)]) : part.map(([m]) => m));
      }
      case 'ZSCORE': { const z = this.get(k); return !z ? '(nil)' : z.t !== 'zset' ? WRONG : z.v.has(a[2]) ? q(String(z.v.get(a[2]))) : '(nil)'; }
      // pub/sub
      case 'PUBLISH': {
        return `(integer) ${this.subs.length}\n→ delivered to ${this.subs.join(', ')} (subscribed to "${k}")`;
      }
      // streams
      case 'XADD': {
        const s = typed('stream', () => ({ t: 'stream', v: { entries: [], groups: new Map(), seq: 0 } }));
        if (!s) return WRONG;
        const id = `${1700000000000 + this.now * 1000 + s.v.seq}-0`;
        s.v.seq++;
        s.v.entries.push({ id, f: a.slice(3) });
        return q(id);
      }
      case 'XLEN': { const s = this.get(k); return !s ? '(integer) 0' : s.t !== 'stream' ? WRONG : `(integer) ${s.v.entries.length}`; }
      case 'XRANGE': {
        const s = this.get(k);
        if (!s) return '(empty array)';
        if (s.t !== 'stream') return WRONG;
        return s.v.entries.map((e, i) => `${i + 1}) 1) ${q(e.id)}\n   2) ${e.f.map(q).join(' ')}`).join('\n') || '(empty array)';
      }
      case 'XGROUP': {
        const s = this.get(a[2]);
        if (!s || s.t !== 'stream') return '(error) ERR The XGROUP subcommand requires the key to exist';
        const g = a[3];
        s.v.groups.set(g, { next: a[4] === '$' ? s.v.entries.length : 0, pending: new Map() });
        return 'OK';
      }
      case 'XREADGROUP': {
        // XREADGROUP GROUP g consumer [COUNT n] STREAMS key >
        const gi = a.findIndex((x) => x.toUpperCase() === 'GROUP');
        const g = a[gi + 1], consumer = a[gi + 2];
        const ci = a.findIndex((x) => x.toUpperCase() === 'COUNT');
        const count = ci > 0 ? Number(a[ci + 1]) : 1;
        const key = a[a.findIndex((x) => x.toUpperCase() === 'STREAMS') + 1];
        const s = this.get(key);
        if (!s || s.t !== 'stream' || !s.v.groups.has(g)) return '(error) NOGROUP No such key or consumer group';
        const grp = s.v.groups.get(g)!;
        const got = s.v.entries.slice(grp.next, grp.next + count);
        grp.next += got.length;
        got.forEach((e) => grp.pending.set(e.id, consumer));
        return got.length ? got.map((e, i) => `${i + 1}) ${q(e.id)}  ${e.f.map(q).join(' ')}  → ${consumer}`).join('\n') : '(nil)';
      }
      case 'XACK': {
        const s = this.get(k);
        if (!s || s.t !== 'stream') return '(integer) 0';
        const grp = s.v.groups.get(a[2]);
        let n = 0;
        for (const id of a.slice(3)) if (grp?.pending.delete(id)) n++;
        return `(integer) ${n}`;
      }
      case 'XPENDING': {
        const s = this.get(k);
        if (!s || s.t !== 'stream') return '(empty array)';
        const grp = s.v.groups.get(a[2]);
        if (!grp) return '(error) NOGROUP';
        return grp.pending.size ? `(integer) ${grp.pending.size} pending\n` + [...grp.pending].map(([id, c], i) => `${i + 1}) ${q(id)} owned by ${c}`).join('\n') : '(integer) 0 pending';
      }
      default: return `(error) ERR unknown command '${a[0]}'`;
    }
  }
}

const REDIS_EXAMPLES: { label: string; cmds: string[] }[] = [
  { label: 'Strings + TTL', cmds: ['SET greeting "hello"', 'GET greeting', 'SET session:42 abc EX 30', 'TTL session:42', 'INCR page:views', 'INCR page:views'] },
  { label: 'List queue', cmds: ['DEL jobs', 'LPUSH jobs "resize-image"', 'LPUSH jobs "send-email"', 'LLEN jobs', 'RPOP jobs', 'LRANGE jobs 0 -1'] },
  { label: 'Hash / set / zset', cmds: ['HSET user:7 name Ayesha city Lahore', 'HGETALL user:7', 'SADD tags redis kafka mqtt', 'SISMEMBER tags kafka', 'ZADD board 120 ali 340 sara 95 omar', 'ZRANGE board 0 -1 WITHSCORES'] },
  { label: 'Pub/Sub', cmds: ['PUBLISH news "breaking: Redis is fast"'] },
  { label: 'Stream + group', cmds: ['DEL orders', 'XADD orders * userId 7 total 59', 'XADD orders * userId 8 total 12', 'XLEN orders', 'XGROUP CREATE orders billing 0', 'XREADGROUP GROUP billing worker-1 COUNT 1 STREAMS orders >', 'XPENDING orders billing', 'XREADGROUP GROUP billing worker-2 COUNT 1 STREAMS orders >', 'XACK orders billing 1700000000000-0', 'XPENDING orders billing'] },
];

export function RedisLab() {
  const r = useRef<MiniRedis | null>(null);
  if (!r.current) r.current = new MiniRedis();
  const [log, setLog] = useState<{ cmd: string; out: string }[]>([{ cmd: 'PING', out: 'PONG' }]);
  const [input, setInput] = useState('');
  const [clock, setClock] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [log]);

  const exec = (c: string) => {
    if (!c.trim()) return;
    setLog((l) => [...l, { cmd: c, out: r.current!.run(c) }]);
  };
  const run = (cmds: string[]) => cmds.forEach(exec);
  const tick = (s: number) => { r.current!.now += s; setClock(r.current!.now); };
  const reset = () => { r.current = new MiniRedis(); setClock(0); setLog([{ cmd: 'PING', out: 'PONG' }]); };

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className="faint" style={{ fontSize: 13, alignSelf: 'center' }}>Run an example:</span>
        {REDIS_EXAMPLES.map((e) => <button key={e.label} className="chip" onClick={() => run(e.cmds)}>▶ {e.label}</button>)}
      </div>
      <div style={{ background: 'var(--code-bg)', color: '#e5e9f5', borderRadius: 14, padding: 14, height: 340, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }} className="thin-scroll">
        {log.map((l, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div><span style={{ color: '#f87171' }}>127.0.0.1:6379&gt;</span> {l.cmd}</div>
            <div style={{ color: l.out.startsWith('(error)') ? '#fca5a5' : '#a7f3d0', whiteSpace: 'pre-wrap' }}>{l.out}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); exec(input); setInput(''); }} style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder='Type a command, e.g.  XADD orders * userId 7   or   LPUSH jobs "task"' style={{ flex: '1 1 260px', fontFamily: 'var(--font-mono)' }} />
        <button className="btn btn-primary" type="submit">Run</button>
        <button className="btn" type="button" onClick={() => tick(10)}>⏩ +10 s (clock: {clock}s)</button>
        <button className="btn btn-ghost" type="button" onClick={reset}>Reset</button>
      </form>
      <p className="faint" style={{ fontSize: 12.5, marginBottom: 0 }}>
        Supported: SET GET DEL EXISTS INCR DECR INCRBY EXPIRE TTL KEYS TYPE · LPUSH RPUSH LPOP RPOP LLEN LRANGE · HSET HGET HGETALL · SADD SMEMBERS SISMEMBER · ZADD ZRANGE ZSCORE · PUBLISH · XADD XLEN XRANGE XGROUP XREADGROUP XACK XPENDING.
        Three pretend clients are subscribed to every channel. Use “+10 s” to watch a key expire.
      </p>
    </div>
  );
}

/* =====================================================================
   2. Kafka: partitions, keys, offsets and consumer groups
   ===================================================================== */
type Msg = { key: string; n: number };
const KEYS = ['user-1', 'user-2', 'user-3', 'user-4', '(no key)'];
const KCOLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#64748b'];
const hashKey = (s: string) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h; };

export function KafkaLab() {
  const [P, setP] = useState(3);
  const [C, setC] = useState(2);
  const [logs, setLogs] = useState<Msg[][]>(() => Array.from({ length: 3 }, () => []));
  const [committed, setCommitted] = useState<number[]>([0, 0, 0]);
  const [key, setKey] = useState(KEYS[0]);
  const [counter, setCounter] = useState(1);
  const [rr, setRr] = useState(0);
  const [note, setNote] = useState('');

  const resize = (p: number) => {
    setP(p);
    setLogs((l) => Array.from({ length: p }, (_, i) => l[i] ?? []));
    setCommitted((c) => Array.from({ length: p }, (_, i) => c[i] ?? 0));
    setNote(`Rebalance! ${p} partitions are re-assigned across the consumers. (Adding partitions changes hash(key) % ${p}, so new messages for a key may go to a different partition.)`);
  };
  const resizeC = (c: number) => { setC(c); setNote(`Rebalance! ${c} consumer${c === 1 ? '' : 's'} in the group share the ${P} partitions.`); };

  const send = (k: string) => {
    const p = k === '(no key)' ? rr % P : hashKey(k) % P;
    if (k === '(no key)') setRr((x) => x + 1);
    setLogs((l) => l.map((arr, i) => (i === p ? [...arr, { key: k, n: counter }] : arr)));
    setCounter((x) => x + 1);
    setNote(k === '(no key)' ? `No key → round-robin → partition ${p}.` : `hash("${k}") % ${P} = partition ${p}. The same key always lands there, so its order is kept.`);
  };
  const sendMany = () => { for (let i = 0; i < 8; i++) send(KEYS[Math.floor(Math.random() * 4)]); };
  const poll = () => {
    setCommitted((c) => c.map((x, i) => Math.min(logs[i].length, x + 1)));
    setNote('Each consumer polled one message from every partition it owns and committed the offset.');
  };
  const reset = () => { setLogs(Array.from({ length: P }, () => [])); setCommitted(Array.from({ length: P }, () => 0)); setCounter(1); setNote(''); };

  const owner = (p: number) => p % C;                       // round-robin assignment
  const owned = (c: number) => Array.from({ length: P }, (_, i) => i).filter((p) => owner(p) === c);
  const lag = (p: number) => logs[p].length - committed[p];

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <label style={{ fontSize: 13.5 }}>Partitions: <b>{P}</b>
          <input type="range" min={1} max={6} value={P} onChange={(e) => resize(+e.target.value)} style={{ display: 'block', accentColor: 'var(--accent)' }} /></label>
        <label style={{ fontSize: 13.5 }}>Consumers in group: <b>{C}</b>
          <input type="range" min={1} max={8} value={C} onChange={(e) => resizeC(+e.target.value)} style={{ display: 'block', accentColor: 'var(--accent)' }} /></label>
        <select className="input" value={key} onChange={(e) => setKey(e.target.value)} style={{ width: 'auto' }}>{KEYS.map((k) => <option key={k}>{k}</option>)}</select>
        <button className="btn btn-primary btn-sm" onClick={() => send(key)}>📤 Send message</button>
        <button className="btn btn-sm" onClick={sendMany}>Send 8 random</button>
        <button className="btn btn-sm" onClick={poll}>📥 Consumers poll</button>
        <button className="btn btn-sm btn-ghost" onClick={reset}>Reset</button>
      </div>
      {note && <div className="sec-body" style={{ padding: '8px 12px', borderRadius: 10, background: 'color-mix(in oklab, var(--accent) 10%, var(--panel))', border: '1px solid var(--border)', fontSize: 13.5, marginBottom: 12 }}>{note}</div>}

      <div style={{ display: 'grid', gap: 8 }}>
        {logs.map((log, p) => (
          <div key={p} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px', gap: 10, alignItems: 'center', padding: 8, borderRadius: 12, background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Partition {p}<div className="faint" style={{ fontWeight: 500, fontSize: 11.5 }}>→ consumer {owner(p) + 1}</div></div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', minHeight: 30 }}>
              {log.map((m, i) => (
                <span key={i} title={`offset ${i}, key ${m.key}`} style={{ minWidth: 26, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, color: 'white', background: KCOLORS[KEYS.indexOf(m.key)], opacity: i < committed[p] ? 0.3 : 1, outline: i === committed[p] ? '2px solid var(--text)' : undefined }}>{i}</span>
              ))}
              {!log.length && <span className="faint" style={{ fontSize: 12 }}>empty</span>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12.5 }} className={lag(p) ? '' : 'faint'}>lag {lag(p)} · end {log.length}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {Array.from({ length: C }, (_, c) => (
          <div key={c} style={{ padding: '8px 12px', borderRadius: 12, border: `1.5px solid ${owned(c).length ? 'var(--accent)' : 'var(--border-2)'}`, background: owned(c).length ? 'color-mix(in oklab, var(--accent) 10%, var(--panel))' : 'var(--panel-2)', opacity: owned(c).length ? 1 : 0.6, fontSize: 13 }}>
            <b>Consumer {c + 1}</b><div className="muted">{owned(c).length ? `reads partition${owned(c).length > 1 ? 's' : ''} ${owned(c).join(', ')}` : '😴 idle (no partition left)'}</div>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
        Colour = key. Faded numbers are offsets already consumed; the outlined box is the next to read. Try 3 partitions with 5 consumers (two idle), or send <b>user-1</b> five times: they all land in one partition, in order.
      </p>
    </div>
  );
}

/* =====================================================================
   3. MQTT topic wildcards
   ===================================================================== */
export function matchMqtt(filter: string, topic: string) {
  const f = filter.split('/'), t = topic.split('/');
  if (topic.startsWith('$') && (filter.startsWith('#') || filter.startsWith('+'))) return false;
  for (let i = 0; i < f.length; i++) {
    if (f[i] === '#') return i === f.length - 1;                 // matches the rest (and the parent level)
    if (i >= t.length) return false;
    if (f[i] !== '+' && f[i] !== t[i]) return false;
  }
  return f.length === t.length;
}

export function MqttWildcardLab() {
  const [filter, setFilter] = useState('home/+/temperature');
  const [topics, setTopics] = useState('home/kitchen/temperature\nhome/bedroom/temperature\nhome/kitchen/humidity\nhome/kitchen/lights/main\nhome/temperature\noffice/temperature\n$SYS/broker/uptime');
  const list = useMemo(() => topics.split('\n').map((s) => s.trim()).filter(Boolean), [topics]);
  const bad = filter.includes('#') && !filter.endsWith('#') ? '“#” must be the last level' : filter.split('/').some((l) => l.length > 1 && /[+#]/.test(l)) ? '“+” and “#” must take a whole level' : '';
  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {['home/+/temperature', 'home/kitchen/#', '#', '+/temperature', 'home/#', '$SYS/#'].map((f) => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} style={{ fontFamily: 'var(--font-mono)' }} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 14 }} className="md:grid-cols-2">
        <div>
          <label className="muted" style={{ fontSize: 13 }}>Subscription filter
            <input className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginTop: 4, fontFamily: 'var(--font-mono)' }} />
          </label>
          {bad && <div style={{ color: 'var(--bad)', fontSize: 13, marginTop: 6 }}>⚠ {bad}</div>}
          <label className="muted" style={{ fontSize: 13, display: 'block', marginTop: 12 }}>Published topics (one per line)
            <textarea className="input" rows={8} value={topics} onChange={(e) => setTopics(e.target.value)} style={{ marginTop: 4 }} />
          </label>
        </div>
        <div>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 6 }}>Does the subscriber receive it?</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {list.map((t) => {
              const ok = !bad && matchMqtt(filter, t);
              return (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 12px', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 13, border: `1px solid ${ok ? 'var(--ok)' : 'var(--border)'}`, background: ok ? 'color-mix(in oklab, var(--ok) 12%, var(--panel))' : 'var(--panel-2)', opacity: ok ? 1 : 0.65 }}>
                  <span>{ok ? '✅' : '❌'}</span><span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{t}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}><b>+</b> = exactly one level · <b>#</b> = everything below (last level only; it also matches the parent, so <code>home/#</code> matches <code>home</code>) · topics starting with <b>$</b> are reserved for the broker and are not matched by a leading wildcard.</p>
    </div>
  );
}

/* =====================================================================
   4. MQTT QoS simulator
   ===================================================================== */
type Packet = { from: 'sender' | 'receiver'; name: string; lost?: boolean; note: string };

function qosScript(qos: 0 | 1 | 2, dropAck: boolean, dropPublish: boolean): { packets: Packet[]; result: string; good: boolean } {
  if (qos === 0) {
    return dropPublish
      ? { packets: [{ from: 'sender', name: 'PUBLISH', lost: true, note: 'sent once, no ack, no retry' }], result: 'Delivered 0 times: the message is lost. QoS 0 is at most once.', good: false }
      : { packets: [{ from: 'sender', name: 'PUBLISH', note: 'fire and forget' }, { from: 'receiver', name: '(app receives it)', note: 'delivered 1 time' }], result: 'Delivered 1 time. QoS 0 never retries, so if the network drops it the message is gone.', good: true };
  }
  if (qos === 1) {
    const p: Packet[] = [];
    if (dropPublish) {
      p.push({ from: 'sender', name: 'PUBLISH (id 7)', lost: true, note: 'lost on the network' }, { from: 'sender', name: 'PUBLISH (id 7, DUP)', note: 'no PUBACK arrived, so the sender retries' }, { from: 'receiver', name: '(app receives it)', note: 'delivered 1 time' }, { from: 'receiver', name: 'PUBACK (id 7)', note: 'sender can stop retrying' });
      return { packets: p, result: 'Delivered 1 time after a retry. QoS 1 guarantees at least once.', good: true };
    }
    p.push({ from: 'sender', name: 'PUBLISH (id 7)', note: 'sent' }, { from: 'receiver', name: '(app receives it)', note: 'delivered 1 time' });
    if (dropAck) {
      p.push({ from: 'receiver', name: 'PUBACK (id 7)', lost: true, note: 'the ack is lost!' }, { from: 'sender', name: 'PUBLISH (id 7, DUP)', note: 'no ack, so resend' }, { from: 'receiver', name: '(app receives it AGAIN)', note: 'delivered a 2nd time ⚠' }, { from: 'receiver', name: 'PUBACK (id 7)', note: 'finally acknowledged' });
      return { packets: p, result: 'Delivered 2 times. QoS 1 is at least once: the handler must be idempotent.', good: false };
    }
    p.push({ from: 'receiver', name: 'PUBACK (id 7)', note: 'acknowledged' });
    return { packets: p, result: 'Delivered 1 time with a 2-packet exchange.', good: true };
  }
  const p: Packet[] = [];
  if (dropPublish) p.push({ from: 'sender', name: 'PUBLISH (id 7)', lost: true, note: 'lost on the network' }, { from: 'sender', name: 'PUBLISH (id 7, DUP)', note: 'no PUBREC, so resend' });
  else p.push({ from: 'sender', name: 'PUBLISH (id 7)', note: 'sent' });
  p.push({ from: 'receiver', name: 'store id 7 + deliver to app', note: 'delivered 1 time' });
  if (dropAck) {
    p.push({ from: 'receiver', name: 'PUBREC (id 7)', lost: true, note: 'the ack is lost!' }, { from: 'sender', name: 'PUBLISH (id 7, DUP)', note: 'no PUBREC, so resend' }, { from: 'receiver', name: 'id 7 already stored: do NOT deliver again', note: 'duplicate ignored ✓' });
  }
  p.push({ from: 'receiver', name: 'PUBREC (id 7)', note: 'received' }, { from: 'sender', name: 'PUBREL (id 7)', note: 'release: you may forget id 7' }, { from: 'receiver', name: 'PUBCOMP (id 7)', note: 'complete' });
  return { packets: p, result: 'Delivered exactly 1 time, even with packet loss. QoS 2 costs 4 packets and more latency.', good: true };
}

export function MqttQosLab() {
  const [qos, setQos] = useState<0 | 1 | 2>(1);
  const [dropAck, setDropAck] = useState(true);
  const [dropPub, setDropPub] = useState(false);
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(false);
  const s = useMemo(() => qosScript(qos, dropAck, dropPub), [qos, dropAck, dropPub]);
  useEffect(() => { setStep(0); setPlay(false); }, [qos, dropAck, dropPub]);
  useEffect(() => {
    if (!play) return;
    if (step >= s.packets.length) { setPlay(false); return; }
    const t = setTimeout(() => setStep((x) => x + 1), 900);
    return () => clearTimeout(t);
  }, [play, step, s.packets.length]);

  return (
    <div className="panel" style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        {([0, 1, 2] as const).map((x) => <button key={x} className={`chip ${qos === x ? 'on' : ''}`} onClick={() => setQos(x)}>QoS {x}{x === 0 ? ' · at most once' : x === 1 ? ' · at least once' : ' · exactly once'}</button>)}
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={dropPub} onChange={(e) => setDropPub(e.target.checked)} /> network drops the PUBLISH</label>
        <label className="chip" style={{ cursor: 'pointer', opacity: qos === 0 ? 0.4 : 1 }}><input type="checkbox" disabled={qos === 0} checked={dropAck && qos > 0} onChange={(e) => setDropAck(e.target.checked)} /> network drops the ack</label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-primary" onClick={() => { if (step >= s.packets.length) setStep(0); setPlay((p) => !p); }}>{play ? '⏸ Pause' : '▶ Play'}</button>
          <button className="btn btn-sm" onClick={() => { setPlay(false); setStep((x) => Math.min(s.packets.length, x + 1)); }}>Step ▶</button>
          <button className="btn btn-sm btn-ghost" onClick={() => { setPlay(false); setStep(0); }}>Reset</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '0 8px' }}>
        <div style={{ textAlign: 'center', fontWeight: 800, padding: 8, borderRadius: 10, background: 'color-mix(in oklab, #8b5cf6 18%, var(--panel))' }}>📡 Sender (publisher)</div>
        <div style={{ textAlign: 'center', fontWeight: 800, padding: 8, borderRadius: 10, background: 'color-mix(in oklab, #06b6d4 18%, var(--panel))' }}>📱 Receiver (broker / subscriber)</div>
      </div>
      <div style={{ display: 'grid', gap: 6, margin: '10px 0', minHeight: 120 }}>
        {s.packets.slice(0, step).map((p, i) => (
          <div key={i} className="sec-body" style={{ display: 'flex', justifyContent: p.from === 'sender' ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '78%', padding: '7px 12px', borderRadius: 12, fontSize: 13.5, border: `1.5px ${p.lost ? 'dashed' : 'solid'} ${p.lost ? 'var(--bad)' : 'var(--border-2)'}`, background: p.lost ? 'color-mix(in oklab, var(--bad) 10%, var(--panel))' : 'var(--panel-2)', textDecoration: p.lost ? 'line-through' : undefined }}>
              <b style={{ fontFamily: 'var(--font-mono)' }}>{p.from === 'sender' ? '→ ' : '← '}{p.name}</b> {p.lost && '💥 LOST'}
              <div className="muted" style={{ fontSize: 12.5, textDecoration: 'none' }}>{p.note}</div>
            </div>
          </div>
        ))}
        {step === 0 && <div className="faint" style={{ fontSize: 13 }}>Press Step or Play to send the message.</div>}
      </div>
      {step >= s.packets.length && (
        <div className="sec-body" style={{ padding: '10px 14px', borderRadius: 12, fontWeight: 650, border: `1.5px solid ${s.good ? 'var(--ok)' : 'var(--warn)'}`, background: `color-mix(in oklab, ${s.good ? 'var(--ok)' : 'var(--warn)'} 10%, var(--panel))` }}>
          {s.good ? '✅ ' : '⚠️ '}{s.result}
        </div>
      )}
    </div>
  );
}
