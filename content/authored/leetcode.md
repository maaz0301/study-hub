---
slug: leetcode
title: LeetCode in C# & JavaScript
subtitle: Linked lists, arrays, strings, loops, collections and Big O: 57 problems with C# and JavaScript solutions
emoji: 🧩
accent: #eab308
category: Coding Interviews
cards: all
---

This file has only the LeetCode linked-list problems, each with a plain-English description, an example, the idea, a C# solution and its complexity. Every solution uses the node class below and was written from memory, so run each one on LeetCode before relying on it.

```csharp
public class ListNode
{
    public int val;
    public ListNode? next;
    public ListNode(int val = 0, ListNode? next = null) { this.val = val;
this.next = next; }
}
```

**Contents:** Part 1 linked-list problems (26 core and 12 related, with pictures and a visual guide), Part 2 arrays and strings (19 problems), Part 3 loops, collections, Big O, more coding questions and interview tips.

| LeetCode | Problem | Level | Pattern |
|---|---|---|---|
| 206 | Reverse Linked List | Easy | reversal |
| 21 | Merge Two Sorted Lists | Easy | dummy head + merge |
| 141 | Linked List Cycle | Easy | fast/slow |
| 876 | Middle of the Linked List | Easy | fast/slow |
| 83 | Remove Duplicates from Sorted List | Easy | single pass |
| 203 | Remove Linked List Elements | Easy | dummy head |
| 234 | Palindrome Linked List | Easy | middle + reverse |
| 160 | Intersection of Two Linked Lists | Easy | two pointers |
| 237 | Delete Node in a Linked List | Medium | copy next value |
| 19 | Remove Nth Node From End of List | Medium | gap pointers |
| 2 | Add Two Numbers | Medium | carry + dummy |
| LeetCode | Problem | Level | Pattern |
| 142 | Linked List Cycle II | Medium | Floyd's algorithm |
| 24 | Swap Nodes in Pairs | Medium | pointer rewiring |
| 328 | Odd Even Linked List | Medium | split and rejoin |
| 61 | Rotate List | Medium | length + relink |
| 92 | Reverse Linked List II | Medium | partial reversal |
| 143 | Reorder List | Medium | middle + reverse + merge |
| 148 | Sort List | Medium | merge sort |
| 138 | Copy List with Random Pointer | Medium | hash map |
| 146 | LRU Cache | Medium | doubly linked list + dictionary |
| 82 | Remove Duplicates from Sorted List II | Medium | dummy head + skip runs |
| 86 | Partition List | Medium | two dummy lists |
| 445 | Add Two Numbers II | Medium | stacks |
| 707 | Design Linked List | Medium | sentinel node |
| 25 | Reverse Nodes in k-Group | Hard | grouped reversal |
| 23 | Merge k Sorted Lists | Hard | priority queue |

# Visual guide: four pointer patterns

These four pictures show the pointer moves that most linked-list problems reuse. Under every problem below, a text picture shows the same moves on that problem's own example.

![diagram](/media/leetcode/p3-1.png)

*reversal · before and after*

Reversal (problems 206, 234, 92, 25, 143, 2130): every arrow is flipped by keeping a `prev` pointer and saving `next`  first.

![diagram](/media/leetcode/p3-2.png)

*fast and slow pointers in a loop*

Fast and slow pointers (141, 142, 876, 234, 143, 148, 2095, 109): the fast pointer gains one node per step inside a loop, and reaches the end when slow is in the middle.

![diagram](/media/leetcode/p4-1.png)

*merge with a dummy head*

Dummy head and merge (21, 148, 23, 86, 147): a placeholder node means the first node needs no special case, and the answer is `dummy.next`.

![diagram](/media/leetcode/p4-2.png)

*gap pointers, remove the nth node from the end*

Gap pointers (19, 1721): keep two pointers a fixed distance apart so that, when the front one reaches the end, the back one is exactly where you need it.

# Easy problems

Every problem below has the same parts: what it asks, an example, the idea in one line, a step-by-step explanation with a dry run, the code, the complexity and the edge cases to test.

## 206. Reverse Linked List

**What it asks:** reverse a singly linked list and return the new head. **Example:** `1→2→3→4→5` becomes `5→4→3→2→1`. **Idea:** walk the list once and make each node point back at the node before it.

**Picture:**

```text
Before:  null   1 → 2 → 3 → null
Step 1:  null ← 1   2 → 3
Step 2:  null ← 1 ← 2   3
Step 3:  null ← 1 ← 2 ← 3          new head = 3
Result:  3 → 2 → 1 → null
```

**Step-by-step explanation:**

1. Keep three pointers: `prev` (the already reversed part, starts as `null`), `cur` (the node being processed, starts at `head`) and `next` (a saved copy of `cur.next`).

2. Save `next = cur.next`  first. If you flip the pointer before saving it, you lose the rest of the list.

3. Flip the link: `cur.next = prev`.

4. Move both pointers forward: `prev = cur`, then `cur = next`.

5. When `cur`  becomes `null`, `prev`  is the last node of the old list, which is the new head.

**Dry run on** `1→2→3` **:**

| Step | prev | cur | After flipping |
|---|---|---|---|
| start | null | 1 |  |
| 1 | 1 | 2 | `1→null` |
| 2 | 2 | 3 | `2→1→null` |
| 3 | 3 | null | `3→2→1→null` (return 3) |

```csharp
public ListNode? ReverseList(ListNode? head)
{
    ListNode? prev = null, cur = head;
    while (cur != null)
    {
        var next = cur.next;   // 1. save the rest of the list
        cur.next = prev;       // 2. flip the pointer
        prev = cur;            // 3. move prev forward
        cur = next;            // 4. move cur forward
    }
    return prev;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** empty list, one node. **Follow-up:** write it recursively (O(n) stack). This loop is the base for problems 234, 92, 143 and 25.

## 21. Merge Two Sorted Lists

**What it asks:** merge two sorted lists into one sorted list by relinking the existing nodes (do not create new ones). **Example:** `1→2→4`  and `1→3→4`  become `1→1→2→3→4→4`. **Idea:** compare the two front nodes, take the smaller one, repeat.

**Picture:**

```text
a: 1 → 2 → 4
b: 1 → 3 → 4
merged: dummy → 1(a) → 1(b) → 2(a) → 3(b) → 4(a) → 4(b)
```

**Step-by-step explanation:**

1. Create a `dummy`  node and a `tail`  pointer that starts on it. The dummy means you never need a special case for "which node is first".

2. While both lists have nodes, compare `a.val`  and `b.val`. Link `tail.next`  to the smaller node and move that list's pointer forward.

3. Move `tail`  to the node you just attached.

4. When one list runs out, the other list is already sorted, so attach all of it with one assignment.

5. Return `dummy.next`, which skips the dummy.

**Dry run on** `1→3`  **and** `2→4` **:** take 1 (tail: 1), take 2 (tail: 1→2), take 3 (tail: 1→2→3), list a is empty so attach `4`, result `1→2→3→4`.

```csharp
public ListNode? MergeTwoLists(ListNode? a, ListNode? b)
{
    var dummy = new ListNode();
    var tail = dummy;
    while (a != null && b != null)
    {
        if (a.val <= b.val) { tail.next = a; a = a.next; }   // take from a
        else                { tail.next = b; b = b.next; }   // take from b
        tail = tail.next;
    }
    tail.next = a ?? b;   // attach whatever is left
    return dummy.next;
}
```

**Complexity:** O(n + m) time, O(1) space. **Edge cases:** one or both lists empty.

## 141. Linked List Cycle

**What it asks:** return true if following `next`  pointers ever loops back to an earlier node.

**Example:** `3→2→0→-4`  where the tail points back to node `2`  returns `true`. **Idea:** two runners on a circular track: the fast one always catches the slow one.

**Picture:**

```csharp
1 → 2 → 3 → 4
        ↑       ↓
        └─ 6 ← 5        (6 points back to 3: a cycle)
