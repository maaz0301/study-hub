# More interview questions

## What are VACUUM and autovacuum, and what is table bloat?

Because of **MVCC**, an `UPDATE` or `DELETE` leaves the old row version ("dead tuple") in the table. **VACUUM** marks that space reusable and updates visibility info; **autovacuum** runs it automatically. If vacuum cannot keep up (long transactions hold old versions, bad settings), tables and indexes **bloat**: they grow and slow down. Fix with tuned autovacuum thresholds, short transactions, `VACUUM (ANALYZE)`, and `pg_repack` or `VACUUM FULL` (locks) for heavy bloat. VACUUM also prevents **transaction ID wraparound**.

## What is the WAL (write-ahead log) and what does a checkpoint do?

Every change is written to the **WAL** (sequential log) **before** it is applied to data files, so after a crash PostgreSQL can **replay** the log and recover. A **checkpoint** flushes dirty buffers to disk and marks a point from which recovery can start. The WAL also powers **replication** and **point-in-time recovery**. Tune `max_wal_size` and `checkpoint_timeout` to balance I/O spikes and recovery time.

## What is an index-only scan and a covering index?

If every column a query needs is **inside the index**, PostgreSQL can answer from the index without reading the table (an **index-only scan**), which needs the **visibility map** to be up to date (vacuum). Create a covering index with `INCLUDE`: `CREATE INDEX ON orders (customer_id) INCLUDE (total, status);`. It speeds up hot read queries but makes the index bigger and writes slower.

## How does PgBouncer work and what are the pooling modes?

PostgreSQL uses one process per connection, so thousands of connections are costly. **PgBouncer** sits in front and multiplexes many client connections over a few server connections. **Session** pooling holds a server connection for the whole client session (safest), **transaction** pooling returns it after each transaction (best reuse, but no session features like `SET`, advisory locks or prepared statements by default), **statement** pooling is the most restrictive. Size pools small and use transaction mode for web apps.

## What are the isolation anomalies, and what is write skew?

At **Read Committed**, you can see **non-repeatable reads** and **phantoms**. At **Repeatable Read** (snapshot isolation) those are prevented but **write skew** can remain: two transactions each read overlapping data, make decisions based on it and write **different** rows, breaking an invariant (two doctors both go off-call). **Serializable** (SSI) detects it and aborts one transaction, so you must **retry**. Alternatives: lock the rows with `SELECT … FOR UPDATE` or add constraints.

## What is LISTEN/NOTIFY and when would you use it?

`NOTIFY channel, 'payload'` sends a lightweight message to every session that ran `LISTEN channel`, delivered when the transaction commits. Use it for cache invalidation, waking workers, or live updates. It is **not durable** (a disconnected listener misses messages) and payloads are small, so use a queue/stream (or a table with `SKIP LOCKED` polling) when you need guaranteed delivery.

## Table partitioning vs sharding?

**Partitioning** splits one logical table into **partitions** (by range, list or hash) **inside one database**: queries and maintenance touch only relevant partitions (partition pruning), and old data can be dropped instantly (`DROP` a month). **Sharding** spreads data across **multiple servers** (Citus, application-level) for scale beyond one machine. Partition first; shard only when a single node's CPU, memory or storage is the limit.

## Physical vs logical replication?

**Physical (streaming)** replication copies the **WAL**, producing an identical standby of the **whole cluster** (high availability, read replicas); same major version required. **Logical** replication publishes **row changes** of selected tables (`CREATE PUBLICATION` / `SUBSCRIPTION`), so you can replicate part of a database, between major versions, or into other systems (CDC with Debezium). It does not replicate DDL or sequences automatically.

## What is row-level security (RLS)?

RLS lets you define **policies** so a query only sees or changes the rows the current user is allowed to: `ALTER TABLE docs ENABLE ROW LEVEL SECURITY; CREATE POLICY tenant ON docs USING (tenant_id = current_setting('app.tenant')::int);`. It is ideal for **multi-tenant** apps and enforces isolation **inside the database**, even if application code has a bug. Remember it does not apply to table owners/superusers unless forced.

## How do you find and debug a deadlock or a blocked query?

Check `pg_stat_activity` (state, `wait_event`, query, how long it has been running) and `pg_locks` joined with `pg_blocking_pids(pid)` to see who blocks whom. With `log_lock_waits = on` and `deadlock_timeout`, PostgreSQL logs deadlocks with the involved statements. Prevent them by locking rows in a **consistent order**, keeping transactions short, and avoiding user interaction inside a transaction.

## How do you implement "insert or update" and a safe job queue in PostgreSQL?

Upsert with `INSERT … ON CONFLICT (key) DO UPDATE SET …` (needs a unique index). For a **job queue**, let workers claim rows without blocking each other: 

```sql
UPDATE jobs SET status = 'running', started_at = now()
WHERE id = (
  SELECT id FROM jobs WHERE status = 'queued'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
) RETURNING *;
```

`SKIP LOCKED` makes concurrent workers skip rows already locked by others.

## When is a CTE materialised, and does it affect performance?

Since PostgreSQL 12, a non-recursive CTE that is referenced **once** and has no side effects is **inlined** (optimised like a subquery). If it is referenced several times or you write `WITH x AS MATERIALIZED (…)`, it is computed once and stored, acting as an **optimisation fence**. Use `NOT MATERIALIZED` to allow inlining or `MATERIALIZED` to force a single evaluation of an expensive query.
