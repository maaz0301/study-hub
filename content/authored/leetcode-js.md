---
slug: leetcode-js
title: LeetCode in JavaScript (50+ more problems)
subtitle: Arrays, windows, stacks, binary search, trees, graphs, DP, backtracking, heaps and Node.js interview tasks
emoji: 🟨
accent: #facc15
category: Coding Interviews
cards: all
---

# Start here

This topic adds 50+ problems that are not in the C# guide, all solved in modern JavaScript (Node 18+). Every problem has the idea in plain words, the code and the complexity. Read the idea first, try it yourself, then compare with the code.

## Pattern cheat sheet: which pattern does this problem need?

| If the problem says… | Reach for | Examples |
|---|---|---|
| "pair / triple that sums to…" in a **sorted** array | two pointers | 15, 42 |
| "longest / shortest **substring or subarray** with a rule" | sliding window | 76, 424, 567 |
| "have I seen this before?", "count of …" | hash map / set | 49, 128, 560 |
| "next greater …", "matching brackets", "undo" | stack | 155, 739, 150 |
| "sorted" or "can answer yes/no for a guess" | binary search | 33, 153, 875 |
| "tree" | recursion (DFS) or a queue (BFS) | 104, 102, 236 |
| "grid of islands", "shortest steps", "dependencies" | BFS / DFS / topological sort | 200, 994, 207 |
| "how many ways", "min/max cost", overlapping sub-problems | dynamic programming | 70, 322, 1143 |
| "all combinations / permutations" | backtracking | 46, 78, 39 |
| "k-th largest", "top k" | heap | 215, 347 |

## JavaScript tools you will use in every solution

- **`Map` / `Set`**: O(1) lookup. Keys can be any type; `Map` keeps insertion order.
- **`arr.sort((a, b) => a - b)`**: the default `sort()` compares as *strings*, so always pass a comparator for numbers.
- **`arr.at(-1)`** is the last element; `arr.length = 0` clears an array.
- **`queue.shift()`** is O(n). For huge BFS queues use an index pointer instead (shown in problem 207).
- **Integer division**: `Math.floor(a / b)` or `Math.trunc(a / b)` for negatives, `(a + b) >> 1` for the middle index.
- **Nodes**: LeetCode gives you these shapes.

```javascript
function TreeNode(val, left, right) {
  this.val = val ?? 0;
  this.left = left ?? null;
  this.right = right ?? null;
}
function Node(val) { this.val = val; this.neighbors = []; }   // graph node
```

- **A min-heap** (JavaScript has none built in). Paste this when a problem needs a priority queue:

```javascript
class MinHeap {
  constructor() { this.a = []; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(v) {
    const a = this.a;
    a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l] < a[m]) m = l;
        if (r < a.length && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}
```

# Arrays and hash maps

## 49. Group Anagrams

**What it asks:** group words that are anagrams of each other. **Idea:** two words are anagrams when their letters sorted are the same, so use the sorted letters as a map key.

```javascript
var groupAnagrams = function (strs) {
  const map = new Map();
  for (const s of strs) {
    const key = [...s].sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return [...map.values()];
};
```

**Complexity:** O(n · k log k) time for n words of length k, O(n · k) space.

## 347. Top K Frequent Elements

**What it asks:** return the k most frequent numbers. **Idea:** count with a map, then bucket-sort by count (a bucket for each possible frequency) so no heap or full sort is needed.

```javascript
var topKFrequent = function (nums, k) {
  const count = new Map();
  for (const n of nums) count.set(n, (count.get(n) ?? 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [n, c] of count) buckets[c].push(n);
  const out = [];
  for (let c = buckets.length - 1; c >= 0 && out.length < k; c--) out.push(...buckets[c]);
  return out.slice(0, k);
};
```

**Complexity:** O(n) time and space.

## 128. Longest Consecutive Sequence

**What it asks:** length of the longest run of consecutive integers (in any order) in O(n). **Idea:** put everything in a set; only start counting at numbers whose predecessor (n - 1) is missing, then walk upward.

