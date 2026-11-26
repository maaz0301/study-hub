# More interview questions

## How would you design a notification system (email, SMS, push) at scale?

Accept notification requests through an **API**, validate and store them, and publish them to a **queue/topic** per channel. **Workers** consume, apply user **preferences and rate limits**, render templates, call the provider (SES, Twilio, FCM) with **retries and backoff**, and record status. Use **idempotency keys** to prevent duplicates, a **dead-letter queue** for failures, provider fallbacks, scheduling (delayed queue), priority queues (security codes before marketing), and metrics for delivery, bounce and latency.

## What is the Saga pattern and why is it used in messaging systems?

A **saga** handles a business transaction that spans several services without a distributed ACID transaction: a **sequence of local transactions**, each publishing an event that triggers the next step; if a step fails, **compensating actions** undo earlier steps (refund the payment, release the stock). Two styles: **choreography** (services react to events) and **orchestration** (a coordinator tells each service what to do). Design steps to be idempotent and keep the saga state durable.

## Event-driven architecture vs event sourcing vs CQRS: how do they differ?

**Event-driven architecture**: services communicate by publishing and reacting to **events**. **Event sourcing**: the **source of truth is the sequence of events** (state is rebuilt by replaying them) instead of the current row. **CQRS**: separate models for **writing** (commands) and **reading** (queries/projections). They combine well (events from the write side build read models) but each adds complexity: use them where you need audit trails, replay or very different read and write needs.

## How do you handle schema evolution and contracts between producers and consumers?

Treat events as a **public API**: use a **schema registry** or versioned schemas, make changes **backward compatible** (add optional fields, never reuse or remove fields suddenly), include an event **type and version** in the envelope, run **consumer-driven contract tests** in CI, and support old and new versions during a deprecation window. Consumers must **ignore unknown fields**.

## How do you get exactly-once effects in practice?

Combine **at-least-once delivery** with **idempotent processing**: give each message a unique id; the consumer records processed ids (a table with a unique constraint, or a `SET NX` key) in the **same transaction** as its side effect, or uses naturally idempotent operations (upsert, `PUT`). Use the **outbox** on the producer side so the event and the database change are committed atomically. True end-to-end exactly-once across independent systems is not possible without these techniques.

## SNS + SQS fan-out: what is it and when do you use it?

Publish one event to an **SNS topic** and have several **SQS queues** subscribed: each service gets **its own queue** with independent retries, scaling and a dead-letter queue. It gives pub/sub (many consumers) plus the buffering and retry behaviour of queues. Use **FIFO** topics/queues when ordering or de-duplication is needed. Kafka consumer groups give a similar effect inside one platform.

## How would you migrate from RabbitMQ to Kafka (or between brokers) safely?

Run both side by side: **dual-publish** (or bridge messages from one to the other), migrate **consumers one service at a time**, compare results, and switch producers last. Keep message formats compatible, make consumers idempotent for the overlap period, plan for **ordering and retention differences**, monitor lag and errors, keep a rollback path, and decommission the old system only after a full cycle of traffic.

## How do you monitor and alert on a messaging system?

Track **throughput** (messages in/out), **backlog and consumer lag**, **age of the oldest message**, **processing time and error rate**, **DLQ size**, redelivery counts, broker health (disk, memory, replication lag, connections) and end-to-end latency with trace ids. Alert on **growing** backlog or age (not just a threshold), DLQ growth, and no-consumer conditions. Add dashboards per topic/queue and run periodic **failure drills**.

## What are poison messages and how do you deal with them?

A **poison message** repeatedly fails processing (malformed data, a bug) and, if retried forever, **blocks** the queue or partition behind it. Handle by validating early, using **bounded retries with backoff**, then moving it to a **dead-letter queue** with the error and headers, alerting on DLQ size, and providing a tool to **inspect, fix and replay** messages. Never drop messages silently.
