---
slug: postgres
title: PostgreSQL
subtitle: SQL from zero, joins, indexes, transactions & MVCC, JSONB, window functions, pgvector
emoji: 🐘
accent: #3b82f6
category: Databases
---

# Start here

## What is PostgreSQL, in one minute

PostgreSQL ("Postgres") is a free, open-source **relational database**. Data lives in **tables** with typed **columns**, tables are linked by **keys**, and you ask questions with **SQL**. It is known for correctness (full ACID), a rich type system (JSONB, arrays, ranges, UUID), powerful indexes, and extensions such as **PostGIS** and **pgvector**.

The **Playground** tab runs a real PostgreSQL (compiled to WebAssembly) in your browser, with a small shop database ready to query.

## Your first tables

```sql
CREATE TABLE customers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  city       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total       NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO customers (name, email, city) VALUES ('Ayesha', 'ayesha@example.com', 'Lahore');
SELECT * FROM customers WHERE city = 'Lahore' ORDER BY created_at DESC LIMIT 10;
```

## The order SQL actually runs in

You **write** `SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT`, but the database **evaluates**:

1. `FROM` / `JOIN` — build the rows
2. `WHERE` — filter rows
3. `GROUP BY` — make groups
4. `HAVING` — filter groups
5. `SELECT` — compute columns (and window functions)
6. `DISTINCT`
7. `ORDER BY`
8. `LIMIT` / `OFFSET`

This is why you cannot use a `SELECT` alias inside `WHERE`, and why aggregates go in `HAVING`, not `WHERE`.

# Querying

## What are the types of JOIN?

| Join | Returns |
|---|---|
| `INNER JOIN` | only rows that match on both sides |
| `LEFT JOIN` | all rows from the left, matches from the right or NULL |
| `RIGHT JOIN` | all rows from the right, matches from the left or NULL |
| `FULL JOIN` | all rows from both, NULL where no match |
| `CROSS JOIN` | every combination (cartesian product) |
| Self join | a table joined to itself (employee → manager) |

```sql
-- customers with no orders (anti-join)
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

## What is the difference between WHERE and HAVING?

`WHERE` filters **rows before** grouping; `HAVING` filters **groups after** aggregation.

```sql
SELECT customer_id, SUM(total) AS spent
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING SUM(total) > 100;
```

## What are CTEs and recursive CTEs?

A **CTE** (`WITH`) names a sub-query so a big query reads top to bottom. A **recursive CTE** walks hierarchies (org charts, categories, graphs).

```sql
WITH RECURSIVE chain AS (
  SELECT id, name, manager_id, 1 AS depth FROM employees WHERE id = 7
  UNION ALL
  SELECT e.id, e.name, e.manager_id, c.depth + 1
  FROM employees e JOIN chain c ON e.id = c.manager_id
)
SELECT * FROM chain;
```

## What are window functions?

They compute across a set of related rows **without collapsing them** like `GROUP BY` does. Use `OVER (PARTITION BY … ORDER BY …)`.

```sql
SELECT customer_id, id, total,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rank_in_customer,
       SUM(total)   OVER (PARTITION BY customer_id) AS customer_total,
       total - LAG(total) OVER (ORDER BY created_at) AS change_vs_previous
FROM orders;
```

`ROW_NUMBER` (1,2,3,4), `RANK` (1,2,2,4), `DENSE_RANK` (1,2,2,3), plus `LAG`, `LEAD`, `NTILE`, running totals.

## How do you find the Nth highest value?

```sql
-- 2nd highest order total
SELECT DISTINCT total FROM orders ORDER BY total DESC OFFSET 1 LIMIT 1;

-- or with a window function (handles ties your way)
SELECT total FROM (
  SELECT total, DENSE_RANK() OVER (ORDER BY total DESC) AS r FROM orders
) t WHERE r = 2;
```

## How do you find and remove duplicates?

```sql
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;

