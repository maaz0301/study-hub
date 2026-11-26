# More interview questions

## What is the time complexity of common JavaScript array and object operations?

`arr[i]` and `push`/`pop` are O(1); `shift`/`unshift` are **O(n)** (elements move); `indexOf`/`includes`/`find` are O(n); `slice`, `concat`, `map`, `filter` and the spread `[...a]` are O(n); `sort` is O(n log n); `Map`/`Set`/object property get, set and `has` are O(1) on average; `delete` on objects can slow them down. Knowing these tells you when a "simple" `shift()` inside a loop quietly makes your solution O(n²).

## Why does `[10, 9, 1].sort()` return `[1, 10, 9]`?

Without a comparator, `sort()` converts items to **strings** and compares them lexicographically ("10" < "9"). Pass a comparator for numbers: `arr.sort((a, b) => a - b)`. The comparator must return a negative, zero or positive number; returning a boolean is a classic bug. Modern engines use a **stable** sort (equal items keep their order).

## Map vs plain object: when do you use each?

Use **`Map`** when keys are not strings (objects, numbers), when you add and remove keys often, when you need **insertion order** and `size`, or when keys are user-provided (no prototype issues like `__proto__`). Use a plain object for fixed, known shapes and JSON. `Map` also iterates predictably and is usually faster for frequent additions and deletions.

## How do you implement an efficient queue in JavaScript?

`Array.shift()` is O(n), so for big BFS queues use an **index pointer** (`queue[head++]`) and clear later, a **linked list**, or two stacks. With a head index, dequeue is O(1) and memory can be reclaimed periodically. For a priority queue implement a **binary heap** (JavaScript has none built in).

## Why is `0.1 + 0.2 !== 0.3` and how do you compare decimals?

JavaScript numbers are **IEEE-754 double-precision floats**, so many decimals cannot be represented exactly (`0.1 + 0.2 = 0.30000000000000004`). Compare with a tolerance (`Math.abs(a - b) < Number.EPSILON`), work in **integers** (cents instead of dollars), or use a decimal library. For integers beyond 2^53 use **`BigInt`** (`123n`), and remember you cannot mix `BigInt` and `Number` without conversion.

## How deep can recursion go in JavaScript, and what do you do about it?

The call stack is limited (roughly 10,000 to 15,000 frames depending on the engine); beyond that you get **`RangeError: Maximum call stack size exceeded`**. JavaScript engines generally do **not** optimise tail calls. Convert deep recursion to an **explicit stack** or loop, use **memoisation** to avoid repeated calls, or process in batches. Typical culprits are DFS on large graphs and naive recursive Fibonacci.

## What is the difference between a shallow and a deep copy, and how do you make each?

A shallow copy copies the top level only; nested objects are still **shared**: `{ ...obj }`, `Object.assign({}, obj)`, `arr.slice()`, `[...arr]`. A **deep copy** duplicates everything: `structuredClone(value)` (handles Dates, Maps, Sets, cycles; not functions) or a custom recursive clone. `JSON.parse(JSON.stringify(x))` loses `undefined`, functions, Dates and fails on cycles.

## What does `==` do differently from `===`?

`===` compares value and type with no conversion. `==` **coerces** types first (`"5" == 5` is true, `null == undefined` is true, `[] == false` is true), which creates surprising results. Use `===` by default; the only common deliberate use of `==` is `x == null` to test for both `null` and `undefined`.

## How do you remove duplicates from an array, and what is the complexity?

`[...new Set(arr)]` is O(n) and keeps the first occurrence order. For objects, dedupe by a key with a `Map` (`new Map(items.map(i => [i.id, i])).values()`). A nested loop or `filter` with `indexOf` is O(n²). If the array is sorted, a single pass comparing neighbours is O(n) with O(1) extra space.

## What are closures and how do they show up in coding problems?

A closure is a function that **remembers the variables of the scope where it was created**. In interviews you use them for counters and memoisation (`memoize(fn)` keeps a cache), `once`, `debounce`/`throttle` (a private timer), module patterns and iterators. The classic bug: `var` in a loop shares one variable (all callbacks see the final value); `let` creates a **new binding per iteration**.

## How do you sort objects by several keys, and keep it stable?

```javascript
people.sort((a, b) =>
  a.lastName.localeCompare(b.lastName) ||   // first key
  a.age - b.age                              // tie-break
);
```

`||` falls through to the next comparison when the first returns 0. Use `localeCompare` for text (handles accents), and remember `sort` mutates the array: copy first (`[...people].sort(...)` or `toSorted`) if you need the original.
