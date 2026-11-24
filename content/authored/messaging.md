---
slug: messaging
title: Messaging: Redis, MQTT & Kafka
subtitle: 27 hands-on Node.js lessons plus reference on queues, pub/sub and event streams
emoji: 📨
accent: #f43f5e
category: Messaging
cards: all
---

# Start here

## What is a message broker, in one minute?

A **message broker** sits between programs so they do not have to talk to each other directly. A **producer** (publisher) sends a message to the broker; one or more **consumers** (subscribers) receive it later. This **decouples** the two sides: they can be written in different languages, run at different speeds, and one can be offline while the other keeps working.

Three shapes you will meet:

| Shape | Who gets each message? | Kept after reading? | Example |
|---|---|---|---|
| **Queue** (work queue) | **one** consumer (workers share the load) | removed once acknowledged | Redis list + BullMQ, RabbitMQ |
| **Pub/Sub** | **every** current subscriber | usually **not kept** at all | Redis Pub/Sub, MQTT |
| **Log / stream** | every consumer **group**, each at its own position | **kept** for a retention time; can be replayed | Kafka, Redis Streams |

Picture: a queue is a ticket counter (each ticket goes to one clerk), pub/sub is a radio broadcast (everyone tuned in hears it, latecomers miss it) and a log is a recorded video that each viewer can watch from any point.

## Which one should I use?

| | Redis (Pub/Sub, Lists, Streams) | MQTT | Kafka |
|---|---|---|---|
| **Best for** | fast in-app messaging, job queues, small streams | **IoT**, phones, flaky networks, millions of tiny devices | high-volume event streaming, data pipelines, event sourcing |
| **Model** | pub/sub, list queue, stream with consumer groups | topic-based pub/sub | partitioned, replicated, durable **log** |
| **Persistence** | Pub/Sub: none. Lists/Streams: in memory + disk (RDB/AOF) | optional (retained messages, persistent sessions) | **always** on disk, replayable |
| **Throughput** | very high (single node) | high connection count, small messages | very high, scales by adding partitions and brokers |
| **Ordering** | per list / per stream | per topic per client (QoS dependent) | **per partition** |
| **Delivery** | Pub/Sub: at-most-once. Streams: at-least-once | QoS 0, 1 or 2 | at-least-once, exactly-once with transactions |
| **Weak spot** | memory-bound, not a long-term event store | not built for replay or big analytics | operational weight, higher latency than Redis |

Rule of thumb: **devices → MQTT**, **a job queue or quick fan-out inside your app → Redis**, **durable event backbone shared by many services → Kafka**. Real systems often chain them (devices → MQTT → Kafka → services).

## What are the delivery guarantees (at-most-once, at-least-once, exactly-once)?

- **At most once**: a message is delivered 0 or 1 times. It may be **lost**, never duplicated. Fastest. (MQTT QoS 0, Redis Pub/Sub.)
- **At least once**: delivered 1 or more times. It is **never lost** but may be **duplicated** after a retry, so consumers must be **idempotent**. (MQTT QoS 1, Kafka default, Redis Streams.)
- **Exactly once**: processed exactly one time. Hard: usually achieved as *at-least-once delivery + idempotent processing*. (MQTT QoS 2, Kafka transactions.)

Why duplicates happen: the consumer processes a message, then crashes **before** acknowledging it, so the broker sends it again. The fix is an **idempotent consumer**: store the message id (or use `INSERT ... ON CONFLICT DO NOTHING`) so reprocessing changes nothing.

# Redis messaging

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

# MQTT

## What is MQTT and why does IoT use it?

**MQTT** (Message Queuing Telemetry Transport) is a tiny **publish/subscribe** protocol over TCP (port 1883, TLS on 8883, WebSockets for browsers). Its header can be just **2 bytes**, it keeps one long-lived connection, and it copes with slow, unreliable networks, which is why sensors, phones, cars and smart-home devices use it.

Parts: **clients** (publishers and subscribers) connect to a **broker** (Mosquitto, EMQX, HiveMQ, AWS IoT Core). Clients never talk to each other directly; they publish to a **topic** and the broker forwards to subscribers of that topic.

```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883', { clientId: 'sensor-1', clean: true });

client.on('connect', () => {
  client.subscribe('home/+/temperature', { qos: 1 });
  client.publish('home/kitchen/temperature', '21.5', { qos: 1, retain: true });
});

client.on('message', (topic, payload) => {
  console.log(topic, payload.toString());
});
```

## How do MQTT topics and wildcards work?

A topic is a path of levels separated by `/`, like `home/kitchen/temperature`. A subscription can use two wildcards:

