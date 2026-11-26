---
slug: n8n
title: n8n Workflow Automation
subtitle: 17 hands-on lessons plus concepts, production setup and interview questions
emoji: ⚙️
accent: #ea4b71
category: Automation
cards: all
---

# Start here

## What is n8n, in one minute?

**n8n** (say "n-eight-n") is a **workflow automation platform**. You build automations on a canvas by connecting **nodes** (each node does one job: read a form, call an API, change data, send a message) and n8n runs the chain for you whenever a **trigger** fires. It has 400+ ready-made integrations (Slack, Google Sheets, Gmail, GitHub, databases …), plus an **HTTP Request** node and a **Code** node (JavaScript or Python) for anything else, and **AI nodes** (LangChain agents, tools, memory).

It is **fair-code** (Sustainable Use License): the source is open and you can **self-host** it for your own use for free, or use the paid cloud version. Check the license before reselling it as a product.

Typical jobs: form → CRM + Slack notification, nightly report emails, syncing two systems, webhook-driven back-office APIs, AI assistants that use your tools, and glue between internal tools.

## n8n vs Zapier vs Make vs writing code: when do you use what?

| | n8n | Zapier / Make | Plain code |
|---|---|---|---|
| **Hosting** | self-host or cloud | cloud only | you host |
| **Cost model** | self-hosted: free (you pay servers); cloud: per execution | per task/operation (grows fast) | developer time |
| **Flexibility** | full JavaScript/Python, HTTP, custom nodes | limited code steps | unlimited |
| **Data control** | stays on your server | goes through their cloud | yours |
| **Best for** | technical teams, many steps, sensitive data | non-technical users, quick simple links | core product logic, high performance, heavy compute |

Rule of thumb: use n8n for **integration and glue** (connect systems, move data, notify people). Write code for **core business logic** and anything performance-critical.

## What are workflows, nodes, triggers and connections?

- A **workflow** is one automation (saved as JSON).
- A **node** is one step. There are **trigger nodes** (start a workflow) and **regular nodes** (do work).
- A **connection** is a line between nodes; data flows along it.
- A workflow is **active** (runs automatically on its trigger) or **inactive** (you can only run it manually while editing).
- An **execution** is one run of a workflow. n8n stores the data of each node for every execution, so you can inspect exactly what happened.

Common triggers: **Manual**, **Schedule (cron)**, **Webhook**, **Chat**, **app triggers** (new Gmail email, new GitHub issue), **Error Trigger**, **Execute Workflow Trigger** (called by another workflow).

## How does data flow: items and JSON?

Data moves between nodes as a **list of items**; each item is a JSON object (`{ "json": {…}, "binary": {…} }`). Most nodes run **once for every item** they receive, so a node that gets 100 items runs 100 times (or batches them, if it supports it). To combine many items into one, use **Aggregate**, **Summarize** or a **Code** node in "all items" mode. To split one item into many, use **Split Out** or the Code node.

Reading data in a field: `{{ $json.email }}` is the current item's `email`. Earlier nodes: `{{ $("Webhook").item.json.body.name }}`.

# Building blocks

## What are the most important core nodes?

| Node | What it does |
|---|---|
| **Webhook** | start a workflow from an HTTP request; can return a response |
| **Schedule Trigger** | run on an interval or cron |
| **HTTP Request** | call any API (auth, pagination, retries, batching) |
| **Edit Fields (Set)** | create or rename fields, change types |
| **IF / Switch / Filter** | route or filter items by conditions |
| **Merge** | combine two inputs (append, join by field, by position) |
| **Code** | JavaScript/Python for custom logic |
| **Loop Over Items** | process in batches (rate limits) |
| **Aggregate / Split Out / Sort / Remove Duplicates / Limit** | reshape lists |
| **Wait** | pause for time or until a webhook/form resumes the run |
| **Execute Workflow** | call another workflow (like a function) |
| **Respond to Webhook** | return data to the caller |
| **Error Trigger / Stop and Error** | build error handling |

## What are expressions and which variables can you use?

An **expression** is JavaScript inside `{{ }}` in any field. Useful variables:

- `$json`: the current item's data. `$binary`: its files.
- `$("Node name").item.json…` / `.all()` / `.first()`: data from another node.
- `$input.all()`, `$input.first()`, `$input.item`: items coming into this node.
- `$now`, `$today`: date/time (Luxon objects, e.g. `$now.toFormat("yyyy-MM-dd")`).
- `$env.MY_VAR`: environment variables; `$vars.name`: custom variables.
- `$execution.id`, `$workflow.name`, `$itemIndex`: metadata.