```javascript
var longestConsecutive = function (nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (set.has(n - 1)) continue;        // not the start of a run
    let len = 1;
    while (set.has(n + len)) len++;
    best = Math.max(best, len);
  }
  return best;
};
```

**Complexity:** O(n) time (each number is walked once), O(n) space.

## 560. Subarray Sum Equals K

**What it asks:** count subarrays whose sum is k. **Idea:** keep the running (prefix) sum. A subarray ending here sums to k when an earlier prefix equals `sum - k`, so remember how often each prefix has occurred.

```javascript
var subarraySum = function (nums, k) {
  const seen = new Map([[0, 1]]);        // empty prefix
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    count += seen.get(sum - k) ?? 0;
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
  }
  return count;
};
```

**Complexity:** O(n) time, O(n) space. Works with negative numbers, unlike a sliding window.

## 56. Merge Intervals

**What it asks:** merge all overlapping intervals. **Idea:** sort by start; if the next interval starts before the last merged one ends, extend the end, otherwise start a new one.

```javascript
var merge = function (intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = out[out.length - 1];
    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else out.push(intervals[i]);
  }
  return out;
};
```

**Complexity:** O(n log n) for the sort, O(n) space.

# Two pointers and sliding window

## 76. Minimum Window Substring

**What it asks:** the shortest part of `s` that contains every character of `t` (with counts). **Idea:** grow the window on the right until it is valid, then shrink it from the left while it stays valid, remembering the best one. `missing` counts how many needed characters are still absent.

```javascript
var minWindow = function (s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let missing = t.length, L = 0, bestStart = 0, bestLen = Infinity;
  for (let R = 0; R < s.length; R++) {
    const c = s[R];
    if (need.has(c)) {
      if (need.get(c) > 0) missing--;
      need.set(c, need.get(c) - 1);
    }
    while (missing === 0) {                       // valid window: try to shrink
      if (R - L + 1 < bestLen) { bestLen = R - L + 1; bestStart = L; }
      const l = s[L];
      if (need.has(l)) {
        need.set(l, need.get(l) + 1);
        if (need.get(l) > 0) missing++;
      }
      L++;
    }
  }
  return bestLen === Infinity ? '' : s.slice(bestStart, bestStart + bestLen);
};
```

**Complexity:** O(|s| + |t|) time, O(|t|) space. A very common interview question.

## 567. Permutation in String

**What it asks:** does `s2` contain a permutation of `s1`? **Idea:** slide a window of length `s1.length` over `s2` and compare letter counts. The `cnt` array holds (counts of s1) minus (counts in the window); it is all zeros when they match.

```javascript
var checkInclusion = function (s1, s2) {
  if (s1.length > s2.length) return false;
  const cnt = new Array(26).fill(0), a = 97;
  for (let i = 0; i < s1.length; i++) {
    cnt[s1.charCodeAt(i) - a]++;
    cnt[s2.charCodeAt(i) - a]--;
  }
  const isZero = () => cnt.every((x) => x === 0);
  if (isZero()) return true;
  for (let i = s1.length; i < s2.length; i++) {
    cnt[s2.charCodeAt(i) - a]--;                  // letter enters the window
    cnt[s2.charCodeAt(i - s1.length) - a]++;      // letter leaves the window
    if (isZero()) return true;
  }
  return false;
};
```

**Complexity:** O(26 · n) time, O(1) space.

## 42. Trapping Rain Water

**What it asks:** how much rain water is trapped between the bars. **Idea:** water above a bar = min(tallest bar to its left, tallest to its right) minus its height. Two pointers move inward from the shorter side, so you always know that side's limit.

```javascript
var trap = function (height) {
  let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      leftMax = Math.max(leftMax, height[l]);
      water += leftMax - height[l];
      l++;
    } else {
      rightMax = Math.max(rightMax, height[r]);
      water += rightMax - height[r];
      r--;
    }
  }
  return water;
};
```

**Complexity:** O(n) time, O(1) space.

## 424. Longest Repeating Character Replacement

**What it asks:** the longest substring you can make all one letter by replacing at most k characters. **Idea:** a window is valid when `length - (count of its most common letter) <= k`. Grow right; shrink left when invalid.

