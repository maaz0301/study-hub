/** Which topics have hands-on labs (the components live in src/components/labs). */
export const LABS: Record<string, { title: string; blurb: string }[]> = {
  dotnet: [
    { title: 'Middleware pipeline', blurb: 'Toggle middleware, send a request and watch it go down and back up.' },
    { title: 'DI lifetimes', blurb: 'See which instances Singleton, Scoped and Transient give you across two requests.' },
    { title: 'LINQ lab', blurb: 'Chain Where, OrderBy, GroupBy, Select and see the C# and the result.' },
  ],
  mongodb: [
    { title: 'Query & aggregation playground', blurb: 'Run real find() filters and aggregation pipelines on sample collections.' },
    { title: 'Index explain simulator', blurb: 'Compare COLLSCAN and IXSCAN on the same query.' },
  ],
  postgres: [
    { title: 'SQL playground (real PostgreSQL)', blurb: 'A real Postgres runs in your browser with a shop database.' },
    { title: 'JOIN visualizer', blurb: 'Pick a join type and see exactly which rows come back.' },
  ],
  'genai-rag': [
    { title: 'Chunking playground', blurb: 'Change chunk size and overlap and see the chunks.' },
    { title: 'Cosine similarity', blurb: 'Drag vectors and watch the similarity change.' },
    { title: 'Mock interview: design scenarios', blurb: 'Pick a system-design scenario, answer in 2 minutes, tick the key points you covered.' },
  ],
  messaging: [
    { title: 'Redis console', blurb: 'A tiny Redis in your browser: strings, lists, hashes, sets, sorted sets, TTL, Pub/Sub and Streams with consumer groups.' },
    { title: 'Kafka partitions and consumer groups', blurb: 'Send keyed messages, watch them land in partitions, and see consumers share (or idle) as you change the counts.' },
    { title: 'MQTT topic wildcards', blurb: 'Type a subscription filter with + and # and see which topics match.' },
    { title: 'MQTT QoS simulator', blurb: 'Drop packets on purpose and see how QoS 0, 1 and 2 behave.' },
  ],
  'leetcode-js': [
    { title: 'Algorithm visualizer', blurb: 'Type your own input and step through two pointers, sliding window, binary search, Kadane, fast/slow and list reversal.' },
    { title: 'Big O feel', blurb: 'Slide the input size and see how many steps each complexity needs.' },
  ],
  leetcode: [
    { title: 'Algorithm visualizer', blurb: 'Type your own input and step through two pointers, sliding window, binary search, Kadane, fast/slow and list reversal, with C# and JS code.' },
    { title: 'Big O feel', blurb: 'Slide the input size and see how many steps each complexity needs.' },
  ],
  'agentic-langchain': [
    { title: 'LangGraph agent run', blurb: 'Step through a ReAct agent graph: state, tool calls, failures and a human-approval interrupt.' },
    { title: 'Agentic patterns explorer', blurb: 'Chaining, routing, parallel, orchestrator–workers, evaluator–optimizer, agents and supervisors.' },
  ],
  'voice-ai': [
    { title: 'Pipeline stepper', blurb: 'Walk through the voice agent one micro step at a time.' },
    { title: 'Latency budget & cost', blurb: 'Tune every stage and see time-to-first-audio and monthly cost.' },
  ],
  'react-node': [
    { title: 'Event loop visualizer', blurb: 'Predict the output order of sync code, microtasks and macrotasks.' },
    { title: 'HTTP status explorer', blurb: 'Quiz yourself on the status code for each situation.' },
  ],
  csharp: [{ title: 'Predict the output', blurb: 'Read a lesson’s program and guess what it prints.' }],
  'ai-fastapi-flask': [{ title: 'Request lifecycle', blurb: 'Follow a FastAPI request through middleware, dependencies, validation and the response.' }],
};
