// Diagrams for the messaging (Redis / MQTT / Kafka) and LeetCode-in-JavaScript topics.
// The generators (flow, cycle, hub, compare) come from diagrams.mjs.

export function extraDiagrams({ flow, cycle, hub, compare }) {
  return {
    // ---------- messaging ----------
    'broker-shapes': () => hub({ title: 'One broker, three shapes', caption: 'a queue gives each message to one worker, pub/sub to everyone listening, a log keeps it so you can replay', center: { i: '📨', t: 'Message broker', s: 'decouples producers and consumers' }, spokes: [
      { i: '🎟️', t: 'Queue', s: 'one consumer gets each message' }, { i: '📻', t: 'Pub/Sub', s: 'every subscriber gets it; not kept' }, { i: '📼', t: 'Log / stream', s: 'kept; replay from any offset' }] }),
    'which-broker': () => hub({ title: 'Which one do I pick?', center: { i: '🤔', t: 'What do I need?', s: 'think about the problem first' }, spokes: [
      { i: '🧠', t: 'Redis', s: 'fast queues and fan-out inside an app', c: '#ef4444' }, { i: '📡', t: 'MQTT', s: 'devices on flaky networks', c: '#8b5cf6' }, { i: '🌊', t: 'Kafka', s: 'durable high-volume event backbone', c: '#14b8a6' }] }),
    'delivery': () => compare({ title: 'Delivery guarantees', left: { icon: '🏃', title: 'At most once', c: '#f59e0b', items: ['May be lost, never duplicated', 'Fastest, no acknowledgement', 'MQTT QoS 0, Redis Pub/Sub', 'OK for frequent sensor data'] }, right: { icon: '🔁', title: 'At least once', c: '#10b981', items: ['Never lost, may be duplicated', 'Needs an ack and a retry', 'MQTT QoS 1, Kafka, Redis Streams', 'Consumers must be idempotent'] } }),
    'redis-pubsub': () => hub({ title: 'Redis Pub/Sub', caption: 'PUBLISH news "hi" reaches everyone subscribed right now; offline clients miss it', center: { i: '🧠', t: 'Redis', s: 'channel "news"', c: '#ef4444' }, spokes: [
      { i: '📤', t: 'Publisher', s: 'PUBLISH news hi' }, { i: '👂', t: 'Subscriber A', s: 'SUBSCRIBE news' }, { i: '👂', t: 'Subscriber B', s: 'SUBSCRIBE news' }, { i: '😴', t: 'Offline client', s: 'misses the message' }] }),
    'redis-queue': () => flow({ title: 'Reliable job queue with a Redis list', caption: 'BLMOVE keeps the job in a processing list until the worker finishes', perRow: 5, steps: [
      { i: '📤', t: 'LPUSH jobs', s: 'producer adds a job' }, { i: '📋', t: 'List "jobs"', s: 'waiting' }, { i: '🔀', t: 'BLMOVE', s: 'atomic move to processing' }, { i: '⚙️', t: 'Worker runs it', s: 'may crash!' }, { i: '✅', t: 'LREM processing', s: 'remove only when done' }] }),
    'redis-streams': () => flow({ title: 'Redis Streams with a consumer group', caption: 'entries are stored; each message goes to one consumer of the group and must be acknowledged', perRow: 5, steps: [
      { i: '📤', t: 'XADD', s: 'append an entry' }, { i: '📼', t: 'Stream', s: 'ids 170…-0, 170…-1' }, { i: '👥', t: 'XREADGROUP', s: 'one worker gets it' }, { i: '⚙️', t: 'Process', s: 'pending until acked' }, { i: '✅', t: 'XACK', s: 'done; XAUTOCLAIM if it dies' }] }),
    'mqtt-pipeline': () => flow({ title: 'MQTT in one picture', caption: 'clients never talk directly: they publish to topics and the broker forwards', perRow: 5, steps: [
      { i: '🌡️', t: 'Sensor', s: 'publishes 21.5' }, { i: '🏷️', t: 'Topic', s: 'home/kitchen/temperature' }, { i: '📡', t: 'Broker', s: 'matches filters' }, { i: '🎯', t: 'Filter', s: 'home/+/temperature' }, { i: '📱', t: 'Subscriber', s: 'gets the value' }] }),
    'mqtt-wildcards': () => compare({ title: 'MQTT wildcards', vs: '+ / #', left: { icon: '➕', title: '+ one level', c: '#8b5cf6', items: ['home/+/temperature', '✓ home/kitchen/temperature', '✓ home/bedroom/temperature', '✗ home/kitchen/lights/temperature'] }, right: { icon: '#️⃣', title: '# all the rest', c: '#06b6d4', items: ['home/kitchen/#', '✓ home/kitchen/temperature', '✓ home/kitchen/lights/main', '✗ home/bedroom/temperature'] } }),
    'mqtt-qos1': () => flow({ title: 'QoS 1: at least once', caption: 'a lost PUBACK makes the sender resend, so a duplicate can arrive', perRow: 5, steps: [
      { i: '📤', t: 'PUBLISH', s: 'packet id 7' }, { i: '📥', t: 'Receiver gets it', s: 'delivers to the app' }, { i: '💨', t: 'PUBACK lost', s: 'network drops the ack', c: '#ef4444' }, { i: '🔁', t: 'Resend (DUP)', s: 'sender retries' }, { i: '⚠️', t: 'Delivered twice', s: 'handler must be idempotent' }] }),
    'mqtt-qos2': () => flow({ title: 'QoS 2: exactly once (4-packet handshake)', caption: 'the receiver remembers the packet id until PUBREL, so a resend is not delivered twice', perRow: 4, steps: [
      { i: '📤', t: 'PUBLISH', s: 'sender → receiver' }, { i: '📝', t: 'PUBREC', s: 'receiver stores the id' }, { i: '🔓', t: 'PUBREL', s: 'sender: release it' }, { i: '✅', t: 'PUBCOMP', s: 'delivered exactly once' }] }),
    'kafka-arch': () => hub({ title: 'Kafka architecture', caption: 'producers append to partitions; each consumer group reads independently', center: { i: '🌊', t: 'Kafka cluster', s: 'topics → partitions → replicas', c: '#14b8a6' }, spokes: [
      { i: '📤', t: 'Producers', s: 'orders API, IoT bridge' }, { i: '💳', t: 'Group: billing', s: 'reads all events' }, { i: '📊', t: 'Group: analytics', s: 'reads all events too' }, { i: '🗄️', t: 'Connect / sinks', s: 'to DB, S3, search' }] }),
    'kafka-partitions': () => flow({ title: 'How a message picks a partition', caption: 'same key → same partition → ordered; each partition is read by one consumer in a group', perRow: 4, steps: [
      { i: '📤', t: 'Producer', s: 'key = user-7' }, { i: '#️⃣', t: 'hash(key) % 3', s: '= partition 1' }, { i: '📼', t: 'Partition 1', s: 'append at offset 42' }, { i: '👤', t: 'Consumer B', s: 'owns partition 1 in the group' }] }),
    'kafka-groups': () => compare({ title: 'Consumers vs partitions', left: { icon: '👍', title: 'Consumers ≤ partitions', c: '#10b981', items: ['6 partitions, 3 consumers', 'each consumer reads 2 partitions', 'work is shared evenly', 'add consumers to go faster'] }, right: { icon: '😴', title: 'Consumers > partitions', c: '#f59e0b', items: ['4 partitions, 6 consumers', '2 consumers sit idle', 'one partition = one consumer', 'add partitions to scale more'] } }),
    'kafka-replication': () => hub({ title: 'Replication: leader and followers', caption: 'acks=all waits for the in-sync replicas; if the leader dies a follower takes over', center: { i: '👑', t: 'Leader', s: 'partition 0 (broker 1)', c: '#14b8a6' }, spokes: [
      { i: '📄', t: 'Follower (broker 2)', s: 'in sync' }, { i: '📄', t: 'Follower (broker 3)', s: 'in sync' }, { i: '📤', t: 'Producer', s: 'acks=all' }] }),
    'outbox': () => flow({ title: 'Outbox pattern', caption: 'write the data and the event in one database transaction; a relay publishes it afterwards', perRow: 5, steps: [
      { i: '🗄️', t: 'One DB transaction', s: 'order row + outbox row' }, { i: '📬', t: 'Outbox table', s: 'status = pending' }, { i: '🔁', t: 'Relay / CDC', s: 'polls or reads the DB log' }, { i: '🌊', t: 'Publish to broker', s: 'Kafka / Redis / MQTT' }, { i: '✅', t: 'Mark sent', s: 'consumers dedupe by id' }] }),
    'dlq': () => flow({ title: 'Retry and dead-letter queue', caption: 'do not block the line: retry with backoff, then park the poison message', perRow: 5, steps: [
      { i: '📥', t: 'Consume', s: 'message arrives' }, { i: '💥', t: 'Fails', s: 'bug or bad data', c: '#ef4444' }, { i: '⏳', t: 'Retry with backoff', s: '1 s, 10 s, 1 min…' }, { i: '☠️', t: 'Dead-letter topic', s: 'after N attempts' }, { i: '🔔', t: 'Alert + replay', s: 'fix, then re-publish' }] }),
    'iot-pipeline': () => flow({ title: 'IoT telemetry pipeline', caption: 'MQTT at the edge, Kafka as the backbone, Redis for the live view', perRow: 4, steps: [
      { i: '🌡️', t: 'Devices', s: 'MQTT QoS 1 + TLS' }, { i: '📡', t: 'MQTT broker', s: 'EMQX / HiveMQ' }, { i: '🌉', t: 'Bridge', s: 'forward to Kafka (key = device id)' }, { i: '🌊', t: 'Kafka topic', s: 'telemetry, replayable' },
      { i: '🧮', t: 'Stream processing', s: 'averages, alerts' }, { i: '🗄️', t: 'Time-series DB', s: 'history' }, { i: '⚡', t: 'Redis', s: 'latest value per device' }, { i: '🖥️', t: 'Dashboard', s: 'live via WebSocket' }] }),
    // ---------- LeetCode in JavaScript ----------
    'bfs-dfs': () => compare({ title: 'BFS vs DFS', vs: 'or', left: { icon: '🌊', title: 'BFS (queue)', c: '#3b82f6', items: ['visit level by level', 'shortest path in unweighted graphs', 'level order, rotting oranges', 'uses a queue'] }, right: { icon: '🕳️', title: 'DFS (stack / recursion)', c: '#8b5cf6', items: ['go deep, then backtrack', 'count islands, clone graph', 'tree depth, validate BST', 'uses recursion or a stack'] } }),
    'backtrack': () => cycle({ title: 'Backtracking: choose, explore, un-choose', caption: 'build a path one step at a time and undo the step after exploring it', center: 'dfs(path)', steps: [
      { i: '👉', t: 'Choose', s: 'path.push(x)' }, { i: '🔭', t: 'Explore', s: 'dfs(next)' }, { i: '↩️', t: 'Un-choose', s: 'path.pop()' }, { i: '💾', t: 'Save a copy', s: 'res.push([...path])' }] }),
    'topo-sort': () => flow({ title: 'Course Schedule: topological sort (Kahn)', caption: 'finish courses with no prerequisites first; if some never finish there is a cycle', perRow: 5, steps: [
      { i: '🧮', t: 'Count prerequisites', s: 'indegree per course' }, { i: '0️⃣', t: 'Queue the zeros', s: 'courses you can take now' }, { i: '✅', t: 'Take one', s: 'done++' }, { i: '➖', t: 'Lower dependents', s: 'indegree-- ; queue new zeros' }, { i: '🏁', t: 'done == n ?', s: 'yes → no cycle' }] }),
    'dp-recipe': () => flow({ title: 'Dynamic programming in 4 steps', perRow: 4, steps: [
      { i: '❓', t: 'State', s: 'dp[i] means …' }, { i: '🔗', t: 'Transition', s: 'dp[i] from smaller states' }, { i: '🌱', t: 'Base case', s: 'dp[0] = …' }, { i: '🏁', t: 'Answer', s: 'dp[n]' }] }),
    'debounce-throttle': () => compare({ title: 'Debounce vs throttle', left: { icon: '⏳', title: 'Debounce', c: '#06b6d4', items: ['waits for a pause in calls', 'resets the timer on every call', 'search box: run after typing stops', 'one call at the end'] }, right: { icon: '🚦', title: 'Throttle', c: '#f59e0b', items: ['runs at most once per interval', 'ignores calls that come too soon', 'scroll / resize handlers', 'steady calls during activity'] } }),
    'promise-pool': () => flow({ title: 'Promise pool (limit concurrency)', caption: 'N workers each keep taking the next task until none are left', perRow: 4, steps: [
      { i: '📋', t: 'Task list', s: '100 async tasks' }, { i: '👷', t: 'Start 5 workers', s: 'limit = 5' }, { i: '🔁', t: 'Each takes next', s: 'next++ until empty' }, { i: '🏁', t: 'Promise.all(workers)', s: 'results in order' }] }),
  };
}

