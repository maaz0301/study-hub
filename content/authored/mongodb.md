---
slug: mongodb
title: MongoDB
subtitle: Documents, CRUD, indexes, aggregation, schema design, transactions and scaling
emoji: 🍃
accent: #22c55e
category: Databases
---

# Start here

## What is MongoDB, in one minute

MongoDB is a **document database**. Instead of rows in tables, it stores **documents** (JSON-like objects, saved as **BSON**) in **collections**. A document can hold nested objects and arrays, so data that is used together is stored together.

| SQL world | MongoDB world |
|---|---|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| JOIN | Embedding, or `$lookup` |
| Primary key | `_id` (an `ObjectId` by default) |

```json
{
  "_id": { "$oid": "665f1c2e9b1e8a3d4c7b2a10" },
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "address": { "city": "Lahore", "zip": "54000" },
  "tags": ["vip", "newsletter"],
  "orders": [ { "sku": "PEN-1", "qty": 3, "price": 2.5 } ]
}
```

**Pick MongoDB when** your data is naturally hierarchical, the shape changes often, or you need easy horizontal scaling. **Pick a relational DB (PostgreSQL)** when you have many relationships, complex joins and strict multi-table consistency.

## What is BSON and what is an ObjectId?

**BSON** is binary JSON: faster to scan and it adds types JSON lacks (`Date`, `ObjectId`, `Decimal128`, `Int64`, binary). Max document size is **16 MB**.

An **ObjectId** is a 12-byte id: a 4-byte timestamp + random value + counter. It is unique without asking a central server, and roughly sortable by creation time (`ObjectId.getTimestamp()`).

## Try it: the shell

```js
// mongosh
use shop
db.users.insertOne({ name: "Ali", age: 28, city: "Karachi" })
db.users.find({ city: "Karachi" })
db.users.countDocuments()
show collections
```

Open the **Playground** tab to run real queries and aggregation pipelines in your browser.

# CRUD

## How do you insert, find, update and delete documents?

```js
// Create
db.products.insertMany([
  { name: "Pen", price: 2.5, stock: 100, tags: ["office"] },
  { name: "Lamp", price: 30, stock: 5, tags: ["home", "light"] }
])

// Read: filter + projection + sort + limit
db.products.find({ price: { $lt: 10 } }, { name: 1, price: 1, _id: 0 }).sort({ price: 1 }).limit(5)

// Update: operators change only some fields
db.products.updateOne({ name: "Pen" }, { $inc: { stock: -1 }, $set: { updatedAt: new Date() } })
db.products.updateMany({ stock: 0 }, { $set: { active: false } })

// Upsert: update, or insert if nothing matched
db.products.updateOne({ name: "Mug" }, { $setOnInsert: { price: 8 } }, { upsert: true })

// Delete
db.products.deleteOne({ name: "Lamp" })
```

## What are the main query operators?

| Kind | Operators |
|---|---|
| Comparison | `$eq $ne $gt $gte $lt $lte $in $nin` |
| Logical | `$and $or $not $nor` |
| Element | `$exists $type` |
| Array | `$all $elemMatch $size` |
| Evaluation | `$regex $expr $text` |

```js
db.users.find({ $or: [{ city: "Lahore" }, { age: { $gte: 30 } }] })
db.orders.find({ items: { $elemMatch: { sku: "PEN-1", qty: { $gte: 2 } } } })
db.users.find({ $expr: { $gt: ["$spent", "$budget"] } })   // compare two fields
```

## What are the main update operators?

`$set`, `$unset`, `$inc`, `$mul`, `$rename`, `$min`, `$max`, and for arrays `$push`, `$addToSet` (no duplicates), `$pull`, `$pop`, plus the positional operators `$` (first match) and `$[]` (all elements).

```js
db.users.updateOne({ _id: id }, { $addToSet: { tags: "vip" } })
db.orders.updateOne({ _id: oid, "items.sku": "PEN-1" }, { $inc: { "items.$.qty": 1 } })
```

## What is the difference between find() and findOne()?

`find()` returns a **cursor** (you iterate, it fetches in batches). `findOne()` returns the first matching document or `null`. With drivers, always `limit` or paginate big `find()` results.

# Indexes

## Why do indexes matter in MongoDB?

Without an index MongoDB does a **COLLSCAN**: it reads every document. With one it does an **IXSCAN**: it walks a B-tree to the matches. Check with `explain("executionStats")` and compare `totalDocsExamined` to `nReturned` — ideally they are close.

```js
db.orders.createIndex({ customerId: 1, createdAt: -1 })
db.orders.find({ customerId: 42 }).sort({ createdAt: -1 }).explain("executionStats")
```

Indexes speed up reads but slow down writes and use RAM, so index the queries you actually run.

## What types of indexes exist?

- **Single field** and **compound** (`{ a: 1, b: -1 }`)
- **Multikey**: automatic when the field is an array
- **Text**: keyword search with `$text`
- **Geospatial**: `2dsphere` for `$near`
- **Hashed**: for hashed sharding
- **TTL**: delete documents after a time (`{ expireAfterSeconds: 3600 }`)
- **Unique**, **partial** (only documents matching a filter), **sparse**, **wildcard**
- **Atlas Search** and **Atlas Vector Search** for full-text and embeddings (RAG)

## What is the ESR rule for compound indexes?

Order the fields in a compound index as **E**quality → **S**ort → **R**ange. Example query: `status = "paid"`, sorted by `date`, `amount > 100` → index `{ status: 1, date: -1, amount: 1 }`. The equality prefix narrows the tree, the sort comes free from index order, and the range filters the rest.

## What is a covered query?

A query whose filter **and** returned fields are all in the index, so MongoDB answers from the index alone without reading documents (`totalDocsExamined: 0`). Exclude `_id` in the projection unless it is in the index.

