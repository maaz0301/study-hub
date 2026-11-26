# More interview questions

## How do you approach an unfamiliar coding problem in an interview?

Use a repeatable routine: **(1) clarify** the input, output, constraints and edge cases out loud; **(2) work a small example** by hand; **(3) state a brute-force solution** and its complexity; **(4) find the bottleneck** and match it to a pattern (hash map, two pointers, sliding window, stack, binary search, BFS/DFS, DP); **(5) code** cleanly with good names; **(6) test** with the example and edge cases; **(7) state time and space complexity**. Talking through your thinking matters as much as the final code.

## How do you analyse time and space complexity?

Count how the work grows with the input size **n**: a single loop is O(n); nested loops over the same data are O(n²); halving the search space each step is O(log n); sorting is O(n log n); a hash map lookup is O(1) on average. **Space** counts extra memory you allocate (recursion depth counts too). Drop constants and lower-order terms. Mention best/average/worst case when they differ (quick sort, hash collisions).

## When do you choose a hash map, sorting or two pointers?

- **Hash map/set**: you need O(1) lookups or counts ("seen before?", complements, grouping). Costs O(n) extra space.
- **Sorting**: ordering helps (merge intervals, closest values, duplicates); costs O(n log n) but little extra space.
- **Two pointers**: the data is **sorted** (or can be) and you scan from both ends or with fast/slow pointers, using O(1) space.
State the trade-off between time and space when you pick one.

## What edge cases should you test for arrays, strings and linked lists?

Empty input, a single element, two elements, all equal values, already sorted and reverse-sorted data, duplicates, negative numbers and zero, very large values (overflow: use `long`), the first and last positions (off-by-one), `null` references, a list with a cycle, and Unicode or case differences in strings. Say them out loud before coding and run at least two through your code.

## Reverse a linked list iteratively and recursively: what is the difference in cost?

Iterative: three pointers (`prev`, `cur`, `next`), O(n) time and **O(1) space**. Recursive: reverse the rest of the list, then point the next node back at the current one: O(n) time but **O(n) stack space**, and a very long list can cause a stack overflow. Prefer the iterative version in production; know both for interviews.

## How would you design an LRU cache?

Combine a **dictionary** (key → node) for O(1) lookup with a **doubly linked list** ordered by recency. On `Get`, move the node to the front; on `Put`, insert at the front and, if over capacity, remove the node at the **tail** (least recently used) and its dictionary entry. Both operations are O(1). In C#, `LinkedList<T>` plus `Dictionary<K, LinkedListNode<T>>` does it; add a lock or a concurrent design if multithreaded.

## How do you detect a cycle in a linked list and find where it starts?

Use **Floyd's tortoise and hare**: move `slow` by 1 and `fast` by 2; if they meet there is a cycle. To find the start, reset one pointer to the head and move both **one step at a time**; they meet at the cycle's first node. O(n) time and O(1) space, unlike a `HashSet` of visited nodes which needs O(n) space.

## What are the ways to merge k sorted lists, and their complexities?

1. **Merge one by one**: O(k·N) in the worst case (N total nodes).
2. **Min-heap / `PriorityQueue`** holding the head of each list: O(N log k).
3. **Divide and conquer**: merge pairs of lists repeatedly: O(N log k), O(1) extra space for lists.
4. Dump everything into an array, sort, rebuild: O(N log N).
Options 2 and 3 are the expected answers.

## Why is `Dictionary<TKey,TValue>` lookup O(1), and when is it not?

It hashes the key to a **bucket**, so average lookup is O(1). It degrades toward O(n) when many keys **collide** in the same bucket (a poor `GetHashCode`, or adversarial input). Keys must have a stable hash code and correct `Equals`, and mutating a key after insertion breaks lookup. `HashSet<T>` works the same way; `List<T>.Contains` is O(n).

## Recursion vs iteration: when do you pick each, and what is the risk?

Recursion is natural for **trees, graphs, backtracking and divide and conquer**, and reads closely to the definition. The risk is **stack overflow** on deep inputs (C# does not do tail-call optimisation) and call overhead. Convert to an **explicit stack/queue** (iterative DFS/BFS) or a loop when depth may be large, or use memoisation/DP to avoid repeated work.

## What is the difference between `string` and `StringBuilder` in loops, and between `Array`, `List` and `LinkedList`?

`string` is immutable: building one with `+=` in a loop is O(n²); `StringBuilder` appends in amortised O(1). `Array` has a fixed size and O(1) index access; `List<T>` grows automatically (amortised O(1) append) with O(1) index access but O(n) insert in the middle; `LinkedList<T>` has O(1) insert/remove **given a node** but O(n) access by index and poor cache locality, so `List<T>` wins in most real cases.