```javascript
var characterReplacement = function (s, k) {
  const cnt = new Array(26).fill(0);
  let L = 0, maxCount = 0, best = 0;
  for (let R = 0; R < s.length; R++) {
    maxCount = Math.max(maxCount, ++cnt[s.charCodeAt(R) - 65]);
    while (R - L + 1 - maxCount > k) cnt[s.charCodeAt(L++) - 65]--;
    best = Math.max(best, R - L + 1);
  }
  return best;
};
```

**Complexity:** O(n) time, O(1) space.

# Stacks and queues

## 155. Min Stack

**What it asks:** a stack with push, pop, top and `getMin` all in O(1). **Idea:** keep a second stack where each entry is the minimum so far.

```javascript
class MinStack {
  constructor() { this.stack = []; this.mins = []; }
  push(x) {
    this.stack.push(x);
    this.mins.push(Math.min(x, this.mins.at(-1) ?? x));
  }
  pop() { this.stack.pop(); this.mins.pop(); }
  top() { return this.stack.at(-1); }
  getMin() { return this.mins.at(-1); }
}
```

**Complexity:** O(1) per operation, O(n) space.

## 739. Daily Temperatures

**What it asks:** for each day, how many days until a warmer one. **Idea:** a *monotonic stack* of indexes whose temperatures are waiting for something warmer; when a warmer day arrives, pop and fill in the answer.

```javascript
var dailyTemperatures = function (T) {
  const res = new Array(T.length).fill(0), stack = [];
  for (let i = 0; i < T.length; i++) {
    while (stack.length && T[stack.at(-1)] < T[i]) {
      const j = stack.pop();
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
};
```

**Complexity:** O(n) time (each index is pushed and popped once), O(n) space.

## 150. Evaluate Reverse Polish Notation

**What it asks:** evaluate an expression like `["2","1","+","3","*"]` = (2 + 1) * 3. **Idea:** push numbers; on an operator pop two, apply it (the first popped is the right operand) and push the result.

```javascript
var evalRPN = function (tokens) {
  const st = [];
  for (const t of tokens) {
    if (t.length === 1 && '+-*/'.includes(t)) {
      const b = st.pop(), a = st.pop();
      st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b));
    } else st.push(Number(t));
  }
  return st[0];
};
```

**Complexity:** O(n) time and space. `Math.trunc` gives the "round toward zero" division the problem asks for.

# Binary search

## 33. Search in Rotated Sorted Array

**What it asks:** find a target in a sorted array that was rotated (like `[4,5,6,7,0,1,2]`). **Idea:** at any midpoint one half is still sorted. Check whether the target lies inside the sorted half; if so go there, otherwise go to the other half.

```javascript
var search = function (nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {                    // left half is sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {                                        // right half is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
};
```

**Complexity:** O(log n) time, O(1) space.

## 153. Find Minimum in Rotated Sorted Array

**What it asks:** the smallest element of a rotated sorted array. **Idea:** compare the middle with the right end. If `nums[mid] > nums[hi]` the minimum is to the right of mid; otherwise it is at mid or to the left.

```javascript
var findMin = function (nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
  }
  return nums[lo];
};
```

**Complexity:** O(log n) time, O(1) space.

## 875. Koko Eating Bananas

**What it asks:** the smallest eating speed `k` that finishes all piles within `h` hours. **Idea:** *binary search on the answer*. For a guessed speed, hours = sum of ceil(pile / speed). Fast enough → try slower, otherwise faster.

```javascript
var minEatingSpeed = function (piles, h) {
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);
    if (hours <= h) hi = mid; else lo = mid + 1;
  }
  return lo;
};
```

**Complexity:** O(n log max(pile)) time, O(1) space. The same trick solves "ship packages in D days" and "split array largest sum".

## 74. Search a 2D Matrix

**What it asks:** find a target in a matrix whose rows are sorted and each row starts after the previous one ends. **Idea:** treat the matrix as one sorted list of `rows * cols` items and convert the index back with division and modulo.

```javascript
var searchMatrix = function (matrix, target) {
  const rows = matrix.length, cols = matrix[0].length;
  let lo = 0, hi = rows * cols - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = matrix[Math.floor(mid / cols)][mid % cols];
    if (v === target) return true;
    if (v < target) lo = mid + 1; else hi = mid - 1;
  }
  return false;
};
```