export const EXTRA_RULES = {
  messaging: [
    [/what is a message broker/i, 'broker-shapes'], [/which one should I use/i, 'which-broker'], [/delivery guarantees/i, 'delivery'],
    [/redis Pub\/Sub work/i, 'redis-pubsub'], [/reliable job queue/i, 'redis-queue'], [/redis Streams and consumer groups/i, 'redis-streams'],
    [/What is MQTT and why/i, 'mqtt-pipeline'], [/topics and wildcards/i, 'mqtt-wildcards'], [/QoS levels/i, 'mqtt-qos1'], [/QoS levels/i, 'mqtt-qos2'],
    [/What is Apache Kafka/i, 'kafka-arch'], [/topics, partitions and offsets/i, 'kafka-partitions'], [/consumers and consumer groups/i, 'kafka-groups'], [/replicate data/i, 'kafka-replication'],
    [/Outbox pattern/i, 'outbox'], [/dead-letter queue/i, 'dlq'], [/IoT telemetry pipeline/i, 'iot-pipeline'],
  ],
  'leetcode-js': [
    [/^76\./, 'sliding-window'], [/^567\./, 'sliding-window'], [/^424\./, 'sliding-window'], [/^42\./, 'two-pointers'], [/^33\./, 'binary-search'], [/^153\./, 'binary-search'],
    [/^155\./, 'stack-parens'], [/^1143\./, 'dp-recipe'], [/^322\./, 'dp-recipe'], [/^102\./, 'bfs-dfs'], [/^200\./, 'bfs-dfs'], [/^46\./, 'backtrack'], [/^78\./, 'backtrack'],
    [/^207\./, 'topo-sort'], [/Implement debounce/i, 'debounce-throttle'], [/Limit concurrency/i, 'promise-pool'], [/^53\./, 'kadane'],
  ],
};
