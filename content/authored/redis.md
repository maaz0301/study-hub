---
cards: all
slug: redis
title: Redis Tutorial
subtitle: Pub/Sub, list queues and Streams with Node.js: lessons, reference and quiz
emoji: 🔴
accent: #ef4444
category: Messaging
lessonsFile: messaging.lessons.mjs
lessonTopic: redis
---

# Start here

## What is Redis and what can it do for messaging?

**Redis** is an in-memory data store that is extremely fast (sub-millisecond). Beyond caching it offers three messaging tools: **Pub/Sub** (live broadcast, nothing stored), **Lists** (a simple job queue) and **Streams** (a durable log with consumer groups and acknowledgements). It is the quickest way to add queues and real-time messages to an application you already run, and it is single-threaded per instance, so commands are atomic.

Use it for: live notifications, job queues (with BullMQ), rate limiting, leaderboards, sessions, and small event streams. Move to Kafka when you need huge retention, many partitions and a data platform.

## Which Redis messaging tool should I pick?

| Need | Use |
|---|---|
| Live broadcast, losing a message is fine | **Pub/Sub** |
| One worker takes each job | **List** + `BLMOVE` (or BullMQ) |
| Durable, acknowledged, replayable, several consumer groups | **Streams** |
| Huge volume, long retention, analytics | **Kafka** |

Follow the **Tutorial** tab to run each one yourself, and try the **Redis console** in the Playground.

# Redis reference

## How does Redis Pub/Sub work?

Clients **SUBSCRIBE** to channels; any client can **PUBLISH** to a channel and Redis pushes the message to everyone subscribed *at that moment*. It is **fire-and-forget**: nothing is stored, a subscriber that is offline **misses** the message, and there is no acknowledgement. Use it for live notifications, cache invalidation and chat presence, **not** for work that must not be lost.

```bash
# terminal 1
redis-cli SUBSCRIBE news
# terminal 2
redis-cli PUBLISH news "hello"      # (integer) 1  = number of subscribers that received it
```

Patterns: `PSUBSCRIBE news.*` subscribes with a glob pattern. Sharded Pub/Sub (`SPUBLISH` / `SSUBSCRIBE`, Redis 7) scales better in a cluster.

## How do you use Pub/Sub from Node.js?

A connection in subscriber mode can only run subscribe commands, so use **two connections**: one to subscribe, one for everything else.

```javascript
import Redis from 'ioredis';

const sub = new Redis();
const pub = new Redis();

await sub.subscribe('news');
sub.on('message', (channel, message) => {
  console.log(`got ${message} on ${channel}`);
});

await pub.publish('news', JSON.stringify({ id: 1, text: 'hello' }));
```

## How do you build a reliable job queue with Redis lists?

A **list** is a simple queue: producers `LPUSH`, workers `BRPOP` (block until an item arrives). The naive version **loses a job** if the worker crashes after popping it. The reliable version moves the job to a *processing* list atomically and removes it only when done:

```javascript
// producer
await redis.lpush('jobs', JSON.stringify({ id: 42, task: 'resize' }));

// worker: BLMOVE pops from 'jobs' and pushes to 'jobs:processing' in one atomic step
const raw = await redis.blmove('jobs', 'jobs:processing', 'RIGHT', 'LEFT', 5);
if (raw) {
  try {
    await handle(JSON.parse(raw));
    await redis.lrem('jobs:processing', 1, raw);      // done: remove it
  } catch {
    // leave it in processing; a janitor re-queues stale items
  }
}
```

In production use **BullMQ** (built on Redis): retries with backoff, delays, priorities, rate limiting, repeatable jobs and a dashboard.

## What are Redis Streams and consumer groups?

A **stream** is an append-only **log** inside Redis. Each entry has an id like `1700000000000-0` (time-sequence) and fields. Unlike Pub/Sub, entries are **stored**, can be **read later**, and consumers can share work with a **consumer group** where each message goes to **one** consumer of the group and must be **acknowledged**.

```bash
XADD orders * userId 7 total 59            # append; * = auto id
XGROUP CREATE orders billing $ MKSTREAM    # a group that starts at new messages
XREADGROUP GROUP billing worker-1 COUNT 10 BLOCK 5000 STREAMS orders >
XACK orders billing 1700000000000-0        # mark as processed
XPENDING orders billing                    # delivered but not yet acknowledged
XAUTOCLAIM orders billing worker-2 60000 0 # take over messages a dead worker held > 60 s
XTRIM orders MAXLEN ~ 100000               # keep the stream bounded
```

```javascript
// Node.js consumer with ioredis
await redis.xgroup('CREATE', 'orders', 'billing', '$', 'MKSTREAM').catch(() => {});
for (;;) {
  const res = await redis.xreadgroup('GROUP', 'billing', 'worker-1', 'COUNT', 10, 'BLOCK', 5000, 'STREAMS', 'orders', '>');
  for (const [, entries] of res ?? []) {
    for (const [id, fields] of entries) {
      await process(fields);
      await redis.xack('orders', 'billing', id);   // ack AFTER success
    }
  }
}
```

Try all of these in the **Redis console** lab.

## Redis Pub/Sub vs Streams: when do you pick which?

- **Pub/Sub**: live broadcast where losing a message is fine (typing indicators, cache invalidation). No storage, no ack, no replay.
- **Streams**: you need **durability, acknowledgements, retries, several consumer groups, or replay**. At-least-once, with `XPENDING` / `XAUTOCLAIM` for crashed consumers.
- **Lists**: the simplest work queue when you only need "one worker takes one job".
- If you need **huge retention, many partitions or a data platform**, move to **Kafka**.

## How do you avoid losing messages with Redis?

- Do not use Pub/Sub for important work; use **Streams** or **BullMQ**.
- **Acknowledge only after** the work is done; handle the **pending list** for crashed workers.
- Turn on persistence (**AOF** `appendfsync everysec`, or RDB + AOF) and replication/Sentinel/Cluster for failover. Note that replication is asynchronous, so a failover can still lose the last writes.
- Make consumers **idempotent**, because retries cause duplicates.
- Cap memory (`maxmemory` and `XTRIM`) so a backlog cannot evict or crash Redis.