| Wildcard | Meaning | Example filter | Matches |
|---|---|---|---|
| `+` | exactly **one** level | `home/+/temperature` | `home/kitchen/temperature`, `home/bedroom/temperature` |
| `#` | **all remaining** levels (must be last) | `home/kitchen/#` | `home/kitchen/temperature`, `home/kitchen/lights/main` |

Rules: topics are case-sensitive; never start a topic with `/`; you **cannot** publish to a wildcard; topics starting with `$` (like `$SYS/...`) are reserved for the broker and are **not** matched by a leading `#` or `+`. Test filters in the **MQTT topic wildcards** lab.

## What are MQTT QoS levels 0, 1 and 2?

QoS (Quality of Service) is chosen per publish and per subscription; the lower of the two applies for each hop.

| QoS | Guarantee | Packets | Use for |
|---|---|---|---|
| **0** | at most once, no ack | PUBLISH | frequent sensor readings where one lost value does not matter |
| **1** | at least once (duplicates possible) | PUBLISH → PUBACK | most things: commands, alerts (make handlers idempotent) |
| **2** | exactly once | PUBLISH → PUBREC → PUBREL → PUBCOMP | billing, critical commands (slowest, 4 packets) |

How QoS 1 can duplicate: the receiver gets the message but the **PUBACK is lost**, so the sender resends it with the DUP flag. QoS 2 adds a second handshake so the receiver remembers the packet id and delivers it only once. See it in the **MQTT QoS simulator**.

## What are retained messages, Last Will and persistent sessions?

