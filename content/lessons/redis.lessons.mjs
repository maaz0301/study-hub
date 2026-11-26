// Runnable Redis commands (no install): each Try it box runs on a small in-browser Redis, one command per line.
const L = (n, title, sub, big, steps, mistakes) => ({ n, title, sub, big, steps: steps.map(([c, t]) => [c, t, 'bash', 'redis']), mistakes, lang: 'bash' });

export const groups = [
  { id: 'try-redis-in-your-browser', title: 'Try Redis commands in your browser (no install)', from: 12, to: 17 },
];

export const lessons = [
  L(12, 'Strings: SET, GET and counters', 'The simplest Redis type.',
    'Redis is a key-value store. A **string** value can be text or a number. `INCR` adds 1 atomically, so many clients can count without losing updates. Lines starting with `#` are comments. Each Run starts with an empty database.',
    [
      ['SET greeting "hello"\nGET greeting\nEXISTS greeting\nDEL greeting\nGET greeting', '`GET` of a missing key gives `(nil)`.'],
      ['INCR page:views\nINCR page:views\nINCRBY page:views 10\nGET page:views', 'Counters: keys like `page:views` use `:` as a naming convention.'],
      ['SET session:42 abc EX 30\nTTL session:42\nTYPE session:42', '`EX 30` expires the key in 30 seconds. `TTL` shows the seconds left (`-1` = no expiry, `-2` = gone).'],
    ],
    ['Using `KEYS *` on a big production database: it blocks Redis. Use `SCAN`.', 'Forgetting that everything is stored as a string: `GET` always returns text.']),

  L(13, 'Lists: queues and stacks', 'LPUSH, RPUSH, LPOP, LRANGE.',
    'A **list** keeps items in order. Push on one end and pop from the same end for a stack, from the other end for a queue. Lists are the simplest job queue.',
    [
      ['RPUSH jobs "resize-image" "send-email" "make-report"\nLLEN jobs\nLRANGE jobs 0 -1', '`RPUSH` adds to the right (the tail). `LRANGE 0 -1` shows everything.'],
      ['RPUSH queue a b c\nLPOP queue\nLPOP queue\nLRANGE queue 0 -1', 'Push right, pop left: **first in, first out**, a queue.'],
    ],
    ['`LPOP` on an empty list returns `(nil)`: the worker must handle it (or use `BLPOP` to wait).', 'A worker that pops a job and crashes loses it: see the reliable-queue lesson.']),

  L(14, 'Hashes: small objects', 'Store fields under one key.',
    'A **hash** is a mini object: field/value pairs under a single key. Perfect for a user profile.',
    [
      ['HSET user:7 name Ayesha city Lahore plan free\nHGET user:7 city\nHGETALL user:7', '`HSET` can set several fields at once. `HGETALL` returns field, value, field, value…'],
      ['HSET user:7 plan pro\nHGET user:7 plan', 'Update one field without touching the others.'],
    ],
    ['Putting huge hashes under one key: operations on it are slow and it cannot be spread over cluster nodes.']),

  L(15, 'Sets and sorted sets', 'Unique values and leaderboards.',
    'A **set** holds unique items, with fast "is it in there?" checks. A **sorted set** gives every member a score and keeps them ordered: leaderboards and rankings.',
    [
      ['SADD tags redis kafka mqtt redis\nSMEMBERS tags\nSISMEMBER tags kafka\nSISMEMBER tags rabbit', 'Adding `redis` twice stores it once.'],
      ['ZADD board 120 ali 340 sara 95 omar\nZRANGE board 0 -1 WITHSCORES\nZSCORE board sara', 'Members come back ordered by score, lowest first.'],
    ],
    ['Expecting a set to keep insertion order: it does not.', '`ZRANGE` is ascending. For the top scores use `ZREVRANGE` / `REV`.']),

  L(16, 'Streams: an event log', 'XADD and XRANGE.',
    'A **stream** is an append-only log. Each entry gets an automatic id (time-sequence) and several fields. Many consumers can read the same data.',
    [
      ['XADD orders * userId 7 total 59\nXADD orders * userId 8 total 12\nXLEN orders\nXRANGE orders - +', '`*` means "generate the id". `XRANGE - +` returns every entry.'],
    ],
    ['Never trimming a stream: it grows without limit. Use `MAXLEN`.']),

  L(17, 'Streams: consumer groups', 'Share the work between workers.',
    'A **consumer group** splits one stream among several workers. Each entry goes to one worker, which must `XACK` it when done. Unacknowledged entries stay *pending*, so a crashed worker\'s job can be retried.',
    [
      ['XADD orders * userId 7 total 59\nXADD orders * userId 8 total 12\nXGROUP CREATE orders billing 0\nXREADGROUP GROUP billing worker-1 COUNT 1 STREAMS orders >\nXPENDING orders billing', 'worker-1 receives the first order. It is now **pending** until acknowledged.'],
      ['XADD orders * userId 7 total 59\nXGROUP CREATE orders billing 0\nXREADGROUP GROUP billing worker-1 COUNT 1 STREAMS orders >\nXREADGROUP GROUP billing worker-2 COUNT 1 STREAMS orders >', 'worker-2 gets the next entry, or nothing if none is left: work is **not** duplicated.'],
    ],
    ['Forgetting `XACK`: entries stay pending forever.', 'Using `>` vs `0`: `>` means "new entries only", `0` re-reads this worker\'s pending ones.']),
];