Fields have **Fixed** and **Expression** modes. A preview below the field shows the evaluated result.

## What is the difference between the test and production webhook URL?

A Webhook node exposes two URLs:

- **Test URL** (`/webhook-test/<path>`): works **only while you click "Listen for test event"** in the editor; the incoming data is shown on the canvas. Use it while building.
- **Production URL** (`/webhook/<path>`): works **only when the workflow is Active**; runs are stored in Executions without opening the editor.

If your service calls the wrong one you see `404 The requested webhook is not registered`. Behind a proxy or in Docker set `WEBHOOK_URL` so n8n shows the correct public address. Protect webhooks with **Header Auth / Basic Auth** and validate the payload.

## How do you handle errors in n8n?

Four levels:

1. **Retry On Fail** (node settings): retry a flaky node N times with a wait.
2. **On Error → Continue (using error output)**: the failed item goes to a separate error branch you can log or alert on, and the rest continues.
3. **Error Workflow**: a workflow starting with the **Error Trigger** that is called whenever a production execution fails (send Slack/email with the workflow name, error and link). Set it in each workflow's settings.
4. **Stop and Error** node: fail on purpose when your own validation fails.

Also: validate input early (IF node), make steps **idempotent**, and use the **Executions** list to inspect and **retry** failed runs.

## How do you loop and respect API rate limits?

- Many nodes already process one request **per item**, so you often do **not** need a loop.
- Use **Loop Over Items (Split in Batches)** to process N items at a time, with a **Wait** node between batches.
- The **HTTP Request** node has **Options → Batching** (items per batch + interval) and **Pagination** for paged APIs.
- On `429 Too Many Requests` use Retry On Fail with a wait, or lower the batch size.

## How do credentials work and how are they secured?

Credentials are stored **encrypted in the database** with the key `N8N_ENCRYPTION_KEY`. Nodes reference a credential by name; the secret never appears in the workflow JSON. Share credentials with specific users/projects only. Back up the encryption key separately: **without it you cannot decrypt credentials** after a restore. For tighter control use **external secrets** (Vault, AWS/Azure/GCP secret managers on supported plans) and OAuth2 credentials where possible.

# Production

## How do you self-host n8n for production?

- Run it in **Docker** (or Kubernetes) with **PostgreSQL** (not the default SQLite) and a persistent volume.
- Put it behind a **reverse proxy with HTTPS** (Caddy, Nginx, Traefik) and set `WEBHOOK_URL`, `N8N_HOST`, `N8N_PROTOCOL`.
- Set a strong, backed-up `N8N_ENCRYPTION_KEY` **before** creating credentials.
- Turn on **execution pruning** (`EXECUTIONS_DATA_PRUNE`, `EXECUTIONS_DATA_MAX_AGE`) and decide how much data to save (`EXECUTIONS_DATA_SAVE_ON_SUCCESS=none` saves space).
- Back up the database and export workflows (`n8n export:workflow`).
- Pin the image to a **version**, not `latest`, and test upgrades in staging.

## What is queue mode and when do you need it?

In the default **regular mode** one process receives triggers *and* runs workflows. In **queue mode** (`EXECUTIONS_MODE=queue`) the **main** instance handles the editor and triggers and pushes jobs to **Redis**; separate **worker** processes (`n8n worker`) pick up jobs and run them; **PostgreSQL** stores data. Optional **webhook processors** answer webhook calls. You need it when many executions run at once, long workflows block others, or you want to scale horizontally and keep the editor responsive.

## How do you scale and monitor n8n?

Scale by adding **workers** (queue mode), using Postgres with enough connections, and splitting heavy flows into sub-workflows. Monitor: the **Executions** list, the `/healthz` endpoint, **metrics** (`N8N_METRICS=true` exposes Prometheus metrics), logs (`N8N_LOG_LEVEL`), and the **Error Workflow** for alerts. Watch database size, queue length (Redis) and worker CPU/memory.

## How do you version control, test and promote workflows?

Workflows are JSON, so you can **export** and commit them to Git. Options: n8n's **source control / environments** feature (Git integration on supported plans) or CLI export/import in a **CI/CD pipeline** (see the CI/CD topic). Use separate **dev / staging / production** instances, keep credentials per instance, test with **pinned data** and a staging webhook, and promote through pull requests. Use **tags** and clear names; keep sub-workflows small and versioned.

## How do you secure n8n?