**Complexity:** O(log(rows · cols)) time, O(1) space.

# Trees

## 104. Maximum Depth of Binary Tree

**What it asks:** the number of levels in a tree. **Idea:** depth of a node = 1 + the deeper of its two children; an empty tree has depth 0.

```javascript
var maxDepth = function (root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
};
```

**Complexity:** O(n) time, O(h) stack space (h = height).

## 226. Invert Binary Tree

**What it asks:** mirror the tree. **Idea:** swap the two children of every node, recursively.

```javascript
var invertTree = function (root) {
  if (!root) return null;
  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  return root;
};
```

**Complexity:** O(n) time, O(h) space.

## 98. Validate Binary Search Tree

**What it asks:** is this a valid BST? **Idea:** every node must lie strictly between a lower and an upper bound that come from its ancestors. Checking only the parent is the classic bug.

```javascript
var isValidBST = function (root, lo = -Infinity, hi = Infinity) {
  if (!root) return true;
  if (root.val <= lo || root.val >= hi) return false;
  return isValidBST(root.left, lo, root.val) && isValidBST(root.right, root.val, hi);
};
```

**Complexity:** O(n) time, O(h) space.

## 102. Binary Tree Level Order Traversal

**What it asks:** return the values level by level. **Idea:** BFS with a queue. At the start of each level, `queue.length` tells you how many nodes belong to it.

```javascript
var levelOrder = function (root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const level = [];
    for (let size = queue.length; size > 0; size--) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
};
```

**Complexity:** O(n) time, O(w) space (w = widest level).

## 236. Lowest Common Ancestor of a Binary Tree

**What it asks:** the lowest node that has both `p` and `q` below it. **Idea:** search both sides. If `p` and `q` are found in different subtrees, the current node is the answer; if only one side finds something, pass it up.

```javascript
var lowestCommonAncestor = function (root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  return left && right ? root : (left ?? right);
};
```

**Complexity:** O(n) time, O(h) space.

## 543. Diameter of Binary Tree

**What it asks:** the longest path (in edges) between any two nodes. **Idea:** at each node the longest path through it is `leftDepth + rightDepth`. Track the best while returning the depth.

```javascript
var diameterOfBinaryTree = function (root) {
  let best = 0;
  const depth = (n) => {
    if (!n) return 0;
    const l = depth(n.left), r = depth(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
  };
  depth(root);
  return best;
};
```

**Complexity:** O(n) time, O(h) space.

## 230. Kth Smallest Element in a BST

**What it asks:** the k-th smallest value in a BST. **Idea:** an in-order traversal visits a BST in sorted order, so stop at the k-th visit. An explicit stack avoids deep recursion.

```javascript
var kthSmallest = function (root, k) {
  const stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }
    cur = stack.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
};
```

**Complexity:** O(h + k) time, O(h) space.

# Graphs

## 200. Number of Islands

**What it asks:** count groups of connected `'1'` cells in a grid. **Idea:** scan the grid; when you find land, count one island and *sink* it (turn it into `'0'`) with DFS so it is never counted again.

```javascript
var numIslands = function (grid) {
  const R = grid.length, C = grid[0].length;
  let count = 0;
  const sink = (r, c) => {
    if (r < 0 || c < 0 || r >= R || c >= C || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  };
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === '1') { count++; sink(r, c); }
    }
  }
  return count;
};
```

**Complexity:** O(R · C) time and recursion space.

## 133. Clone Graph

**What it asks:** deep-copy a connected undirected graph. **Idea:** DFS with a map from old node to its copy. The map both stores the copies and stops infinite loops on cycles.

```javascript
var cloneGraph = function (node) {
  if (!node) return null;
  const map = new Map();
  const dfs = (n) => {
    if (map.has(n)) return map.get(n);
    const copy = new Node(n.val);
    map.set(n, copy);
    for (const nb of n.neighbors) copy.neighbors.push(dfs(nb));
    return copy;
  };
  return dfs(node);
};
```