DELETE FROM customers a
USING customers b
WHERE a.email = b.email AND a.id > b.id;   -- keep the lowest id
```

## UNION vs UNION ALL?

`UNION` combines results and **removes duplicates** (needs a sort or hash, slower). `UNION ALL` keeps everything and is faster. Use `UNION ALL` unless you need de-duplication.

## What is UPSERT in PostgreSQL?

`INSERT … ON CONFLICT` inserts, or updates when a unique constraint would be violated.

```sql
INSERT INTO stock (sku, qty) VALUES ('PEN-1', 5)
ON CONFLICT (sku) DO UPDATE SET qty = stock.qty + EXCLUDED.qty;
```

# Design

## What are primary keys, foreign keys and constraints?

- **Primary key**: unique, not null row identity (`SERIAL`/`IDENTITY` integer or `UUID`).
- **Foreign key**: a column that must match a key in another table; `ON DELETE CASCADE / SET NULL / RESTRICT` decides what happens to children.
- `UNIQUE`, `NOT NULL`, `CHECK (price >= 0)`, `DEFAULT`, and Postgres-only **exclusion constraints** (no overlapping bookings).

Constraints keep bad data out even when app code has bugs.

## What is normalization?

Organizing tables to remove duplication and update anomalies.

- **1NF**: atomic values, no repeating groups (no "tag1, tag2" in one column).
- **2NF**: every non-key column depends on the **whole** key.
- **3NF**: non-key columns depend **only** on the key, not on other non-key columns (store `city_id`, not the city's country in every customer row).

**Denormalize** on purpose for read speed (reporting tables, cached totals), and accept the cost of keeping copies in sync.

## SERIAL vs IDENTITY vs UUID?

`SERIAL` is the old shorthand for a sequence; `GENERATED ALWAYS AS IDENTITY` is the SQL-standard modern form. **UUID** keys are unique across systems and safe to expose, but bigger and random (worse index locality); **UUIDv7** is time-ordered and fixes most of that.

# Indexes & performance

## How do indexes work in PostgreSQL?

An index is a separate structure that finds rows without scanning the whole table. The default is a **B-tree** (equality, ranges, sorting).

| Index | Good for |
|---|---|
| B-tree | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, prefix `LIKE 'abc%'` |
| Hash | equality only |
| GIN | JSONB, arrays, full-text search |
| GiST / SP-GiST | geometry, ranges, nearest-neighbour |
| BRIN | huge, naturally ordered tables (time-series) |
| HNSW / IVFFlat (pgvector) | vector similarity search |

Also: **composite** (`(customer_id, created_at)`), **partial** (`WHERE status = 'pending'`), **expression** (`lower(email)`) and **covering** (`INCLUDE (total)`) indexes. Use `CREATE INDEX CONCURRENTLY` on busy production tables.

## How do you read EXPLAIN ANALYZE?

`EXPLAIN` shows the plan; `EXPLAIN ANALYZE` runs it and shows real times and row counts. Look for:

- **Seq Scan** on a big table with a selective filter → missing index.
- **Estimated rows far from actual rows** → stale statistics, run `ANALYZE`.
- Join types: **Nested Loop** (small inputs), **Hash Join** (big unsorted), **Merge Join** (sorted inputs).
- Sorts or hashes spilling to disk → raise `work_mem` for that query.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
```

## Why might Postgres ignore your index?

The filter is not selective (it matches most rows, so a sequential scan is cheaper), a function or cast is applied to the column (`WHERE lower(email) = …` without an expression index), a leading wildcard (`LIKE '%abc'`), the composite index's first column is not used, or statistics are stale.

## How do you speed up a slow query?

1. Measure with `EXPLAIN ANALYZE` and `pg_stat_statements`.
2. Add the right index (composite in filter/sort order, partial, covering).
3. Select only needed columns, paginate with **keyset** (`WHERE id < $last ORDER BY id DESC LIMIT 20`) instead of large `OFFSET`.
4. Fix N+1 queries in the app; batch writes.
5. Keep stats fresh (`ANALYZE`), let autovacuum keep up.
6. Use connection pooling (**PgBouncer**), caching, and read replicas for read-heavy loads; partition very large tables.

# Transactions & concurrency

## What does ACID mean?

