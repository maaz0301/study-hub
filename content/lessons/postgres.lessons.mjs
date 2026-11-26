// W3Schools-style PostgreSQL tutorial. Every snippet runs on a REAL PostgreSQL (PGlite) in the browser
// against the shop database: customers, products, orders, order_items, employees.
const R = 'sql';
const L = (n, title, sub, big, steps, mistakes) => ({ n, title, sub, big, steps: steps.map(([c, t]) => [c, t, 'sql', R]), mistakes, lang: 'sql' });

export const groups = [
  { id: 'tutorial-1-basics', title: 'Tutorial 1: Read data with SELECT (lessons 1–6)', from: 1, to: 6 },
  { id: 'tutorial-2-joins-and-groups', title: 'Tutorial 2: Join and summarise (lessons 7–10)', from: 7, to: 10 },
  { id: 'tutorial-3-change-data', title: 'Tutorial 3: Change data and design tables (lessons 11–14)', from: 11, to: 14 },
];

export const lessons = [
  L(1, 'Your first SELECT', 'Read rows from a table.',
    'A database table is like a spreadsheet: columns across the top, one row per record. `SELECT` asks for columns, `FROM` says which table. The sample shop has `customers`, `products`, `orders`, `order_items` and `employees`. Press **Try it Yourself** and change anything.',
    [
      ['SELECT * FROM customers;', '`*` means "every column". Good for exploring, avoid it in real apps.'],
      ['SELECT name, city FROM customers;', 'Name only the columns you need. The result has just those two.'],
      ["SELECT name AS customer, upper(city) AS town FROM customers;", '`AS` renames a column in the result. Functions like `upper()` transform values.'],
      ['SELECT DISTINCT city FROM customers;', '`DISTINCT` removes duplicate rows, so each city appears once.'],
    ],
    ['Forgetting the `;` between statements: only the last statement shows a result here.', 'Using double quotes for text: `"Lahore"` is a column name in SQL. Text uses single quotes `\'Lahore\'`.', '`SELECT *` on big tables is slow and fragile when columns change.']),

  L(2, 'Filter rows with WHERE', 'Keep only the rows that match a condition.',
    '`WHERE` runs on every row and keeps the ones where the condition is true. Combine conditions with `AND`, `OR`, `NOT`.',
    [
      ["SELECT * FROM customers WHERE city = 'Lahore';", 'Equality uses a single `=` in SQL, not `==`.'],
      ['SELECT name, price FROM products WHERE price > 10 AND stock > 0;', '`AND` needs both conditions to be true.'],
      ["SELECT name FROM products WHERE category IN ('office', 'home');", '`IN (...)` is a short way to write several `OR`s.'],
      ['SELECT name, price FROM products WHERE price BETWEEN 5 AND 15;', '`BETWEEN` is inclusive on both ends.'],
      ["SELECT name FROM customers WHERE name LIKE 'A%' OR name ILIKE '%khan';", '`LIKE` matches patterns (`%` = any text). `ILIKE` is the case-insensitive version, PostgreSQL only.'],
    ],
    ['`WHERE city = NULL` never matches. Use `IS NULL` / `IS NOT NULL`.', 'Mixing `AND` and `OR` without brackets: `AND` binds tighter. Add `( )`.', 'Comparing text and numbers: `price > \'10\'` can fail or surprise you.']),

  L(3, 'Sort and limit results', 'ORDER BY, LIMIT and OFFSET.',
    'Rows have no guaranteed order unless you ask. `ORDER BY` sorts, `LIMIT` keeps the first N rows, `OFFSET` skips some (used for pages).',
    [
      ['SELECT name, price FROM products ORDER BY price DESC;', '`DESC` is high to low. The default `ASC` is low to high.'],
      ['SELECT name, category, price FROM products ORDER BY category, price DESC;', 'Sort by several columns: first `category`, then price inside each category.'],
      ['SELECT name, price FROM products ORDER BY price DESC LIMIT 3;', 'The 3 most expensive products.'],
      ['SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3;', 'Page 2 when a page has 3 rows.'],
    ],
    ['`LIMIT` without `ORDER BY` returns arbitrary rows.', 'Large `OFFSET` values are slow because the database still reads the skipped rows. Use keyset paging for big data.']),

  L(4, 'NULL and missing values', 'NULL means "unknown", not zero or empty.',
    '`NULL` is the absence of a value. Any comparison with `NULL` gives unknown, which `WHERE` treats as false. That is why `= NULL` never works.',
    [
      ['SELECT name, attrs FROM products WHERE attrs IS NULL;', '`IS NULL` is the right test.'],
      ["SELECT name, coalesce(attrs->>'brand', 'no brand') AS brand FROM products;", '`coalesce` returns the first non-null value, a handy default. `->>` reads a JSON field as text.'],
      ['SELECT 1 + NULL AS sum, NULL = NULL AS equal, NULL IS NULL AS is_null;', 'Anything plus NULL is NULL, and NULL is not even equal to NULL.'],
    ],
    ['Counting with `COUNT(column)` skips NULLs; `COUNT(*)` counts rows.', 'Using `NOT IN (subquery)` when the subquery can return NULL: it returns nothing. Use `NOT EXISTS`.']),

  L(5, 'Functions and expressions', 'Calculate values inside the query.',
    'You can do maths, join text and format dates right in `SELECT`. `CASE` is SQL\'s if/else.',
    [
      ['SELECT name, price, stock, price * stock AS stock_value FROM products;', 'Arithmetic works on columns row by row.'],
      ["SELECT name, price, CASE WHEN price >= 50 THEN 'premium' WHEN price >= 10 THEN 'standard' ELSE 'budget' END AS tier FROM products;", '`CASE` picks the first matching branch.'],
      ["SELECT name || ' (' || city || ')' AS label, length(name) AS chars FROM customers;", '`||` joins text.'],
      ["SELECT name, created_at, to_char(created_at, 'DD Mon YYYY') AS pretty, age(created_at) FROM customers;", 'Dates have their own functions: `to_char`, `age`, `date_trunc`, `now()`.'],
    ],
    ['Integer division: `5 / 2` is `2`. Use `5 / 2.0` or `::numeric`.', 'Forgetting `END` in `CASE`.']),

  L(6, 'Aggregates: COUNT, SUM, AVG', 'Turn many rows into one number.',
    'Aggregate functions read many rows and return one value: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.',
    [
      ['SELECT count(*) AS customers FROM customers;', 'How many rows.'],
      ['SELECT min(price), max(price), round(avg(price), 2) AS average FROM products;', 'Several aggregates in one query.'],
      ["SELECT count(*) AS orders, sum(qty * price) AS revenue FROM order_items;", 'Sum a calculated value.'],
      ["SELECT count(*) FILTER (WHERE stock = 0) AS sold_out, count(*) AS total FROM products;", '`FILTER` counts only rows matching a condition, a PostgreSQL favourite.'],
    ],
    ['Mixing an aggregate with a plain column without `GROUP BY` is an error.', '`AVG` of integers returns a decimal in PostgreSQL, but rounding may surprise you: use `round()`.']),

  L(7, 'GROUP BY and HAVING', 'One result row per group.',
    '`GROUP BY` splits rows into buckets and the aggregate runs on each bucket. `HAVING` filters the buckets after grouping; `WHERE` filters rows before.',
    [
      ['SELECT category, count(*) AS products, round(avg(price), 2) AS avg_price FROM products GROUP BY category;', 'One row per category.'],
      ['SELECT city, count(*) AS customers FROM customers GROUP BY city ORDER BY customers DESC;', 'Sort groups by their count.'],
      ['SELECT category, sum(stock) AS units FROM products GROUP BY category HAVING sum(stock) > 100;', '`HAVING` can use aggregates, `WHERE` cannot.'],
    ],
    ['Using an aggregate in `WHERE` ("aggregate functions are not allowed in WHERE").', 'Selecting a column that is not in `GROUP BY` and not aggregated.']),

  L(8, 'INNER JOIN: combine tables', 'Match rows between two tables.',
    'Data is split into tables to avoid repeating it. A **join** puts it back together using a key: `orders.customer_id` points to `customers.id`.',
    [
      ['SELECT o.id AS order_id, c.name, o.status FROM orders o JOIN customers c ON c.id = o.customer_id;', '`JOIN ... ON` matches each order to its customer. `o` and `c` are short aliases.'],
      ['SELECT c.name, o.id AS order_id, o.created_at FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.city = \'Lahore\' ORDER BY o.created_at;', 'Filter and sort work as usual on joined rows.'],
      ['SELECT o.id AS order_id, p.name AS product, oi.qty, oi.price FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.id = 1;', 'Join three tables: orders → items → products.'],
    ],
    ['Forgetting `ON` makes a cross join: every row with every row.', 'Ambiguous column names (`id` exists in both tables). Prefix with the alias: `c.id`.']),

  L(9, 'LEFT JOIN: keep unmatched rows', 'Include rows that have no match.',
    '`JOIN` drops rows with no match. `LEFT JOIN` keeps every row from the left table and fills the right side with `NULL`. Use it to find "customers who never ordered".',
    [
      ['SELECT c.name, count(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY orders DESC;', 'Every customer appears, even with 0 orders.'],
      ['SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;', 'The classic "anti-join": rows with no match have NULL on the right.'],
      ['SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON m.id = e.manager_id;', 'A table can join to itself (self join). The CEO has no manager.'],
    ],
    ['Putting a right-table condition in `WHERE` turns a `LEFT JOIN` back into an inner join. Put it in `ON`.', '`COUNT(*)` counts the NULL row too; count a right-table column instead.']),

  L(10, 'Subqueries and CTEs', 'A query inside a query, with a name.',
    'A **subquery** is a `SELECT` used as a value or a table. A **CTE** (`WITH`) gives the subquery a name so long queries read top to bottom.',
    [
      ['SELECT name, price FROM products WHERE price > (SELECT avg(price) FROM products);', 'The inner query returns one number the outer query compares to.'],
      ["WITH revenue AS (\n  SELECT order_id, sum(qty * price) AS total FROM order_items GROUP BY order_id\n)\nSELECT o.id, c.name, r.total\nFROM revenue r\nJOIN orders o ON o.id = r.order_id\nJOIN customers c ON c.id = o.customer_id\nORDER BY r.total DESC LIMIT 5;", 'The CTE `revenue` is a temporary named result. Top 5 orders by value.'],
      ['SELECT name, salary, rank() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;', 'A **window function**: ranks every row without collapsing them like `GROUP BY`.'],
    ],
    ['A scalar subquery that returns more than one row is an error.', 'Reusing the same heavy subquery many times: a CTE or a join is clearer.']),

  L(11, 'INSERT, UPDATE and DELETE', 'Change data safely.',
    'Each time you press Run the sample database is reset, so experiment freely. In real life **always** test `UPDATE` and `DELETE` with a `SELECT` using the same `WHERE` first.',
    [
      ["INSERT INTO customers (name, email, city, created_at) VALUES ('Taha Ali', 'taha@example.com', 'Quetta', '2025-06-01') RETURNING *;", '`RETURNING` shows the new row, including the generated `id`.'],
      ["UPDATE products SET price = price * 1.10 WHERE category = 'tech' RETURNING name, price;", 'Raises tech prices by 10%. Without `WHERE` it would change every row.'],
      ['DELETE FROM order_items WHERE order_id = 6 RETURNING *;', 'Removes the rows and shows what was removed.'],
    ],
    ['`UPDATE`/`DELETE` without `WHERE` changes the whole table.', 'Deleting a parent row that other rows reference fails because of the foreign key.']),

  L(12, 'Create tables and constraints', 'Design a table that protects its own data.',
    '`CREATE TABLE` defines columns and types. **Constraints** (`PRIMARY KEY`, `UNIQUE`, `NOT NULL`, `CHECK`, `REFERENCES`) make bad data impossible.',
    [
      ["CREATE TABLE reviews (\n  id SERIAL PRIMARY KEY,\n  product_id INT NOT NULL REFERENCES products(id),\n  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),\n  body TEXT,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\nINSERT INTO reviews (product_id, rating, body) VALUES (5, 5, 'Great sound'), (5, 4, 'Comfy');\nSELECT * FROM reviews;", 'A new table with a key, a link to `products`, a rule on the rating and a default time.'],
      ["CREATE TABLE tmp (n INT CHECK (n > 0));\nINSERT INTO tmp VALUES (-1);", 'Run this to see a constraint refuse bad data: the error message is shown.'],
    ],
    ['Storing money as `FLOAT`: use `NUMERIC(10,2)`.', 'Skipping foreign keys "for speed": you get orphan rows later.']),

  L(13, 'Indexes and EXPLAIN', 'Make queries fast and see why.',
    'An **index** is a sorted shortcut so the database does not read every row. `EXPLAIN` shows the plan PostgreSQL picked. Tiny tables are always scanned, so here you mostly learn to read the output.',
    [
      ["CREATE INDEX idx_orders_customer ON orders (customer_id);\nEXPLAIN SELECT * FROM orders WHERE customer_id = 1;", 'Creates an index and shows the plan. On big tables you would see `Index Scan`.'],
      ['EXPLAIN SELECT o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE c.city = \'Lahore\';', 'Read plans from the innermost line outwards. Look for `Seq Scan` on big tables.'],
    ],
    ['Indexing every column: each index slows writes and uses disk.', 'Wrapping an indexed column in a function (`lower(email) = ...`) stops the index from being used unless you index that expression.']),

  L(14, 'JSONB: documents inside Postgres', 'Store flexible data next to normal columns.',
    'PostgreSQL can hold JSON in a `JSONB` column and query it. `->` returns JSON, `->>` returns text, `@>` tests containment, and a GIN index makes it fast.',
    [
      ["SELECT name, attrs->>'brand' AS brand FROM products WHERE attrs->>'brand' IS NOT NULL;", 'Read a field from the JSON.'],
      ["SELECT name, attrs FROM products WHERE attrs @> '{\"wireless\": true}';", '`@>` means "contains this JSON".'],
      ["UPDATE products SET attrs = attrs || '{\"on_sale\": true}' WHERE name = 'Mug' RETURNING name, attrs;", '`||` merges JSON objects.'],
    ],
    ['Putting everything in JSONB: you lose constraints and easy joins. Use it for truly flexible parts.', 'Comparing `->` (JSON) with a text value; use `->>`.']),
];