- **Retained message**: the broker keeps the **last** message of a topic and gives it to every **new subscriber** immediately (great for "current state", e.g. a device's last temperature or `online`/`offline`). Clear it by publishing an empty retained payload.
- **Last Will and Testament (LWT)**: a message the client registers at connect time; the broker publishes it if the client **disconnects ungracefully**. Typical use: publish `offline` on `devices/sensor-1/status`.
- **Keep alive**: the client pings every N seconds; if the broker hears nothing for ~1.5 × N it declares the client dead and sends the LWT.
- **Persistent session** (`clean: false` / MQTT 5 `sessionExpiryInterval`) with a fixed `clientId`: the broker stores subscriptions and queued QoS 1/2 messages while the client is offline and delivers them on reconnect.

```javascript
const client = mqtt.connect(url, {
  clientId: 'sensor-1',
  clean: false,                                   // keep the session
  keepalive: 30,
  will: { topic: 'devices/sensor-1/status', payload: 'offline', qos: 1, retain: true },
});
client.on('connect', () => client.publish('devices/sensor-1/status', 'online', { qos: 1, retain: true }));
```

## What is new in MQTT 5?

Reason codes on acks, **user properties** (metadata headers), **message expiry**, **session expiry**, **shared subscriptions** (`$share/group/topic` load-balances a topic across a group of subscribers, like a work queue), topic aliases, request/response (`responseTopic`, `correlationData`) and better error reporting.

## How do you secure and scale MQTT?

- Use **TLS** (8883), never send passwords over plain 1883 on the internet. Authenticate with username/password, **client certificates** or tokens (JWT/OAuth); restrict what each client may publish or subscribe to with **ACLs** (e.g. a device may only publish to `devices/<its id>/#`).
- Scale with a **clustered broker** (EMQX, HiveMQ, VerneMQ) behind a load balancer; use **shared subscriptions** for backend consumers.
- Bridge to other systems: broker rules or a bridge service forward MQTT into **Kafka**, databases or HTTP.
- Browsers connect over **MQTT over WebSockets**.

## MQTT vs HTTP: why not just use HTTP?

HTTP is request/response: devices would have to **poll**, each request has big headers and a new handshake, and the server cannot push to a device behind NAT. MQTT keeps one small, always-open connection, **pushes** data both ways, has built-in delivery guarantees, a last-will for presence and uses far less bandwidth and battery.

# Kafka

## What is Apache Kafka?

Kafka is a **distributed, durable, replicated commit log** used as an event streaming platform. Producers **append** events to **topics**; events are stored on disk for a retention period (days, weeks, forever) and any number of consumers can read them at their own pace, and **re-read** them. It is built for very high throughput (millions of events/second) and is the "central nervous system" of many companies' data pipelines.

Key words: **broker** (a Kafka server), **cluster**, **topic**, **partition**, **offset**, **producer**, **consumer**, **consumer group**, **replica**, **leader**.

## What are topics, partitions and offsets?

- A **topic** is a named stream of events (`orders`, `payments`).
- A topic is split into **partitions**. Each partition is an **ordered, append-only log**; every event in it gets a number called an **offset** (0, 1, 2, …).
- **Ordering is guaranteed only inside one partition**, not across the whole topic.
- Partitions are how Kafka **scales**: they are spread across brokers and consumed in parallel.
- The producer decides the partition: by the **key** (`hash(key) % partitions`, so the same key always goes to the same partition, which keeps that key's events in order), or round-robin/sticky if there is no key.

Play with partitions, keys and consumers in the **Kafka partitions and consumer groups** lab.

## How do Kafka producers work (keys, acks, idempotence)?

- **Key**: choose it so related events stay together and ordered (`userId`, `orderId`). A very skewed key makes a **hot partition**.
- **`acks`**: `0` (do not wait, can lose), `1` (leader wrote it), `all` (all **in-sync replicas** wrote it; safest). Combine with `min.insync.replicas=2`.
- **Idempotent producer** (`enable.idempotence=true`): retries do not create duplicates inside a partition (the broker de-duplicates using a producer id and sequence number).
- **Batching and compression** (`linger.ms`, `batch.size`, `compression.type=lz4|zstd`) raise throughput.

```javascript
import { Kafka, Partitioners } from 'kafkajs';

const kafka = new Kafka({ clientId: 'shop-api', brokers: ['localhost:9092'] });
const producer = kafka.producer({ idempotent: true, createPartitioner: Partitioners.DefaultPartitioner });

await producer.connect();
await producer.send({
  topic: 'orders',
  acks: -1,                                           // -1 = all in-sync replicas
  messages: [{ key: 'user-7', value: JSON.stringify({ orderId: 1, total: 59 }) }],
});
```

## How do Kafka consumers and consumer groups work?

Consumers join a **consumer group**. Kafka assigns each partition to **exactly one consumer in the group**, so the group shares the work, and different groups each get **all** the events independently (one group for billing, another for analytics).

- 6 partitions and 3 consumers → each gets 2 partitions.
- **More consumers than partitions** → the extras sit **idle**. Partitions are the upper limit of parallelism.
- When a consumer joins, leaves or crashes Kafka **rebalances** (reassigns partitions). Cooperative rebalancing and static membership reduce the pause.
- A consumer records how far it has read by **committing offsets**. After a restart it continues from the committed offset. **Consumer lag** = latest offset − committed offset; rising lag means consumers are too slow.

```javascript
const consumer = kafka.consumer({ groupId: 'billing' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    await handle(JSON.parse(message.value.toString()));   // idempotent!
    await consumer.commitOffsets([{ topic, partition, offset: (Number(message.offset) + 1).toString() }]);
  },
});
```

Commit **after** processing for at-least-once; commit **before** for at-most-once (can lose on crash).

## How does Kafka replicate data (leader, ISR)?

Each partition has a **replication factor** (usually 3): one **leader** handles reads and writes, the others are **followers** that copy it. The **ISR** (in-sync replicas) are followers that are caught up. If the leader's broker dies, a new leader is elected from the ISR, so no acknowledged data is lost when `acks=all` and `min.insync.replicas` is set correctly. A common safe setup: `replication.factor=3`, `min.insync.replicas=2`, `acks=all`.

## What are retention and log compaction?

- **Time/size retention**: delete old segments after `retention.ms` or `retention.bytes` (default 7 days). Reading does **not** delete anything.
- **Log compaction** (`cleanup.policy=compact`): keep only the **latest value per key**, like a table of current state (user profiles, config). Publishing a key with a `null` value (a *tombstone*) deletes it.

## What are Kafka delivery semantics and exactly-once?

- **At-most-once**: commit offsets *before* processing (a crash loses work).
- **At-least-once** (default): commit *after* processing (a crash causes reprocessing and duplicates).
- **Exactly-once**: **idempotent producer + transactions**. A transactional producer writes output records and the consumed offsets **atomically**; consumers use `isolation.level=read_committed`. This gives exactly-once for *Kafka-to-Kafka* pipelines (Kafka Streams `processing.guarantee=exactly_once_v2`). When the final step writes to an **external system** (a database, an email), you still need an **idempotent write**.

## What is the Kafka ecosystem (KRaft, Connect, Streams, Schema Registry)?

- **KRaft**: Kafka's built-in consensus (Raft) that replaced **ZooKeeper** for cluster metadata in modern versions.
- **Kafka Connect**: ready-made connectors that move data in and out (databases via CDC with Debezium, S3, Elasticsearch, MQTT bridge).
- **Kafka Streams / ksqlDB / Flink**: stateful stream processing (joins, windows, aggregations).
- **Schema Registry** with **Avro / Protobuf / JSON Schema**: enforces a contract for message formats and allows safe schema evolution.

## How do you pick the number of partitions and the key?

Partitions ≥ the **maximum number of consumers** you want in one group; size for throughput (target MB/s ÷ MB/s one partition can do). You can **add** partitions later but that changes `hash(key) % n`, so the same key may go to a different partition and per-key ordering breaks across the change. Pick a key with many distinct values and even traffic (user id, device id), never a constant or a boolean.

# Patterns and interview questions

## What is the Outbox pattern and why is it needed?

Problem: you must **update your database and publish an event**, but a database and a broker cannot share one transaction. If you write the DB then publish and crash in between, the event is lost (or the opposite: event sent, DB rolled back).

Solution: in **one database transaction** write your data **and** an `outbox` row. A separate **relay** (a poller, or **CDC** such as Debezium reading the DB log) reads the outbox and publishes to Kafka/Redis/MQTT, then marks it sent. Result: **at-least-once publishing without losing events**; consumers dedupe by event id.

## What is an idempotent consumer?

A consumer that can process the **same message twice** with the same result as once. Ways: store processed message ids in a table with a unique constraint; use natural idempotency (`UPDATE ... SET status='paid'`, `PUT`, `SETNX`); use upserts (`INSERT ... ON CONFLICT DO NOTHING`); include a version/sequence number and ignore old ones. It is the standard answer to "the broker delivers at-least-once".

## What is a dead-letter queue (DLQ) and how do you retry?

When a message keeps failing (bad data, a bug), blocking it would stop everything behind it. Pattern: **retry** a few times with **exponential backoff** (maybe through separate retry topics `orders.retry.1m`, `orders.retry.10m`), and after the limit send it to a **dead-letter queue/topic** with the error and original headers. Alert on DLQ size, then fix the bug and **replay**. Never retry forever in a tight loop.

## How do you keep message order?

- **Kafka**: same key → same partition → ordered. Do not run multiple threads on one partition without care; avoid changing partition counts.
- **Redis**: one list / one stream preserves order; with several workers, order of *completion* is not guaranteed.
- **MQTT**: ordered per topic and QoS from one publisher to one subscriber on one connection; QoS 1 retries can reorder (MQTT 5 shared subscriptions do not guarantee order).
- General rule: **ordering is cheap inside one partition/queue and expensive globally**. Shard by the entity that needs order (one user, one device).

## What is backpressure and how do you handle slow consumers?

When producers are faster than consumers, a backlog builds. Options: scale consumers (more partitions/workers), batch work, **pause** consumption (`consumer.pause()`), rate-limit producers, set memory limits and **drop or sample** low-value data (MQTT QoS 0 telemetry). Monitor **consumer lag** (Kafka), **stream length / pending count** (Redis Streams) and queue depth. Pull-based systems (Kafka, Streams) handle this more naturally than push-based Pub/Sub.

## Design an IoT telemetry pipeline (devices → dashboard)

1. **Devices** publish readings to `devices/<id>/telemetry` over **MQTT** (QoS 1, TLS, per-device credentials and ACL), with a **Last Will** for presence.
2. A clustered **MQTT broker** (EMQX/HiveMQ) accepts millions of connections.
3. A **bridge/rule engine** forwards messages to **Kafka** (`telemetry` topic, key = device id so each device stays ordered).
4. **Consumer groups** read independently: a **stream processor** (Flink/Kafka Streams) computes rolling averages and alerts; a **sink connector** writes raw data to a time-series DB or object storage.
5. **Redis** holds the **latest value per device** (for the dashboard) and **Pub/Sub** pushes live updates to WebSocket clients.
6. Reliability: idempotent writes, DLQ for malformed data, retention for replay, lag and error-rate alerts.

## Redis vs Kafka vs MQTT: give me the 30-second answer

"They solve different problems. **MQTT** is a lightweight protocol for devices on unreliable networks: topic pub/sub with three QoS levels, retained messages and last will. **Redis** is an in-memory data store that also does fast pub/sub, simple job queues and streams; great inside one application, but memory-bound. **Kafka** is a durable, partitioned, replayable log for high-volume event streaming between many services. I pick by need: devices → MQTT, quick queues and fan-out → Redis, a durable shared event backbone → Kafka, and I often combine them with a bridge."

## Kafka vs RabbitMQ: what is the difference?

**RabbitMQ** is a traditional **message broker**: smart broker, exchanges and queues with flexible routing, messages are **deleted after ack**, good for task queues and complex routing, per-message acknowledgements. **Kafka** is a **log**: dumb broker, smart consumers that track offsets, messages are **retained and replayable**, built for throughput and streaming. Use RabbitMQ for work distribution with rich routing; Kafka when you need replay, multiple independent consumers and big data volumes.
