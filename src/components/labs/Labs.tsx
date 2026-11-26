'use client';
import dynamic from 'next/dynamic';
import { LABS } from '@/lib/labs';

const loading = () => <div className="panel muted" style={{ padding: 24 }}>Loading lab…</div>;
const L = {
  Middleware: dynamic(() => import('./DotnetLabs').then((m) => m.MiddlewareLab), { loading }),
  Di: dynamic(() => import('./DotnetLabs').then((m) => m.DiLab), { loading }),
  Linq: dynamic(() => import('./DotnetLabs').then((m) => m.LinqLab), { loading }),
  Mongo: dynamic(() => import('./MongoLabs').then((m) => m.MongoLab), { loading, ssr: false }),
  MongoIndex: dynamic(() => import('./MongoLabs').then((m) => m.IndexLab), { loading }),
  Sql: dynamic(() => import('./SqlLab').then((m) => m.SqlLab), { loading, ssr: false }),
  Join: dynamic(() => import('./JoinLab').then((m) => m.JoinLab), { loading }),
  Chunk: dynamic(() => import('./AiLabs').then((m) => m.ChunkLab), { loading }),
  Cosine: dynamic(() => import('./AiLabs').then((m) => m.CosineLab), { loading }),
  Pipeline: dynamic(() => import('./VoiceLabs').then((m) => m.PipelineLab), { loading }),
  Latency: dynamic(() => import('./VoiceLabs').then((m) => m.LatencyCostLab), { loading }),
  EventLoop: dynamic(() => import('./JsLabs').then((m) => m.EventLoopLab), { loading }),
  Status: dynamic(() => import('./JsLabs').then((m) => m.StatusLab), { loading }),
  Predict: dynamic(() => import('./JsLabs').then((m) => m.PredictLab), { loading }),
  AgentGraph: dynamic(() => import('./AgentLabs').then((m) => m.AgentGraphLab), { loading }),
  Patterns: dynamic(() => import('./AgentLabs').then((m) => m.PatternsLab), { loading }),
  Mock: dynamic(() => import('./AgentLabs').then((m) => m.MockInterviewLab), { loading }),
  Lifecycle: dynamic(() => import('./AiLabs').then((m) => m.LifecycleLab), { loading }),
  Redis: dynamic(() => import('./MessagingLabs').then((m) => m.RedisLab), { loading }),
  Kafka: dynamic(() => import('./MessagingLabs').then((m) => m.KafkaLab), { loading }),
  MqttWild: dynamic(() => import('./MessagingLabs').then((m) => m.MqttWildcardLab), { loading }),
  MqttQos: dynamic(() => import('./MessagingLabs').then((m) => m.MqttQosLab), { loading }),
  N8n: dynamic(() => import('./AutomationLabs').then((m) => m.N8nLab), { loading }),
  Cicd: dynamic(() => import('./AutomationLabs').then((m) => m.CicdLab), { loading }),
  Canary: dynamic(() => import('./AutomationLabs').then((m) => m.CanaryLab), { loading }),
  Algo: dynamic(() => import('./LeetLabs').then((m) => m.AlgoLab), { loading }),
  BigO: dynamic(() => import('./LeetLabs').then((m) => m.BigOLab), { loading }),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const MAP: Record<string, ((d: any) => React.ReactNode)[]> = {
  dotnet: [() => <L.Middleware />, () => <L.Di />, () => <L.Linq />],
  mongodb: [() => <L.Mongo />, () => <L.MongoIndex />],
  postgres: [() => <L.Sql />, () => <L.Join />],
  'genai-rag': [() => <L.Chunk />, () => <L.Cosine />, (d) => <L.Mock items={d?.mock || []} />],
  'agentic-langchain': [() => <L.AgentGraph />, () => <L.Patterns />],
  leetcode: [() => <L.Algo />, () => <L.BigO />],
  'leetcode-js': [() => <L.Algo />, () => <L.BigO />],
  redis: [() => <L.Redis />],
  mqtt: [() => <L.MqttWild />, () => <L.MqttQos />],
  kafka: [() => <L.Kafka />],
  n8n: [() => <L.N8n />],
  cicd: [() => <L.Cicd />, () => <L.Canary />],
  'voice-ai': [(d) => <L.Pipeline steps={d?.steps || []} />, () => <L.Latency />],
  'react-node': [() => <L.EventLoop />, () => <L.Status />],
  csharp: [(d) => <L.Predict items={d || []} />],
  'ai-fastapi-flask': [() => <L.Lifecycle />],
};

export function Labs({ slug, data }: { slug: string; data: unknown }) {
  const meta = LABS[slug] || [];
  const render = MAP[slug] || [];
  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {meta.length > 1 && (
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {meta.map((m, i) => <a key={m.title} href={`#lab-${i}`} className="chip">🧪 {m.title}</a>)}
        </nav>
      )}
      {meta.map((m, i) => (
        <section key={m.title} id={`lab-${i}`} style={{ scrollMarginTop: 80 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{m.title}</h2>
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 15 }}>{m.blurb}</p>
          {render[i]?.(data)}
        </section>
      ))}
    </div>
  );
}
