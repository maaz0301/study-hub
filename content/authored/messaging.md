---
cards: all
slug: messaging
title: Messaging Overview: Redis vs MQTT vs Kafka
subtitle: Compare the three, delivery guarantees, patterns (outbox, DLQ) and a capstone pipeline
emoji: 📨
accent: #f43f5e
category: Messaging
lessonsFile: messaging.lessons.mjs
lessonTopic: capstone
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