- **Atomicity**: all statements in a transaction succeed, or none do.
- **Consistency**: constraints hold before and after.
- **Isolation**: concurrent transactions do not see each other's half-done work.
- **Durability**: once committed, it survives a crash (the **WAL**, write-ahead log).

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- or ROLLBACK;
```

## What is MVCC?

**Multi-Version Concurrency Control**: an `UPDATE` writes a **new version** of the row instead of overwriting it, and each transaction sees a consistent **snapshot**. Result: **readers never block writers and writers never block readers**. Old versions ("dead tuples") are cleaned up later by **VACUUM** (autovacuum).

## What are the isolation levels?

| Level | Prevents |
|---|---|
| Read Committed (**default**) | dirty reads |
| Repeatable Read | + non-repeatable reads, phantoms (in Postgres) |
| Serializable | + all anomalies; may fail with a serialization error, so retry |

Postgres treats Read Uncommitted as Read Committed.

## How do you handle concurrent updates (lost updates)?

- **Atomic update**: `UPDATE stock SET qty = qty - 1 WHERE sku = $1 AND qty > 0`.
- **Pessimistic lock**: `SELECT … FOR UPDATE` inside a transaction (`SKIP LOCKED` for job queues).
- **Optimistic lock**: a `version` column; `UPDATE … SET version = version + 1 WHERE id = $1 AND version = $2` and retry if 0 rows changed.
- **Serializable** isolation with retries.

## What is a deadlock?

Two transactions each hold a lock the other needs. Postgres detects it and aborts one. Avoid it by locking rows in a consistent order and keeping transactions short.

# Postgres superpowers

## What is JSONB and when do you use it?

`JSONB` stores JSON in a binary, indexable form. Use it for flexible attributes (product specs, settings, webhook payloads) next to normal columns — the best of relational and document styles.

```sql
CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, attrs JSONB);
CREATE INDEX ON products USING GIN (attrs);

SELECT name, attrs->>'color' AS color
FROM products
WHERE attrs @> '{"brand": "Acme"}' AND (attrs->>'weight')::numeric < 2;
```

Operators: `->` (JSON), `->>` (text), `@>` (contains), `?` (key exists), `jsonb_set`, `jsonb_agg`. Do not put everything in JSONB: columns you filter or join on all the time belong in real columns.

## How do you do full-text search?

```sql
ALTER TABLE articles ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;
CREATE INDEX ON articles USING GIN (tsv);

SELECT title, ts_rank(tsv, q) AS rank
FROM articles, websearch_to_tsquery('english', 'vector database') q
WHERE tsv @@ q ORDER BY rank DESC LIMIT 10;
```

## What is pgvector and how is it used for RAG?

**pgvector** adds a `vector` type and similarity operators, so Postgres can be your vector database next to your normal data (with joins, filters and permissions in one query).

```sql
CREATE EXTENSION vector;
CREATE TABLE chunks (id BIGSERIAL PRIMARY KEY, doc_id INT, content TEXT, embedding vector(1536));
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);

SELECT content, 1 - (embedding <=> $1) AS similarity
FROM chunks
WHERE doc_id = ANY($2)            -- metadata / permission filter
ORDER BY embedding <=> $1          -- <=> cosine distance, <-> L2, <#> inner product
LIMIT 5;
```

## What are views and materialized views?

A **view** is a saved query (always fresh, no storage). A **materialized view** stores the result for fast reads and is updated with `REFRESH MATERIALIZED VIEW CONCURRENTLY` — great for dashboards.

## What are partitioning, replication and backups?

- **Partitioning**: split a huge table by range/list/hash (for example by month) so queries and deletes touch only relevant partitions.
- **Replication**: streaming replicas copy the WAL for read scaling and failover; logical replication copies selected tables.
- **Backups**: `pg_dump` for logical backups, base backups + WAL archiving for point-in-time recovery.

## Stored procedures, functions and triggers?

**Functions** (`CREATE FUNCTION … LANGUAGE plpgsql`) return values and can be used in queries. **Procedures** (`CALL`) can manage transactions. **Triggers** run a function automatically on `INSERT/UPDATE/DELETE` (audit logs, `updated_at`). Keep business logic mostly in the app unless the database is the right place for it.

```sql
CREATE FUNCTION touch() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER t_touch BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION touch();
```

# Using Postgres from code

## How do you prevent SQL injection?

Never build SQL by gluing strings. Use **parameterized queries**; the driver sends values separately from the SQL text.

```js
// Node.js (pg)
const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
```

```csharp
// .NET (Npgsql / EF Core)
var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);           // parameterized
var list = await db.Users.FromSql($"SELECT * FROM users WHERE city = {city}").ToListAsync(); // still parameterized
```

```python
# Python (psycopg)
cur.execute("SELECT * FROM users WHERE email = %s", (email,))
```

## Why use a connection pool?

Opening a Postgres connection is expensive (a new server process each). A pool keeps a few connections open and lends them out. Use the driver pool (`pg.Pool`, Npgsql's built-in pooling, SQLAlchemy pool) and **PgBouncer** when many app instances connect. Too many connections hurt Postgres more than they help: size pools small.
