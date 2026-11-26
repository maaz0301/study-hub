// W3Schools-style MongoDB tutorial. Snippets run in the browser on sample data:
// customers {_id,name,city,age,tags,joined}, products {_id,name,category,price,stock,specs}, orders {_id,customerId,status,date,items[]}.
const R = 'mongo';
const L = (n, title, sub, big, steps, mistakes) => ({ n, title, sub, big, steps: steps.map(([c, t]) => [c, t, 'javascript', R]), mistakes, lang: 'javascript' });

export const groups = [
  { id: 'tutorial-1-documents-and-queries', title: 'Tutorial 1: Documents and queries (lessons 1–7)', from: 1, to: 7 },
  { id: 'tutorial-2-change-data', title: 'Tutorial 2: Change data (lessons 8–10)', from: 8, to: 10 },
  { id: 'tutorial-3-aggregation', title: 'Tutorial 3: Aggregation and design (lessons 11–14)', from: 11, to: 14 },
];

export const lessons = [
  L(1, 'What is MongoDB?', 'Documents instead of table rows.',
    'MongoDB stores **documents** (JSON-like objects) in **collections**. There is no fixed table schema: two documents in the same collection can have different fields, and a field can hold an array or another object. Try the sample `customers` collection below.',
    [
      ['db.customers.find()', '`find()` with no arguments returns every document in the collection.'],
      ['db.customers.findOne()', '`findOne()` returns just the first matching document.'],
      ['db.products.find({}, { name: 1, price: 1, _id: 0 })', 'The second argument is a **projection**: `1` includes a field, `0` hides it.'],
    ],
    ['Treating Mongo like SQL tables: you can embed related data in one document.', 'Every document gets a unique `_id`. Do not remove it from your data.']),

  L(2, 'Filter with find()', 'Query by field values.',
    'The first argument of `find` is a **filter** object. `{ city: "Lahore" }` means "city equals Lahore". Several fields are combined with AND.',
    [
      ['db.customers.find({ city: "Lahore" })', 'Equality match on one field.'],
      ['db.customers.find({ city: "Lahore", age: { $gt: 30 } })', 'Two conditions together. `$gt` means greater than.'],
      ['db.customers.find({ tags: "vip" })', 'On an array field a plain value matches when the array contains it.'],
      ['db.products.find({ "specs.wireless": true })', 'Use dot notation to reach into nested objects (quote the key).'],
    ],
    ['Writing `{ age > 30 }`: use operators such as `{ age: { $gt: 30 } }`.', 'Forgetting the quotes around dotted keys like `"specs.wireless"`.']),

  L(3, 'Comparison and logical operators', '$gt, $lt, $in, $or and friends.',
    'Operators start with `$`. Comparisons: `$eq $ne $gt $gte $lt $lte $in $nin`. Logic: `$and $or $nor $not`.',
    [
      ['db.products.find({ price: { $gte: 10, $lte: 50 } })', 'A range: two operators on one field.'],
      ['db.customers.find({ city: { $in: ["Lahore", "Karachi"] } })', '`$in` matches any value in the list.'],
      ['db.customers.find({ $or: [ { age: { $lt: 26 } }, { tags: "vip" } ] })', '`$or` takes an array of filters. Matches if any is true.'],
      ['db.products.find({ stock: { $ne: 0 }, category: { $nin: ["home"] } })', 'Not equal and not in.'],
    ],
    ['Using the same key twice in one object: the second silently replaces the first. Use `$and`/`$or`.', '`$in` needs an array, not a single value.']),

  L(4, 'Sort, limit and skip', 'Order and page your results.',
    'Chain `.sort()`, `.skip()` and `.limit()` after `find()`. Sort uses `1` for ascending and `-1` for descending.',
    [
      ['db.products.find().sort({ price: -1 })', 'Most expensive first.'],
      ['db.products.find().sort({ price: -1 }).limit(3)', 'The top 3.'],
      ['db.products.find().sort({ price: -1 }).skip(3).limit(3)', 'Page two of size three.'],
      ['db.customers.countDocuments({ city: "Lahore" })', '`countDocuments` counts matches without returning them.'],
    ],
    ['`skip` on big collections is slow. Page by the last seen `_id` instead.', 'Sorting without an index on large data can be very slow.']),

  L(5, 'Query arrays', '$elemMatch, $size and $all.',
    'Arrays are first-class in MongoDB. The `orders` collection stores its line `items` as an array inside each order.',
    [
      ['db.orders.find({ "items.sku": "PEN" })', 'Dot notation looks inside every array element.'],
      ['db.orders.find({ items: { $elemMatch: { sku: "PEN", qty: { $gte: 10 } } } })', '`$elemMatch` makes **one** element satisfy all conditions together.'],
      ['db.customers.find({ tags: { $all: ["newsletter", "wholesale"] } })', '`$all`: the array has every listed value.'],
      ['db.customers.find({ tags: { $size: 0 } })', '`$size` matches arrays of an exact length.'],
    ],
    ['Without `$elemMatch`, `{"items.sku":"PEN","items.qty":{$gte:10}}` may match different elements.', '`$size` cannot take a range, store a count field if you need that.']),

  L(6, 'Projection: choose the fields', 'Return only what you need.',
    'A projection reduces what is sent back. Use inclusion (`1`) or exclusion (`0`), but do not mix them (except `_id`).',
    [
      ['db.customers.find({}, { name: 1, city: 1 })', 'Only `name`, `city` and `_id`.'],
      ['db.customers.find({}, { tags: 0, joined: 0 })', 'Everything except those two.'],
      ['db.orders.find({ status: "paid" }, { items: 0 }).sort({ date: 1 })', 'Hide the large array.'],
    ],
    ['Mixing `1` and `0` in one projection is an error.', 'Fetching whole documents when you only show a name.']),

  L(7, 'Distinct values and counting', 'Summaries without aggregation.',
    'Quick questions like "which cities do we have?" do not need a pipeline.',
    [
      ['db.customers.distinct("city")', 'The list of unique values of one field.'],
      ['db.orders.countDocuments({ status: "paid" })', 'How many orders are paid.'],
      ['db.products.distinct("category", { price: { $gt: 10 } })', '`distinct` can take a filter too.'],
    ],
    ['`distinct` results must fit in one document (16 MB). Use aggregation for huge sets.', '`count()` is deprecated: use `countDocuments` or `estimatedDocumentCount`.']),

  L(8, 'insertOne and insertMany', 'Add documents.',
    'Press Run and the sample data is reset every time, so you can experiment safely. Mongo creates the collection on first insert. If you leave out `_id`, it creates one.',
    [
      ['db.customers.insertOne({ name: "Taha Ali", city: "Quetta", age: 33, tags: ["new"] });\ndb.customers.find({ city: "Quetta" })', 'Insert, then read it back. The last statement is what gets shown.'],
      ['db.products.insertMany([\n  { _id: "BAG", name: "Backpack", category: "tech", price: 39, stock: 12 },\n  { _id: "CAP", name: "Cap", category: "home", price: 8, stock: 30 }\n]);\ndb.products.countDocuments()', 'Insert several in one call.'],
    ],
    ['Inserting a duplicate `_id` raises an error.', 'Different spellings of the same field (`city` vs `City`) make queries miss data.']),

  L(9, 'updateOne and updateMany', 'Change fields with update operators.',
    'Updates use operators too: `$set` sets a field, `$inc` adds to a number, `$push` appends to an array, `$unset` removes a field. Without an operator you would replace the whole document.',
    [
      ['db.products.updateOne({ _id: "PEN" }, { $set: { price: 3 } });\ndb.products.findOne({ _id: "PEN" })', 'Change one field of one document.'],
      ['db.products.updateMany({ category: "tech" }, { $inc: { stock: 10 } });\ndb.products.find({ category: "tech" }, { name: 1, stock: 1 })', '`$inc` adds 10 to the stock of every tech product.'],
      ['db.customers.updateOne({ _id: 3 }, { $push: { tags: "vip" } });\ndb.customers.findOne({ _id: 3 })', '`$push` appends to an array. `$addToSet` appends only if missing.'],
    ],
    ['Forgetting `$set` replaces the document in `replaceOne`, or errors in `updateOne`.', '`updateOne` only changes the first match.']),

  L(10, 'deleteOne and deleteMany', 'Remove documents.',
    'Delete with a filter, just like `find`. An empty filter `{}` matches **everything**, so be careful.',
    [
      ['db.orders.deleteOne({ _id: 106 });\ndb.orders.countDocuments()', 'Delete one order and count what is left.'],
      ['db.orders.deleteMany({ status: "cancelled" });\ndb.orders.find({}, { status: 1 })', 'Delete all matching documents.'],
    ],
    ['`deleteMany({})` empties the collection.', 'No transaction rollback by default for single operations: take a backup first.']),

  L(11, 'Aggregation: $match and $group', 'A pipeline of stages.',
    'An **aggregation pipeline** passes documents through stages, each transforming them. `$match` filters, `$group` summarises, `$sort` orders, `$project` reshapes.',
    [
      ['db.orders.aggregate([\n  { $match: { status: "paid" } },\n  { $group: { _id: "$customerId", orders: { $sum: 1 } } },\n  { $sort: { orders: -1 } }\n])', 'Paid orders per customer. `$customerId` (with `$`) means "the value of that field".'],
      ['db.products.aggregate([\n  { $group: { _id: "$category", avgPrice: { $avg: "$price" }, items: { $sum: 1 } } }\n])', 'Average price per category.'],
    ],
    ['Putting `$match` late: filter first so later stages process fewer documents.', 'Forgetting the `$` in field references: `"$price"`, not `"price"`.']),

  L(12, '$unwind: flatten arrays', 'One document per array element.',
    '`$unwind` turns a document with an array of 3 items into 3 documents. You need it before grouping on array contents.',
    [
      ['db.orders.aggregate([\n  { $unwind: "$items" },\n  { $project: { _id: 1, sku: "$items.sku", qty: "$items.qty" } }\n])', 'Each line item becomes its own row.'],
      ['db.orders.aggregate([\n  { $match: { status: { $in: ["paid", "shipped"] } } },\n  { $unwind: "$items" },\n  { $group: { _id: "$items.sku", units: { $sum: "$items.qty" },\n      revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },\n  { $sort: { revenue: -1 } }\n])', 'Revenue per product: unwind, group, sort.'],
    ],
    ['Unwinding before filtering multiplies the work.', 'Documents with an empty array disappear after `$unwind`.']),

  L(13, '$lookup: join collections', 'MongoDB can join too.',
    '`$lookup` brings matching documents from another collection into an array field. It is a left outer join. Use it when embedding is not suitable.',
    [
      ['db.orders.aggregate([\n  { $match: { status: "paid" } },\n  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } },\n  { $unwind: "$customer" },\n  { $project: { _id: 1, date: 1, "customer.name": 1, "customer.city": 1 } }\n])', 'Attach each order\'s customer, then flatten the one-item array.'],
    ],
    ['Using `$lookup` everywhere: if you always read two things together, embed them in one document.', 'Not indexing the `foreignField` makes joins slow.']),

  L(14, 'Schema design: embed or reference?', 'Pick the shape that matches how you read the data.',
    '**Embed** data that is read together and belongs to one parent (order lines inside an order). **Reference** data that is shared, large or changes on its own (a customer used by many orders). The sample `orders` embed `items` and reference `customerId`.',
    [
      ['db.orders.findOne({ _id: 101 })', 'One read returns the order and all its lines (embedded).'],
      ['db.customers.find({ _id: 1 })', 'Customer lives separately and is referenced by `customerId`.'],
      ['db.orders.aggregate([\n  { $group: { _id: "$status", n: { $sum: 1 } } },\n  { $sort: { n: -1 } }\n])', 'Think in queries first: what will you ask most often?'],
    ],
    ['Embedding unbounded arrays (comments forever): documents are limited to 16 MB.', 'Duplicating data that changes often without a plan to update every copy.']),
];
