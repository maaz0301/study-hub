# More interview questions

## What is the difference between BRPOP and BLMOVE for a job queue?

`BRPOP` removes the item from the list as soon as it is returned, so if the worker crashes before finishing, the job is **lost**. `BLMOVE source destination RIGHT LEFT timeout` **atomically moves** the item into a `processing` list, so it still exists until you remove it with `LREM` after success. This is the reliable-queue pattern; a janitor re-queues items stuck in `processing`. BullMQ and similar libraries implement this for you.

## In a Redis Stream, what do `$`, `0` and `>` mean?

- **`$`** (in `XGROUP CREATE` or `XREAD`): "only entries added **after now**".
- **`0`** (in `XGROUP CREATE`): start the group at the **very first** entry. In `XREADGROUP`, `0` re-reads **your own pending** (delivered, unacknowledged) entries.
- **`>`** (in `XREADGROUP`): give me entries **never delivered to any consumer** of this group.
Using the wrong one is a common cause of "my consumer sees nothing" or "re-processing everything".

## How do you implement a rate limiter with Redis?

Simplest: a **fixed window** counter: `INCR key` then `EXPIRE key 60` on the first hit; reject when the count exceeds the limit. More accurate: a **sliding window** with a **sorted set** (add the timestamp, remove old entries with `ZREMRANGEBYSCORE`, count with `ZCARD`) or a **token bucket** stored in a Lua script. Do the check and update in one **Lua script** or `MULTI` so concurrent requests cannot race.

## What are the problems with a Redis distributed lock (Redlock)?

The basic lock is `SET lock:key <random-token> NX PX 30000`, released by a script that deletes it **only if the token matches**. Problems: if the holder pauses (GC, network) longer than the TTL, the lock expires and **two clients hold it**; failover can lose a lock that was not replicated; clocks drift. Use **fencing tokens** (a monotonically increasing number the resource checks), keep critical sections short, and prefer database constraints or idempotency when correctness matters more than speed.

## What happens to Pub/Sub when a subscriber is slow?

Redis keeps an **output buffer** per client. If a subscriber cannot read fast enough, the buffer grows until it hits `client-output-buffer-limit pubsub` (by default 32 MB hard / 8 MB over 60 s) and Redis **disconnects that client**, so messages are lost. Keep subscriber handlers fast (push work to a queue), monitor client buffers, and use Streams when you need to absorb bursts.

## How does Pub/Sub behave in Redis Cluster?

Classic `PUBLISH` is **broadcast to every node** in the cluster, which does not scale with many channels. **Sharded Pub/Sub** (`SPUBLISH`/`SSUBSCRIBE`, Redis 7) maps a channel to a **hash slot**, so only the shard owning that slot handles it. Use sharded Pub/Sub for large clusters, or move to Streams (which live in one slot per key).

## AOF vs RDB persistence: what should you choose for queues and streams?

**RDB** takes periodic **snapshots** (compact, fast restarts, but you can lose minutes of data). **AOF** logs every write (`appendfsync everysec` loses at most about one second; `always` is safest but slower) and is rewritten in the background. For queues and streams where losing messages matters use **AOF** (often together with RDB) plus replication; remember replication is asynchronous, so a failover can still lose the last writes.

## How do you implement delayed or scheduled jobs in Redis?

Use a **sorted set** where the score is the **time to run**: `ZADD delayed <timestamp> <job>`. A worker polls `ZRANGEBYSCORE delayed -inf <now> LIMIT 0 10`, moves due jobs to a list or stream with a **Lua script** (so two workers do not take the same job) and removes them from the set. Libraries like **BullMQ** do this (delays, repeatable jobs, retries) so you do not have to build it.

## How do you use Redis for idempotency keys?

`SET idem:<key> <result-or-"processing"> NX EX 86400` succeeds only for the **first** request with that key. If it returns nil, a request with the same key already ran: return the stored result (or `409` while it is still processing). Store the final response when the work completes. The TTL bounds memory use. It must be combined with the real side effect being safe to retry.

## Redis Streams vs Kafka: when would you choose Streams?

Choose **Redis Streams** when you already run Redis, volume is moderate, you want **low latency and simple operations**, and a retention of hours or days in memory is fine. Choose **Kafka** for very high throughput, **long retention**, many partitions, large consumer groups, replay of months of data, an ecosystem (Connect, Streams, Schema Registry) and stronger durability guarantees. Streams are memory-bound and scale mostly by sharding keys yourself.

## How do you monitor a Redis-based queue?

Track **queue length** (`LLEN`, `XLEN`), **pending entries** (`XPENDING`), **oldest pending age**, consumer lag, processing time and failure counts, plus Redis health (memory, `evicted_keys`, connected clients, replication lag, slow log). Alert when the backlog or oldest message age keeps growing and when memory nears `maxmemory` (an eviction policy that removes queue keys would silently lose jobs, so use `noeviction` for queue instances).
