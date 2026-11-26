// Step-by-step Node.js lessons for the Messaging topic, in the same style as the C# lessons.
// Each lesson: title, one-line sub, the big idea, steps (code + explanation), output, common mistakes, full program, run command.

const L = (n, title, sub, big, steps, output, mistakes, file, program, run) => ({ n, title, sub, big, steps, output, mistakes, file, program, run });

const T = (topic, lesson, t2) => ({ ...lesson, topic: t2 ?? topic });

export const groups = [
  { id: 'lab-1-setup-and-redis', title: 'Lab 1: Setup and Redis (lessons 1–11)', from: 1, to: 11 },
  { id: 'lab-2-mqtt', title: 'Lab 2: MQTT step by step (lessons 12–18)', from: 12, to: 18 },
  { id: 'lab-3-kafka', title: 'Lab 3: Kafka step by step (lessons 19–26)', from: 19, to: 26 },
  { id: 'lab-4-capstone', title: 'Lab 4: Capstone pipeline (lesson 27)', from: 27, to: 27 },
];

export const lessons = [
  // ---------------- per-technology setup lessons (n = 0 sorts first in each topic)
  T('redis', L(0, 'Set up Redis and your project', 'Start Redis with Docker and connect from Node.js.',
    'Redis runs as a small server. The quickest way to get one is Docker: a single command starts it and you can delete it afterwards. Then you create a Node.js project with the `ioredis` library, which is how every lesson here talks to Redis.',
    [
      ['docker run -d --name redis -p 6379:6379 redis:7', 'Starts **Redis** on `localhost:6379`. `-d` runs it in the background, `--name` lets you stop it later.', 'bash'],
      ['docker exec -it redis redis-cli ping', 'Runs the built-in command-line client inside the container. A healthy server answers `PONG`.', 'bash'],
      ['mkdir redis-lab\ncd redis-lab\nnpm init -y\nnpm pkg set type=module\nnpm install ioredis', 'Creates a project. `type=module` lets you use `import`. `ioredis` is the Redis client for Node.js.', 'bash'],
      ['docker rm -f redis', 'When you are completely done, this stops and deletes the container.', 'bash'],
    ],
    'PONG\n\nadded 8 packages in 2s',
    ['Forgetting `npm pkg set type=module`: Node says `Cannot use import statement outside a module`.', 'Port 6379 already in use (another Redis): stop it or change the left number: `-p 6380:6379`.', 'Docker not running: start Docker Desktop first.'],
    'check.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();
console.log('Redis:', await redis.ping());
await redis.quit();`,
    'node check.mjs', 'javascript'), 'redis'),

  T('mqtt', L(0, 'Set up an MQTT broker and your project', 'Start an MQTT broker with Docker and connect from Node.js.',
    'MQTT needs a **broker**: the server that receives published messages and forwards them to subscribers. EMQX is a popular free broker and starts with one Docker command. You then install the `mqtt` library (MQTT.js).',
    [
      ['docker run -d --name emqx -p 1883:1883 -p 18083:18083 emqx/emqx', 'Starts the broker. Port `1883` is MQTT; `18083` is a web dashboard at http://localhost:18083 where you can watch clients and topics.', 'bash'],
      ['mkdir mqtt-lab\ncd mqtt-lab\nnpm init -y\nnpm pkg set type=module\nnpm install mqtt', 'Creates a project with the MQTT client library.', 'bash'],
      ['mqtt://broker.hivemq.com', 'No Docker? Use this free public test broker instead (never send secrets to it, and use unique topic names).', 'plaintext'],
      ['docker rm -f emqx', 'Cleans up when you are done.', 'bash'],
    ],
    'emqx\n\nadded 17 packages in 3s',
    ['Using a public broker with generic topics like `test`: other people see (and send) your messages.', 'The dashboard default login is documented by EMQX: change it if the broker is reachable by anyone else.', 'Port 1883 in use: another broker (such as Mosquitto) is running.'],
    'check.mjs',
    `import mqtt from 'mqtt';

const client = await mqtt.connectAsync('mqtt://localhost:1883');
console.log('MQTT: connected');
await client.endAsync();`,
    'node check.mjs', 'javascript'), 'mqtt'),

  T('kafka', L(0, 'Set up Kafka and your project', 'Start a single-node Kafka with Docker and connect from Node.js.',
    'Kafka is a cluster of **brokers**. For learning, one broker is enough: the official Docker image runs Kafka in KRaft mode (no ZooKeeper needed) and listens on `localhost:9092`. You then install `kafkajs`, a pure-JavaScript client.',
    [
      ['docker run -d --name kafka -p 9092:9092 apache/kafka:latest', 'Starts a single-node Kafka. Give it 10 seconds to boot.', 'bash'],
      ['docker exec kafka /opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092', 'Lists topics using Kafka\'s own command-line tool. An empty answer means the broker is up and has no topics yet.', 'bash'],
      ['mkdir kafka-lab\ncd kafka-lab\nnpm init -y\nnpm pkg set type=module\nnpm install kafkajs', 'Creates a project with the Kafka client library.', 'bash'],
      ['docker rm -f kafka', 'Cleans up when you are done.', 'bash'],
    ],
    '(no topics yet)\n\nadded 3 packages in 2s',
    ['Connecting immediately after `docker run`: Kafka needs several seconds to start. Wait and retry.', 'Running your code **inside** another container: `localhost:9092` then points at that container. Use the broker\'s network name and advertised listeners.', 'Port 9092 already in use by another Kafka.'],
    'check.mjs',
    `import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({ clientId: 'check', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const admin = kafka.admin();
await admin.connect();
console.log('Kafka topics:', await admin.listTopics());
await admin.disconnect();`,
    'node check.mjs', 'javascript'), 'kafka'),

  // ------------------------------------------------------------------ 2
  L(2, 'Redis: connect, SET and GET', 'Talk to Redis from Node.js and store a value.',
    'Redis is a giant dictionary that lives in memory: you give it a key and a value, and later you ask for the key back. This is the base for everything else (queues, streams and pub/sub are all built on top of the same connection).',
    [
      ["import Redis from 'ioredis';", 'Loads the `ioredis` library, the most popular Redis client for Node.js.'],
      ['const redis = new Redis();', 'Opens a connection. With no arguments it connects to `localhost:6379`. For another server write `new Redis({ host: "10.0.0.5", port: 6379 })`.'],
      ["await redis.set('greeting', 'hello');", '`SET` stores the text `hello` under the key `greeting`. Every Redis call returns a promise, so we `await` it.'],
      ["const value = await redis.get('greeting');", '`GET` reads the value back. If the key does not exist you get `null`.'],
      ['await redis.quit();', 'Closes the connection politely. Without it the program keeps running because the socket is still open.'],
    ],
    'greeting = hello',
    ['Forgetting `await`: you print `Promise { <pending> }` instead of the value.', 'Not closing the connection: the script never exits.', 'Values are always strings: `set("n", 5)` stores `"5"` and `get` returns `"5"`.'],
    '02-set-get.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();

await redis.set('greeting', 'hello');
const value = await redis.get('greeting');
console.log('greeting =', value);

await redis.quit();`,
    'node 02-set-get.mjs'),

  // ------------------------------------------------------------------ 3
  L(3, 'Redis: expiry (TTL) and counters', 'Make keys disappear on their own and count things atomically.',
    'A key can have a time to live (TTL): when it runs out Redis deletes the key for you. That is perfect for sessions and caches. `INCR` adds 1 in a single step that no other client can interrupt, so it is safe for counters even with thousands of users.',
    [
      ["await redis.set('session:42', 'abc', 'EX', 3);", '`EX 3` means "expire in 3 seconds". The key is created and the timer starts in one command.'],
      ["console.log('ttl:', await redis.ttl('session:42'));", '`TTL` tells you the seconds left. `-1` means no expiry, `-2` means the key does not exist.'],
      ["await redis.incr('views');\nawait redis.incr('views');\nawait redis.incr('views');", '`INCR` creates the key at 0 if needed and adds 1. Three calls give 3, even if other programs are incrementing at the same time.'],
      ['await new Promise((r) => setTimeout(r, 4000));', 'Waits 4 seconds so the session can expire.'],
      ["console.log('session after 4s:', await redis.get('session:42'));", 'The key is gone, so `GET` returns `null`.'],
    ],
    'ttl: 3\nviews = 3\nsession after 4s: null',
    ['Doing `get`, adding 1 in JavaScript, then `set`: two clients can overwrite each other. Always use `INCR`.', 'Calling `SET` again on a key removes its old TTL unless you pass `EX` again (or `KEEPTTL`).'],
    '03-ttl-incr.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await redis.set('session:42', 'abc', 'EX', 3);
console.log('ttl:', await redis.ttl('session:42'));

await redis.del('views');
await redis.incr('views');
await redis.incr('views');
await redis.incr('views');
console.log('views =', await redis.get('views'));

await sleep(4000);
console.log('session after 4s:', await redis.get('session:42'));

await redis.quit();`,
    'node 03-ttl-incr.mjs'),

  // ------------------------------------------------------------------ 4
  L(4, 'Redis Pub/Sub: publish a message', 'Send a message to a channel and see that nobody has to be listening.',
    'In Pub/Sub the publisher sends a message to a named channel and Redis hands it to everyone who is subscribed right now. If nobody is subscribed the message is simply thrown away. `PUBLISH` tells you how many subscribers received it, so you can see this for yourself.',
    [
      ["const pub = new Redis();", 'A normal connection is fine for publishing.'],
      ["const receivers = await pub.publish('news', 'hello');", '`PUBLISH channel message` returns the **number of subscribers** that got the message.'],
      ["console.log('Delivered to', receivers, 'subscriber(s)');", 'With no subscriber running it prints 0: the message is gone. Redis Pub/Sub does not store anything.'],
    ],
    'Delivered to 0 subscriber(s)',
    ['Expecting Redis to keep the message for later. It does not; use Streams (lesson 9) when messages must not be lost.', 'Sending non-string data: objects must be turned into text first with `JSON.stringify`.'],
    '04-publish.mjs',
    `import Redis from 'ioredis';

const pub = new Redis();

const receivers = await pub.publish('news', JSON.stringify({ id: 1, text: 'hello' }));
console.log('Delivered to', receivers, 'subscriber(s)');

await pub.quit();`,
    'node 04-publish.mjs'),

  // ------------------------------------------------------------------ 5
  L(5, 'Redis Pub/Sub: subscribe', 'Listen to a channel in one terminal and publish from another.',
    'A connection that is subscribed can only listen: it is not allowed to run normal commands like GET or SET. So real programs use **two connections**, one for subscribing and one for everything else.',
    [
      ["const sub = new Redis();", 'This connection will become a "subscriber" and can do nothing else.'],
      ["await sub.subscribe('news');", 'Starts listening to the channel `news`. It returns how many channels this connection now listens to.'],
      ["sub.on('message', (channel, message) => {\n  console.log('[' + channel + ']', message);\n});", 'Redis **pushes** messages to you. This function runs every time one arrives, with the channel name and the text.'],
      ['(leave the program running)', 'Do not call `quit()`. The script stays alive and keeps listening. Open a second terminal and run lesson 4 (`node 04-publish.mjs`).'],
    ],
    'Subscribed. Waiting for messages (Ctrl+C to stop)…\n[news] {"id":1,"text":"hello"}',
    ['Using the subscriber connection for `GET`/`SET`: Redis replies `Connection in subscriber mode, only subscribe commands are allowed`.', 'Starting the publisher **before** the subscriber: the message is lost (lesson 4).'],
    '05-subscribe.mjs',
    `import Redis from 'ioredis';

const sub = new Redis();

await sub.subscribe('news');
sub.on('message', (channel, message) => {
  console.log('[' + channel + ']', message);
});

console.log('Subscribed. Waiting for messages (Ctrl+C to stop)…');`,
    'node 05-subscribe.mjs     # then, in another terminal: node 04-publish.mjs'),

  // ------------------------------------------------------------------ 6
  L(6, 'Redis Pub/Sub: pattern subscriptions', 'Subscribe to many channels at once with a pattern.',
    '`PSUBSCRIBE` takes a pattern with `*`. One subscription then covers every channel whose name matches, like `news.sports` and `news.tech`. This is handy for naming channels by area.',
    [
      ["await sub.psubscribe('news.*');", 'Listen to every channel that starts with `news.`'],
      ["sub.on('pmessage', (pattern, channel, message) => { … });", 'Pattern subscriptions use a different event, `pmessage`, and give you three values: the pattern, the real channel and the message.'],
      ["await pub.publish('news.sports', 'goal!');\nawait pub.publish('news.tech', 'new phone');\nawait pub.publish('weather.rain', 'wet');", 'Three messages: the first two match the pattern, the third does not.'],
    ],
    '[news.*] news.sports → goal!\n[news.*] news.tech → new phone',
    ['Using `on("message")` for pattern subscriptions: nothing arrives, you need `pmessage`.', '`*` matches any characters including dots, so `news.*` also matches `news.sports.football`.'],
    '06-pattern.mjs',
    `import Redis from 'ioredis';

const sub = new Redis();
const pub = new Redis();

await sub.psubscribe('news.*');
sub.on('pmessage', (pattern, channel, message) => {
  console.log('[' + pattern + ']', channel, '→', message);
});

await pub.publish('news.sports', 'goal!');
await pub.publish('news.tech', 'new phone');
await pub.publish('weather.rain', 'wet');       // does not match

setTimeout(() => { sub.quit(); pub.quit(); }, 500);`,
    'node 06-pattern.mjs'),

  // ------------------------------------------------------------------ 7
  L(7, 'Redis list: a simple job queue', 'Producers push jobs, a worker takes them one at a time.',
    'A Redis **list** works as a queue. The producer adds jobs on the left with `LPUSH`; the worker takes from the right with `BRPOP`. The `B` means **blocking**: if the list is empty the worker waits instead of spinning in a loop. Each job is given to exactly one worker.',
    [
      ["await redis.del('jobs');\nfor (const n of [1, 2, 3]) await redis.lpush('jobs', 'job-' + n);", 'Starts from an empty list and adds three jobs. `LPUSH` adds at the **left** end.'],
      ["const res = await redis.brpop('jobs', 2);", '`BRPOP` removes and returns the item at the **right** end (the oldest one, so the queue is first-in, first-out). `2` means "wait up to 2 seconds".'],
      ['if (!res) break;', 'After the timeout with nothing to do, `res` is `null`, so we stop the loop.'],
      ["const [, job] = res;", 'The result is an array `[listName, value]`. We only want the value.'],
    ],
    'processing job-1\nprocessing job-2\nprocessing job-3\nqueue is empty, bye',
    ['Using `LPUSH` with `LPOP`: that makes a **stack** (last in, first out), not a queue.', 'If the worker crashes right after `BRPOP` the job is **lost**. The next lesson fixes that.'],
    '07-list-queue.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();

await redis.del('jobs');
for (const n of [1, 2, 3]) await redis.lpush('jobs', 'job-' + n);

for (;;) {
  const res = await redis.brpop('jobs', 2);
  if (!res) break;
  const [, job] = res;
  console.log('processing', job);
}
console.log('queue is empty, bye');

await redis.quit();`,
    'node 07-list-queue.mjs'),

  // ------------------------------------------------------------------ 8
  L(8, 'Redis list: a reliable queue', 'Do not lose a job when the worker crashes.',
    'With `BRPOP` the job leaves Redis the moment the worker takes it, so a crash loses it. The safe version uses `BLMOVE`: it moves the job from `jobs` to a second list `jobs:processing` in one atomic step. The job stays safe there until the worker finishes and removes it. After a crash you can see what was left behind and put it back.',
    [
      ["const job = await redis.blmove('jobs', 'jobs:processing', 'RIGHT', 'LEFT', 1);", 'Takes a job from the right of `jobs` and puts it on the left of `jobs:processing` **atomically**. Now the job exists in exactly one place at all times.'],
      ['await doWork(job);', 'Your real work goes here. If the process dies in this line, the job is still in `jobs:processing`.'],
      ["await redis.lrem('jobs:processing', 1, job);", 'Only after success remove the job from the processing list. `1` means "remove one match".'],
      ["while (await redis.lmove('jobs:processing', 'jobs', 'RIGHT', 'LEFT')) {}", 'The recovery step: move everything stuck in processing back to the main queue. Real systems do this for jobs that have been stuck longer than a timeout.'],
    ],
    '$ node 08-reliable-queue.mjs\nprocessing job-1\n💥 crash while processing job-2\n\n$ node 08-reliable-queue.mjs --recover\nre-queued 1 stuck job(s)\nprocessing job-2\nprocessing job-3',
    ['Removing the job from `processing` **before** the work finishes: you have rebuilt the unsafe queue.', 'Two workers re-queuing at the same time can duplicate a job, so jobs must be idempotent (safe to run twice).', 'For production use BullMQ, which handles retries, delays and stalled jobs for you.'],
    '08-reliable-queue.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();
const recover = process.argv.includes('--recover');

if (recover) {
  let n = 0;
  while (await redis.lmove('jobs:processing', 'jobs', 'RIGHT', 'LEFT')) n++;
  console.log('re-queued', n, 'stuck job(s)');
} else {
  await redis.del('jobs', 'jobs:processing');
  for (const n of [1, 2, 3]) await redis.lpush('jobs', 'job-' + n);
}

for (;;) {
  const job = await redis.blmove('jobs', 'jobs:processing', 'RIGHT', 'LEFT', 1);
  if (!job) break;
  console.log('processing', job);
  if (job === 'job-2' && !recover) {
    console.log('💥 crash while processing', job);
    process.exit(1);                       // job-2 stays in jobs:processing
  }
  await redis.lrem('jobs:processing', 1, job);
}

await redis.quit();`,
    'node 08-reliable-queue.mjs\nnode 08-reliable-queue.mjs --recover'),

  // ------------------------------------------------------------------ 9
  L(9, 'Redis Streams: XADD and XRANGE', 'Append events to a log that Redis keeps.',
    'A **stream** is a log: events are added at the end, each gets a unique id (time and sequence), and they are **kept** so you can read them later, even many times. This is the big difference from Pub/Sub. Think of it as a very small Kafka inside Redis.',
    [
      ["await redis.del('orders');", 'Start with an empty stream.'],
      ["const id = await redis.xadd('orders', '*', 'userId', '7', 'total', '59');", '`XADD stream id field value …` appends an entry. The `*` asks Redis to create the id for us. The fields are name/value pairs. It returns the new id.'],
      ["const entries = await redis.xrange('orders', '-', '+');", '`XRANGE` reads entries between two ids. `-` is the smallest possible id and `+` the biggest, so this reads **everything**.'],
      ['const obj = Object.fromEntries(chunk(fields, 2));', 'Redis returns the fields as a flat array `["userId","7","total","59"]`. We turn it into a normal object with a tiny helper.'],
    ],
    'added 1700000000000-0\nadded 1700000000001-0\nadded 1700000000002-0\n1700000000000-0 { userId: \'1\', total: \'10\' }\n1700000000001-0 { userId: \'2\', total: \'20\' }\n1700000000002-0 { userId: \'3\', total: \'30\' }',
    ['Using Streams without a size limit: the stream grows forever. Add `MAXLEN` to `XADD` or run `XTRIM`.', 'Ids look like timestamps but are not for display; use your own timestamp field for that.'],
    '09-streams.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();
await redis.del('orders');

for (const n of [1, 2, 3]) {
  const id = await redis.xadd('orders', '*', 'userId', String(n), 'total', String(n * 10));
  console.log('added', id);
}

const toObject = (flat) => Object.fromEntries(flat.reduce((acc, v, i) => (i % 2 ? acc : [...acc, [v, flat[i + 1]]]), []));

const entries = await redis.xrange('orders', '-', '+');
for (const [id, fields] of entries) console.log(id, toObject(fields));

await redis.quit();`,
    'node 09-streams.mjs'),

  // ------------------------------------------------------------------ 10
  L(10, 'Redis Streams: consumer groups', 'Share the work between several workers and acknowledge each message.',
    'A **consumer group** lets many workers read the same stream **without getting the same message**: Redis gives each new entry to one worker of the group. After finishing, the worker sends `XACK`. Until then Redis remembers that the message is "pending", so nothing is silently lost.',
    [
      ["await redis.xgroup('CREATE', 'orders', 'billing', '0', 'MKSTREAM').catch(() => {});", 'Creates the group `billing`. `0` means "start from the first message" (use `$` for only new ones). `MKSTREAM` creates the stream if needed. If the group already exists Redis raises an error, which we ignore.'],
      ["const res = await redis.xreadgroup('GROUP', 'billing', name, 'COUNT', 2, 'BLOCK', 1000, 'STREAMS', 'orders', '>');", 'Reads up to 2 new messages for this worker (`name`). `>` means "messages never delivered to anyone in this group". `BLOCK 1000` waits up to 1 s.'],
      ['if (!res) break;', 'No new messages within the time: we are done.'],
      ["await redis.xack('orders', 'billing', id);", 'Tells Redis the message was handled. Only now is it removed from the pending list.'],
    ],
    '$ node 10-group.mjs worker-1      (in terminal 1)\nworker-1 got 1700000000000-0 userId=1\nworker-1 got 1700000000002-0 userId=3\n\n$ node 10-group.mjs worker-2      (in terminal 2)\nworker-2 got 1700000000001-0 userId=2',
    ['Calling `XACK` **before** the work is done: a crash then loses the message.', 'Giving two workers the same name: Redis treats them as one consumer.', 'Using `0` instead of `>` in `XREADGROUP`: you re-read your own pending messages, not new ones (this is how you retry).'],
    '10-group.mjs',
    `import Redis from 'ioredis';

const name = process.argv[2] ?? 'worker-1';
const redis = new Redis();

await redis.xgroup('CREATE', 'orders', 'billing', '0', 'MKSTREAM').catch(() => {});

for (;;) {
  const res = await redis.xreadgroup('GROUP', 'billing', name, 'COUNT', 2, 'BLOCK', 1000, 'STREAMS', 'orders', '>');
  if (!res) break;
  for (const [, entries] of res) {
    for (const [id, fields] of entries) {
      console.log(name, 'got', id, fields[0] + '=' + fields[1]);
      await redis.xack('orders', 'billing', id);      // ack AFTER the work
    }
  }
}
await redis.quit();`,
    'node 09-streams.mjs\nnode 10-group.mjs worker-1'),

  // ------------------------------------------------------------------ 11
  L(11, 'Redis Streams: recover a crashed worker', 'Find messages nobody acknowledged and give them to another worker.',
    'If a worker reads a message and then dies, Redis keeps it in the **pending entries list**. `XPENDING` shows what is stuck and `XAUTOCLAIM` lets a healthy worker take over messages that have been idle for too long. This is what makes Streams **at-least-once**.',
    [
      ["await redis.xreadgroup('GROUP', 'billing', 'worker-1', 'COUNT', 1, 'STREAMS', 'orders', '>');", 'worker-1 reads one message and then "crashes" (we simply never acknowledge it).'],
      ["const [count] = await redis.xpending('orders', 'billing');", '`XPENDING` returns a summary: how many messages are delivered but not acknowledged.'],
      ["const [, claimed] = await redis.xautoclaim('orders', 'billing', 'worker-2', 0, '0');", 'worker-2 claims pending messages that have been idle at least `0` ms, starting from id `0`. In production use a real timeout such as `60000` ms.'],
      ["await redis.xack('orders', 'billing', id);", 'worker-2 handles the message and acknowledges it. Now the pending list is empty again.'],
    ],
    'pending after crash: 1\nworker-2 claimed 1700000000000-0 userId=1\npending after recovery: 0',
    ['Setting the idle timeout too low: a slow but healthy worker has its message stolen, so the message is processed twice. Make the handler idempotent.', 'Never checking `XPENDING`: failed messages sit there silently forever. Monitor it.'],
    '11-recover.mjs',
    `import Redis from 'ioredis';

const redis = new Redis();
await redis.del('orders');
await redis.xadd('orders', '*', 'userId', '1', 'total', '10');
await redis.xgroup('CREATE', 'orders', 'billing', '0');

// worker-1 reads the message and "crashes" without acking it
await redis.xreadgroup('GROUP', 'billing', 'worker-1', 'COUNT', 1, 'STREAMS', 'orders', '>');
const [count] = await redis.xpending('orders', 'billing');
console.log('pending after crash:', count);

// worker-2 takes over
const [, claimed] = await redis.xautoclaim('orders', 'billing', 'worker-2', 0, '0');
for (const [id, fields] of claimed) {
  console.log('worker-2 claimed', id, fields[0] + '=' + fields[1]);
  await redis.xack('orders', 'billing', id);
}
const [after] = await redis.xpending('orders', 'billing');
console.log('pending after recovery:', after);

await redis.quit();`,
    'node 11-recover.mjs'),

  // ------------------------------------------------------------------ 12
  L(12, 'MQTT: connect and publish', 'Connect to an MQTT broker and publish a message to a topic.',
    'MQTT clients never talk to each other. They connect to a **broker** and **publish** messages to **topics** (like `lab/hello`). The broker forwards each message to everyone subscribed to that topic. Messages are tiny and the connection stays open, which is why MQTT is used for sensors and phones.',
    [
      ["import mqtt from 'mqtt';", 'The `mqtt` package (MQTT.js) is the standard MQTT client for Node.js and browsers.'],
      ["const client = await mqtt.connectAsync('mqtt://localhost:1883');", 'Connects to the broker and waits until the connection is ready. `mqtt://` is plain MQTT; use `mqtts://` for TLS and `ws://` for WebSockets.'],
      ["await client.publishAsync('lab/hello', 'Hello MQTT');", 'Publishes the text to the topic `lab/hello`. With no options this is **QoS 0**: fire and forget.'],
      ['await client.endAsync();', 'Disconnects cleanly.'],
    ],
    'Published to lab/hello',
    ['Nobody is subscribed yet, so this message is dropped by the broker (that is normal for MQTT).', 'Publishing numbers or objects: the payload must be a string or Buffer, so use `JSON.stringify` for objects.', 'Forgetting `endAsync()`: the script keeps the connection open and never exits.'],
    '12-publish.mjs',
    `import mqtt from 'mqtt';

const client = await mqtt.connectAsync('mqtt://localhost:1883');

await client.publishAsync('lab/hello', 'Hello MQTT');
console.log('Published to lab/hello');

await client.endAsync();`,
    'node 12-publish.mjs'),

  // ------------------------------------------------------------------ 13
  L(13, 'MQTT: subscribe and receive', 'Listen to a topic and print every message.',
    'A subscriber tells the broker which topics it wants. From then on the broker **pushes** every matching message to it. The handler gets the topic and the payload (a `Buffer`, so call `toString()` to read the text).',
    [
      ["const client = await mqtt.connectAsync('mqtt://localhost:1883');", 'Same connection as before.'],
      ["client.on('message', (topic, payload) => {\n  console.log(topic, '→', payload.toString());\n});", 'Registers the handler **before** subscribing so no early message is missed.'],
      ["await client.subscribeAsync('lab/hello');", 'Asks the broker for messages on `lab/hello`.'],
      ['(do not end the client)', 'The program keeps running and waits. In a second terminal run lesson 12.'],
    ],
    'Subscribed to lab/hello\nlab/hello → Hello MQTT',
    ['Forgetting `payload.toString()`: you print `<Buffer 48 65 …>`.', 'Starting the publisher first: the broker does not keep the message for you (unless it is **retained**, lesson 16).'],
    '13-subscribe.mjs',
    `import mqtt from 'mqtt';

const client = await mqtt.connectAsync('mqtt://localhost:1883');

client.on('message', (topic, payload) => {
  console.log(topic, '→', payload.toString());
});

await client.subscribeAsync('lab/hello');
console.log('Subscribed to lab/hello');`,
    'node 13-subscribe.mjs      # then, in another terminal: node 12-publish.mjs'),

  // ------------------------------------------------------------------ 14
  L(14, 'MQTT: topics and wildcards', 'Subscribe to many topics at once with + and #.',
    'A topic is a path like `home/kitchen/temperature`. A subscription can use `+` to match **exactly one level** and `#` to match **everything below** (only at the end). This lets one subscriber collect data from thousands of devices.',
    [
      ["await sub.subscribeAsync('home/+/temperature');", '`+` replaces one level. This matches `home/kitchen/temperature` and `home/bedroom/temperature`, but not `home/kitchen/lights/temperature`.'],
      ["await sub.subscribeAsync('home/kitchen/#');", '`#` matches the rest. This matches everything under `home/kitchen`, at any depth.'],
      ["const topics = ['home/kitchen/temperature', 'home/bedroom/temperature', 'home/kitchen/lights/main', 'office/temperature'];", 'Four topics that we will publish to.'],
      ["sub.on('message', (topic, payload, packet) => …)", 'A message that matches **both** filters can arrive once per matching subscription depending on the broker, so we print the topic to see what happened.'],
    ],
    'home/kitchen/temperature → 21\nhome/bedroom/temperature → 19\nhome/kitchen/lights/main → on\n(office/temperature was not received)',
    ['Writing `home/#/temperature`: `#` must be the **last** level.', 'Publishing to a wildcard topic: you can only publish to real topics, never to `+` or `#`.', 'Starting a topic with `/` (like `/home`): that creates an extra empty first level and surprises you.'],
    '14-wildcards.mjs',
    `import mqtt from 'mqtt';

const sub = await mqtt.connectAsync('mqtt://localhost:1883');
const pub = await mqtt.connectAsync('mqtt://localhost:1883');

sub.on('message', (topic, payload) => console.log(topic, '→', payload.toString()));
await sub.subscribeAsync('home/+/temperature');
await sub.subscribeAsync('home/kitchen/#');

const messages = [
  ['home/kitchen/temperature', '21'],
  ['home/bedroom/temperature', '19'],
  ['home/kitchen/lights/main', 'on'],
  ['office/temperature', '23'],          // matches neither filter
];
for (const [topic, value] of messages) await pub.publishAsync(topic, value);

setTimeout(async () => { await sub.endAsync(); await pub.endAsync(); }, 500);`,
    'node 14-wildcards.mjs'),

  // ------------------------------------------------------------------ 15
  L(15, 'MQTT: QoS levels', 'Choose how hard MQTT tries to deliver a message.',
    'QoS (Quality of Service) is chosen for each publish and each subscription. **0** = at most once (no ack), **1** = at least once (ack, may duplicate), **2** = exactly once (4-packet handshake). The message is delivered at the **lower** of the publisher\'s QoS and the subscription\'s QoS.',
    [
      ["await sub.subscribeAsync('lab/qos', { qos: 1 });", 'This subscriber asks for QoS 1 at most.'],
      ["await pub.publishAsync('lab/qos', 'zero', { qos: 0 });", 'Published with QoS 0.'],
      ["await pub.publishAsync('lab/qos', 'two', { qos: 2 });", 'Published with QoS 2, but the subscriber only asked for 1, so it arrives as QoS 1.'],
      ["sub.on('message', (topic, payload, packet) => console.log(payload.toString(), 'qos', packet.qos));", 'The third argument is the raw MQTT packet; `packet.qos` is the QoS actually used for this delivery.'],
    ],
    'zero qos 0\none qos 1\ntwo qos 1       ← published with 2, delivered at the lower level',
    ['Using QoS 2 everywhere: it needs 4 packets per message and is much slower. Use 1 for most things and 0 for frequent sensor readings.', 'Assuming QoS 1 means no duplicates: a lost ack makes the sender resend, so your handler must be safe to run twice.'],
    '15-qos.mjs',
    `import mqtt from 'mqtt';

const sub = await mqtt.connectAsync('mqtt://localhost:1883');
const pub = await mqtt.connectAsync('mqtt://localhost:1883');

sub.on('message', (topic, payload, packet) => {
  console.log(payload.toString(), 'qos', packet.qos);
});
await sub.subscribeAsync('lab/qos', { qos: 1 });

await pub.publishAsync('lab/qos', 'zero', { qos: 0 });
await pub.publishAsync('lab/qos', 'one', { qos: 1 });
await pub.publishAsync('lab/qos', 'two', { qos: 2 });

setTimeout(async () => { await sub.endAsync(); await pub.endAsync(); }, 500);`,
    'node 15-qos.mjs'),

  // ------------------------------------------------------------------ 16
  L(16, 'MQTT: retained messages', 'Let new subscribers see the last value immediately.',
    'Normally a subscriber only gets messages sent **after** it subscribes. If you publish with `retain: true`, the broker **remembers the last message** of that topic and hands it to every new subscriber at once. It is perfect for "current state": a device\'s status, the last temperature, a switch position.',
    [
      ["await pub.publishAsync('lab/status', 'online', { retain: true, qos: 1 });", 'Publishes and asks the broker to keep it. Nobody is listening yet.'],
      ['(wait a moment, then connect a brand new client)', 'This client did not exist when the message was sent.'],
      ["await late.subscribeAsync('lab/status');", 'As soon as it subscribes the broker delivers the retained message.'],
      ["packet.retain", 'In the handler, `packet.retain` is `true` for a message that came from the broker\'s memory instead of a live publish.'],
      ["await pub.publishAsync('lab/status', '', { retain: true });", 'To **delete** a retained message, publish an empty payload with `retain: true`.'],
    ],
    'lab/status → online   (retained: true)',
    ['Retaining every message of a busy topic: only the last one is kept, so it is only useful for state, not for history.', 'Forgetting to clear a retained message: new subscribers keep receiving the old state forever.'],
    '16-retained.mjs',
    `import mqtt from 'mqtt';

const pub = await mqtt.connectAsync('mqtt://localhost:1883');
await pub.publishAsync('lab/status', 'online', { retain: true, qos: 1 });
console.log('published retained message');

// a brand new client that arrives later
const late = await mqtt.connectAsync('mqtt://localhost:1883');
late.on('message', (topic, payload, packet) => {
  console.log(topic, '→', payload.toString(), '(retained:', packet.retain + ')');
});
await late.subscribeAsync('lab/status');

setTimeout(async () => {
  await pub.publishAsync('lab/status', '', { retain: true });   // clear it
  await pub.endAsync();
  await late.endAsync();
}, 800);`,
    'node 16-retained.mjs'),

  // ------------------------------------------------------------------ 17
  L(17, 'MQTT: Last Will and presence', 'Let the broker announce that a device died.',
    'A client can give the broker a **will**: a message to publish **if the client disappears without saying goodbye** (crash, battery, network loss). Together with a retained `online` message this gives you reliable presence: everyone can see whether a device is up. A clean `end()` does **not** trigger the will.',
    [
      ["const device = await mqtt.connectAsync(url, { clientId: 'device-1', keepalive: 2, will: { topic: 'lab/presence/device-1', payload: 'offline', qos: 1, retain: true } });", 'Connects with a will. `keepalive: 2` means the client must talk to the broker at least every 2 seconds, so the broker notices death quickly (the default is 60).'],
      ["await device.publishAsync('lab/presence/device-1', 'online', { qos: 1, retain: true });", 'Right after connecting, announce `online` (retained).'],
      ["device.stream.destroy();", 'Simulates a crash by cutting the network socket **without** sending DISCONNECT.'],
      ["watcher.on('message', …)", 'After about 1.5 × the keep-alive time, the broker publishes the will, and the watcher prints `offline`.'],
    ],
    'lab/presence/device-1 → online\n… (about 3 seconds later) …\nlab/presence/device-1 → offline',
    ['Calling `device.end()` and expecting `offline`: a graceful disconnect does not send the will. Publish `offline` yourself in that case.', 'A huge keep-alive: the broker waits that long before declaring the client dead.'],
    '17-last-will.mjs',
    `import mqtt from 'mqtt';

const url = 'mqtt://localhost:1883';

const watcher = await mqtt.connectAsync(url);
watcher.on('message', (topic, payload) => console.log(topic, '→', payload.toString()));
await watcher.subscribeAsync('lab/presence/#');

const device = await mqtt.connectAsync(url, {
  clientId: 'device-1',
  keepalive: 2,
  will: { topic: 'lab/presence/device-1', payload: 'offline', qos: 1, retain: true },
});
await device.publishAsync('lab/presence/device-1', 'online', { qos: 1, retain: true });

setTimeout(() => {
  console.log('(device crashes now)');
  device.stream.destroy();                // no DISCONNECT is sent
}, 1000);

setTimeout(async () => { await watcher.endAsync(); }, 7000);`,
    'node 17-last-will.mjs'),

  // ------------------------------------------------------------------ 18
  L(18, 'MQTT: persistent sessions', 'Receive messages that were sent while you were offline.',
    'With a fixed `clientId` and `clean: false` the broker keeps your **session**: your subscriptions and any QoS 1 or 2 messages that arrive while you are disconnected. When you reconnect with the same client id they are delivered. Phones and devices with weak networks rely on this.',
    [
      ["const a = await mqtt.connectAsync(url, { clientId: 'durable-1', clean: false });\nawait a.subscribeAsync('lab/jobs', { qos: 1 });\nawait a.endAsync();", 'Connects, subscribes with QoS 1 and goes offline. Because `clean: false`, the broker remembers the subscription.'],
      ["for (const n of [1, 2, 3]) await pub.publishAsync('lab/jobs', 'job ' + n, { qos: 1 });", 'While `durable-1` is offline, three messages are published. The broker queues them for that session.'],
      ["const b = await mqtt.connectAsync(url, { clientId: 'durable-1', clean: false });", 'Reconnect with the **same client id** and `clean: false`. You do **not** need to subscribe again.'],
      ["b.on('message', …)", 'All three queued messages arrive immediately.'],
    ],
    'received while away: job 1\nreceived while away: job 2\nreceived while away: job 3',
    ['Using a random client id on each start: the broker thinks it is a new client and has no stored session.', 'QoS 0 messages are **not** queued, only QoS 1 and 2.', 'Two clients with the same client id kick each other off the broker.'],
    '18-persistent-session.mjs',
    `import mqtt from 'mqtt';

const url = 'mqtt://localhost:1883';
const opts = { clientId: 'durable-1', clean: false };

// 1. subscribe, then go offline
const a = await mqtt.connectAsync(url, opts);
await a.subscribeAsync('lab/jobs', { qos: 1 });
await a.endAsync();

// 2. messages arrive while the subscriber is away
const pub = await mqtt.connectAsync(url);
for (const n of [1, 2, 3]) await pub.publishAsync('lab/jobs', 'job ' + n, { qos: 1 });
await pub.endAsync();

// 3. come back with the same client id: no new subscribe needed
const b = await mqtt.connectAsync(url, opts);
b.on('message', (topic, payload) => console.log('received while away:', payload.toString()));

setTimeout(() => b.endAsync(), 1000);`,
    'node 18-persistent-session.mjs'),

  // ------------------------------------------------------------------ 19
  L(19, 'Kafka: create a topic', 'Connect with the admin client and create a topic with 3 partitions.',
    'In Kafka a **topic** is split into **partitions**, and each partition is its own ordered log. Choosing the number of partitions decides how many consumers can read in parallel. We create the topic ourselves so we control that number.',
    [
      ["import { Kafka, logLevel } from 'kafkajs';", '`kafkajs` is a pure JavaScript Kafka client.'],
      ["const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });", 'Describes how to reach the cluster. `brokers` is a list: give a few so the client can still connect if one is down. `logLevel.ERROR` hides noisy logs.'],
      ['const admin = kafka.admin();\nawait admin.connect();', 'The **admin** client manages topics. It is separate from producers and consumers.'],
      ["await admin.createTopics({ topics: [{ topic: 'orders', numPartitions: 3, replicationFactor: 1 }] });", 'Creates `orders` with 3 partitions. `replicationFactor: 1` is fine on one broker; production uses 3.'],
      ["const meta = await admin.fetchTopicMetadata({ topics: ['orders'] });", 'Asks Kafka to describe the topic so we can see the partitions.'],
    ],
    'topic created: true\norders has 3 partitions: [0, 1, 2]',
    ['`replicationFactor` bigger than the number of brokers: Kafka refuses with `Replication factor … larger than available brokers`.', 'Creating the topic twice: `createTopics` returns `false` the second time (it already exists), which is fine.', 'Trying to **reduce** partitions later: not possible. You can only add them, and adding changes where keys land.'],
    '19-create-topic.mjs',
    `import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const admin = kafka.admin();
await admin.connect();

const created = await admin.createTopics({
  topics: [{ topic: 'orders', numPartitions: 3, replicationFactor: 1 }],
});
console.log('topic created:', created);

const meta = await admin.fetchTopicMetadata({ topics: ['orders'] });
const partitions = meta.topics[0].partitions.map((p) => p.partitionId);
console.log('orders has', partitions.length, 'partitions:', partitions);

await admin.disconnect();`,
    'node 19-create-topic.mjs'),

  // ------------------------------------------------------------------ 20
  L(20, 'Kafka: produce a message', 'Send your first event and see which partition and offset it got.',
    'A **producer** appends messages to a topic. Kafka answers with the **partition** the message went to and its **offset** (its position number in that partition). The offset is how Kafka remembers where everything is.',
    [
      ["const producer = kafka.producer();\nawait producer.connect();", 'Creates and connects a producer.'],
      ["await producer.send({ topic: 'orders', messages: [{ key: 'user-1', value: JSON.stringify({ orderId: 1, total: 59 }) }] });", 'Sends one message. The **key** decides the partition (same key → same partition). The **value** must be a string or Buffer, so we stringify the object.'],
      ['const [meta] = result;', '`send` returns an array with one entry per partition that received messages.'],
      ["console.log('partition', meta.partition, 'offset', meta.baseOffset);", 'Prints where the message was stored.'],
      ['await producer.disconnect();', 'Flushes anything still buffered and closes the connection.'],
    ],
    'sent to partition 2 at offset 0',
    ['Sending an object as `value`: kafkajs throws. Use `JSON.stringify`.', 'Not awaiting `send`: the process may exit before the message leaves.', 'The partition number can differ on your machine: it comes from a hash of the key, not from this page.'],
    '20-produce.mjs',
    `import { Kafka, logLevel, Partitioners } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
await producer.connect();

const result = await producer.send({
  topic: 'orders',
  messages: [{ key: 'user-1', value: JSON.stringify({ orderId: 1, total: 59 }) }],
});
const [meta] = result;
console.log('sent to partition', meta.partition, 'at offset', meta.baseOffset);

await producer.disconnect();`,
    'node 20-produce.mjs'),

  // ------------------------------------------------------------------ 21
  L(21, 'Kafka: consume messages', 'Read events from the topic with a consumer.',
    'A **consumer** reads messages and remembers how far it got (its **offset**) under a **group id**. With `fromBeginning: true` a brand new group starts at the very first message, which shows the biggest difference from Redis Pub/Sub: **Kafka keeps the data**, so you can read old messages.',
    [
      ["const consumer = kafka.consumer({ groupId: 'lab-1' });\nawait consumer.connect();", 'Creates a consumer in the group `lab-1`. The group id is how Kafka tracks your progress.'],
      ["await consumer.subscribe({ topic: 'orders', fromBeginning: true });", 'Subscribes to the topic. `fromBeginning` only matters the first time the group runs; afterwards it continues from its saved offset.'],
      ['await consumer.run({ eachMessage: async ({ topic, partition, message }) => { … } });', 'Starts the loop. Your function runs once for every message, in order within each partition.'],
      ["message.value.toString()", '`message.value` is a Buffer. `message.key` is too (it can be `null`). `message.offset` is a string.'],
    ],
    'partition 2 offset 0 key user-1 value {"orderId":1,"total":59}\npartition 2 offset 1 key user-1 value {"orderId":2,"total":12}',
    ['Forgetting that it runs forever: press Ctrl+C to stop.', 'Changing the `groupId` makes Kafka treat you as a new reader: with `fromBeginning: true` you read everything again.', 'Messages from different partitions can interleave: order is only guaranteed **inside one partition**.'],
    '21-consume.mjs',
    `import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const consumer = kafka.consumer({ groupId: 'lab-1' });

await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: true });

await consumer.run({
  eachMessage: async ({ partition, message }) => {
    console.log(
      'partition', partition,
      'offset', message.offset,
      'key', message.key?.toString(),
      'value', message.value.toString(),
    );
  },
});
console.log('Consuming… (Ctrl+C to stop)');`,
    'node 21-consume.mjs'),

  // ------------------------------------------------------------------ 22
  L(22, 'Kafka: keys and partitions', 'See that the same key always lands in the same partition.',
    'Kafka picks the partition with `hash(key) % number of partitions`. So all messages for `user-1` go to one partition and stay **in order**, while different users spread over the partitions. If you send **no key**, messages are spread out for balance and no order is promised.',
    [
      ["const users = ['user-1', 'user-2', 'user-3', 'user-4'];", 'Four keys, three messages each.'],
      ["const result = await producer.send({ topic: 'orders', messages: [{ key, value }] });", 'We send one message at a time so we can see the partition of each.'],
      ['table[key].push(result[0].partition);', 'Collect the partition number per key.'],
      ["console.log(key, '→ partitions', [...new Set(list)]);", 'If everything works each key shows **exactly one** partition.'],
    ],
    'user-1 → partitions [ 2 ]\nuser-2 → partitions [ 0 ]\nuser-3 → partitions [ 1 ]\nuser-4 → partitions [ 2 ]',
    ['Using a key with very few values (like `"true"`): all messages go to one partition (a **hot partition**) and the others stay empty.', 'Adding partitions later changes the result of `hash(key) % n`, so an existing key may start going to a different partition.', 'Expecting global order: only per-key (per-partition) order exists.'],
    '22-keys.mjs',
    `import { Kafka, logLevel, Partitioners } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
await producer.connect();

const users = ['user-1', 'user-2', 'user-3', 'user-4'];
const table = Object.fromEntries(users.map((u) => [u, []]));

for (let round = 1; round <= 3; round++) {
  for (const key of users) {
    const value = JSON.stringify({ user: key, round });
    const result = await producer.send({ topic: 'orders', messages: [{ key, value }] });
    table[key].push(result[0].partition);
  }
}
for (const [key, list] of Object.entries(table)) console.log(key, '→ partitions', [...new Set(list)]);

await producer.disconnect();`,
    'node 22-keys.mjs'),

  // ------------------------------------------------------------------ 23
  L(23, 'Kafka: consumer groups', 'Run two consumers and watch Kafka split the partitions between them.',
    'All consumers with the **same group id** form a team. Kafka gives each partition to **one** member of the team, so the work is shared. When a member joins or leaves, Kafka **rebalances** and reassigns partitions. A second group with a different id would receive every message again, independently.',
    [
      ["const consumer = kafka.consumer({ groupId: 'team-a' });", 'Both copies of the program use the same group id.'],
      ["consumer.on(consumer.events.GROUP_JOIN, (e) => console.log(name, 'owns', e.payload.memberAssignment));", 'This event fires after every rebalance and tells you which partitions this instance owns.'],
      ['const name = process.argv[2] ?? "consumer";', 'Lets you start the program as `consumer-1` and `consumer-2` to tell the output apart.'],
      ['(start the first, then the second)', 'The first one owns all three partitions. When the second joins, the partitions are shared and the first one is told its new list.'],
    ],
    'consumer-1 owns { orders: [ 0, 1, 2 ] }\n(second consumer starts)\nconsumer-1 owns { orders: [ 0, 1 ] }\nconsumer-2 owns { orders: [ 2 ] }',
    ['Starting more consumers than partitions: the extra ones are **idle** (nothing to read).', 'Forgetting that a rebalance pauses reading for a moment. Keep handlers quick and use static membership in production if rebalances are a problem.', 'Using a different group id for each worker: then every worker gets **every** message (that is pub/sub, not work sharing).'],
    '23-groups.mjs',
    `import { Kafka, logLevel } from 'kafkajs';

const name = process.argv[2] ?? 'consumer';
const kafka = new Kafka({ clientId: name, brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const consumer = kafka.consumer({ groupId: 'team-a' });

consumer.on(consumer.events.GROUP_JOIN, (e) => {
  console.log(name, 'owns', e.payload.memberAssignment);
});

await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ partition, message }) => {
    console.log(name, 'partition', partition, 'offset', message.offset);
  },
});`,
    'node 23-groups.mjs consumer-1      # then, in a second terminal: node 23-groups.mjs consumer-2'),

  // ------------------------------------------------------------------ 24
  L(24, 'Kafka: commit offsets yourself', 'Get at-least-once processing by committing after the work is done.',
    'By default kafkajs commits offsets automatically. That can mark a message as done **before** your code finished it. For safety turn auto-commit off and commit **after** the work succeeds. If the program crashes in between, Kafka re-delivers the message after restart: that is **at-least-once**, so make the handler idempotent.',
    [
      ["await consumer.run({ autoCommit: false, eachMessage: … });", 'Stops automatic commits. We are now in charge.'],
      ['await handle(message);', 'Do the real work first (save to a database, call an API).'],
      ["await consumer.commitOffsets([{ topic, partition, offset: String(Number(message.offset) + 1) }]);", 'Commit the **next** offset to read (current + 1). It means "everything before this is finished".'],
      ['if (seen.has(id)) return;', 'A simple idempotency check: remember processed ids so a re-delivery is ignored. In a real system this is a database table with a unique key.'],
    ],
    'processing offset 5 (order 7)\ncommitted 6\nprocessing offset 6 (order 8)\ncommitted 7\n(restart after a crash: it continues from offset 6, never skips)',
    ['Committing **before** handling: a crash then loses the message (at-most-once).', 'Committing the current offset instead of `offset + 1`: Kafka re-delivers the same message after a restart.', 'Not making the handler idempotent: you will eventually process a message twice.'],
    '24-manual-commit.mjs',
    `import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const consumer = kafka.consumer({ groupId: 'billing' });
const seen = new Set();                         // in real life: a DB table with a unique key

await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: true });

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    const order = JSON.parse(message.value.toString());
    const id = partition + ':' + message.offset;

    if (!seen.has(id)) {
      console.log('processing offset', message.offset, '(order', order.orderId + ')');
      // ... save to a database here ...
      seen.add(id);
    }

    await consumer.commitOffsets([{ topic, partition, offset: String(Number(message.offset) + 1) }]);
    console.log('committed', Number(message.offset) + 1);
  },
});`,
    'node 24-manual-commit.mjs'),

  // ------------------------------------------------------------------ 25
  L(25, 'Kafka: acks and the idempotent producer', 'Make sure a sent message is safely stored, and that retries do not create duplicates.',
    '`acks` says how many brokers must confirm a write: `0` = nobody (fast, can lose), `1` = the leader, `-1` (all) = every in-sync replica (safest). The **idempotent producer** adds a producer id and a sequence number to each message, so if the producer retries after a network error the broker **drops the duplicate**.',
    [
      ["const producer = kafka.producer({ idempotent: true, maxInFlightRequests: 1 });", 'Turns on idempotence. The producer then needs `maxInFlightRequests: 1` and `acks: -1` so ordering and de-duplication hold.'],
      ["await producer.send({ topic: 'orders', acks: -1, messages: […] });", '`acks: -1` waits until **all in-sync replicas** have the message. Combined with `min.insync.replicas=2` on the topic and replication factor 3, you can lose a broker without losing data.'],
      ['const result = await producer.send({ … acks: 0 … });', 'With `acks: 0` the producer does not wait and gets **no metadata back**, so you cannot know if it arrived. Use only for data you can afford to lose.'],
      ['console.log(result);', 'Compare the two outputs.'],
    ],
    'acks=-1 → [ { topicName: \'orders\', partition: 1, baseOffset: \'7\', … } ]\nacks=0  → []            (fire and forget, no confirmation)',
    ['Setting `acks: 1` and thinking it is safe: if the leader dies before followers copy the message, it is lost.', 'Using `idempotent: true` without `acks: -1`: kafkajs rejects it.', 'Idempotence protects against **producer retries** only. It does not make your *consumer* idempotent (lesson 24).'],
    '25-acks.mjs',
    `import { Kafka, logLevel, Partitioners } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 1,
  createPartitioner: Partitioners.DefaultPartitioner,
});
await producer.connect();

const safe = await producer.send({
  topic: 'orders',
  acks: -1,                                   // wait for all in-sync replicas
  messages: [{ key: 'user-9', value: JSON.stringify({ orderId: 99 }) }],
});
console.log('acks=-1 →', safe.map((r) => ({ partition: r.partition, offset: r.baseOffset })));

await producer.disconnect();

// fire-and-forget version (a separate, non-idempotent producer)
const loose = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
await loose.connect();
const result = await loose.send({ topic: 'orders', acks: 0, messages: [{ key: 'user-9', value: '{}' }] });
console.log('acks=0  →', result);
await loose.disconnect();`,
    'node 25-acks.mjs'),

  // ------------------------------------------------------------------ 26
  L(26, 'Kafka: retry and dead-letter topic', 'Do not let one bad message block everything.',
    'Some messages fail again and again (bad data, a bug). If you retry forever the whole partition is stuck behind it. The standard pattern: **retry a few times with a growing delay**, and if it still fails **send the message to a dead-letter topic** (DLQ) with the error, then move on. Later you inspect the DLQ, fix the cause and replay.',
    [
      ["async function withRetry(fn, attempts = 3) { … }", 'A small helper that calls `fn`. On error it waits `200 ms, 400 ms, 800 ms…` (exponential backoff) and tries again, up to `attempts` times.'],
      ['if (order.total < 0) throw new Error("negative total");', 'Our fake business rule: a negative total can never succeed, no matter how often we retry.'],
      ["await producer.send({ topic: 'orders.dlq', messages: [{ key, value, headers: { error: err.message } }] });", 'After the last attempt, publish the original message to `orders.dlq` and put the reason in a **header** so whoever looks later knows why.'],
      ['(then the handler returns normally)', 'Returning without throwing lets kafkajs commit the offset and continue with the next message.'],
    ],
    'order 1 ok\norder 2 failed (attempt 1/3): negative total\norder 2 failed (attempt 2/3): negative total\norder 2 failed (attempt 3/3): negative total\norder 2 → dead-letter topic\norder 3 ok',
    ['Retrying forever: one poison message blocks its partition (and everything after it).', 'Dropping failed messages silently: you lose data and never learn why. Always keep them in a DLQ and alert on its size.', 'Retrying errors that can never succeed (invalid data). Only retry temporary errors like timeouts.'],
    '26-dlq.mjs',
    `import { Kafka, logLevel, Partitioners } from 'kafkajs';

const kafka = new Kafka({ clientId: 'lab', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
const consumer = kafka.consumer({ groupId: 'billing-dlq-demo' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, attempts = 3) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      console.log('failed (attempt ' + i + '/' + attempts + '):', err.message);
      if (i >= attempts) throw err;
      await sleep(200 * 2 ** (i - 1));          // 200 ms, 400 ms, 800 ms …
    }
  }
}

await producer.connect();
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: true });

await consumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value.toString());
    try {
      await withRetry(async () => {
        if (order.total < 0) throw new Error('negative total');
        console.log('order', order.orderId, 'ok');
      });
    } catch (err) {
      await producer.send({
        topic: 'orders.dlq',
        messages: [{ key: message.key, value: message.value, headers: { error: err.message } }],
      });
      console.log('order', order.orderId, '→ dead-letter topic');
    }
  },
});`,
    'node 26-dlq.mjs'),

  // ------------------------------------------------------------------ 27
  L(27, 'Capstone: sensors → MQTT → Kafka', 'Build the IoT pipeline from the design question: devices, an MQTT broker, a bridge, Kafka and a consumer.',
    'Real systems chain these tools. **Devices** talk MQTT (small, works on weak networks). A **bridge** reads MQTT and writes to Kafka, using the device id as the Kafka **key** so each device stays in order. Other services read Kafka at their own pace and can replay it. You will run three small programs: a sensor, the bridge and an averaging consumer.',
    [
      ["await mqtt.subscribeAsync('sensors/+/temperature', { qos: 1 });", 'The bridge listens to **every** device with one wildcard subscription.'],
      ["const deviceId = topic.split('/')[1];", 'The topic is `sensors/<id>/temperature`, so the second part is the device id.'],
      ["await producer.send({ topic: 'telemetry', messages: [{ key: deviceId, value: JSON.stringify({ deviceId, celsius, at: Date.now() }) }] });", 'Forwards the reading to Kafka. `key: deviceId` keeps each device\'s readings in order inside one partition.'],
      ['(sensor.mjs)  setInterval(() => publish("sensors/dev-1/temperature", …), 1000)', 'A fake sensor publishes a random temperature every second (see the sensor program below).'],
      ['(averages.mjs)  consumer.run({ eachMessage: … })', 'A Kafka consumer keeps a running average per device and prints it: this is where real systems would write to a database or raise alerts.'],
    ],
    '$ node 27-bridge.mjs\nbridge ready: MQTT sensors/+/temperature → Kafka telemetry\nforwarded dev-1 21.4°C\nforwarded dev-2 19.8°C\n\n$ node 27-averages.mjs\ndev-1 average 21.4°C (1 readings)\ndev-2 average 19.8°C (1 readings)\ndev-1 average 21.9°C (2 readings)',
    ['Forgetting to create the `telemetry` topic (see the Kafka tutorial): with auto-create off the producer fails.', 'Using no key: readings of one device spread over partitions and arrive out of order.', 'Losing messages on restart: the bridge uses QoS 1 on the MQTT side and acks=-1 on the Kafka side, so the chain is at-least-once. Duplicates are possible, so the consumer should be idempotent.'],
    '27-bridge.mjs',
    `// Run these three programs in three terminals:
//   node 27-bridge.mjs     (this file)
//   node 27-averages.mjs   (a Kafka consumer that averages readings per device)
//   node 27-sensor.mjs     (publishes a random temperature every second)
//
// 27-sensor.mjs:
//   import mqtt from 'mqtt';
//   const c = await mqtt.connectAsync('mqtt://localhost:1883');
//   setInterval(() => c.publish('sensors/dev-1/temperature', String(20 + Math.random() * 3), { qos: 1 }), 1000);

import mqtt from 'mqtt';
import { Kafka, logLevel, Partitioners } from 'kafkajs';

const kafka = new Kafka({ clientId: 'bridge', brokers: ['localhost:9092'], logLevel: logLevel.ERROR });
const admin = kafka.admin();
await admin.connect();
await admin.createTopics({ topics: [{ topic: 'telemetry', numPartitions: 3 }] });
await admin.disconnect();

const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
await producer.connect();

const client = await mqtt.connectAsync('mqtt://localhost:1883', { clientId: 'bridge-1', clean: false });

client.on('message', async (topic, payload) => {
  const deviceId = topic.split('/')[1];
  const celsius = Number(payload.toString());
  await producer.send({
    topic: 'telemetry',
    acks: -1,
    messages: [{ key: deviceId, value: JSON.stringify({ deviceId, celsius, at: Date.now() }) }],
  });
  console.log('forwarded', deviceId, celsius.toFixed(1) + '°C');
});

await client.subscribeAsync('sensors/+/temperature', { qos: 1 });
console.log('bridge ready: MQTT sensors/+/temperature → Kafka telemetry');`,
    'node 27-bridge.mjs'),
];

// assign topics by original number (the setup lessons already have one)
const topicOf = (n) => (n <= 11 ? 'redis' : n <= 18 ? 'mqtt' : n <= 26 ? 'kafka' : 'capstone');
for (const l of lessons) if (!l.topic) l.topic = topicOf(l.n);

// tutorial sections per technology (ranges use the original lesson numbers, 0 = setup)
export const groupsByTopic = {
  redis: [
    { id: 'part-1-basics-and-pubsub', title: 'Part 1: Basics and Pub/Sub', from: 0, to: 6 },
    { id: 'part-2-queues', title: 'Part 2: Job queues with lists', from: 7, to: 8 },
    { id: 'part-3-streams', title: 'Part 3: Streams and consumer groups', from: 9, to: 11 },
  ],
  mqtt: [
    { id: 'part-1-publish-subscribe-topics', title: 'Part 1: Publish, subscribe and topics', from: 0, to: 14 },
    { id: 'part-2-reliability', title: 'Part 2: QoS, retained messages, Last Will and sessions', from: 15, to: 18 },
  ],
  kafka: [
    { id: 'part-1-topics-produce-consume', title: 'Part 1: Topics, producing and consuming', from: 0, to: 22 },
    { id: 'part-2-groups-and-reliability', title: 'Part 2: Groups, commits and reliability', from: 23, to: 26 },
  ],
  capstone: [{ id: 'capstone-pipeline', title: 'Capstone pipeline', from: 27, to: 27 }],
};