**Complexity:** O(V + E) time and space.

## 207. Course Schedule

**What it asks:** given prerequisites, can you finish all courses (no cycle)? **Idea:** *topological sort (Kahn)*. Start with courses that have no prerequisites, finish them, and lower the count of their dependents. If every course gets finished there is no cycle.

```javascript
var canFinish = function (numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) { adj[pre].push(course); indeg[course]++; }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let done = 0;
  for (let head = 0; head < queue.length; head++) {   // index pointer: no slow shift()
    done++;
    for (const next of adj[queue[head]]) {
      if (--indeg[next] === 0) queue.push(next);
    }
  }
  return done === numCourses;
};
```

**Complexity:** O(V + E) time and space.

## 994. Rotting Oranges

**What it asks:** minutes until all oranges rot (rot spreads to 4 neighbours each minute), or -1. **Idea:** *multi-source BFS*. Put every rotten orange in the queue, spread one level per minute, and count the fresh ones left.

```javascript
var orangesRotting = function (grid) {
  const R = grid.length, C = grid[0].length;
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      else if (grid[r][c] === 1) fresh++;
    }
  }
  let minutes = 0;
  while (queue.length && fresh > 0) {
    for (let size = queue.length; size > 0; size--) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < R && nc < C && grid[nr][nc] === 1) {
          grid[nr][nc] = 2; fresh--; queue.push([nr, nc]);
        }
      }
    }
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
};
```

**Complexity:** O(R · C) time and space.

# Dynamic programming

## 70. Climbing Stairs

**What it asks:** ways to climb n stairs taking 1 or 2 steps. **Idea:** ways(n) = ways(n - 1) + ways(n - 2), the Fibonacci numbers. Keep only the last two values.

```javascript
var climbStairs = function (n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
};
```

**Complexity:** O(n) time, O(1) space.

## 198. House Robber

**What it asks:** the most money you can rob without robbing two neighbouring houses. **Idea:** for each house you either rob it (previous best-without-neighbour + this house) or skip it (the best so far).

```javascript
var rob = function (nums) {
  let take = 0, skip = 0;
  for (const n of nums) [take, skip] = [skip + n, Math.max(take, skip)];
  return Math.max(take, skip);
};
```

**Complexity:** O(n) time, O(1) space.

## 322. Coin Change

**What it asks:** the fewest coins that make an amount, or -1. **Idea:** `dp[a]` = fewest coins for amount `a` = 1 + the best `dp[a - coin]` over all coins.

```javascript
var coinChange = function (coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
};
```

**Complexity:** O(amount · coins) time, O(amount) space.

## 300. Longest Increasing Subsequence

**What it asks:** the length of the longest strictly increasing subsequence. **Idea:** keep `tails`, where `tails[i]` is the smallest possible last value of an increasing subsequence of length i + 1. For each number, binary search where it fits and overwrite.

```javascript
var lengthOfLIS = function (nums) {
  const tails = [];
  for (const n of nums) {
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < n) lo = mid + 1; else hi = mid;
    }
    tails[lo] = n;
  }
  return tails.length;
};
```

**Complexity:** O(n log n) time, O(n) space. (The simple O(n²) DP is fine to explain first.)

## 1143. Longest Common Subsequence

**What it asks:** the length of the longest subsequence two strings share. **Idea:** `dp[i][j]` for the first i and j characters: if the characters match, take the diagonal + 1, otherwise the better of dropping a character from either string.

```javascript
var longestCommonSubsequence = function (a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
};
```

**Complexity:** O(n · m) time and space.

## 139. Word Break

**What it asks:** can the string be split into dictionary words? **Idea:** `dp[i]` is true when the first i characters can be split. It is true if some earlier `dp[j]` is true and `s[j..i)` is a word.

```javascript
var wordBreak = function (s, wordDict) {
  const words = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && words.has(s.slice(j, i))) { dp[i] = true; break; }
    }
  }
  return dp[s.length];
};
```

**Complexity:** O(n²) substring checks, O(n) space.

## 62. Unique Paths

**What it asks:** the number of paths from top-left to bottom-right of a grid moving only right or down. **Idea:** paths to a cell = paths from above + paths from the left. One row of memory is enough.