# Aggregation

## What is the aggregation pipeline?

A list of **stages**; documents flow through them in order, like an assembly line. Each stage transforms the stream.

| Stage | Like SQL | Does |
|---|---|---|
| `$match` | WHERE | filter |
| `$project` / `$addFields` | SELECT | reshape, compute fields |
| `$group` | GROUP BY | aggregate with `$sum $avg $min $max $push` |
| `$sort`, `$limit`, `$skip` | ORDER BY, LIMIT, OFFSET | |
| `$lookup` | LEFT JOIN | pull docs from another collection |
| `$unwind` | — | one document per array element |
| `$facet` | — | several pipelines at once (search pages with counts) |

```js
db.orders.aggregate([
  { $match: { status: "paid" } },
  { $unwind: "$items" },
  { $group: { _id: "$items.sku", revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 }
])
```

Put `$match` and `$sort` **early** so they can use indexes and shrink the stream.

## How does $lookup work?

`$lookup` joins another collection in the same database. It adds an array field with the matches.

```js
db.orders.aggregate([
  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } },
  { $unwind: "$customer" },
  { $project: { total: 1, "customer.name": 1 } }
])
```

If you need `$lookup` on every hot request, reconsider the schema: maybe embed.

# Schema design

## Embedding vs referencing: how do you choose?

**Embed** when the child is read with the parent, belongs only to it, and the list is bounded (address in user, items in order). **Reference** (store the `_id`) when the child is large, shared, updated on its own, or unbounded (comments on a viral post, orders of a customer).

| Relationship | Usual design |
|---|---|
| One-to-few | Embed an array |
| One-to-many | Embed or reference, depends on size and access |
| One-to-squillions (logs, events) | Reference parent from the child |
| Many-to-many | Arrays of ids on one or both sides |

Golden rule: **design for your queries**. Data that is accessed together should be stored together.

## What schema design patterns should you know?

- **Subset**: embed the 10 latest reviews, keep the rest in another collection.
- **Extended reference**: copy a few hot fields (customer name) into the order to avoid lookups.
- **Computed**: store totals/counters, update them on write.
- **Bucket**: group time-series readings per hour into one document (or use **time-series collections**).
- **Outlier**: handle the rare huge document differently (overflow flag).
- **Polymorphic**: different shapes in one collection with a `type` field.
- **Schema versioning**: a `schemaVersion` field to migrate lazily.

## How do you enforce a schema in MongoDB?

Use **JSON Schema validation** on the collection, plus validation in your app (Mongoose, Zod, Pydantic).

```js
db.createCollection("users", { validator: { $jsonSchema: {
  bsonType: "object", required: ["email"],
  properties: { email: { bsonType: "string", pattern: "^.+@.+$" }, age: { bsonType: "int", minimum: 0 } }
} } })
```

# Transactions, replication & sharding

## Does MongoDB support transactions?

Yes. A write to **one document** is always atomic (including its embedded arrays), which is why good schema design avoids most transactions. Since 4.0 (replica sets) and 4.2 (sharded clusters) MongoDB supports **multi-document ACID transactions**. They cost more, so keep them short.

```js
const session = client.startSession();
await session.withTransaction(async () => {
  await accounts.updateOne({ _id: 1 }, { $inc: { balance: -100 } }, { session });
  await accounts.updateOne({ _id: 2 }, { $inc: { balance: 100 } }, { session });
});
```

## What is a replica set?

A group of `mongod` servers holding the same data: one **primary** takes writes, **secondaries** copy the primary's **oplog**. If the primary dies, the members **elect** a new one automatically (high availability). You can read from secondaries with a read preference (results may be slightly stale).

## What are write concern and read concern?

**Write concern** says how many members must confirm a write: `w: 1` (primary only, fast) or `w: "majority"` (survives failover, safe default). **Read concern** says how committed data must be to be read: `local`, `majority`, `linearizable`. Together they let you trade latency for consistency.

## What is sharding and how do you pick a shard key?

**Sharding** splits a collection across several replica sets (shards) by a **shard key**; `mongos` routers send each query to the right shards. A good shard key has **high cardinality**, **even write distribution** and matches the common query filter. Avoid a monotonically increasing key (like a timestamp) as a ranged key: all inserts hit one shard. Use a hashed key or a compound key such as `{ tenantId: 1, _id: 1 }`.

## MongoDB vs PostgreSQL: how do you answer this in an interview?

Neither is "better". MongoDB: flexible documents, nested data in one read, built-in sharding, great for catalogs, content, events, IoT. PostgreSQL: relations, joins, strict constraints, mature SQL and analytics, and JSONB when you need some flexibility. Many systems use both. Choose by **data shape, query patterns, consistency needs and team skills**.

# Node.js & Mongoose

## How do you use MongoDB from Node.js?

```js
import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGO_URL);   // one client per app: it pools connections
await client.connect();
const users = client.db("shop").collection("users");
const vip = await users.find({ tags: "vip" }).limit(20).toArray();
```

## What is Mongoose and why use it?

An ODM for Node.js: **schemas**, validation, defaults, middleware (hooks), `populate()` for references, and model methods.

```js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  age: { type: Number, min: 0 },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }]
}, { timestamps: true });

userSchema.pre("save", function () { this.email = this.email.trim(); });
const User = mongoose.model("User", userSchema);
const u = await User.findOne({ email }).populate("orders").lean();   // lean = plain objects, faster
```

## How do you paginate efficiently?

`skip()` gets slower as the page number grows (it still walks skipped documents). For big collections use **range (keyset) pagination**: remember the last `_id` (or sort key) and query the next page from there.

```js
db.posts.find({ _id: { $lt: lastSeenId } }).sort({ _id: -1 }).limit(20)
```
