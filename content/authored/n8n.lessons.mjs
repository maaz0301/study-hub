// Step-by-step n8n lessons (same layout as the C# and Messaging lessons).
// step = [code or settings, explanation, optional language]

const L = (n, title, sub, big, steps, output, mistakes, file, program, run, lang = 'plaintext', fileLabel = 'workflow outline') =>
  ({ n, title, sub, big, steps, output, mistakes, file, program, run, lang, fileLabel });

export const groups = [
  { id: 'lab-1-basics', title: 'Lab 1: First steps (lessons 1–4)', from: 1, to: 4 },
  { id: 'lab-2-data-and-apis', title: 'Lab 2: Data, APIs and webhooks (lessons 5–9)', from: 5, to: 9 },
  { id: 'lab-3-real-workflows', title: 'Lab 3: Real-world workflows (lessons 10–14)', from: 10, to: 14 },
  { id: 'lab-4-advanced', title: 'Lab 4: Reuse, AI and production (lessons 15–17)', from: 15, to: 17 },
];

export const lessons = [
  L(1, 'Run n8n on your computer', 'Start n8n with Docker and open the workflow editor.',
    'n8n is a workflow automation tool: you drag **nodes** onto a canvas and connect them, and n8n runs them for you (get data, change it, send it somewhere). You can run it yourself for free, and Docker is the quickest way. Everything you build is saved in a folder (a Docker **volume**) so it survives restarts.',
    [
      ['docker volume create n8n_data', 'Creates a named volume. Without it your workflows disappear when the container stops.', 'bash'],
      ['docker run -it --rm --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n', 'Starts n8n. `-p 5678:5678` makes the editor available on port 5678, `-v` stores your data in the volume.', 'bash'],
      ['http://localhost:5678', 'Open this address in a browser. The first time, n8n asks you to create the **owner account** (email and password).'],
      ['npx n8n', 'No Docker? This runs n8n directly with Node.js (use a Node version supported by n8n).', 'bash'],
    ],
    'n8n ready on ::, port 5678\nn8n Task Broker ready on 127.0.0.1, port 5679\nEditor is now accessible via:\nhttp://localhost:5678',
    ['Forgetting `-v n8n_data:/home/node/.n8n`: all workflows and credentials are lost when the container is removed.', 'Port `5678` already used: change the left number, for example `-p 5679:5678`.', 'Webhooks from the internet cannot reach `localhost`. Later you will use a tunnel or set `WEBHOOK_URL` to a public address.'],
    'docker-compose.yml',
    `services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - GENERIC_TIMEZONE=Asia/Karachi
      - TZ=Asia/Karachi
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:`,
    'docker compose up -d      # then open http://localhost:5678', 'yaml', 'file'),

  L(2, 'Your first workflow', 'Build a two-node workflow and run it with one click.',
    'A workflow always starts with a **trigger** (what starts it) followed by **nodes** (what to do). The simplest trigger is **Manual Trigger**: it runs when you click the button. The **Edit Fields (Set)** node creates or changes data. After you run it you can click any node and see exactly what went in and what came out, which makes debugging easy.',
    [
      ['Create workflow → Add first step → "Trigger manually"', 'Adds a **Manual Trigger** node. It has no settings; it just starts the run.'],
      ['Click + after the trigger → search "Edit Fields" → add it', 'The **Edit Fields (Set)** node is where you make or change data.'],
      ['Mode: Manual Mapping\nAdd field → Name: greeting   Type: String   Value: Hello n8n!\nAdd field → Name: year       Type: Number   Value: 2026', 'Creates two fields. Each field has a name, a type and a value.'],
      ['Click "Execute workflow"', 'Runs everything from the trigger to the end. A green tick and an item count appear on every node that ran.'],
      ['Double-click the Edit Fields node → OUTPUT tab → JSON', 'Shows the data this node produced. Compare with the INPUT tab to see what changed.'],
    ],
    '[\n  {\n    "greeting": "Hello n8n!",\n    "year": 2026\n  }\n]',
    ['Forgetting to click **Save**: n8n warns you, but unsaved changes are lost when you leave.', 'Choosing the wrong **Type** for a field (a number stored as a String cannot be used in maths).', 'Thinking the trigger button runs a live workflow: it only runs it once, for testing. Real workflows must be **Active** (lesson 8).'],
    'workflow outline',
    'Manual Trigger  →  Edit Fields (greeting = "Hello n8n!", year = 2026)',
    'Click "Execute workflow" at the bottom of the canvas'),

  L(3, 'Items and JSON: how data flows', 'Understand that every node passes a list of items, and runs once per item.',
    'The most important idea in n8n: data travels as a **list of items**, and every item is a JSON object. A node usually runs **once for every item** it receives. One item in, one item out is common, but a node can return many items (like a list of users) and the next node then runs for each of them.',
    [
      ['[\n  { "json": { "name": "Ann", "age": 31 } },\n  { "json": { "name": "Bob", "age": 25 } }\n]', 'This is what n8n passes between nodes: an **array of items**, each with a `json` object (and optionally `binary` for files). The editor shows it as a table or JSON.', 'json'],
      ['Code node → Mode: Run Once for All Items\nreturn [\n  { json: { name: "Ann", age: 31 } },\n  { json: { name: "Bob", age: 25 } },\n  { json: { name: "Cy",  age: 40 } },\n];', 'A **Code** node that creates three items. (Paste it in the JavaScript editor.)', 'javascript'],
      ['Edit Fields node after it:\nName: isAdult   Type: Boolean   Value: {{ $json.age >= 30 }}', 'The next node runs **three times**, once per item. `{{ $json.age }}` always means "the `age` of the current item".'],
      ['Code → "Include Other Input Fields" ON', 'In Edit Fields, turn on **Include Other Input Fields** to keep the old fields. Otherwise you only keep the fields you set.'],
    ],
    '[\n  { "name": "Ann", "age": 31, "isAdult": true },\n  { "name": "Bob", "age": 25, "isAdult": false },\n  { "name": "Cy",  "age": 40, "isAdult": true }\n]',
    ['Expecting one run with all items. Most nodes run once **per item**; use the Code node (all items mode) or the **Aggregate** node when you need all items together.', 'Forgetting that a node with no output items stops the workflow: nothing after it runs.', 'Returning plain objects from a Code node. Each item must be `{ json: { … } }`.'],
    'workflow outline',
    'Manual Trigger → Code (returns 3 items) → Edit Fields (isAdult = {{ $json.age >= 30 }})',
    'Click "Execute workflow", then open each node to see 3 items', 'plaintext'),

  L(4, 'Expressions: use data from earlier nodes', 'Put dynamic values into any field with {{ }}.',
    'An **expression** is a value that n8n calculates while the workflow runs. You write it between double curly braces. Inside you can read the current item (`$json`), another node\'s data (`$("Node name")`), the current time (`$now`) and use normal JavaScript. Any field can switch between **Fixed** (plain text) and **Expression** mode.',
    [
      ['{{ $json.name }}', 'The `name` of the current item.', 'javascript'],
      ['{{ $json.name.toUpperCase() + " (" + $json.age + ")" }}', 'Full JavaScript works inside the braces: `ANN (31)`.', 'javascript'],
      ['{{ $now.toFormat("yyyy-MM-dd") }}', '`$now` is the current date/time (Luxon). This prints something like `2026-11-26`.', 'javascript'],
      ['{{ $("Webhook").item.json.body.email }}', 'Reads data from an **earlier node** by name, not just the previous one.', 'javascript'],
      ['{{ $input.all().length }}', 'How many items came into this node. Handy for a summary message.', 'javascript'],
      ['{{ $json.age >= 30 ? "senior" : "junior" }}', 'A normal JavaScript ternary: use it for simple decisions.', 'javascript'],
    ],
    'ANN (31)\n2026-11-26\n3\nsenior',
    ['Leaving the field in Fixed mode: you see `{{ $json.name }}` printed as text. Click the **Expression** tab on the field.', 'Using `$json` when you mean an earlier node. `$json` is only the **previous** node\'s item.', 'Typos in field names: expressions fail quietly with `undefined`. Use the expression preview under the field to check.'],
    'workflow outline',
    'Edit Fields:\n  label   = {{ $json.name.toUpperCase() + " (" + $json.age + ")" }}\n  today   = {{ $now.toFormat("yyyy-MM-dd") }}\n  count   = {{ $input.all().length }}\n  level   = {{ $json.age >= 30 ? "senior" : "junior" }}',
    'Click "Execute workflow" and look at the green expression preview under each field'),

  L(5, 'HTTP Request: call any API', 'Fetch data from a web API and turn every result into an item.',
    'The **HTTP Request** node can talk to any web API, even apps that have no ready-made n8n node. You give it a method (GET, POST …), a URL, and optionally headers, query values or a body. If the API returns a list, n8n turns each element into its own item automatically.',
    [
      ['Method: GET\nURL: https://jsonplaceholder.typicode.com/users', 'A free fake API. It returns a JSON array of 10 users.'],
      ['Send Query Parameters: ON\n  name: _limit    value: 3', 'Adds `?_limit=3` to the URL so we only get 3 users. Use this instead of writing the query string by hand.'],
      ['Options → Response → Response Format: JSON', 'Tells n8n to parse the answer. (JSON is the default for most APIs.)'],
      ['Method: POST\nURL: https://jsonplaceholder.typicode.com/posts\nSend Body: ON   Body Content Type: JSON\nJSON: { "title": "{{ $json.name }}", "userId": {{ $json.id }} }', 'A POST that sends data. The body can use expressions, so each incoming item makes its own request.', 'json'],
    ],
    '[\n  { "id": 1, "name": "Leanne Graham", "email": "Sincere@april.biz" },\n  { "id": 2, "name": "Ervin Howell",  "email": "Shanna@melissa.tv" },\n  { "id": 3, "name": "Clementine Bauch", "email": "Nathan@yesenia.net" }\n]\n(3 items)',
    ['Putting API keys in the URL or body text. Use **Authentication → Credentials** (lesson 13) so secrets stay hidden.', 'Ignoring pagination: many APIs return only the first page. Turn on **Options → Pagination** or loop (lesson 11).', 'Forgetting that the node runs once **per input item**: with 100 items you send 100 requests.'],
    'workflow outline',
    'Manual Trigger → HTTP Request (GET /users?_limit=3) → Edit Fields (keep name, email)',
    'Click "Execute workflow"; the HTTP node shows 3 items'),

  L(6, 'IF and Switch: make decisions', 'Send items down different paths depending on their data.',
    'The **IF** node has two outputs, **true** and **false**. Each item goes to exactly one of them. When you need more than two paths, use the **Switch** node (a list of rules, one output each). Branches run independently, and you can join them again later with the Merge node.',
    [
      ['IF node → Conditions\n  Value 1: {{ $json.id }}   Operator: Number → is greater than   Value 2: 5', 'Items with `id > 5` leave through **true**, the rest through **false**.'],
      ['Connect "true" → Edit Fields (label = "big")\nConnect "false" → Edit Fields (label = "small")', 'Each branch can have its own nodes. Both labels end up in the same shape so you can merge later.'],
      ['Switch node → Mode: Rules\n  Rule 1: {{ $json.status }} equals "new"      → Output 0\n  Rule 2: {{ $json.status }} equals "paid"     → Output 1\n  Fallback Output: Extra Output', 'A Switch with two rules and a **fallback** so no item is lost when nothing matches.'],
      ['IF → "Combine conditions": AND / OR', 'You can add several conditions to one IF and choose whether **all** (AND) or **any** (OR) must be true.'],
    ],
    'IF output "true"  (id 6–10): 5 items → label = big\nIF output "false" (id 1–5):  5 items → label = small',
    ['Comparing a number with the wrong type: `"5"` (text) is not greater than `3` (number). Match the operator type to the data.', 'Forgetting a Switch **fallback**: items that match no rule are silently dropped.', 'Building long chains of IF nodes when one Switch would be clearer.'],
    'workflow outline',
    'HTTP Request (10 users) → IF (id > 5)\n   true  → Edit Fields (label = "big")\n   false → Edit Fields (label = "small")',
    'Click "Execute workflow" and compare the item counts on the two branches'),

  L(7, 'Code node: transform data with JavaScript', 'Reshape items when the visual nodes are not enough.',
    'The **Code** node runs JavaScript (or Python). It has two modes: **Run Once for All Items** (you get every item and return a new list) and **Run Once for Each Item** (the code runs for each item and returns one). Use it for loops, grouping, maths and anything that needs real logic. You always return items in the `{ json: … }` shape.',
    [
      ['const items = $input.all();', 'In "all items" mode this gives you the list of incoming items.', 'javascript'],
      ['return items.map((item) => ({\n  json: {\n    id: item.json.id,\n    name: item.json.name.toUpperCase(),\n    domain: item.json.email.split("@")[1],\n  },\n}));', '`map` turns each item into a new one. We keep the id, shout the name and pull the domain out of the email.', 'javascript'],
      ['const total = $input.all().reduce((sum, i) => sum + i.json.amount, 0);\nreturn [{ json: { total } }];', 'Combining many items into **one** (a sum). The result is a list with a single item.', 'javascript'],
      ['// Mode: Run Once for Each Item\nreturn { json: { ...$input.item.json, checked: true } };', 'In "each item" mode you return just one object. `$input.item` is the current item.', 'javascript'],
    ],
    '[\n  { "id": 1, "name": "LEANNE GRAHAM", "domain": "april.biz" },\n  { "id": 2, "name": "ERVIN HOWELL",  "domain": "melissa.tv" }\n]\n{ "total": 350 }',
    ['Returning a plain array of objects instead of `{ json: … }` items: n8n shows `Code doesn\'t return items properly`.', 'Using `console.log` and expecting to see it in the editor: it prints in the browser dev-tools console (and in the logs when self-hosted).', 'Doing heavy work in the Code node that a built-in node (Aggregate, Sort, Remove Duplicates) already does faster and clearer.'],
    'code-node.js',
    `// Mode: Run Once for All Items
const items = $input.all();

const cleaned = items.map((item) => ({
  json: {
    id: item.json.id,
    name: item.json.name.toUpperCase(),
    domain: item.json.email.split('@')[1],
  },
}));

// keep only the .com addresses
return cleaned.filter((i) => i.json.domain.endsWith('.com'));`,
    'Click "Execute node" on the Code node', 'javascript', 'program'),

  L(8, 'Webhook trigger: start a workflow from the outside', 'Give your workflow a URL and call it with curl.',
    'A **Webhook** node gives your workflow a URL. When something sends a request to that URL (another app, a form, curl), the workflow starts and the request data becomes the first item. There are two URLs: a **Test URL** that only works while you are listening in the editor, and a **Production URL** that works when the workflow is **Active**.',
    [
      ['Webhook node\n  HTTP Method: POST\n  Path: lead', 'This creates the addresses `…/webhook-test/lead` (testing) and `…/webhook/lead` (production).'],
      ['Click "Listen for test event"', 'The node waits for one request. The **Test URL** works only while it is listening.'],
      ['curl -X POST http://localhost:5678/webhook-test/lead \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"Sara","email":"sara@example.com","budget":1500}\'', 'Sends a request to the test URL from your terminal.', 'bash'],
      ['{{ $json.body.name }}   {{ $json.body.budget }}', 'The sent JSON is under `body`. Headers are in `headers`, query values in `query`.', 'javascript'],
      ['Toggle "Active" (top right) → use the Production URL: /webhook/lead', 'Only an **Active** workflow answers on the production URL.'],
    ],
    '[\n  {\n    "headers": { "content-type": "application/json" },\n    "params": {},\n    "query": {},\n    "body": { "name": "Sara", "email": "sara@example.com", "budget": 1500 }\n  }\n]',
    ['Calling the **test** URL when the workflow is not listening: you get `404 The requested webhook is not registered`.', 'Forgetting to activate the workflow and then calling the production URL.', 'Exposing a webhook with no authentication. Add **Authentication** (Header Auth or Basic Auth) in the Webhook node.', 'Using `localhost` in an external service: it cannot reach your machine. Use a public URL or a tunnel.'],
    'workflow outline',
    'Webhook (POST /lead) → Edit Fields (name, email, budget from body)',
    'curl -X POST http://localhost:5678/webhook-test/lead -H "Content-Type: application/json" -d \'{"name":"Sara","budget":1500}\'', 'plaintext'),

  L(9, 'Respond to Webhook: build a small API', 'Return your own answer to the caller.',
    'By default a webhook answers right away with a plain "workflow started" message. If you want the caller to receive the **result of your workflow** (like a real API), set the Webhook to wait and add a **Respond to Webhook** node at the end. This turns n8n into a tiny backend.',
    [
      ['Webhook node → Respond: "Using \'Respond to Webhook\' Node"', 'Tells the webhook to wait for your answer instead of replying immediately.'],
      ['Edit Fields\n  greeting = Hello {{ $json.body.name }}!\n  vip      = {{ $json.body.budget > 1000 }}', 'Build the data you want to return.'],
      ['Respond to Webhook node\n  Respond With: JSON\n  Response Body: {{ { "ok": true, "greeting": $json.greeting, "vip": $json.vip } }}', 'Sends a JSON answer. Also set the **response code** (200 by default, or 400/404 for errors).'],
      ['curl -X POST http://localhost:5678/webhook-test/lead -H "Content-Type: application/json" -d \'{"name":"Sara","budget":1500}\'', 'Now the curl command prints your JSON instead of a generic message.', 'bash'],
    ],
    '{"ok":true,"greeting":"Hello Sara!","vip":true}',
    ['Forgetting to change the Webhook **Respond** option: the caller gets an immediate answer and never sees your result.', 'A branch that never reaches Respond to Webhook: the request times out. Make every branch (including errors) respond.', 'Long-running work before responding: the caller may time out. Respond first, then continue, or use a queue.'],
    'workflow outline',
    'Webhook (Respond: using node) → Edit Fields (greeting, vip) → Respond to Webhook (JSON)',
    'curl -X POST …/webhook-test/lead -d \'{"name":"Sara","budget":1500}\'', 'plaintext'),

  L(10, 'Schedule Trigger: run on a timer', 'Run a workflow every morning, hour or minute.',
    'The **Schedule Trigger** starts a workflow by itself on a timetable. You can pick simple intervals ("every day at 9") or write a **cron expression**. The workflow must be **Active** and uses the timezone of the workflow, so set it correctly. Add a **Wait** node when you need a pause inside a run.',
    [
      ['Schedule Trigger\n  Trigger Interval: Days   Days Between Triggers: 1   Trigger at Hour: 9   Minute: 0', 'Runs once a day at 09:00 in the workflow timezone.'],
      ['Mode: Custom (Cron)   Expression: 0 9 * * 1-5', 'Cron has five parts: minute, hour, day of month, month, day of week. This means **09:00 on weekdays**.'],
      ['Workflow → Settings → Timezone: Asia/Karachi', 'Without this the server timezone is used, which is often UTC.'],
      ['Wait node → Resume: After Time Interval → 30 seconds', 'Pauses this execution (it is stored safely, so it also survives a restart).'],
      ['Toggle "Active"', 'Scheduled workflows only run when Active. Test them first with **Execute workflow**.'],
    ],
    'Execution #41   Mode: trigger   Status: Success   Started: 2026-11-26 09:00:00',
    ['Not activating the workflow: it never runs and nothing tells you why.', 'Getting the timezone wrong: the "9:00" run happens at 14:00 your time.', 'Cron day-of-week: `0` or `7` is Sunday; test the expression with a cron checker.'],
    'workflow outline',
    'Schedule Trigger (cron 0 9 * * 1-5) → HTTP Request (get report) → Edit Fields → (send message)',
    'Click "Execute workflow" to test, then switch the workflow to Active', 'plaintext'),

  L(11, 'Loop Over Items: batches and rate limits', 'Process many items a few at a time and wait between calls.',
    'APIs often limit how many requests you can send per second. The **Loop Over Items (Split in Batches)** node cuts your list into batches. It has two outputs: **loop** (the current batch) and **done** (everything finished). Connect the end of your work back into the loop node and add a **Wait** node to slow down.',
    [
      ['Loop Over Items → Batch Size: 10', 'Sends 10 items at a time through the **loop** output.'],
      ['Loop output → HTTP Request → Wait (1 second) → back to Loop Over Items', 'After each batch, wait one second and return to the loop node, which hands out the next batch.'],
      ['Loop Over Items → "done" output → Edit Fields', 'When all batches are processed, the **done** output delivers **all items together**.'],
      ['HTTP Request → Options → Batching\n  Items per Batch: 5   Batch Interval: 1000 ms', 'Many nodes can do simple rate limiting themselves, without a loop.'],
    ],
    'Loop: batch 1 (10 items) → wait → batch 2 (10 items) → … → done (100 items)',
    ['Forgetting to connect the last node **back** to the loop node: only the first batch runs.', 'Looping when a node already handles batching (HTTP Request Batching): more nodes, more to debug.', 'No wait between batches: the API answers `429 Too Many Requests`.'],
    'workflow outline',
    'Get 100 users → Loop Over Items (10) → HTTP Request → Wait 1 s → (back to loop)\n                      └─ done → Summary',
    'Click "Execute workflow" and watch the loop counter', 'plaintext'),

  L(12, 'Merge: combine data from two paths', 'Join two lists of items, like a database JOIN.',
    'The **Merge** node takes two inputs and combines them. **Append** puts both lists one after another. **Combine → Matching Fields** joins items that share a value (like SQL JOIN), and **Combine → By Position** pairs item 1 with item 1, item 2 with item 2. Use it to add extra data to your main list.',
    [
      ['Branch A: HTTP Request GET /users          (items with "id")\nBranch B: HTTP Request GET /todos?_limit=20  (items with "userId")', 'Two data sources that you want to connect.'],
      ['Merge node → Mode: Combine → Combine By: Matching Fields\n  Input 1 Field: id    Input 2 Field: userId', 'Joins every todo to its user, because `todo.userId` equals `user.id`.'],
      ['Join Mode: Keep Matches (inner join)\nOther choices: Keep Non-Matches, Enrich Input 1 (left join), Keep Everything', 'Matches the usual SQL join types.'],
      ['Merge → Mode: Append', 'Simply stacks the items of both inputs: good for combining lists of the same shape.'],
    ],
    '[\n  { "id": 1, "name": "Leanne Graham", "title": "delectus aut autem", "completed": false },\n  …\n]',
    ['Wrong field names on the two inputs: you get zero items. Check both inputs\' field names in the INPUT tab.', 'Duplicate field names in both inputs: one overwrites the other. Rename with Edit Fields first.', 'Expecting Merge to wait forever: if one branch produces no items, choose an option that handles empty inputs.'],
    'workflow outline',
    'Manual → HTTP (users) ─┐\n         HTTP (todos) ─┴→ Merge (match id = userId) → Edit Fields',
    'Click "Execute workflow" and open the Merge node output', 'plaintext'),

  L(13, 'Credentials and retrying failed steps', 'Connect services safely and make flaky steps try again.',
    'Never type passwords or API keys into a node field. n8n has a **Credentials** store: secrets are saved **encrypted** and nodes only reference them. Real-world APIs also fail sometimes, so each node can **retry** automatically, or let the workflow continue down an **error output**.',
    [
      ['Credentials → Create credential → "Header Auth"\n  Name: Authorization\n  Value: Bearer sk_live_xxx', 'Creates a reusable secret. In the HTTP Request node choose **Authentication → Generic → Header Auth** and pick it.'],
      ['N8N_ENCRYPTION_KEY=use-a-long-random-string-and-keep-it-safe', 'The key n8n uses to encrypt stored credentials. **Back it up**: without it you cannot decrypt them after moving servers.', 'bash'],
      ['Node → Settings → Retry On Fail: ON\n  Max Tries: 3   Wait Between Tries: 2000 ms', 'If the node errors (timeout, 500) n8n tries again before failing the run.'],
      ['Node → Settings → On Error: "Continue (using error output)"', 'Instead of stopping, the failed item goes to a second **error** output where you can log it or send an alert.'],
    ],
    'HTTP Request failed (attempt 1/3): 503 Service Unavailable\nHTTP Request failed (attempt 2/3): 503 Service Unavailable\nHTTP Request succeeded (attempt 3/3)',
    ['Pasting an API key into a Set node or the URL: it appears in execution logs and exported workflows.', 'Losing `N8N_ENCRYPTION_KEY` when you rebuild the container: every credential becomes unusable.', 'Retrying actions that must not run twice (like "charge customer") without an idempotency key.'],
    'workflow outline',
    'HTTP Request (Credentials: Header Auth, Retry 3×, Wait 2 s, On Error: error output)\n   success → continue\n   error   → Slack alert',
    'Execute the workflow against an API that sometimes fails', 'plaintext'),

  L(14, 'Error workflows: get notified when something breaks', 'Create one workflow that handles failures of all the others.',
    'A scheduled workflow can fail at 3 a.m. and nobody notices. An **error workflow** starts automatically whenever another workflow fails. It begins with an **Error Trigger** node, which receives the name of the failed workflow, the error message and a link to the execution. Then you send yourself a message.',
    [
      ['Create a new workflow named "Global error handler"\n  Node 1: Error Trigger', 'The trigger fires when a workflow that points to this handler fails.'],
      ['{{ $json.workflow.name }}   {{ $json.execution.error.message }}   {{ $json.execution.url }}', 'The data you get: failed workflow name, the error and a URL to open the execution.', 'javascript'],
      ['Node 2: Slack / Telegram / Email\n  Text: ❌ {{ $json.workflow.name }} failed: {{ $json.execution.error.message }}\n{{ $json.execution.url }}', 'Any message node works. Keep the text short and include the link.'],
      ['Other workflow → Settings → Error Workflow: "Global error handler"', 'Point every important workflow at it. This is the connection.'],
    ],
    '❌ Daily report failed: 401 Unauthorized - invalid token\nhttp://localhost:5678/workflow/12/executions/41',
    ['Forgetting to set **Error Workflow** in each workflow\'s settings: the handler never runs.', 'Testing with the manual button: error workflows run for **production (automatic) executions**, not for manual test runs.', 'The handler itself failing silently: keep it very simple.'],
    'workflow outline',
    'Error Trigger → Telegram/Slack/Email ("❌ workflow name failed: error + link")',
    'Break a scheduled workflow on purpose and wait for its next run', 'plaintext'),

  L(15, 'Sub-workflows: reuse your logic', 'Call one workflow from another, like a function.',
    'When the same steps appear in many workflows (for example "validate an address" or "send an alert"), put them in **one workflow** and call it with **Execute Workflow**. The called workflow starts with **When Executed by Another Workflow**, receives the items, and returns its last node\'s output, like a function with input and return value.',
    [
      ['Workflow "Format phone number"\n  Trigger: When Executed by Another Workflow\n  Node: Edit Fields → phone = {{ $json.phone.replace(/\\D/g, "") }}', 'The helper workflow: it receives items and cleans a phone number.'],
      ['Main workflow → Execute Workflow node\n  Source: Database   Workflow: Format phone number', 'Calls the helper. Items go in, and the helper\'s result comes back out.'],
      ['Execute Workflow → Mode: Run once for each item  /  Run once with all items', 'Choose whether the helper runs per item or once for the whole list.'],
      ['Workflow → Settings → "This workflow can be called by": choose who', 'Control which workflows may call it.'],
    ],
    '{ "phone": "03001234567" }   (from "0300-123 4567")',
    ['Forgetting that the child\'s **last node** is the return value.', 'Changing the child\'s input shape and breaking every caller: treat the first node like an API contract.', 'Deep chains of sub-workflows that are hard to debug; keep it to one or two levels.'],
    'workflow outline',
    'Main: Webhook → Execute Workflow ("Format phone number") → CRM\nChild: When Executed by Another Workflow → Edit Fields',
    'Execute the main workflow and open the sub-execution link', 'plaintext'),

  L(16, 'AI Agent node: let a model use tools', 'Build a chat agent that can call your own tools.',
    'n8n has AI nodes built on LangChain. The **AI Agent** node connects a **chat model** (brain), optional **memory** (it remembers the conversation) and **tools** (things it may do: search, call an API, run another workflow). The model decides **when** to use a tool, in a loop, just like the agents you saw in the Agentic AI topic.',
    [
      ['Chat Trigger (When chat message received) → AI Agent', 'The Chat Trigger gives you a built-in chat window to test the agent.'],
      ['AI Agent → Chat Model: OpenAI Chat Model (or Anthropic / Ollama)\n  Credential: your API key   Model: pick one', 'The brain. Use a credential for the key, never paste it.'],
      ['AI Agent → Memory: Window Buffer Memory   Context Window Length: 5', 'Keeps the last 5 messages so follow-up questions make sense.'],
      ['AI Agent → Tool: HTTP Request Tool\n  Name: get_weather   Description: "Gets the weather for a city"\n  URL: https://wttr.in/{city}?format=3', 'A tool the model may call. A clear **name and description** matters: the model reads them to decide when to use it.'],
      ['System Message: "You are a helpful assistant. Use get_weather for weather questions. Never guess."', 'Instructions that shape behaviour and limits.'],
    ],
    'You: What\'s the weather in Lahore?\nAgent: (calls get_weather) → "Lahore: ☀️ +24°C"\nAgent: It\'s sunny and about 24°C in Lahore right now.',
    ['Vague tool descriptions: the model never calls the tool, or calls the wrong one.', 'Giving the agent powerful tools (delete, send money) with no human approval step. Add a confirmation step for risky actions.', 'Letting the loop run forever: set **Max Iterations** on the agent.'],
    'workflow outline',
    'Chat Trigger → AI Agent\n   ├─ Chat Model (OpenAI)\n   ├─ Memory (Window Buffer, 5)\n   └─ Tool: get_weather (HTTP Request Tool)',
    'Open the chat panel and ask a question', 'plaintext'),

  L(17, 'Go to production', 'Run n8n with PostgreSQL, a stable URL and backups.',
    'For real use change three things: use **PostgreSQL** instead of the default SQLite file, set the **public URL** so webhooks and links are correct, and **back up** your workflows and the encryption key. When load grows, n8n can run in **queue mode**: a main instance receives triggers and puts jobs in **Redis**, and separate **workers** run them.',
    [
      ['services:\n  postgres:\n    image: postgres:16\n    environment: [POSTGRES_USER=n8n, POSTGRES_PASSWORD=change_me, POSTGRES_DB=n8n]\n    volumes: [pg_data:/var/lib/postgresql/data]', 'A real database for workflows and execution history.', 'yaml'],
      ['  n8n:\n    image: docker.n8n.io/n8nio/n8n\n    environment:\n      - DB_TYPE=postgresdb\n      - DB_POSTGRESDB_HOST=postgres\n      - DB_POSTGRESDB_USER=n8n\n      - DB_POSTGRESDB_PASSWORD=change_me\n      - DB_POSTGRESDB_DATABASE=n8n\n      - N8N_ENCRYPTION_KEY=long-random-secret\n      - WEBHOOK_URL=https://n8n.example.com/', 'Points n8n at Postgres. `WEBHOOK_URL` is the address the outside world uses (behind HTTPS).', 'yaml'],
      ['EXECUTIONS_MODE=queue\nQUEUE_BULL_REDIS_HOST=redis\n# start extra workers with:  n8n worker', 'Queue mode: Redis holds the job queue and workers execute workflows, so you can scale by adding workers.', 'bash'],
      ['n8n export:workflow --all --output=backups/\nn8n export:credentials --all --output=backups/creds.json', 'Backs up workflows and (encrypted) credentials. Also copy the encryption key somewhere safe.', 'bash'],
      ['EXECUTIONS_DATA_PRUNE=true\nEXECUTIONS_DATA_MAX_AGE=168', 'Deletes execution history older than 168 hours (7 days) so the database does not grow forever.', 'bash'],
    ],
    'n8n ready on ::, port 5678\nEditor is now accessible via: https://n8n.example.com/',
    ['Keeping SQLite in production: slow with many executions and hard to back up.', 'Changing `N8N_ENCRYPTION_KEY` after the first start: stored credentials cannot be decrypted.', 'Serving n8n over plain HTTP on the internet. Put it behind HTTPS (a reverse proxy such as Caddy or Nginx).', 'Never pruning executions: the database fills the disk.'],
    'docker-compose.yml',
    `services:
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=change_me
      - POSTGRES_DB=n8n
    volumes:
      - pg_data:/var/lib/postgresql/data

  n8n:
    image: docker.n8n.io/n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=change_me
      - DB_POSTGRESDB_DATABASE=n8n
      - N8N_ENCRYPTION_KEY=long-random-secret
      - WEBHOOK_URL=https://n8n.example.com/
      - GENERIC_TIMEZONE=Asia/Karachi
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    depends_on:
      - postgres
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  pg_data:
  n8n_data:`,
    'docker compose up -d', 'yaml', 'file'),
];