slow moves 1 step, fast moves 2 steps; inside the loop fast catches slow
```

**Step-by-step explanation:**

1. Start `slow`  and `fast`  at the head.

2. Each loop, move `slow`  one node and `fast`  two nodes.

3. If there is no cycle, `fast`  reaches `null`  and the loop ends: return `false`.

4. If there is a cycle, both end up inside it. Each step the gap between them shrinks by one node, so they must land on the same node: return `true`.

**Why it works:** inside a loop the fast pointer gains exactly one node per step on the slow pointer, so it cannot jump over it.

```csharp
public bool HasCycle(ListNode? head)
{
    ListNode? slow = head, fast = head;
    while (fast?.next != null)      // fast can take two steps
    {
        slow = slow!.next;          // 1 step
        fast = fast.next.next;      // 2 steps
        if (slow == fast) return true;
    }
    return false;
}
```

**Complexity:** O(n) time, O(1) space (a `HashSet<ListNode>`  also works but uses O(n) space). **Edge cases:** empty list, a single node pointing to itself.

## 876. Middle of the Linked List

**What it asks:** return the middle node; if there are two middles, return the second.

**Example:** `1→2→3→4→5`  returns node `3`; `1→2→3→4→5→6`  returns node `4`. **Idea:** the fast pointer moves twice as fast, so when it reaches the end the slow pointer is halfway.

**Picture:**

```text
1 → 2 → 3 → 4 → 5 → null
slow visits: 1, 2, 3        fast visits: 1, 3, 5 (end)
fast is at the end, so slow = 3 is the middle
```

**Step-by-step explanation:**

1. Start both pointers at the head.

2. Move `slow`  one step and `fast`  two steps while `fast`  and `fast.next`  exist.

3. Stop when `fast`  is at the last node (odd length) or `null` (even length).

4. `slow`  is the middle (the second middle for even lengths).

**Dry run on** `1→2→3→4` **:** start slow=1, fast=1; step: slow=2, fast=3; step: slow=3, fast=null; stop. Answer is node `3`.

```csharp
public ListNode? MiddleNode(ListNode? head)
{
    ListNode? slow = head, fast = head;
    while (fast?.next != null) { slow = slow!.next; fast = fast.next.next; }
    return slow;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** one node, two nodes.

## 83. Remove Duplicates from Sorted List

**What it asks:** delete duplicates so each value appears once. **Example:** `1→1→2→3→3` becomes `1→2→3`. **Idea:** the list is sorted, so equal values sit next to each other.

**Picture:**

```text
1 → 1 → 2 → 3 → 3
cur on first 1: next is also 1, skip it   →  1 → 2 → 3 → 3
cur on 2, then 3: values differ, move on
cur on 3: next is also 3, skip it         →  1 → 2 → 3
```

**Step-by-step explanation:**

1. Start at the head with a pointer `cur`.

2. Compare `cur.val`  with `cur.next.val`.

3. If they are equal, skip the next node: `cur.next = cur.next.next`. Do not move `cur`, because the new next node could also be a duplicate.

4. If they differ, move `cur`  forward.

5. Stop when there is no next node.

```csharp
public ListNode? DeleteDuplicates(ListNode? head)
{
    var cur = head;
    while (cur?.next != null)
    {
        if (cur.val == cur.next.val) cur.next = cur.next.next;   // unlink
the duplicate
        else cur = cur.next;                                      //
different value, move on
    }
    return head;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** all values equal, empty list.

## 203. Remove Linked List Elements

**What it asks:** remove every node whose value equals `val`. **Example:** `1→2→6→3→4→5→6`, val = 6 becomes `1→2→3→4→5`. **Idea:** use a dummy head so deleting the first node is no different from deleting any other.

**Picture:**

```text
dummy → 1 → 2 → 6 → 3 → 4 → 5 → 6          val = 6
skip each 6:  dummy → 1 → 2 ────→ 3 → 4 → 5 ────→ null
Result: 1 → 2 → 3 → 4 → 5
```

**Step-by-step explanation:**

1. Create `dummy`  pointing to `head`, and set `cur = dummy`.

2. Look one node ahead: if `cur.next.val == val`, unlink it with `cur.next =` `cur.next.next`.

3. Otherwise move `cur`  forward. Never move after a deletion, because the new next node might also match.

4. Return `dummy.next`.

```csharp
public ListNode? RemoveElements(ListNode? head, int val)
{
    var dummy = new ListNode(0, head);
    var cur = dummy;
    while (cur.next != null)
    {
        if (cur.next.val == val) cur.next = cur.next.next;   // delete
        else cur = cur.next;                                  // keep
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** the head matches, every node matches, empty list.

## 234. Palindrome Linked List

**What it asks:** return true if the list reads the same forwards and backwards. **Example:** `1→2→2→1`  returns `true`; `1→2`  returns `false`. **Idea:** reverse the second half and compare it with the first half.

**Picture:**

```text
1 → 2 → 2 → 1
middle: slow stops on the second 2
reverse the second half:   [2 → 1]  becomes  [1 → 2]
compare:  first half 1 → 2   with   reversed half 1 → 2    equal, so
palindrome
```

**Step-by-step explanation:**

1. Find the middle using fast and slow pointers (problem 876).

2. Reverse the list starting at the middle (problem 206). Now `prev`  is the head of the reversed second half.

3. Walk the first half from `head`  and the reversed half from `prev`  together.

4. If any pair of values differs, return `false`. If the reversed half is used up, return `true`.

5. For odd length the middle node is part of the second half and is compared with itself, which is fine.

**Dry run on** `1→2→2→1` **:** middle is the second `2`; reversed half is `1→2`; compare `1=1`, `2=2`, so it is a palindrome.

```csharp
public bool IsPalindrome(ListNode? head)
{
    ListNode? slow = head, fast = head;
    while (fast?.next != null) { slow = slow!.next; fast = fast.next.next; }
// find middle
    ListNode? prev = null;
// reverse second half
    while (slow != null) { var nx = slow.next; slow.next = prev; prev = slow;
slow = nx; }
    ListNode? l = head, r = prev;
// compare halves
    while (r != null)
    {
        if (l!.val != r.val) return false;
        l = l.next; r = r.next;
    }
    return true;
}
```

**Complexity:** O(n) time, O(1) space (copying values to a list is the simpler O(n)-space version). This changes the list; reverse the half again if you must restore it.

## 160. Intersection of Two Linked Lists

**What it asks:** return the node where two lists first share the same node in memory (not just the same value), or `null`  if they never meet. **Example:** A = `4→1→8→4→5`, B = `5→6→1→8→4→5`, sharing the tail from `8`; the answer is node `8`. **Idea:** make both pointers travel the same total distance so they line up at the meeting point.

**Picture:**

```text
A:  4 → 1 ↘
            8 → 4 → 5
B:  5 → 6 → 1 ↗
p walks A then B, q walks B then A: equal total distance,
so both arrive at node 8 on the same step
```

**Step-by-step explanation:**

1. Start `p`  at the head of A and `q`  at the head of B.

2. Move both one step at a time. When `p`  falls off the end of A, restart it at the head of B; when `q`  falls off B, restart it at the head of A.

3. Each pointer travels `lenA + lenB`  nodes in total, so after the swap the shorter and longer paths are equalised.

4. They meet at the intersection node. If there is none, they both become `null`  at the same time and the loop ends, returning `null`.

```csharp
public ListNode? GetIntersectionNode(ListNode? a, ListNode? b)
{
    ListNode? p = a, q = b;
    while (p != q)
    {
        p = p == null ? b : p.next;   // switch to the other list at the end
        q = q == null ? a : q.next;
    }
    return p;   // the intersection, or null
}
```

**Complexity:** O(n + m) time, O(1) space. **Edge cases:** no intersection, intersection at the head, one list empty.

# Medium problems, part 1

## 237. Delete Node in a Linked List

**What it asks:** delete a node when you are given only that node, not the head. The node is never the tail. **Example:** given node `5`  in `4→5→1→9`, the list becomes `4→1→9`. **Idea:** you cannot reach the previous node, so make this node a copy of the next node, then remove the next node.

**Picture:**

```text
4 → 5 → 1 → 9        node = 5
copy next value into node:   4 → 1 → 1 → 9
unlink the next node:        4 → 1 → 9
```

**Step-by-step explanation:**

1. Copy the next node's value into the given node: `node.val = node.next.val`. Now two nodes hold the same value.

2. Unlink the duplicate: `node.next = node.next.next`.

3. The list now reads as if the original node had been removed.

**Dry run on** `4→5→1→9` **, node =** `5` **:** copy 1 into it giving `4→1→1→9`, then skip the second `1` giving `4→1→9`.

```csharp
public void DeleteNode(ListNode node)
{
    node.val = node.next!.val;      // overwrite with the next value
    node.next = node.next.next;     // drop the next node
}
```

**Complexity:** O(1) time and space. **Caveat:** this works only because the node is not the tail and the problem guarantees it.

## 19. Remove Nth Node From End of List

**What it asks:** delete the nth node counting from the end, in one pass. **Example:** `1→2→3→4→5`, n = 2 becomes `1→2→3→5`. **Idea:** keep two pointers exactly n nodes apart; when the front one reaches the end, the back one is right before the node to delete.

**Picture:**

```text
dummy → 1 → 2 → 3 → 4 → 5        n = 2
fast moves 2 ahead:      slow = dummy,  fast = 2
move both until fast is the last node:  slow = 3,  fast = 5
unlink the node after slow:  dummy → 1 → 2 → 3 → 5
```

**Step-by-step explanation:**

1. Add a dummy node before the head so removing the first node needs no special case. Start `slow`  and `fast`  on the dummy.

2. Move `fast`  forward n steps. Now the gap between the pointers is n nodes.

3. Move both pointers one step at a time until `fast.next`  is `null`, meaning `fast`  is on the last node.

4. `slow`  is now the node just before the one to remove. Set `slow.next =` `slow.next.next`.

5. Return `dummy.next`.

**Dry run on** `1→2→3→4→5` **, n = 2:** fast moves to 2; then they move together until fast is 5, slow is 3; remove the node after 3 (which is 4), result `1→2→3→5`.

```csharp
public ListNode? RemoveNthFromEnd(ListNode? head, int n)
{
    var dummy = new ListNode(0, head);
    ListNode slow = dummy, fast = dummy;
    for (int i = 0; i < n; i++) fast = fast.next!;           // create the
gap
    while (fast.next != null) { slow = slow.next!; fast = fast.next; }
    slow.next = slow.next!.next;                              // skip the
target
    return dummy.next;
}
```

**Complexity:** O(n) time, one pass, O(1) space. **Edge cases:** removing the head, a one-node list.

## 2. Add Two Numbers

**What it asks:** two non-negative numbers are stored as lists with digits in reverse order; return their sum as a list in the same format. **Example:** `2→4→3`  + `5→6→4`  = `7→0→8` (342 + 465 = 807). **Idea:** add column by column like on paper, carrying the extra digit.

**Picture:**

```text
  2 → 4 → 3        (342, digits reversed)
+ 5 → 6 → 4        (465)
= 7 → 0 → 8        (807)
columns: 2+5=7   4+6=10 (write 0, carry 1)   3+4+1=8
```

**Step-by-step explanation:**

1. Use a dummy head and a `cur`  pointer to build the answer, and a `carry`  that starts at 0.

2. Loop while either list has a node or the carry is not zero.

3. Compute `sum = carry + digit1 + digit2`, treating a missing digit as 0.

4. Append a new node with `sum % 10`  and set `carry = sum / 10`.

5. Move to the next nodes of both input lists (if they exist).

6. Return `dummy.next`.

**Dry run on** `9→9`  **+** `1` **:** 9+1=10, write 0 carry 1; 9+0+1=10, write 0 carry 1; carry 1 remains, write 1; result `0→0→1` (99 + 1 = 100).

```csharp
public ListNode? AddTwoNumbers(ListNode? l1, ListNode? l2)
{
    var dummy = new ListNode();
    var cur = dummy;
    int carry = 0;
    while (l1 != null || l2 != null || carry != 0)
    {
        int sum = carry + (l1?.val ?? 0) + (l2?.val ?? 0);
        carry = sum / 10;
        cur.next = new ListNode(sum % 10);
        cur = cur.next;
        l1 = l1?.next;
        l2 = l2?.next;
    }
    return dummy.next;
}
```

**Complexity:** O(max(n, m)) time and space for the result. **Edge cases:** different lengths, a final carry.

## 142. Linked List Cycle II

**What it asks:** return the node where the cycle begins, or `null`  if there is no cycle.

**Example:** `3→2→0→-4`  with the tail linking back to node `2`  returns node `2`. **Idea:** use Floyd's meeting point, then restart one pointer from the head; both then meet at the cycle start.

**Picture:**

```csharp
3 → 2 → 0 → -4
    ↑          ↓
    └──────────┘      the cycle starts at node 2
1) slow and fast meet inside the loop (here at -4)
2) slow restarts at the head; both now move 1 step at a time
   they meet at node 2, the cycle start
```

**Step-by-step explanation:**

1. Run slow (1 step) and fast (2 steps) pointers. If fast reaches `null`, there is no cycle: return `null`.

2. When slow equals fast, a cycle exists and they have met somewhere inside it.

3. Move `slow`  back to the head, keep `fast`  at the meeting point, and move both one step at a time.

4. They meet again exactly at the first node of the cycle.

**Why step 4 works:** let the distance from the head to the cycle start be `a`, and from the start to the meeting point be `b`, with cycle length `c`. When they meet, slow has walked `a` `+ b`  and fast `2(a + b)`, so the extra `a + b`  is a whole number of laps: `a + b = k*c`. So `a` `= k*c - b`: walking `a`  steps from the meeting point lands on the cycle start, the same place a pointer from the head reaches after `a`  steps.

```csharp
public ListNode? DetectCycle(ListNode? head)
{
    ListNode? slow = head, fast = head;
    while (fast?.next != null)
    {
        slow = slow!.next;
        fast = fast.next.next;
        if (slow == fast)                       // cycle found
        {
            slow = head;                        // restart one pointer
            while (slow != fast) { slow = slow!.next; fast = fast!.next; }
            return slow;                        // cycle start
        }
    }
    return null;
}
```

**Complexity:** O(n) time, O(1) space.

## 24. Swap Nodes in Pairs

**What it asks:** swap every two adjacent nodes by changing links, not values. **Example:** `1→2→3→4`  becomes `2→1→4→3`. **Idea:** for each pair, rewire three links using a pointer that sits just before the pair.

**Picture:**

```text
dummy → 1 → 2 → 3 → 4
swap pair (1, 2):  dummy → 2 → 1 → 3 → 4
swap pair (3, 4):  dummy → 2 → 1 → 4 → 3
```

**Step-by-step explanation:**

1. Use a dummy head; `prev`  starts on the dummy and always points at the node before the current pair.

2. While two nodes exist after `prev`, name them `a = prev.next`  and `b = a.next`.

3. Rewire: `a.next = b.next` (a now points past the pair), `b.next = a` (b points back to a), `prev.next = b` (the pair is now b then a).

4. Move `prev`  to `a`, which is now the last node of the swapped pair.

5. Return `dummy.next`.

**Dry run on** `1→2→3→4` **:** first pair gives `2→1→3→4`, prev is 1; second pair gives `2→1→4→3`.

```csharp
public ListNode? SwapPairs(ListNode? head)
{
    var dummy = new ListNode(0, head);
    var prev = dummy;
    while (prev.next?.next != null)
    {
        var a = prev.next;
        var b = a.next!;
        a.next = b.next;    // a points past the pair
        b.next = a;         // b points back to a
        prev.next = b;      // connect the previous part to b
        prev = a;           // move to the end of the swapped pair
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** odd length (the last node stays), empty list. Swap nodes, never values, as the problem requires.

## 328. Odd Even Linked List

**What it asks:** group all nodes at odd positions first, then the nodes at even positions, keeping their relative order. Position matters, not the value. **Example:** `1→2→3→4→5` becomes `1→3→5→2→4`. **Idea:** build two chains in place (odd and even) and join them.

**Picture:**

```text
1 → 2 → 3 → 4 → 5
odd chain:   1 → 3 → 5
even chain:  2 → 4
join:        1 → 3 → 5 → 2 → 4
```

**Step-by-step explanation:**

1. If there are fewer than two nodes, return the head.

2. Set `odd = head`, `even = head.next`, and remember `evenHead = even`.

3. Loop while `even`  and `even.next`  exist: link `odd.next`  to `even.next`  and move `odd`; then link `even.next`  to the new `odd.next`  and move `even`.

4. At the end, attach the even chain after the odd chain: `odd.next = evenHead`.

**Dry run on** `1→2→3→4→5` **:** odd chain becomes `1→3→5`, even chain becomes `2→4`, join to `1→3→5→2→4`.

```csharp
public ListNode? OddEvenList(ListNode? head)
{
    if (head?.next == null) return head;
    ListNode odd = head, even = head.next!, evenHead = even;
    while (even?.next != null)
    {
        odd.next = even.next;  odd = odd.next;      // extend odd chain
        even.next = odd.next;  even = even.next!;   // extend even chain
    }
    odd.next = evenHead;                            // join the chains
    return head;
}
```

**Complexity:** O(n) time, O(1) space.

## 61. Rotate List

**What it asks:** rotate the list to the right by `k`  places. **Example:** `1→2→3→4→5`, k = 2 becomes `4→5→1→2→3`. **Idea:** turn the list into a ring, then cut it at the right spot.

**Picture:**

```text
1 → 2 → 3 → 4 → 5        k = 2
make a ring: tail 5 points to head 1
new tail = node 3 (length 5 minus k 2 = 3 steps from the head)
cut after node 3:   4 → 5 → 1 → 2 → 3
```

**Step-by-step explanation:**

1. Walk the list to count its length and find the tail.

2. Reduce `k`  with `k % length`, because rotating by the full length changes nothing. If `k`  is 0, return the head.

3. Connect the tail to the head, making a ring.

4. The new tail is the node `length - k`  steps from the head, and the new head is the node after it.

5. Cut the ring by setting `newTail.next = null`.

**Dry run on** `1→2→3→4→5` **, k = 2:** length 5, ring made, new tail is the 3rd node ( `3`), new head is `4`, cut gives `4→5→1→2→3`.

```csharp
public ListNode? RotateRight(ListNode? head, int k)
{
    if (head?.next == null || k == 0) return head;
    int len = 1;
    var tail = head;
    while (tail.next != null) { tail = tail.next; len++; }
    k %= len;
    if (k == 0) return head;
    tail.next = head;                                   // make a ring
    var newTail = head;
    for (int i = 0; i < len - k - 1; i++) newTail = newTail.next!;
    var newHead = newTail.next;
    newTail.next = null;                                // cut the ring
    return newHead;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** k larger than the length, k = 0, empty list.

## 92. Reverse Linked List II

**What it asks:** reverse only the nodes from position `left`  to position `right` (1-based).

**Example:** `1→2→3→4→5`, left = 2, right = 4 becomes `1→4→3→2→5`. **Idea:** one by one, take the node after `cur`  and move it to the front of the section.

**Picture:**

```text
1 → 2 → 3 → 4 → 5        left = 2, right = 4        prev = 1, cur = 2
move 3 to the front of the section:  1 → 3 → 2 → 4 → 5
move 4 to the front of the section:  1 → 4 → 3 → 2 → 5
```

**Step-by-step explanation:**

1. Use a dummy head and walk `prev`  to the node just before position `left`.

2. Let `cur = prev.next`; this node ends up at the end of the reversed section.

3. Repeat `right - left`  times: take `next = cur.next`, unlink it ( `cur.next =` `next.next`), then insert it at the front of the section ( `next.next = prev.next`, `prev.next = next`).

4. Return `dummy.next`.

**Dry run on** `1→2→3→4→5` **, left 2, right 4:** prev = 1, cur = 2. Move 3 to the front: `1→3→2→4→5`. Move 4 to the front: `1→4→3→2→5`. Done after two moves.

```csharp
public ListNode? ReverseBetween(ListNode? head, int left, int right)
{
    var dummy = new ListNode(0, head);
    var prev = dummy;
    for (int i = 0; i < left - 1; i++) prev = prev.next!;   // node before
the section
    var cur = prev.next!;                                   // stays as the
section's tail
    for (int i = 0; i < right - left; i++)
    {
        var next = cur.next!;
        cur.next = next.next;       // detach next
        next.next = prev.next;      // put it at the front of the section
        prev.next = next;
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, O(1) space, one pass. **Edge cases:** left = 1 (the head changes, which the dummy handles), left = right (no change).

# Medium problems, part 2

## 143. Reorder List

**What it asks:** reorder `L0→L1→…→Ln`  into `L0→Ln→L1→Ln-1→…`  in place, without changing node values. **Example:** `1→2→3→4→5`  becomes `1→5→2→4→3`. **Idea:** split in the middle, reverse the second half, then weave the two halves together.

**Picture:**

```text
Start:            1 → 2 → 3 → 4 → 5
Split at middle:  1 → 2 → 3        4 → 5
Reverse 2nd half: 1 → 2 → 3        5 → 4
Weave (take one from each, alternately):
                  1 → 5 → 2 → 4 → 3
```

**Step-by-step explanation:**

1. Find the middle with slow and fast pointers. `slow`  ends on the last node of the first half.

2. Cut the list: `second = slow.next; slow.next = null`. Without this cut the weave creates a cycle.

3. Reverse `second`  with the loop from problem 206.

4. Weave: while `second`  has nodes, save both `next`  pointers, point `first.next`  at `second`, point `second.next`  at the saved first-half node, and advance both.

```csharp
public void ReorderList(ListNode? head)
{
    if (head?.next == null) return;
    ListNode slow = head, fast = head;                       // 1. find the
middle
    while (fast.next?.next != null) { slow = slow.next!; fast =
fast.next.next; }
    ListNode? second = slow.next, prev = null;
    slow.next = null;                                         // 2. cut in
two
    while (second != null)                                    // 3. reverse
the second half
    {
        var nx = second.next; second.next = prev; prev = second; second = nx;
    }
    ListNode? first = head; second = prev;                    // 4. weave
    while (second != null)
    {
        var t1 = first!.next; var t2 = second.next;
        first.next = second;
        second.next = t1;
        first = t1; second = t2;
    }
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** one or two nodes, odd and even lengths.

## 148. Sort List

**What it asks:** sort a linked list in ascending order in O(n log n) time. **Example:** `4→2→1→3` becomes `1→2→3→4`. **Idea:** merge sort suits linked lists because splitting needs only a pointer walk and merging needs no extra array (reuse problem 21).

**Picture:**

```text
4 → 2 → 1 → 3
   split
4 → 2        1 → 3
 split          split
4    2        1    3
   merge          merge
2 → 4        1 → 3
         merge
   1 → 2 → 3 → 4
```

**Step-by-step explanation:**

1. Base case: an empty list or a single node is already sorted.

2. Find the middle with slow and fast pointers (start `fast`  one step ahead so the first half is not longer than the second).

3. Cut after the middle: `right = slow.next; slow.next = null`.

4. Sort both halves recursively.

5. Merge the sorted halves with `MergeTwoLists`  from problem 21.

```csharp
public ListNode? SortList(ListNode? head)
{
    if (head?.next == null) return head;                      // base case
    ListNode slow = head, fast = head.next;                   // find the
middle
    while (fast?.next != null) { slow = slow.next!; fast = fast.next.next; }
    var right = slow.next;
    slow.next = null;                                         // split
    return MergeTwoLists(SortList(head), SortList(right));    // sort both,
then merge
}
// MergeTwoLists is the method from problem 21.
```

**Complexity:** O(n log n) time, O(log n) recursion stack. A bottom-up version removes the recursion for O(1) extra space. **Edge cases:** empty list, duplicates, already sorted.

## 138. Copy List with Random Pointer

**What it asks:** make a deep copy of a list where each node also has a `random`  pointer to any node (or `null`). No copied node may point into the original list. **Example:** original `A→B→C`  with `A.random = C`, `B.random = A`; the copy has new nodes `A'→B'→C'`  with `A'.random = C'`, `B'.random = A'`. **Idea:** a dictionary maps every original node to its copy, so you can wire the pointers in a second pass.

**Picture:**

```text
Original:   A → B → C        random: A→C, B→A, C→null
            |   |   |
map:        A'  B'  C'       (dictionary: original → copy)
Copy:       A' → B' → C'     random: A'→C', B'→A', C'→null
```

**Step-by-step explanation:**

1. Pass one: walk the original list and create a copy of each node, storing `map[original]` `= copy`. Copy only the value for now.

2. Pass two: walk again; set `map[cur].next = map[cur.next]`  and `map[cur].random =` `map[cur.random]` (when those are not `null`).

3. Return `map[head]`.

```csharp
public class Node
{
    public int val; public Node? next, random;
    public Node(int val) { this.val = val; }
}
public Node? CopyRandomList(Node? head)
{
    if (head == null) return null;
    var map = new Dictionary<Node, Node>();
    for (var c = head; c != null; c = c.next) map[c] = new Node(c.val);   //
pass 1: copies
    for (var c = head; c != null; c = c.next)                              //
pass 2: wire pointers
    {
        map[c].next   = c.next   != null ? map[c.next]   : null;
        map[c].random = c.random != null ? map[c.random] : null;
    }
    return map[head];
}
```

**Complexity:** O(n) time, O(n) space. **Follow-up for O(1) extra space:** insert each copy right after its original ( `A→A'→B→B'→…`), set `A'.random = A.random.next`, then separate the two lists. **Edge cases:** empty list, `random`  pointing to itself or `null`.

## 146. LRU Cache

**What it asks:** design a cache with `Get(key)`  and `Put(key, value)`, both O(1). When the cache is full, `Put`  evicts the least recently used key. **Example:** capacity 2: `Put(1,1)`, `Put(2,2)`, `Get(1)`  returns 1, `Put(3,3)`  evicts key 2, `Get(2)`  returns -1. **Idea:** a doubly linked list keeps keys in order of use (front = most recent), and a dictionary jumps straight to any node.

**Picture:**

```text
Dictionary:  key → node
Most recent                         Least recent
   front ⇄  [3]  ⇄  [1]  ⇄  [2]  ⇄  back
   Get(1): move [1] to the front  →  [1] ⇄ [3] ⇄ [2]
   Put(4) when full: drop the back [2], add [4] at the front
```

**Step-by-step explanation:**

1. `Get`: if the key is missing return -1. Otherwise remove its node from the list, add it at the front, and return the value.

2. `Put`  on an existing key: remove the old node, then insert a new node with the new value at the front.

3. `Put`  on a new key when full: remove the last node of the list and its dictionary entry first.

4. Insert the new node at the front and store it in the dictionary.

5. .NET's `LinkedList<T>`  removes a node in O(1) when you hold the `LinkedListNode`, so it fits perfectly.

```csharp
public class LRUCache
{
    private readonly int _cap;
    private readonly Dictionary<int, LinkedListNode<(int key, int val)>> _map
= new();
    private readonly LinkedList<(int key, int val)> _list = new();
    public LRUCache(int capacity) => _cap = capacity;
    public int Get(int key)
    {
        if (!_map.TryGetValue(key, out var node)) return -1;
        _list.Remove(node); _list.AddFirst(node);       // mark as most
recent
        return node.Value.val;
    }
    public void Put(int key, int value)
    {
        if (_map.TryGetValue(key, out var node))
        {
            _list.Remove(node);                          // replace the old
entry
            _map.Remove(key);
        }
        else if (_map.Count == _cap)
        {
            var last = _list.Last!;                      // evict least
recently used
            _map.Remove(last.Value.key);
            _list.RemoveLast();
        }
        _map[key] = _list.AddFirst((key, value));
    }
}
```

**Complexity:** O(1) per operation, O(capacity) space. **Edge cases:** capacity 1, updating an existing key.

## 82. Remove Duplicates from Sorted List II

**What it asks:** delete every value that appears more than once, so none of the duplicated values remain. **Example:** `1→2→3→3→4→4→5`  becomes `1→2→5`. **Idea:** unlike problem 83, even the first copy goes. A dummy head and a `prev`  pointer let you skip the whole run of equal values.

**Picture:**

```text
dummy → 1 → 2 → 3 → 3 → 4 → 4 → 5
                 prev=2   └ run of 3s ┘
  prev.next jumps over both 3s → 4 → 4 → 5, then over both 4s → 5
Result: 1 → 2 → 5
```

**Step-by-step explanation:**

1. Create a dummy node before the head and set `prev = dummy`.

2. Look at `head`. If `head.val == head.next.val`, remember the value and move `head` forward until the value changes. Then set `prev.next = head`, which removes the whole run. `prev`  does not move.

3. Otherwise this value is unique: move `prev`  forward and move `head`  forward.

4. Return `dummy.next`.

```csharp
public ListNode? DeleteDuplicates(ListNode? head)
{
    var dummy = new ListNode(0, head);
    var prev = dummy;
    while (head != null)
    {
        if (head.next != null && head.val == head.next.val)
        {
            int dup = head.val;
            while (head != null && head.val == dup) head = head.next;   //
skip the whole run
            prev.next = head;
        }
        else
        {
            prev = prev.next!;      // unique value, keep it
            head = head.next;
        }
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** duplicates at the head, duplicates at the tail, every value duplicated.

## 86. Partition List

**What it asks:** put all nodes with value less than `x`  before nodes with value greater than or equal to `x`, keeping the original relative order inside each group. **Example:** `1→4→3→2→5→2`, x = 3 becomes `1→2→2→4→3→5`. **Idea:** build two lists (small and large) in one pass, then join them.

**Picture:**

```text
Input:  1 → 4 → 3 → 2 → 5 → 2        x = 3
small:  1 → 2 → 2
large:  4 → 3 → 5
Join:   1 → 2 → 2 → 4 → 3 → 5
```

**Step-by-step explanation:**

1. Make two dummy heads and two tail pointers, `small`  and `large`.

2. Walk the list; append each node to the small tail when `val < x`, otherwise to the large tail.

3. Set `large.next = null`. If you forget this, the last large node may still point into the list and create a cycle.

4. Connect `small.next = largeHead.next`  and return `smallHead.next`.

```csharp
public ListNode? Partition(ListNode? head, int x)
{
    var smallHead = new ListNode(); var largeHead = new ListNode();
    ListNode small = smallHead, large = largeHead;
    for (var cur = head; cur != null; cur = cur.next)
    {
        if (cur.val < x) { small.next = cur; small = cur; }
        else             { large.next = cur; large = cur; }
    }
    large.next = null;                  // important: avoid a cycle
    small.next = largeHead.next;        // join the two lists
    return smallHead.next;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** every value small, every value large, empty list.

## 445. Add Two Numbers II

**What it asks:** add two numbers stored in lists with the most significant digit first, and return the sum in the same format. Do it without reversing the input lists. **Example:** `7→2→4→3`  + `5→6→4`  = `7→8→0→7` (7243 + 564 = 7807). **Idea:** a stack gives you the digits from the end. Pop and add with a carry, and build the answer by putting each new node at the front.

**Picture:**

```text
stack1 (top first): 3, 4, 2, 7        stack2 (top first): 4, 6, 5
3+4=7  → 7
4+6=10 → 0 carry 1       answer built at the front each time:
2+5+1=8 → 8                  7 → null, then 0 → 7, then 8 → 0 → 7, then 7 → 8
→ 0 → 7
7      → 7
```

**Step-by-step explanation:**

1. Push every digit of each list onto its own stack.

2. Loop while either stack has digits or the carry is non-zero.

3. `sum = carry + pop1 + pop2` (use 0 for an empty stack). Digit is `sum % 10`, new carry is `sum / 10`.

4. Make a node for the digit whose `next`  is the current answer head, and make it the new head.

```csharp
public ListNode? AddTwoNumbers(ListNode? l1, ListNode? l2)
{
    var s1 = new Stack<int>(); var s2 = new Stack<int>();
    for (; l1 != null; l1 = l1.next) s1.Push(l1.val);
    for (; l2 != null; l2 = l2.next) s2.Push(l2.val);
    ListNode? head = null;
    int carry = 0;
    while (s1.Count > 0 || s2.Count > 0 || carry != 0)
    {
        int sum = carry + (s1.Count > 0 ? s1.Pop() : 0) + (s2.Count > 0 ?
s2.Pop() : 0);
        carry = sum / 10;
        head = new ListNode(sum % 10, head);      // put the new digit at the
front
    }
    return head;
}
```

**Complexity:** O(n + m) time and space. **Edge cases:** different lengths, a final carry such as `5`  + `5`  giving `1→0`.

## 707. Design Linked List

**What it asks:** build your own singly linked list class with `Get(index)`, `AddAtHead`, `AddAtTail`, `AddAtIndex(index, val)`  and `DeleteAtIndex(index)`. **Idea:** keep a sentinel (dummy) head node and a size counter. With a sentinel, inserting or deleting at index 0 works like any other position.

**Picture:**

```csharp
sentinel → [a] → [b] → [c] → null        size = 3
AddAtIndex(1, x): find the node before index 1 (the sentinel's next is index
0 ...)
   prev = sentinel → [a]; insert x after prev:  sentinel → [a] → [x] → [b] →
[c]
```

**Step-by-step explanation:**

1. Start with a sentinel node and `size = 0`.

2. `Get(i)`: return -1 if `i`  is out of range; otherwise walk `i`  steps from the first real node.

3. `AddAtIndex(i, v)`: ignore it if `i < 0`  or `i > size`. Walk `prev`  from the sentinel `i` steps, then `prev.next = new ListNode(v, prev.next)`  and `size++`.

4. `AddAtHead`  is `AddAtIndex(0, v)`  and `AddAtTail`  is `AddAtIndex(size, v)`.

5. `DeleteAtIndex(i)`: ignore if out of range; walk `prev`  to the node before it and set `prev.next = prev.next.next`, then `size--`.

```csharp
public class MyLinkedList
{
    private readonly ListNode _head = new();     // sentinel
    private int _size;
    public int Get(int index)
    {
        if (index < 0 || index >= _size) return -1;
        var cur = _head.next!;
        for (int i = 0; i < index; i++) cur = cur.next!;
        return cur.val;
    }
    public void AddAtHead(int val) => AddAtIndex(0, val);
    public void AddAtTail(int val) => AddAtIndex(_size, val);
    public void AddAtIndex(int index, int val)
    {
        if (index < 0 || index > _size) return;
        var prev = _head;
        for (int i = 0; i < index; i++) prev = prev.next!;
        prev.next = new ListNode(val, prev.next);
        _size++;
    }
    public void DeleteAtIndex(int index)
    {
        if (index < 0 || index >= _size) return;
        var prev = _head;
        for (int i = 0; i < index; i++) prev = prev.next!;
        prev.next = prev.next!.next;
        _size--;
    }
}
```

**Complexity:** `AddAtHead`  is O(1); the others are O(n). Keeping a tail pointer would make `AddAtTail`  O(1).

# Hard problems

## 25. Reverse Nodes in k-Group

**What it asks:** reverse the nodes of the list `k`  at a time and return the modified list. If fewer than `k`  nodes remain at the end, leave them as they are. Only node links may change, never values. **Example:** `1→2→3→4→5`, k = 2 becomes `2→1→4→3→5`; with k = 3 it becomes `3→2→1→4→5`. **Idea:** for each block, check that k nodes exist, reverse exactly those k nodes, and reconnect the block to the part before and after it.

**Picture (k = 3):**

```text
dummy → [1 → 2 → 3] → [4 → 5 → 6] → 7
         block 1         block 2        leftover (1 node, k = 3), stays
reverse block 1:  dummy → 3 → 2 → 1 → [4 → 5 → 6] → 7
reverse block 2:  dummy → 3 → 2 → 1 → 6 → 5 → 4 → 7
```

**Step-by-step explanation:**

1. Use a dummy head. `groupPrev`  is the node just before the current block; it starts on the dummy.

2. Find `kth`, the k-th node after `groupPrev`. If it does not exist, fewer than k nodes remain: stop.

3. Remember `groupNext = kth.next`, the first node after the block.

4. Reverse the k nodes with the usual loop, but start with `prev = groupNext`  instead of `null`. Then the old first node of the block automatically points to the rest of the list.

5. Reconnect: the old first node ( `groupPrev.next`  before reversing) is now the block's tail. Set `groupPrev.next = kth` (the new block head) and move `groupPrev`  to that old first node.

6. Repeat from step 2.

```csharp
public ListNode? ReverseKGroup(ListNode? head, int k)
{
    var dummy = new ListNode(0, head);
    var groupPrev = dummy;
    while (true)
    {
        var kth = groupPrev;
        for (int i = 0; i < k && kth != null; i++) kth = kth.next;
        if (kth == null) break;                         // fewer than k nodes
left
        var groupNext = kth.next;
        ListNode? prev = groupNext, cur = groupPrev.next;
        while (cur != groupNext)                        // reverse the k
nodes
        {
            var nx = cur!.next; cur.next = prev; prev = cur; cur = nx;
        }
        var oldFirst = groupPrev.next;                  // becomes the
block's tail
        groupPrev.next = kth;                           // connect to the new
block head
        groupPrev = oldFirst!;
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** k = 1 (no change), k equal to the length, k larger than the length.

## 23. Merge k Sorted Lists

**What it asks:** merge an array of `k`  sorted lists into one sorted list. **Example:** `[1→4→5,` `1→3→4, 2→6]`  becomes `1→1→2→3→4→4→5→6`. **Idea:** keep the current front node of every list in a min-heap; the smallest of them is always the next node of the answer.

**Picture:**

```csharp
list A: 1 → 4 → 5       heap holds the front of each list: {1(A), 1(B), 2(C)}
list B: 1 → 3 → 4       pop 1(A) → answer: 1   push A's next (4)  heap {1(B),
2(C), 4(A)}
list C: 2 → 6           pop 1(B) → answer: 1 → 1 push B's next (3) ...
```

**Step-by-step explanation:**

1. Create a `PriorityQueue<ListNode, int>`  whose priority is the node's value (it is a min-heap).

2. Enqueue the head of every non-empty list.

3. Use a dummy head and a `tail`  pointer. While the heap is not empty: dequeue the smallest node, append it to `tail`, and enqueue its `next`  node if it exists.

4. Return `dummy.next`.

```csharp
public ListNode? MergeKLists(ListNode?[] lists)
{
    var pq = new PriorityQueue<ListNode, int>();
    foreach (var l in lists) if (l != null) pq.Enqueue(l, l.val);   // fronts
of all lists
    var dummy = new ListNode();
    var tail = dummy;
    while (pq.Count > 0)
    {
        var node = pq.Dequeue();                                     //
smallest front node
        tail.next = node; tail = node;
        if (node.next != null) pq.Enqueue(node.next, node.next.val); // next
from the same list
    }
    return dummy.next;
}
```

**Complexity:** O(N log k) time for N total nodes, O(k) space. **Alternative:** merge lists in pairs (divide and conquer) using problem 21, also O(N log k). **Edge cases:** empty array, all lists empty, some lists empty.

# Related problems: more linked-list practice

These problems use the same ideas as the ones above. Do them after the main list; each says which earlier problem it builds on. LeetCode problem numbers and titles can change over time, so confirm each on the site.

| LeetCode | Problem | Level | Builds on |
|---|---|---|---|
| 1290 | Convert Binary Number in a Linked List to Integer | Easy | simple traversal |
| 2095 | Delete the Middle Node of a Linked List | Medium | 876 and 19 |
| LeetCode | Problem | Level | Builds on |
| 1721 | Swapping Nodes in a Linked List | Medium | 19 (gap pointers) |
| 2130 | Maximum Twin Sum of a Linked List | Medium | 876, 206, 234 |
| 1669 | Merge In Between Linked Lists | Medium | relinking |
| 725 | Split Linked List in Parts | Medium | length + cut |
| 2181 | Merge Nodes in Between Zeros | Medium | running sum |
| 2487 | Remove Nodes From Linked List | Medium | 206 + running maximum |
| 2816 | Double a Number Represented as a Linked List | Medium | 2 and 445 (carry) |
| 147 | Insertion Sort List | Medium | 148 (sorting) |
| 430 | Flatten a Multilevel Doubly Linked List | Medium | doubly linked relinking |
| 109 | Convert Sorted List to Binary Search Tree | Medium | 876 (middle) + recursion |

## 1290. Convert Binary Number in a Linked List to Integer

**What it asks:** the list holds the bits of a binary number, most significant bit first. Return its decimal value. **Example:** `1→0→1`  is binary `101`, which is `5`. **Idea:** read left to right; for each bit, double the number so far and add the bit.

**Picture:**

```text
1 → 0 → 1
number: 0 → (0*2+1)=1 → (1*2+0)=2 → (2*2+1)=5
```

**Step-by-step explanation:** start with `result = 0`; for every node do `result = result *` `2 + node.val` (or `(result << 1) | node.val`). The list has at most 30 nodes, so `int`  is enough.

```csharp
public int GetDecimalValue(ListNode? head)
{
    int result = 0;
    for (var cur = head; cur != null; cur = cur.next)
        result = (result << 1) | cur.val;     // shift left, then add the new
bit
    return result;
}
```

**Complexity:** O(n) time, O(1) space.

## 2095. Delete the Middle Node of a Linked List

**What it asks:** delete the middle node. For length `n`, the middle is the node at 0-based index `floor(n / 2)`; a one-node list becomes empty. **Example:** `1→3→4→7→1→2→6`  becomes `1→3→4→1→2→6` (the `7`  is removed). **Idea:** the fast and slow pointers of problem 876, but stop `slow`  one node early so you can unlink the middle.

**Picture:**

```text
1 → 2 → 3 → 4 → 5
    slow   fast starts two ahead
slow stops on 2 (the node before the middle 3)  →  2.next = 2.next.next
Result: 1 → 2 → 4 → 5
```

**Step-by-step explanation:**

1. If the list has one node, return `null`.

2. Start `slow`  at the head and `fast`  two nodes ahead ( `head.next.next`).

3. While `fast`  and `fast.next`  exist, move `slow`  one step and `fast`  two steps.

4. `slow`  is now just before the middle. Delete it with `slow.next = slow.next.next`.

```csharp
public ListNode? DeleteMiddle(ListNode? head)
{
    if (head?.next == null) return null;
    ListNode slow = head;
    ListNode? fast = head.next.next;
    while (fast?.next != null) { slow = slow.next!; fast = fast.next.next; }
    slow.next = slow.next!.next;              // unlink the middle
    return head;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** one node, two nodes.

## 1721. Swapping Nodes in a Linked List

**What it asks:** swap the values of the k-th node from the start and the k-th node from the end (1-based). **Example:** `1→2→3→4→5`, k = 2 becomes `1→4→3→2→5`. **Idea:** find the first node by walking k - 1 steps; then use the gap-pointer trick from problem 19 to find the k-th from the end.

**Picture:**

```csharp
1 → 2 → 3 → 4 → 5        k = 2
first = node 2 (1 step from head)
fast starts at first and runs to the last node (5); second starts at head and
moves with it
second ends on 4  →  swap the values of 2 and 4
```

**Step-by-step explanation:**

1. Move `first`  k - 1 steps from the head.

2. Set `fast = first`  and `second = head`.

3. Move `fast`  until `fast.next`  is `null`, moving `second`  each time. `second`  lands on the k-th node from the end.

4. Swap `first.val`  and `second.val`.

```csharp
public ListNode? SwapNodes(ListNode? head, int k)
{
    var first = head!;
    for (int i = 0; i < k - 1; i++) first = first.next!;
    var fast = first;
    var second = head!;
    while (fast.next != null) { fast = fast.next; second = second.next!; }
    (first.val, second.val) = (second.val, first.val);   // swap values
    return head;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** k at the head or the tail, the middle node (both pointers are the same node), a one-node list.

## 2130. Maximum Twin Sum of a Linked List

**What it asks:** the list has an even length `n`. The twin of node `i`  is node `n - 1 - i`. Return the largest sum of a node and its twin. **Example:** `5→4→2→1`: twins are (5, 1) and (4, 2), sums 6 and 6, answer `6`. **Idea:** reverse the second half, then walk both halves together and take the maximum sum.

**Picture:**

```text
5 → 4 → 2 → 1
      second half starts at 2
reverse second half:   2 → 1  becomes  1 → 2
walk together: (5,1) = 6   (4,2) = 6   →  maximum 6
```

**Step-by-step explanation:**

1. Find the start of the second half: move `slow`  one step and `fast`  two steps until `fast` falls off the end. `slow`  is the first node of the second half.

2. Reverse the list starting at `slow` (problem 206).

3. Walk `l`  from the head and `r`  from the reversed half together; compute `l.val +` `r.val`  and keep the maximum.

```csharp
public int PairSum(ListNode? head)
{
    ListNode? slow = head, fast = head;
    while (fast != null && fast.next != null) { slow = slow!.next; fast =
fast.next.next; }
    ListNode? prev = null;                                    // reverse the
second half
    while (slow != null) { var nx = slow.next; slow.next = prev; prev = slow;
slow = nx; }
    int best = 0;
    ListNode? l = head, r = prev;
    while (r != null)
    {
        best = Math.Max(best, l!.val + r.val);
        l = l.next; r = r.next;
    }
    return best;
}
```

**Complexity:** O(n) time, O(1) space.

## 1669. Merge In Between Linked Lists

**What it asks:** remove the nodes of `list1`  from index `a`  to index `b`, and put all of `list2` in their place. **Example:** `list1 = 10→1→13→6→9→5`, a = 3, b = 4, `list2 =` `1000000→1000001→1000002`  gives `10→1→13→1000000→1000001→1000002→5`. **Idea:** find the node before index `a`  and the node after index `b`, then connect them to the two ends of `list2`.

**Picture:**

```text
list1:  10 → 1 → 13 → [6 → 9] → 5        remove indexes 3..4
                 ^before   ^after
list2:                 [L2a → … → L2z]
Result: 10 → 1 → 13 → L2a → … → L2z → 5
```

**Step-by-step explanation:**

1. Walk `before`  to the node at index `a - 1`.

2. Walk `after`  from `before`  to the node at index `b + 1` (that is `b - a + 2`  steps).

3. Point `before.next`  at the head of `list2`.

4. Walk to the tail of `list2`  and point its `next`  at `after`.

```csharp
public ListNode? MergeInBetween(ListNode list1, int a, int b, ListNode list2)
{
    var before = list1;
    for (int i = 0; i < a - 1; i++) before = before.next!;
    var after = before;
    for (int i = 0; i < b - a + 2; i++) after = after.next!;
    before.next = list2;                  // connect the front part to list2
    var tail = list2;
    while (tail.next != null) tail = tail.next;
    tail.next = after;                    // connect list2 to the rest
    return list1;
}
```

**Complexity:** O(n + m) time, O(1) space. The problem guarantees `a >= 1`, so `before` always exists.

## 725. Split Linked List in Parts

**What it asks:** split the list into `k`  consecutive parts. Part sizes may differ by at most one, and earlier parts must not be smaller than later ones. Some parts may be empty ( `null`).

**Example:** `1→2→3→4→5→6→7→8→9→10`, k = 3 gives parts `1→2→3→4`, `5→6→7`, `8→9→10`. **Idea:** with length `n`, every part gets `n / k`  nodes and the first `n % k`  parts get one extra.

**Picture:**

```text
n = 10, k = 3  →  base size 3, extra 1 (10 % 3)
part 1: 4 nodes (base + 1)    part 2: 3 nodes    part 3: 3 nodes
[1→2→3→4]  [5→6→7]  [8→9→10]
```

**Step-by-step explanation:**

1. Count the nodes ( `n`), then compute `size = n / k`  and `extra = n % k`.

2. For part `i`, the head is the current node. Take `size + (i < extra ? 1 : 0)`  nodes.

3. Walk to the last node of the part, remember its `next`, set `next = null`  to cut, and continue from the remembered node.

4. If the list runs out, the remaining parts stay `null`.

```csharp
public ListNode?[] SplitListToParts(ListNode? head, int k)
{
    int n = 0;
    for (var c = head; c != null; c = c.next) n++;
    int size = n / k, extra = n % k;
    var parts = new ListNode?[k];
    var cur = head;
    for (int i = 0; i < k; i++)
    {
        parts[i] = cur;
        int take = size + (i < extra ? 1 : 0);
        for (int j = 0; j < take - 1 && cur != null; j++) cur = cur.next;
// go to the part's last node
        if (cur != null)
        {
            var next = cur.next;
            cur.next = null;               // cut this part off
            cur = next;
        }
    }
    return parts;
}
```

**Complexity:** O(n + k) time, O(k) for the returned array. **Edge cases:** k greater than the length (trailing parts are `null`), empty list.

## 2181. Merge Nodes in Between Zeros

**What it asks:** the list starts and ends with `0`, and there are no two adjacent zeros. Replace every run of numbers between two zeros with one node holding their sum. The result contains no zeros. **Example:** `0→3→1→0→4→5→2→0`  becomes `4→11`. **Idea:** walk once, keep a running sum, and write a node whenever you meet a zero.

**Picture:**

```text
0 → 3 → 1 → 0 → 4 → 5 → 2 → 0
    └ 3+1=4 ┘    └ 4+5+2=11 ┘
Result: 4 → 11
```

**Step-by-step explanation:**

1. Start after the first zero ( `cur = head.next`) with `sum = 0`, and a dummy head for the answer.

2. If `cur.val`  is not zero, add it to `sum`.

3. If it is zero, the group ended: append a new node holding `sum`  to the answer and reset `sum = 0`.

4. Continue to the end; the last node is a zero, so the final group is always written.

```csharp
public ListNode? MergeNodes(ListNode? head)
{
    var dummy = new ListNode();
    var tail = dummy;
    int sum = 0;
    for (var cur = head!.next; cur != null; cur = cur.next)
    {
        if (cur.val == 0)
        {
            tail.next = new ListNode(sum);   // group finished
            tail = tail.next;
            sum = 0;
        }
        else sum += cur.val;
    }
    return dummy.next;
}
```

**Complexity:** O(n) time, O(m) space for the m output nodes (or reuse the input nodes for O(1) extra space).

## 2487. Remove Nodes From Linked List

**What it asks:** remove every node that has a node with a greater value somewhere to its right. **Example:** `5→2→13→3→8`  becomes `13→8`. **Idea:** it is easy from the right: reverse the list, keep only nodes that are at least as large as every node seen so far, then reverse back.

**Picture:**

```text
5 → 2 → 13 → 3 → 8
reverse:        8 → 3 → 13 → 2 → 5     running max starts at 8
keep 8 (max 8), drop 3, keep 13 (max 13), drop 2, drop 5
kept:           8 → 13
reverse back:   13 → 8
```

**Step-by-step explanation:**

1. Reverse the list with the loop from problem 206.

2. Keep the first node and set `max`  to its value.

3. For every next node, if its value is greater than or equal to `max`, link it after the last kept node and update `max`; otherwise skip it.

4. Set the last kept node's `next`  to `null`, then reverse the list again.

```csharp
public ListNode? RemoveNodes(ListNode? head)
{
    head = Reverse(head);
    var last = head!;                       // last kept node
    int max = head!.val;
    for (var cur = head.next; cur != null; cur = cur.next)
    {
        if (cur.val >= max) { max = cur.val; last.next = cur; last = cur; }
    }
    last.next = null;
    return Reverse(head);
}
private static ListNode? Reverse(ListNode? head)
{
    ListNode? prev = null;
    while (head != null) { var nx = head.next; head.next = prev; prev = head;
head = nx; }
    return prev;
}
```

**Complexity:** O(n) time, O(1) space. A monotonic stack gives the same answer in O(n) space. **Edge cases:** already non-increasing list (nothing removed), strictly increasing list (only the last node stays).

## 2816. Double a Number Represented as a Linked List

**What it asks:** the list holds the digits of a number, most significant digit first. Return the list for twice that number. **Example:** `1→8→9` (189) becomes `3→7→8` (378). **Idea:** when you double a digit, a carry comes from the digit to its right, and that carry is 1 exactly when the right digit is 5 or more.

**Picture:**

```text
1 → 8 → 9
digit 1: 1*2 = 2, right digit 8 >= 5 → carry 1  →  3
digit 8: 8*2 = 16 → 6, right digit 9 >= 5 → carry 1 →  7
digit 9: 9*2 = 18 → 8, no right digit          →  8
Result: 3 → 7 → 8
```

**Step-by-step explanation:**

1. If the first digit is 5 or more, the answer needs one more digit; put a `0`  node at the front.

2. For each node left to right: `val = (val * 2) % 10`, and add 1 if the next node's original value is 5 or more.

3. Because you process left to right and only read the next node (not yet changed), no second pass is needed.

```csharp
public ListNode? DoubleIt(ListNode? head)
{
    if (head!.val >= 5) head = new ListNode(0, head);      // room for a
carry out of the top digit
    for (var cur = head; cur != null; cur = cur.next)
    {
        int carry = (cur.next != null && cur.next.val >= 5) ? 1 : 0;
        cur.val = (cur.val * 2) % 10 + carry;
    }
    return head;
}
```

**Complexity:** O(n) time, O(1) space. **Edge cases:** a single digit such as `5`  giving `1→0`, `0` giving `0`.

## 147. Insertion Sort List

**What it asks:** sort the list using insertion sort (take one node at a time and insert it into the sorted part). **Example:** `4→2→1→3`  becomes `1→2→3→4`. **Idea:** build a new sorted list behind a dummy head; for each input node, walk the sorted list to find where it belongs.

**Picture:**

```text
sorted: dummy → (empty)           input: 4 → 2 → 1 → 3
take 4:   dummy → 4
take 2:   dummy → 2 → 4
take 1:   dummy → 1 → 2 → 4
take 3:   dummy → 1 → 2 → 3 → 4
```

**Step-by-step explanation:**

1. For each node `cur`, save `next = cur.next`  before you change anything.

2. Start `prev`  at the dummy and move it while `prev.next.val < cur.val`. `prev`  is the node after which `cur`  belongs.

3. Insert: `cur.next = prev.next; prev.next = cur`.

4. Continue with the saved `next`.

```csharp
public ListNode? InsertionSortList(ListNode? head)
{
    var dummy = new ListNode();
    var cur = head;
    while (cur != null)
    {
        var next = cur.next;                                      // save the
rest
        var prev = dummy;
        while (prev.next != null && prev.next.val < cur.val) prev =
prev.next;
        cur.next = prev.next;                                     // insert
cur after prev
        prev.next = cur;
        cur = next;
    }
    return dummy.next;
}
```

**Complexity:** O(n²) time, O(1) space. Use problem 148 when you need O(n log n).

## 430. Flatten a Multilevel Doubly Linked List

**What it asks:** each node has `prev`, `next`  and a `child`  pointer to another doubly linked list (which may have children too). Flatten it into one single-level list in which each child list appears right after its parent node, and clear every `child`. **Example:** `1``↔``2``↔``3`  where node 2 has child list `7``↔``8`: result `1``↔``2``↔``7``↔``8``↔``3`. **Idea:** when you reach a node with a child, splice the child list in between the node and its old `next`.

**Picture:**

```text
Before:   1 ⇄ 2 ⇄ 3            After:   1 ⇄ 2 ⇄ 7 ⇄ 8 ⇄ 3
              ↓ child                    (child = null everywhere)
              7 ⇄ 8
```

**Step-by-step explanation:**

1. Walk the list with `cur`. If `cur.child`  is `null`, move on.

2. Otherwise find the tail of the child list.

3. Connect the tail to `cur.next` (and set `cur.next.prev = tail`  when `cur.next` exists).

4. Connect `cur.next = child`  and `child.prev = cur`, then set `cur.child = null`.

5. Keep walking; you will now enter the spliced-in child nodes, so deeper children are handled the same way.

```csharp
public class DNode
{
    public int val;
    public DNode? prev, next, child;
}
public DNode? Flatten(DNode? head)
{
    for (var cur = head; cur != null; cur = cur.next)
    {
        if (cur.child == null) continue;
        var child = cur.child;
        var tail = child;
        while (tail.next != null) tail = tail.next;     // last node of the
child list
        tail.next = cur.next;                           // child tail -> old
next
        if (cur.next != null) cur.next.prev = tail;
        cur.next = child;                               // cur -> child head
        child.prev = cur;
        cur.child = null;
    }
    return head;
}
```

**Complexity:** O(n) time overall (each node is visited a constant number of times), O(1) space. **Edge cases:** child on the last node, nested children, no children at all.

## 109. Convert Sorted List to Binary Search Tree

**What it asks:** convert a sorted linked list into a height-balanced binary search tree.

**Example:** `-10→-3→0→5→9`  becomes a tree with root `0`, left subtree built from `-10, -3` and right subtree built from `5, 9`. Several balanced answers are valid. **Idea:** the middle node becomes the root; the left half builds the left subtree and the right half builds the right subtree. This reuses the middle-finding step of problem 876.

**Picture:**

```text
list: -10 → -3 → 0 → 5 → 9              tree:        0
                  middle = 0                         /   \
   left half: -10 → -3   right half: 5 → 9        -3     9
                                                    /     /
                                                 -10     5
```

**Step-by-step explanation:**

1. If the list is empty return `null`; if it has one node return a leaf.

2. Find the middle with slow and fast pointers while remembering the node before it ( `prev`).

3. Cut the list: `prev.next = null`, so the left half ends before the middle.

4. The middle value becomes the root; recurse on the left half (the original head) and on the right half ( `slow.next`).

```csharp
public class TreeNode
{
    public int val; public TreeNode? left, right;
    public TreeNode(int val = 0) { this.val = val; }
}
public TreeNode? SortedListToBST(ListNode? head)
{
    if (head == null) return null;
    if (head.next == null) return new TreeNode(head.val);
    ListNode? prev = null, slow = head, fast = head;
    while (fast?.next != null) { prev = slow; slow = slow!.next; fast =
fast.next.next; }
    prev!.next = null;                                  // cut the left half
    var root = new TreeNode(slow!.val);
    root.left = SortedListToBST(head);
    root.right = SortedListToBST(slow.next);
    return root;
}
```

**Complexity:** O(n log n) time (finding each middle costs O(n) per level, about log n levels), O(log n) recursion stack. An in-order simulation can reach O(n) time.

# Pattern summary and study plan

| Pattern | Use it when | Problems |
|---|---|---|
| Dummy head | the head might change or be removed | 21, 203, 19, 2, 24, 82, 86, 92, 147, 25 |
| Fast and slow | find the middle or detect a cycle | 141, 142, 876, 234, 143, 148, |
| pointers |  | 2095, 2130, 109 |
| Reverse in place | you need the list backwards without extra memory | 206, 234, 143, 92, 25, 2130, 2487 |
| Gap (two-pointer | something counted from the end | 19, 1721 |
| distance) |  |  |
| Merge | combine sorted lists | 21, 148, 23 |
| Hash map or stack | you need to remember nodes or digits | 138, 445, 146 |
| Cut and rejoin | rearrange chains | 328, 61, 86, 725, 1669 |
| Doubly linked list | O(1) removal or two-way walking | 146, 430 |

**Suggested order (about 3 weeks):**

1. Days 1 to 3: 206, 21, 141, 876, 83, 203, 234, 160, 1290.

2. Days 4 to 8: 19, 2, 142, 24, 328, 61, 92, 237, 2095, 1721.

3. Days 9 to 13: 143, 148, 82, 86, 445, 707, 2130, 1669, 725, 2181, 2816.

4. Days 14 to 17: 138, 146, 147, 2487, 430, 109.

5. Days 18 to 21: 25 and 23, then redo 206, 21, 142 and 146 from memory.

**Before you submit any linked-list solution, check:** Empty list, one node and two nodes. A dummy head wherever the first node can change.

`next`  saved before it is overwritten.

The tail's `next`  is set to `null`  after cutting or splitting (no accidental cycle).

You can state time and space complexity out loud.

# Part 2: Arrays, strings and loops

These are the problems interviewers ask most often alongside linked lists. They use the same ideas (two pointers, hash maps, sliding windows), so practise them together.

| LeetCode | Problem | Level | Pattern |
|---|---|---|---|
| 1 | Two Sum | Easy | Hash map |
| 217 | Contains Duplicate | Easy | Hash set |
| 242 | Valid Anagram | Easy | Counting array |
| 125 | Valid Palindrome | Easy | Two pointers |
| 344 | Reverse String | Easy | Two pointers |
| 283 | Move Zeroes | Easy | Two pointers (write index) |
| 88 | Merge Sorted Array | Easy | Two pointers from the back |
| 121 | Best Time to Buy and Sell Stock | Easy | One pass, running minimum |
| 53 | Maximum Subarray | Medium | Kadane |
| 169 | Majority Element | Easy | Boyer-Moore vote |
| 268 | Missing Number | Easy | Sum or XOR |
| 20 | Valid Parentheses | Easy | Stack |
| 704 | Binary Search | Easy | Divide in half |
| 189 | Rotate Array | Medium | Reverse three times |
| 238 | Product of Array Except Self | Medium | Prefix and suffix |
| LeetCode | Problem | Level | Pattern |
| 11 | Container With Most Water | Medium | Two pointers |
| 15 | 3Sum | Medium | Sort and two pointers |
| 3 | Longest Substring Without Repeating Characters | Medium | Sliding window |
| 412 | FizzBuzz | Easy | Loop and modulo |

## 1. Two Sum

**What it asks:** return the indexes of the two numbers that add up to `target`. **Example:** `nums = [2,7,11,15]`, `target = 9`  gives `[0,1]`. **Idea:** for each number, you need `target` `- number`. Store the numbers you have seen in a dictionary so that lookup takes O(1).

**Picture:**

```csharp
nums = [2, 7, 11, 15]   target = 9
i=0: need 7, not seen yet      seen = {2:0}
i=1: need 2, found at index 0  → answer [0, 1]
public int[] TwoSum(int[] nums, int target)
{
    var seen = new Dictionary<int, int>();          // value -> index
    for (int i = 0; i < nums.Length; i++)
    {
        int need = target - nums[i];
        if (seen.TryGetValue(need, out int j)) return new[] { j, i };
        seen[nums[i]] = i;
    }
    return Array.Empty<int>();
}
```

**Complexity:** O(n) time, O(n) space. The brute force (two nested loops) is O(n²); say that first, then improve it.

## 217. Contains Duplicate

**What it asks:** return `true`  if any value appears at least twice. **Idea:** a `HashSet`  rejects a second copy. `Add`  returns `false`  when the value is already there.

```csharp
public bool ContainsDuplicate(int[] nums)
{
    var set = new HashSet<int>();
    foreach (var n in nums)
        if (!set.Add(n)) return true;
    return false;
}
```

**Complexity:** O(n) time, O(n) space. Sorting first gives O(n log n) time with O(1) extra space.

## 242. Valid Anagram

**What it asks:** are two strings made of the same letters with the same counts? **Example:** `anagram`  and `nagaram`  give `true`. **Idea:** count letters of the first string up, count the second string down; all counts must end at zero.

**Picture:**

```csharp
"cat" vs "act"
counts after s: a=1 c=1 t=1
after subtracting t: a=0 c=0 t=0  → all zero, anagram
public bool IsAnagram(string s, string t)
{
    if (s.Length != t.Length) return false;
    var count = new int[26];
    for (int i = 0; i < s.Length; i++) { count[s[i] - 'a']++; count[t[i] -
'a']--; }
    foreach (var c in count) if (c != 0) return false;
    return true;
}
```

**Complexity:** O(n) time, O(1) space (26 counters). For Unicode input use a `Dictionary<char,int>`.

## 125. Valid Palindrome

**What it asks:** ignoring case and anything that is not a letter or digit, is the string a palindrome? **Example:** `A man, a plan, a canal: Panama`  gives `true`. **Idea:** two pointers from both ends moving inward; skip characters that do not count.

```csharp
public bool IsPalindrome(string s)
{
    int l = 0, r = s.Length - 1;
    while (l < r)
    {
        while (l < r && !char.IsLetterOrDigit(s[l])) l++;
        while (l < r && !char.IsLetterOrDigit(s[r])) r--;
        if (char.ToLower(s[l]) != char.ToLower(s[r])) return false;
        l++; r--;
    }
    return true;
}
```

**Complexity:** O(n) time, O(1) space.

## 344. Reverse String

**What it asks:** reverse a `char[]`  in place. **Picture:**

```csharp
[h, e, l, l, o]
 l              r      swap h and o
    l        r         swap e and l
       l,r             stop
[o, l, l, e, h]
public void ReverseString(char[] s)
{
    for (int l = 0, r = s.Length - 1; l < r; l++, r--)
        (s[l], s[r]) = (s[r], s[l]);                    // tuple swap
}
```

**Complexity:** O(n) time, O(1) space.

## 283. Move Zeroes

**What it asks:** move all zeroes to the end, keeping the order of the other numbers, in place.

**Example:** `[0,1,0,3,12]`  becomes `[1,3,12,0,0]`. **Idea:** keep a write index `w`. Every nonzero value is copied to `w`, then the rest is filled with zeroes. (Swapping instead of filling also works.)

**Picture:**

```csharp
[0, 1, 0, 3, 12]     w = 0
see 1  → nums[0]=1, w=1       [1, 1, 0, 3, 12]
see 3  → nums[1]=3, w=2       [1, 3, 0, 3, 12]
see 12 → nums[2]=12, w=3      [1, 3, 12, 3, 12]
fill from w with 0:           [1, 3, 12, 0, 0]
public void MoveZeroes(int[] nums)
{
    int w = 0;
    foreach (var n in nums) if (n != 0) nums[w++] = n;
    while (w < nums.Length) nums[w++] = 0;
}
```

**Complexity:** O(n) time, O(1) space.

## 88. Merge Sorted Array

**What it asks:** `nums1`  has `m`  real values followed by `n`  empty slots; merge the sorted `nums2`  into it, in place. **Idea:** fill from the back, so you never overwrite a value you still need. The largest remaining value always goes to the last free slot.

**Picture:**

```csharp
nums1 = [1, 2, 3, 0, 0, 0]   m = 3        nums2 = [2, 5, 6]   n = 3
write from index 5: 6 → 5 → 3 → 2 → 2 → 1
result: [1, 2, 2, 3, 5, 6]
public void Merge(int[] nums1, int m, int[] nums2, int n)
{
    int i = m - 1, j = n - 1, k = m + n - 1;
    while (j >= 0)
        nums1[k--] = (i >= 0 && nums1[i] > nums2[j]) ? nums1[i--] : nums2[j-
-];
}
```

**Complexity:** O(m + n) time, O(1) space. Same idea as merging two linked lists (problem 21), but from the back.

## 121. Best Time to Buy and Sell Stock

**What it asks:** `prices[i]`  is the price on day `i`. Buy once, sell later, maximise profit (0 if none). **Example:** `[7,1,5,3,6,4]`  gives `5` (buy at 1, sell at 6). **Idea:** walk once, remember the lowest price so far, and at each day check profit if you sold today.

```csharp
public int MaxProfit(int[] prices)
{
    int min = int.MaxValue, best = 0;
    foreach (var p in prices)
    {
        min = Math.Min(min, p);
        best = Math.Max(best, p - min);
    }
    return best;
}
```

**Complexity:** O(n) time, O(1) space.

## 53. Maximum Subarray (Kadane's algorithm)

**What it asks:** find the contiguous subarray with the largest sum. **Example:** `[-2,1,-3,4,-1,2,1,-5,4]`  gives `6` (the part `4,-1,2,1`). **Idea:** at each element decide: extend the current run, or start fresh here. If the run so far is negative, it can only hurt, so drop it.

**Picture:**

```csharp
num:      -2   1  -3   4  -1   2   1  -5   4
run:      -2   1  -2   4   3   5   6   1   5
best:     -2   1   1   4   4   5   6   6   6
public int MaxSubArray(int[] nums)
{
    int run = nums[0], best = nums[0];
    for (int i = 1; i < nums.Length; i++)
    {
        run = Math.Max(nums[i], run + nums[i]);   // extend or restart
        best = Math.Max(best, run);
    }
    return best;
}
```

**Complexity:** O(n) time, O(1) space. Works when every number is negative (the answer is the largest single number).

## 169. Majority Element

**What it asks:** find the value that appears more than n/2 times (it always exists). **Idea(Boyer-Moore vote):** keep a candidate and a count. Same value: count up. Different value: count down. At zero, pick a new candidate. The majority survives every cancellation.

```csharp
public int MajorityElement(int[] nums)
{
    int cand = 0, count = 0;
    foreach (var n in nums)
    {
        if (count == 0) cand = n;
        count += (n == cand) ? 1 : -1;
    }
    return cand;
}
```

**Complexity:** O(n) time, O(1) space. A dictionary of counts is the simpler O(n)-space answer.

## 268. Missing Number

**What it asks:** the array holds `n`  distinct numbers from `0..n`; find the one that is missing.

**Idea:** the sum of `0..n`  is `n(n+1)/2`; subtract the actual sum.

```csharp
public int MissingNumber(int[] nums)
{
    int n = nums.Length;
    int expected = n * (n + 1) / 2;
    int actual = 0;
    foreach (var x in nums) actual += x;
    return expected - actual;
}
```

**Complexity:** O(n) time, O(1) space. XOR of all indexes and values also works and cannot overflow.

## 20. Valid Parentheses

**What it asks:** a string of `()[]{}`; every opener must be closed by the same kind, in the right order. **Idea:** push openers on a stack; when you see a closer, the top of the stack must be its opener.

**Picture:**

```csharp
"{[()]}"
{ push        stack: {
[ push        stack: { [
( push        stack: { [ (
) pops (       stack: { [
] pops [       stack: {
} pops {       stack: (empty)  → valid
public bool IsValid(string s)
{
    var stack = new Stack<char>();
    foreach (var c in s)
    {
        if (c == '(' || c == '[' || c == '{') stack.Push(c);
        else
        {
            if (stack.Count == 0) return false;
            char open = stack.Pop();
            if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c
== '}' && open != '{'))
                return false;
        }
    }
    return stack.Count == 0;                    // nothing left open
}
```

**Complexity:** O(n) time, O(n) space.

## 704. Binary Search

**What it asks:** find `target`  in a sorted array; return its index or `-1`. **Idea:** compare with the middle; discard the half that cannot contain the target.

**Picture:**

```csharp
[-1, 0, 3, 5, 9, 12]   target = 9
lo=0 hi=5 mid=2 (3)  too small → lo=3
lo=3 hi=5 mid=4 (9)  found
public int Search(int[] nums, int target)
{
    int lo = 0, hi = nums.Length - 1;
    while (lo <= hi)
    {
        int mid = lo + (hi - lo) / 2;           // avoids int overflow of (lo
+ hi)
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
```

**Complexity:** O(log n) time, O(1) space. Common bug: `lo < hi`  instead of `lo <= hi`, or forgetting the `+ 1`  / `- 1`, which causes an endless loop.

## 189. Rotate Array

**What it asks:** rotate the array right by `k`  steps, in place. **Example:** `[1,2,3,4,5,6,7]`, `k =` `3`  gives `[5,6,7,1,2,3,4]`. **Idea:** reverse the whole array, then reverse the first `k`  items,

then reverse the rest.

**Picture:**

```csharp
[1, 2, 3, 4, 5, 6, 7]   k = 3
reverse all:        [7, 6, 5, 4, 3, 2, 1]
reverse first 3:    [5, 6, 7, 4, 3, 2, 1]
reverse the rest:   [5, 6, 7, 1, 2, 3, 4]
public void Rotate(int[] nums, int k)
{
    k %= nums.Length;                           // k can be larger than the
length
    Reverse(nums, 0, nums.Length - 1);
    Reverse(nums, 0, k - 1);
    Reverse(nums, k, nums.Length - 1);
}
private static void Reverse(int[] a, int l, int r)
{
    while (l < r) { (a[l], a[r]) = (a[r], a[l]); l++; r--; }
}
```

**Complexity:** O(n) time, O(1) space.

## 238. Product of Array Except Self

**What it asks:** `answer[i]`  is the product of all elements except `nums[i]`, without using division. **Idea:** `answer[i]`  = (product of everything left of i) × (product of everything right of i). Compute the left products in one pass and multiply the right products in a second pass.

**Picture:**

```csharp
nums:   [1, 2, 3, 4]
left:   [1, 1, 2, 6]       (product of items before i)
right:  [24, 12, 4, 1]     (product of items after i)
answer: [24, 12, 8, 6]
public int[] ProductExceptSelf(int[] nums)
{
    int n = nums.Length;
    var ans = new int[n];
    ans[0] = 1;
    for (int i = 1; i < n; i++) ans[i] = ans[i - 1] * nums[i - 1];   // left
products
    int right = 1;
    for (int i = n - 1; i >= 0; i--) { ans[i] *= right; right *= nums[i]; }
    return ans;
}
```

**Complexity:** O(n) time, O(1) extra space (the output array does not count).

## 11. Container With Most Water

**What it asks:** `height[i]`  are vertical lines; pick two that, with the x-axis, hold the most water. **Idea:** start with the widest container (both ends). The water level is limited by the shorter line, so moving the taller line can never help; move the shorter one inward.

```csharp
public int MaxArea(int[] height)
{
    int l = 0, r = height.Length - 1, best = 0;
    while (l < r)
    {
        best = Math.Max(best, Math.Min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++; else r--;
    }
    return best;
}
```

**Complexity:** O(n) time, O(1) space.

## 15. 3Sum

**What it asks:** find all unique triples that add up to 0. **Idea:** sort, fix one number `a`, then find two numbers on its right that add to `-a`  with two pointers. Skip repeated values so each triple appears once.

**Picture:**

```csharp
sorted: [-4, -1, -1, 0, 1, 2]
fix -1 (i=1): l=2 (-1), r=5 (2) → sum 0  ✓ [-1,-1,2]
              l=3 (0),  r=4 (1) → sum 0  ✓ [-1,0,1]
public IList<IList<int>> ThreeSum(int[] nums)
{
    Array.Sort(nums);
    var res = new List<IList<int>>();
    for (int i = 0; i < nums.Length - 2; i++)
    {
        if (nums[i] > 0) break;                                    // no way
to reach 0
        if (i > 0 && nums[i] == nums[i - 1]) continue;             // skip
duplicate first value
        int l = i + 1, r = nums.Length - 1;
        while (l < r)
        {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) l++;
            else if (sum > 0) r--;
            else
            {
                res.Add(new List<int> { nums[i], nums[l], nums[r] });
                l++; r--;
                while (l < r && nums[l] == nums[l - 1]) l++;       // skip
duplicates
            }
        }
    }
    return res;
}
```

**Complexity:** O(n²) time, O(1) extra space besides the output (sorting is O(n log n)).

## 3. Longest Substring Without Repeating Characters

**What it asks:** the length of the longest substring in which no character repeats. **Example:** `abcabcbb`  gives `3` ( `abc`). **Idea (sliding window):** keep a window `[left, right]`  with no repeats. When the new character was already inside the window, move `left`  just past its previous position.

**Picture:**

```csharp
a b c a b c b b
[a b c]            length 3
  [b c a]          a repeated → left moves past the old a
    [c a b]        and so on; best = 3
public int LengthOfLongestSubstring(string s)
{
    var last = new Dictionary<char, int>();     // char -> last index seen
    int left = 0, best = 0;
    for (int right = 0; right < s.Length; right++)
    {
        if (last.TryGetValue(s[right], out int idx) && idx >= left)
            left = idx + 1;                     // shrink past the earlier
copy
        last[s[right]] = right;
        best = Math.Max(best, right - left + 1);
    }
    return best;
}
```

**Complexity:** O(n) time, O(k) space for the k distinct characters.

## 412. FizzBuzz

**What it asks:** for 1 to n: print `FizzBuzz`  for multiples of 15, `Fizz`  for multiples of 3, `Buzz` for multiples of 5, else the number. **Idea:** check 15 first (or build the word from parts), otherwise the 3 and 5 cases swallow it.

```csharp
public IList<string> FizzBuzz(int n)
{
    var res = new List<string>(n);
    for (int i = 1; i <= n; i++)
    {
        if (i % 15 == 0) res.Add("FizzBuzz");
        else if (i % 3 == 0) res.Add("Fizz");
        else if (i % 5 == 0) res.Add("Buzz");
        else res.Add(i.ToString());
    }
    return res;
}
```

**Complexity:** O(n) time and space.

# Part 3: Loops and arrays, interview questions

# Loops in C#

**Q: What loops does C# have and when do you use each?**

`for`: you know the count or need the index. `for (int i = 0; i < n; i++)`.

`foreach`: you only need each item, no index. Works on anything that implements `IEnumerable`.

`while`: repeat while a condition holds, and it may run zero times.

`do { } while ()`: the body runs at least once, then the condition is checked.

**Q: What do** `break` **,** `continue`  **and** `return`  **do inside a loop?** `break`  leaves the loop completely. `continue`  skips the rest of this round and goes to the next. `return`  leaves the whole method. C# has no labelled break; to leave nested loops use a flag, move the loops into a method and `return`, or use `goto` (rare).

**Q: Why does this throw, and how do you fix it?**

```csharp
foreach (var x in list)
    if (x == 3) list.Remove(x);     // InvalidOperationException: collection
was modified
```

`foreach`  uses an enumerator that fails if the collection changes. Fixes: loop backwards with `for`  and `RemoveAt`, or call `list.RemoveAll(x => x == 3)`, or loop over a copy ( `list.ToList()`).

```csharp
for (int i = list.Count - 1; i >= 0; i--)
    if (list[i] == 3) list.RemoveAt(i);
```

**Q: What is an off-by-one error?** A loop that runs one time too many or too few, usually from `<`  versus `<=`  or from starting at 1 instead of 0. An array of length `n`  has valid indexes `0`  to `n - 1`, so `i <= n`  throws `IndexOutOfRangeException`.

**Q: What is the time complexity of nested loops?** Two loops that each run `n`  times give O(n²). A loop that halves the range each time (binary search) is O(log n). A loop inside which you call `list.Contains`  is also O(n²), because `Contains`  is O(n); use a `HashSet`  to make the check O(1).

```csharp
for (int i = 1; i < n; i *= 2) { }              // O(log n): i doubles
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++) { }             // O(n^2)
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) { }         // still O(n^2): about n*n/2
steps
```

**Q:** `foreach`  **or** `for` **, which is faster?** On arrays and `List<T>`  the difference is tiny. `for` can be a little faster because it skips enumerator creation and allows indexing; `foreach`  is clearer and safer. Choose by readability first and measure if it is a hot path.

**Q: Loop or LINQ?** LINQ ( `Where`, `Select`, `Sum`) is shorter and easier to read; a plain loop avoids allocations and is easier to debug and to step through. Remember LINQ is lazy: the query runs when you enumerate it, and enumerating it twice runs it twice.

**Q: What is a closure trap in a loop?** In modern C# each `foreach`  iteration gets its own variable, so a lambda captures the right value. With a `for`  loop the variable `i`  is shared by all iterations:

```csharp
var actions = new List<Action>();
for (int i = 0; i < 3; i++) actions.Add(() => Console.Write(i));
foreach (var a in actions) a();                 // prints 333, not 012
// fix: copy it inside the loop
for (int i = 0; i < 3; i++) { int copy = i; actions.Add(() =>
Console.Write(copy)); }
```

**Q: What does** `yield return`  **do?** It lets a method produce items one at a time (lazy iteration) instead of building a whole list first, which saves memory for large or endless sequences.

```csharp
public static IEnumerable<int> Evens(int max)
{
    for (int i = 0; i <= max; i += 2) yield return i;
}
```

# Arrays and collections

**Q: Array versus** `List<T>` **?** An array has a fixed size set at creation and is the fastest for indexed access. A `List<T>`  grows automatically: it keeps an internal array and, when full, allocates one twice as big and copies, so `Add`  is O(1) on average. Indexing is O(1) in both; inserting or removing in the middle is O(n).

**Q: Array versus linked list?** Array: O(1) access by index, contiguous in memory (cache friendly), O(n) insert or delete in the middle. Linked list: O(n) access, O(1) insert or delete once you hold the node, extra memory for the pointers. Most of the time an array or `List<T>`  wins in practice.

**Q: How does a** `Dictionary<TKey,TValue>`  **work?** It computes the key's hash code, uses it to pick a bucket and compares keys inside the bucket. Lookup, add and remove are O(1) on average and O(n) in the worst case (many collisions). Keys must have consistent `GetHashCode`  and `Equals`, and a key that changes after insertion will not be found.

**Q:** `Dictionary`  **versus** `HashSet`  **versus** `List` **?** `Dictionary`  maps a key to a value. `HashSet`  stores unique values and answers "is it in here?" in O(1). `List`  keeps order and allows duplicates, but `Contains`  is O(n). `SortedDictionary` / `SortedSet`  keep keys sorted with O(log n) operations.

**Q:** `Stack`  **versus** `Queue` **?** `Stack<T>`  is last in, first out ( `Push`, `Pop`, `Peek`): undo, parentheses, depth-first search. `Queue<T>`  is first in, first out ( `Enqueue`, `Dequeue`): scheduling, breadth-first search.

**Q: What are** `Array.Copy`  **and** `Clone` **, and what is a shallow copy?** Both copy the array's elements. For value types you get independent values; for reference types you copy the references, so both arrays point to the same objects (shallow copy). A deep copy duplicates the objects too.

**Q: Jagged versus multidimensional arrays?** `int[][]`  is an array of arrays; each row may have its own length. `int[,]`  is a true rectangle. Jagged arrays are usually faster in .NET.

**Q: What are** `Span<T>`  **and** `ReadOnlySpan<T>` **?** A view over a part of an array or string with no copying and no heap allocation. Slicing `span[2..5]`  costs nothing, which is useful in parsing and other hot code. A span can only live on the stack (it is a `ref struct`), so it cannot be a field of a class or be used across `await`.

**Q: How do you remove duplicates from an array or list?**

```csharp
var unique = nums.Distinct().ToArray();          // simplest, keeps first
occurrences
var set = new HashSet<int>(nums);                // when you only need
uniqueness
```

**Q: How do you sort in C#?** `Array.Sort(arr)`, `list.Sort()`, or `OrderBy`  in LINQ (stable, returns a new sequence). Custom order: `list.Sort((a, b) => b.CompareTo(a))`. Sorting is O(n log n).

# Big O quick reference

*Operation*

*Array*

*List*

*Linked list*

*Dictionary /*

*Sorted*

*HashSet*

*structure*

*Access by index*

*O(1)*

*O(1)*

*O(n)*

*n/a*

*n/a*

*Search*

*O(n)*

*O(n)*

*O(n)*

*O(1) average*

*O(log n)*

*Add at the end*

*n/a*

*O(1)*

*O(1) with a tail*

*O(1) average*

*O(log n)*

*average*

*pointer*

*Insert or remove in the*

*O(n)*

*O(n)*

*O(1) at a known*

*O(1) average*

*O(log n)*

*middle*

*node*

| Algorithm | Time | Space | Notes |
|---|---|---|---|
| Binary search | O(log n) | O(1) | input must be sorted |
| Bubble, insertion, | O(n²) | O(1) | simple, slow; insertion sort is |
| selection sort |  |  | fast on nearly sorted data |
| Merge sort | O(n log n) | O(n) | stable |
| Quick sort | O(n log n) average, O(n²) worst | O(log n) | fast in practice |
| Heap sort | O(n log n) | O(1) | not stable |
| BFS and DFS | O(V + E) | O(V) | graphs and trees |

# More coding questions that come up often

## Reverse a string without using Reverse()

```csharp
public static string ReverseString(string s)
{
    var chars = s.ToCharArray();
    Array.Reverse(chars);                       // or swap with two pointers
    return new string(chars);
}
```

## Count the characters in a string

```csharp
public static Dictionary<char, int> CountChars(string s)
{
    var map = new Dictionary<char, int>();
    foreach (var c in s) map[c] = map.GetValueOrDefault(c) + 1;
    return map;
}
```

## Find the first non-repeating character

```csharp
public static char? FirstUnique(string s)
{
    var count = CountChars(s);
    foreach (var c in s) if (count[c] == 1) return c;
    return null;
}
```

## Swap two numbers without a third variable

```csharp
(a, b) = (b, a);                                 // tuple swap
a = a ^ b; b = a ^ b; a = a ^ b;                 // XOR trick, interview
classic
```

## Check for a prime number

```csharp
public static bool IsPrime(int n)
{
    if (n < 2) return false;
    for (int i = 2; (long)i * i <= n; i++)       // only test up to the
square root
        if (n % i == 0) return false;
    return true;
}
```

## Fibonacci: recursive versus loop

```csharp
public static long Fib(int n)                    // O(n) time, O(1) space
{
    long a = 0, b = 1;
    for (int i = 0; i < n; i++) (a, b) = (b, a + b);
    return a;
}
// naive recursion Fib(n-1) + Fib(n-2) is O(2^n): it recomputes the same
values
```

## Factorial and recursion

```csharp
public static long Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);
```

Every recursive method needs a base case and a step that moves towards it, otherwise you get a `StackOverflowException`. Recursion uses stack space for each call; a loop does not.

## Check whether a number is a power of two

```csharp
public static bool IsPowerOfTwo(int n) => n > 0 && (n & (n - 1)) == 0;
```

## Find the second largest number

```csharp
public static int SecondLargest(int[] a)
{
    int first = int.MinValue, second = int.MinValue;
    foreach (var x in a)
    {
        if (x > first) { second = first; first = x; }
        else if (x > second && x != first) second = x;
    }
    return second;
}
```

# Interview tips and common questions

**How to answer a coding question:**

1. Repeat the problem in your own words and ask about the input (can it be empty, are there negatives, how big can it be).

2. Give the simple (brute force) solution and its complexity first.

3. Improve it and explain which idea you use (hash map, two pointers, sort, window).

4. Write the code, then walk through one example by hand.

5. Name the time and space complexity and the edge cases you checked.

**General questions and short answers:**

| Question | Short answer |
|---|---|
| What is the difference between `==`  and | `==`  on reference types compares |
| `.Equals()` ? | references unless overloaded (strings are overloaded to compare values); `.Equals()` compares by value when the type overrides it. |
| What is the difference between `string`  and | Strings are immutable, so each change |
| `StringBuilder` ? | creates a new string; `StringBuilder`  edits one buffer and is better for many appends in a loop. |
| Question | Short answer |
| What is the difference between `ref`  and | Both pass by reference; `ref`  must be |
| `out` ? | assigned before the call, `out`  must be assigned inside the method. |

*const  versus readonly ?*

*const  is fixed at compile time; readonly  is*

| set once at runtime (declaration or |
|---|
| constructor). |
| What is boxing? Converting a value type to `object`, which |
| allocates on the heap; unboxing converts |
| back. It costs time and memory, so avoid it in |
| loops (use generics). |
| What is the difference between an abstract An abstract class can hold state and partial |
| class and an interface? implementation and gives one base; a class |
| can implement many interfaces, which |
| define a contract. |
| What is the difference between `IEnumerable`  runs in memory; `IQueryable` |
| `IEnumerable`  and `IQueryable` ? builds an expression that the provider (such |
| as EF Core) translates to SQL. |
| What is `async`  and `await`  for? Free the thread while waiting for I/O, then |
| continue when it completes. It improves |
| scalability, not CPU speed. |
| What is garbage collection? The runtime frees memory of objects that |
| no code can reach, in generations 0, 1 and 2; |
| use `IDisposable`  and `using`  for |
| unmanaged resources. |
| How do you handle exceptions well? Catch only what you can handle, keep the |
| stack trace with `throw;` (not `throw ex;`), |
| use `finally`  or `using`  to clean up. |

**Behavioural questions to prepare (use the STAR method: situation, task, action, result):**

Tell me about a hard bug you fixed and how you found it.

Tell me about a disagreement with a teammate and what you did.

Describe a time you missed a deadline or made a mistake.

Why do you want this role, and what do you want to learn?

What was your biggest project, and what exactly did you build yourself?

**Practice checklist for arrays and loops:**

Empty array, one element, all equal elements, all negative numbers.

Index stays inside `0`  to `length - 1`.

Integer overflow in sums and products (use `long`).

Modifying a collection while looping over it.

Time and space complexity stated out loud.
