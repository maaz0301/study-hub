---
cards: all
slug: kafka
title: Kafka Tutorial
subtitle: Topics, partitions, consumer groups, acks and dead-letter topics with Node.js
emoji: 🌊
accent: #14b8a6
category: Messaging
lessonsFile: messaging.lessons.mjs
lessonTopic: kafka
---

# Start here

## What is Kafka in plain words?

**Apache Kafka** is a distributed **log** for events. Programs **produce** events into **topics**; each topic is split into **partitions** (ordered, append-only files) that are **replicated** across brokers; programs **consume** events at their own pace and can **re-read** history because Kafka keeps the data for days, weeks or forever. Many independent **consumer groups** can read the same stream.

Use it as the central nervous system between services: order events, click streams, logs, change-data-capture from databases, IoT telemetry, stream processing. It is built for throughput (millions of events per second), durability and replay. It is heavier to run than Redis or MQTT, so pick it when you need those strengths.

Follow the **Tutorial** tab to produce and consume for real, and try the **Kafka partitions** lab in the Playground.

# Kafka reference

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
