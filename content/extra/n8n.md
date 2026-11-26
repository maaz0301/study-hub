# More interview questions

## What are the Merge node modes and how do they map to SQL joins?

- **Append**: stack both inputs one after another (like `UNION ALL`).
- **Combine → Matching Fields**: join on a field. With "Keep Matches" = **inner join**; "Enrich Input 1" = **left join**; "Keep Non-Matches" = anti-join; "Keep Everything" = full outer join.
- **Combine → By Position**: pair item 1 with item 1, item 2 with item 2.
- **Combine → All Possible Combinations**: cross join.
- **Choose Branch**: pass through only one input.
Check both inputs' field names, or you get zero items.

## What is pinned data and why is it useful?

**Pinning** freezes a node's output so n8n uses that saved data instead of running the node again while you edit. It saves time and API calls (do not resend a webhook or re-call a paid API on every test), and makes debugging reproducible. Pinned data is only used for **manual test runs**; production executions always use live data. Remember to unpin before relying on real results.

## How do you work with files (binary data) in n8n?

Items can carry **binary** data next to JSON (`$binary`). Nodes such as **HTTP Request** (download), **Read/Write Files**, **Extract From File**, **Convert to File** and **Google Drive** produce or consume binary. Reference it by property name (default `data`). Large files use memory, so enable **filesystem binary storage** (`N8N_DEFAULT_BINARY_DATA_MODE=filesystem`) or S3 storage, and avoid loading huge files into a Code node.

## How do you secure a webhook with a signature (HMAC)?

Many services sign the request body with a shared secret and send the signature in a header. In n8n, read the **raw body** (enable *Raw Body* in the Webhook node), compute the HMAC with a **Crypto** node or Code node, and compare it to the header in an **IF**; reject with **Respond to Webhook** (401) when it does not match. Also check a timestamp to prevent replays, and use **Header Auth** for simple shared-secret setups.

## How do you test and promote workflows between environments?

Keep **dev, staging and production** instances. Build and test in dev with pinned data and test credentials; export workflows (UI, CLI `n8n export:workflow`, or **source control/environments** on supported plans) into **Git**, review via pull request, and import into the next environment with a **CI/CD pipeline**. Credentials are per environment (match them by name), and use environment variables or variables for URLs and IDs that differ.

## When should you use a Code node and when the built-in nodes?

Prefer **built-in nodes** (Edit Fields, IF, Switch, Filter, Aggregate, Sort, Remove Duplicates, Date & Time): they are readable by non-developers, validated, and show clear item flow. Use **Code** for logic that is awkward visually: complex transformations, grouping, calling a library function, loops with state. Keep Code nodes **small and well-named**, and move large logic to a real service you call over HTTP.

## How do you design an idempotent webhook workflow?

Take a unique **event id** from the payload, check whether you already processed it (look it up in a database/Redis/Data table, or use an **upsert** in the destination), and **skip** if yes. Record the id **after** success (or in the same step as the side effect). Respond quickly with 200 so the sender does not retry, and if the work is slow, respond first and continue (or queue it). This protects you from webhook re-deliveries and manual re-runs.

## What are the risks of community nodes?

Community nodes are packages written by third parties and run **with the permissions of your n8n instance**, so they can read credentials and data passing through. Risks: malicious or buggy code, abandoned packages that break after upgrades, and supply-chain attacks. Mitigate by reviewing the source, pinning versions, using only well-known maintained packages, restricting who may install them, running n8n with least privilege, and preferring the **HTTP Request** node for simple integrations.

## Self-hosted vs n8n Cloud: how do you decide?

**Cloud**: no servers to run, automatic updates and backups, quick start, support; usage-based pricing and your data on their infrastructure. **Self-hosted**: full control over data and network (private databases, compliance), no per-execution fee (you pay for servers), custom nodes and scaling, but you own **upgrades, backups, security, monitoring and uptime**. Pick self-hosted when data location or integrations with private systems demand it and you have the DevOps capacity.

## How do you avoid hitting API rate limits (429 errors)?

Process in **batches** (Loop Over Items or HTTP Request **Batching** with an interval), add a **Wait** between batches, enable **Retry On Fail** with a wait (respect the `Retry-After` header with an expression), reduce calls with **filters/query parameters** and caching, and spread scheduled workflows so they do not all fire at the same minute. For heavy workloads, queue the work and run it with a limited number of workers (queue mode concurrency).

## How do you handle very large result sets in n8n without running out of memory?

Fetch and process **page by page** (pagination + batches), write results to a database or file as you go instead of keeping everything in items, filter and drop fields early (Edit Fields with only the fields you need), avoid duplicating huge arrays in Code nodes, turn off saving of successful execution data for high-volume workflows, and move the heavy lifting to a dedicated service or a database query that returns an aggregate.