```javascript
var uniquePaths = function (m, n) {
  const row = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) row[j] += row[j - 1];
  }
  return row[n - 1];
};
```

**Complexity:** O(m · n) time, O(n) space.

# Backtracking

## 46. Permutations

**What it asks:** all orderings of distinct numbers. **Idea:** *choose, explore, un-choose*. Build a path one number at a time, mark numbers used, recurse, then undo the choice.

```javascript
var permute = function (nums) {
  const res = [], path = [], used = new Array(nums.length).fill(false);
  const dfs = () => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]);
      dfs();
      path.pop(); used[i] = false;
    }
  };
  dfs();
  return res;
};
```

**Complexity:** O(n · n!) time. Remember to copy the path (`[...path]`) before saving it.

## 78. Subsets

**What it asks:** every subset (the power set). **Idea:** at each step record the current path as a subset, then try adding each later element.

```javascript
var subsets = function (nums) {
  const res = [], path = [];
  const dfs = (start) => {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  };
  dfs(0);
  return res;
};
```

**Complexity:** O(n · 2ⁿ) time.

## 39. Combination Sum

**What it asks:** all combinations that add up to a target, reusing numbers freely. **Idea:** same backtracking, but recurse with `i` (not `i + 1`) because a number may repeat; stop when the remainder reaches 0.

```javascript
var combinationSum = function (candidates, target) {
  const res = [], path = [];
  const dfs = (start, remain) => {
    if (remain === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) continue;
      path.push(candidates[i]);
      dfs(i, remain - candidates[i]);          // the same number may be used again
      path.pop();
    }
  };
  dfs(0, target);
  return res;
};
```

**Complexity:** exponential in the worst case; pruning with `remain` keeps it small.

# Heaps and bits

## 215. Kth Largest Element in an Array

**What it asks:** the k-th largest number. **Idea:** keep a *min-heap of size k*. The smallest of the k biggest is at the top, which is the answer. Uses the `MinHeap` class from the start of this topic.

```javascript
var findKthLargest = function (nums, k) {
  const heap = new MinHeap();
  for (const n of nums) {
    heap.push(n);
    if (heap.size() > k) heap.pop();      // drop the smallest
  }
  return heap.peek();
};
```

**Complexity:** O(n log k) time, O(k) space. The simple answer `nums.sort((a, b) => b - a)[k - 1]` is O(n log n).

## 136. Single Number

**What it asks:** every number appears twice except one; find it. **Idea:** XOR cancels equal numbers (`a ^ a = 0`, `a ^ 0 = a`).

```javascript
var singleNumber = function (nums) {
  return nums.reduce((acc, n) => acc ^ n, 0);
};
```

**Complexity:** O(n) time, O(1) space.

## 191. Number of 1 Bits

**What it asks:** count the set bits of an integer. **Idea:** `n & (n - 1)` clears the lowest set bit, so loop until `n` is zero.

```javascript
var hammingWeight = function (n) {
  n >>>= 0;                 // treat as unsigned 32-bit
  let count = 0;
  while (n) { n &= n - 1; count++; }
  return count;
};
```

**Complexity:** O(number of set bits) time, O(1) space.

# JavaScript and Node.js interview tasks

## Implement debounce

**What it asks:** run a function only after calls have stopped for `wait` ms (search boxes, resize). **Idea:** every call cancels the previous timer and starts a new one.

```javascript
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
```

**Difference from throttle:** debounce waits for *silence*; throttle runs *at most once per interval*.

## Implement throttle

**What it asks:** allow a function to run at most once every `wait` ms (scroll handlers). **Idea:** remember the last run time and ignore calls that come too soon.

```javascript
function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}
```

## Implement Promise.all

