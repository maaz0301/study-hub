# More interview questions

## Why is Kafka so fast?

Kafka writes and reads **sequentially** on disk (append-only logs), uses the operating system's **page cache** instead of its own, sends data to consumers with **zero-copy** (`sendfile`) so bytes go from the page cache to the network without extra copies, **batches** and **compresses** messages, and **partitions** topics so many brokers and consumers work in parallel. Sequential disk access can be faster than random memory access patterns, which is why a log is a good data structure.

## What is the controller, and what changed with KRaft?

One broker acts as the **controller**: it manages cluster **metadata** (topics, partitions, leaders, broker membership) and elects partition leaders when brokers fail. Older versions stored this in **ZooKeeper**. **KRaft** mode replaces ZooKeeper with a built-in **Raft** quorum of controllers that keeps the metadata in an internal log, giving simpler operations, faster controller failover and support for many more partitions.

## How does exactly-once semantics work in Kafka?

Three pieces: the **idempotent producer** (producer id + sequence numbers so retries do not create duplicates in a partition), **transactions** (a producer can write to several partitions and commit the consumed **offsets** atomically, so all or none are visible), and consumers with `isolation.level=read_committed` that ignore uncommitted or aborted records. Kafka Streams enables it with `processing.guarantee=exactly_once_v2`. It covers **Kafka-to-Kafka** processing; writes to an external system still need idempotent handling.

## How do you choose the number of partitions and the rebalance strategy?

Partitions limit **consumer parallelism** and spread load: aim for at least the number of consumers you will run and size for throughput (target ÷ per-partition throughput), with headroom since reducing is not possible. Too many partitions increase broker memory, open files and failover time. For rebalancing, prefer the **cooperative sticky** assignor (only moved partitions pause) and **static membership** (`group.instance.id`) to avoid rebalances on quick restarts.

## What is consumer lag and how do you reduce it?

**Lag** = the latest offset in a partition minus the group's committed offset: how far behind the consumers are. Reduce it by **adding consumers** (up to the partition count), making processing **faster** (batching, async I/O, fewer database round trips), increasing `max.poll.records` carefully, avoiding long work inside `poll` (which triggers rebalances), adding partitions, and fixing slow downstream systems. Alert on lag trend, not only on a single number.

## What is the difference between retention and compaction?

**Retention** (`retention.ms`, `retention.bytes`) deletes whole **old segments** after a time or size, regardless of keys; the topic is an event history. **Compaction** (`cleanup.policy=compact`) keeps only the **latest record per key** (and deletes a key when you write a null "tombstone"), turning the topic into a **table of current state** (user profiles, configs); consumers can rebuild state by reading it from the start. You can combine both (`compact,delete`).

## What is the Schema Registry and what are compatibility modes?

The **Schema Registry** stores versioned schemas (Avro, Protobuf, JSON Schema); messages carry a small **schema id**, and producers/consumers fetch the schema. It enforces **compatibility** when you evolve a schema: **backward** (new schema can read old data: consumers upgrade first), **forward** (old schema can read new data: producers upgrade first), **full** (both). Safe changes add optional fields with defaults; renaming or removing required fields breaks consumers.

## What happens when the ISR shrinks, and what is unclean leader election?

The **ISR** (in-sync replicas) is the set of replicas that are caught up. If a follower lags or dies it leaves the ISR. With `acks=all` and `min.insync.replicas=2`, writes **fail** (rather than lose data) when the ISR drops below 2. **Unclean leader election** (`unclean.leader.election.enable=true`) lets an **out-of-sync** replica become leader when no in-sync one is available: the partition stays available but **committed messages can be lost**. Keep it off for data you cannot lose.

## Kafka vs RabbitMQ vs Pulsar: how do you choose?

**Kafka**: distributed log, very high throughput, long retention and replay, huge ecosystem; consumers track offsets. **RabbitMQ**: flexible routing (exchanges, queues), per-message acks and priorities, delete-after-ack, great for **task queues** and complex routing, lower throughput. **Pulsar**: log plus queue semantics, separates compute (brokers) from storage (BookKeeper), built-in multi-tenancy and geo-replication; younger ecosystem. Choose by use case: event backbone (Kafka), work queue (RabbitMQ), multi-tenant streaming (Pulsar).

## How do you keep ordering when a producer retries?

Without care, a retry of an earlier batch after a later one succeeded can **reorder** messages. With **`enable.idempotence=true`** (which also requires `acks=all` and limits in-flight requests to 5 or fewer) Kafka keeps ordering per partition and removes duplicates. Without idempotence set `max.in.flight.requests.per.connection=1` if strict order matters, at some cost to throughput.

## What is change data capture (CDC) with Debezium?

**CDC** streams every **insert, update and delete** from a database's transaction log (MySQL binlog, PostgreSQL WAL) as events. **Debezium** (a Kafka Connect source connector) reads the log and writes events to Kafka topics, so other systems can react in near real time without querying the database. It underlies the **Outbox pattern**, cache and search index updates, and data-lake sync. Handle schema changes, large initial snapshots and tombstones.

## What are Kafka Streams state stores?

Kafka Streams is a client library for stream processing. Operations like **aggregations, joins and windowing** need **state**, kept in local **state stores** (RocksDB) backed by a compacted **changelog topic** in Kafka. If an instance fails, another rebuilds the store from the changelog, so processing continues with exactly-once guarantees. State size, standby replicas and rebalancing time are the main operational concerns.