- HTTPS everywhere; do not expose the editor publicly without authentication (use SSO/2FA where available, or a VPN/allow-list).
- Authenticate every **webhook** (header secret, HMAC signature check, IP allow-list).
- Least-privilege credentials (a Slack token that only posts to one channel).
- Restrict who can edit/credentials, disable unused nodes (`NODES_EXCLUDE`), and be careful with the **Code** and **Execute Command** nodes.
- Keep n8n **updated**; secure the encryption key and the database.

## What is the sub-workflow (Execute Workflow) pattern?

Put reusable logic (validate an address, send an alert, call a rate-limited API) into its **own workflow** that starts with **When Executed by Another Workflow**. Other workflows call it with the **Execute Workflow** node and pass items in; the last node's output returns. Benefits: reuse, smaller canvases, easier testing and a clear contract. Keep the depth shallow and document the input shape.

# Interview questions

## How would you automate "new form submission → enrich → CRM → Slack"?

1. **Webhook** (or Typeform/Google Forms trigger) receives the submission; authenticate it.
2. **Edit Fields** validates and normalises (trim, lower-case email, phone format); **IF** rejects bad data and responds with an error.
3. **HTTP Request** to an enrichment API (Clearbit-style) with retry + credentials.
4. **IF/Switch** on lead score → route to the right CRM owner.
5. **CRM node** (HubSpot/Salesforce) creates or **updates** the contact (use "upsert" or search first so retries do not create duplicates).
6. **Slack** message with a link; **Respond to Webhook** returns 200.
7. **Error workflow** alerts you if any step fails.

## How do you make a workflow idempotent so retries do not double-process?

Use a unique key (form id, order id, message id) and **check before you write**: search the destination first, use an **upsert** operation, or store processed ids in a database/Redis/data table and skip duplicates (`Remove Duplicates` node, or an IF on a lookup). Send an **idempotency key** header to APIs that support it. This matters because retries, webhook re-deliveries and manual re-runs all repeat work.

## How do you debug a failing workflow?

Open the failed **execution**, click the red node and read the error and its **input**. Use **pinned data** to freeze the trigger's sample so you do not have to resend the webhook each time. Run nodes one by one with **Execute node**. Check the expression preview, the data type (string vs number) and whether the item count is what you expect. For production, enable saving failed executions and use the Error Workflow with a link to the run. Retry the execution from the list once fixed.

## How do you handle pagination and big data sets?

Use the HTTP Request node's built-in **Pagination** (next page URL, page number or cursor from the response) with a stop condition, or a **Loop Over Items** that calls the next page until empty. Keep memory small: process in **batches**, avoid loading huge arrays into one Code node, filter early, and write results to a database instead of passing millions of items. For huge jobs move the heavy lifting to code and let n8n orchestrate.

## How do you trigger n8n from your own app and return a result?

Create a **Webhook** node with **Respond: Using 'Respond to Webhook' Node**, do the work, and end with **Respond to Webhook** returning JSON and a status code. Secure it with a shared secret or HMAC, keep the work under the caller's timeout (otherwise respond immediately with a job id and let the caller poll or receive a callback), and version the path (`/webhook/v1/orders`).

## How would you build a human approval step?

Send a message with **Approve / Reject** links that call a **Webhook**, then use a **Wait** node set to **resume on webhook call** so the run pauses (stored safely, even across restarts) until the person clicks. Many app nodes (Slack, Gmail, Telegram) also have a **Send and Wait for Response** operation that does exactly this. Add a timeout branch so requests do not wait forever.

## How would you build an AI agent workflow safely?

Use **Chat Trigger → AI Agent** with a chat model, **memory**, and **tools** (HTTP Request Tool, workflow tools, database). Write clear tool names/descriptions and a strict system prompt, set **max iterations**, give tools **least privilege**, and put a **human approval** step before risky actions (sending email, writing to production). Log tool calls, treat tool outputs as untrusted text (prompt injection), and evaluate with test conversations. See the Agentic AI topic for the patterns.

## What are the limits of n8n, and when would you write code instead?

n8n is great for glue, but not for: very high-throughput or low-latency paths, heavy CPU/ML work, complex transactional business logic that needs strong testing and code review, or large stateful systems. Signs to move to code: a workflow with 60+ nodes nobody understands, lots of Code-node logic, performance limits, or strict compliance. A good pattern is **n8n orchestrates, services do the heavy work** (call your API from n8n).

## How would you keep a self-hosted n8n reliable?

Postgres + backups, versions pinned, HTTPS, resource limits, queue mode when load grows, execution pruning, health checks and restarts (`restart: unless-stopped`), monitoring and alerts (error workflow, metrics), a staging instance for upgrades, and documented recovery steps (restore DB + encryption key + re-import workflows). Test the restore, not only the backup.