**What it asks:** resolve with all results in order, or reject as soon as one rejects. **Idea:** run every promise, store each result at its own index, count completions.

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const list = [...promises];
    if (list.length === 0) return resolve([]);
    const results = new Array(list.length);
    let done = 0;
    list.forEach((p, i) => {
      Promise.resolve(p).then((value) => {
        results[i] = value;
        if (++done === list.length) resolve(results);
      }, reject);
    });
  });
}
```

**Remember:** results keep the *input order*, not the order the promises finish.

## Deep clone an object

**What it asks:** copy nested objects without sharing references. **Idea:** recurse, and remember what you already copied in a `WeakMap` so circular references do not loop forever.

```javascript
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value);
  if (value instanceof Map) {
    const m = new Map();
    seen.set(value, m);
    value.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set();
    seen.set(value, s);
    value.forEach((v) => s.add(deepClone(v, seen)));
    return s;
  }
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) copy[key] = deepClone(value[key], seen);
  return copy;
}
```

**In real code:** use the built-in `structuredClone(value)` (it cannot clone functions).

## Implement curry

**What it asks:** turn `f(a, b, c)` into `f(a)(b)(c)`. **Idea:** collect arguments until you have as many as the function declares (`fn.length`), then call it.

```javascript
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn.apply(this, args)
      : (...more) => curried.apply(this, [...args, ...more]);
  };
}
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);      // 6
add(1, 2)(3);      // 6
```

## Flatten a nested array

**What it asks:** `[1, [2, [3, [4]]]]` → `[1, 2, 3, 4]`, with an optional depth. **Idea:** recurse into arrays, decreasing the depth.

```javascript
function flatten(arr, depth = Infinity) {
  return depth > 0
    ? arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flatten(x, depth - 1) : x), [])
    : arr.slice();
}
// built-in: [1, [2, [3]]].flat(Infinity)
```

## Memoize a function

**What it asks:** cache results of a pure function by its arguments. **Idea:** build a key from the arguments and store the result in a `Map`.

```javascript
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args));
    return cache.get(key);
  };
}
const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
```

**Watch out:** `JSON.stringify` cannot tell some values apart (functions, `undefined`); only memoize pure functions.

## Build an EventEmitter (Node.js style)

**What it asks:** `on`, `off`, `once`, `emit`. **Idea:** a map from event name to a list of listeners; `once` wraps the listener so it removes itself.

```javascript
class EventEmitter {
  #handlers = new Map();
  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push(fn);
    return this;
  }
  off(event, fn) {
    const list = this.#handlers.get(event) ?? [];
    this.#handlers.set(event, list.filter((f) => f !== fn && f.original !== fn));
    return this;
  }
  once(event, fn) {
    const wrapper = (...args) => { this.off(event, wrapper); fn(...args); };
    wrapper.original = fn;
    return this.on(event, wrapper);
  }
  emit(event, ...args) {
    const list = [...(this.#handlers.get(event) ?? [])];   // copy: listeners may remove themselves
    list.forEach((fn) => fn(...args));
    return list.length > 0;
  }
}
```

## Retry with exponential backoff

**What it asks:** call an async function, retry on failure, wait longer each time. **Idea:** delay = base × 2^attempt plus a little random *jitter* so many clients do not retry at the same instant.

```javascript
async function retry(fn, { retries = 3, baseMs = 200 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries) throw err;
      const delay = baseMs * 2 ** attempt + Math.random() * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

**Use it for:** flaky HTTP calls, message-broker reconnects, database connections.

## Limit concurrency (promise pool)

**What it asks:** run many async tasks but only `limit` at a time. **Idea:** start `limit` workers; each worker keeps taking the next task until none are left.

```javascript
async function promisePool(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
// await promisePool(urls.map((u) => () => fetch(u)), 5);
```

## Sleep and timeout helpers

**What it asks:** pause for some time, and cancel a slow promise. **Idea:** wrap `setTimeout` in a promise; race the real promise against a timer and clear the timer afterwards.

```javascript
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
```

## Node.js: count word frequency in a huge file with streams

**What it asks:** process a file too big for memory. **Idea:** read it line by line with a stream and update a `Map`, so memory stays small.

```javascript
const fs = require('node:fs');
const readline = require('node:readline');

async function wordFrequency(path) {
  const counts = new Map();
  const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    for (const word of line.toLowerCase().match(/[a-z']+/g) ?? []) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 10);
}
```

**Why streams:** `fs.readFile` would load the whole file into memory; a stream handles files of any size with a few KB of memory.
