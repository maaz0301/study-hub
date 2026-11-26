# More interview questions

## What is WiredTiger and why does it matter?

**WiredTiger** is MongoDB's default **storage engine**. It provides **document-level concurrency control** (many writers at once), **compression** (snappy, zstd) for data and indexes, **checkpoints and a journal** for crash recovery, and an **internal cache** (by default about 50% of RAM minus 1 GB). Knowing it explains why working-set size, index size and disk throughput drive performance.

## What are read preference and read/write concern, and how do they combine for consistency?

**Read preference** decides **which member** serves reads (`primary`, `primaryPreferred`, `secondary`, `nearest`). **Write concern** (`w: "majority"`) decides how many members must acknowledge a write; **read concern** (`majority`, `linearizable`) decides how committed the data must be. Reading from a secondary can return **stale** data. For read-your-own-writes use `primary`, or **causal consistency** sessions with majority concerns.

## What are change streams and what are they used for?

A **change stream** lets an application **subscribe to changes** (inserts, updates, deletes) of a collection, database or cluster in real time, built on the **oplog**, with a **resume token** so it can continue after a disconnect. Uses: cache invalidation, syncing to search or analytics systems, event-driven microservices, notifications. It needs a **replica set** (or sharded cluster).

## TTL indexes vs capped collections: what is the difference?

A **TTL index** (`expireAfterSeconds`) on a date field makes MongoDB **delete documents** after a time (sessions, logs, tokens); deletion runs in a background task about every 60 seconds. A **capped collection** has a **fixed size**: it keeps insertion order and overwrites the **oldest** documents when full (good for rolling logs), but you cannot delete individual documents or shard it. Choose TTL for time-based expiry, capped for fixed-size buffers.

## How do you find and fix slow queries in MongoDB?

Turn on the **profiler** (`db.setProfilingLevel(1, { slowms: 100 })`) or use Atlas Performance Advisor, then run `explain("executionStats")` on slow queries: look for **COLLSCAN**, high `totalDocsExamined` vs `nReturned`, in-memory sorts, and large documents. Fix with the right **compound index** (ESR rule), projections, pagination by range, avoiding `$where` and unanchored regex, and reshaping the schema to avoid `$lookup` on hot paths.

## How do you handle schema changes (migrations) in MongoDB?

Because documents are flexible, use **schema versioning**: add a `schemaVersion` field, make code read **both** old and new shapes, then migrate lazily (when a document is written) or with a background script that updates in batches, and finally drop the old handling. Add **JSON Schema validation** (`validationLevel: "moderate"` for existing data) to enforce the new shape going forward, and keep changes backward compatible during deploys.

## How do you model a many-to-many relationship?

Options: **arrays of ids on one side** (students hold `courseIds`) when one side is bounded; **arrays on both sides** when queries go both ways (keep them in sync, watch the 16 MB limit); or a **separate "join" collection** (`enrollments` with `studentId`, `courseId` and extra fields like grade/date) when the relationship has its own data or is unbounded. Embed a few read-hot fields (**extended reference** pattern) to avoid lookups.

## What are common shard-key mistakes?

A **monotonically increasing key** (timestamp, ObjectId) sends all inserts to one shard (a hot shard); **low cardinality** (country, boolean) limits how finely data can be split (jumbo chunks); a key **not used in queries** forces **scatter-gather** to every shard; and a key that cannot be changed easily (since 5.0 you can reshard, but it is expensive). Use a high-cardinality key that matches your query filters, often compound (`tenantId + _id`) or hashed.

## How do backup and restore work in MongoDB?

Options: **`mongodump`/`mongorestore`** (logical, simple, slow for big data), **filesystem or cloud snapshots** with a consistent point (fast, needs journaling and care with sharded clusters), and **continuous backup with oplog** for **point-in-time recovery** (Atlas, Ops Manager/Cloud Manager). Test restores regularly, keep backups off the cluster and encrypted, and define RPO/RTO targets.

## `$expr` vs `$where` vs regular query operators?

Regular operators (`$gt`, `$in`) are fastest and use indexes. **`$expr`** lets you use **aggregation expressions** in a query (compare two fields: `{ $expr: { $gt: ["$spent", "$budget"] } }`) and can use indexes in some cases. **`$where`** runs **JavaScript** per document: slow, no index use and a security risk; avoid it (and it is disabled on some hosted plans).

## MongoDB or PostgreSQL with JSONB: how do you choose?

Pick **PostgreSQL** when data is relational, you need strong **multi-table transactions, joins and constraints**, rich SQL analytics, or you want one database for everything (JSONB covers flexible fields). Pick **MongoDB** when documents are the natural unit, schemas change often, you need easy **horizontal sharding**, or workloads are read/write heavy on nested data. Team skills, tooling and operational maturity matter as much as features.
