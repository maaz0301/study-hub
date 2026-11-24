// JavaScript / Node.js solutions for the LeetCode topic, keyed by problem number (or section title).
// The build puts each one next to the C# solution as a "JavaScript" tab.
// Linked-list problems use LeetCode's JS node:  function ListNode(val, next) { this.val = val ?? 0; this.next = next ?? null; }

export default {
  // ---------------- linked lists: easy ----------------
  206: `var reverseList = function (head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next; // save the rest
    cur.next = prev;       // flip the pointer
    prev = cur;
    cur = next;
  }
  return prev;
};`,
  21: `var mergeTwoLists = function (l1, l2) {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
    else { tail.next = l2; l2 = l2.next; }
    tail = tail.next;
  }
  tail.next = l1 ?? l2;
  return dummy.next;
};`,
  141: `var hasCycle = function (head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
};`,
  876: `var middleNode = function (head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow; // second middle when the length is even
};`,
  83: `var deleteDuplicates = function (head) {
  let cur = head;
  while (cur && cur.next) {
    if (cur.val === cur.next.val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
};`,
  203: `var removeElements = function (head, val) {
  const dummy = new ListNode(0, head);
  let cur = dummy;
  while (cur.next) {
    if (cur.next.val === val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return dummy.next;
};`,
  234: `var isPalindrome = function (head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null;                       // reverse the second half
  while (slow) { const n = slow.next; slow.next = prev; prev = slow; slow = n; }
  for (let a = head, b = prev; b; a = a.next, b = b.next) {
    if (a.val !== b.val) return false;
  }
  return true;
};`,
  160: `var getIntersectionNode = function (headA, headB) {
  let a = headA, b = headB;
  while (a !== b) {
    a = a ? a.next : headB;   // switch lists at the end
    b = b ? b.next : headA;
  }
  return a; // the meeting node, or null
};`,
  // ---------------- linked lists: medium ----------------
  237: `var deleteNode = function (node) {
  node.val = node.next.val;   // copy the next value in
  node.next = node.next.next; // and skip the next node
};`,
  19: `var removeNthFromEnd = function (head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next; // gap of n + 1
  while (fast) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
};`,
  2: `var addTwoNumbers = function (l1, l2) {
  const dummy = new ListNode(0);
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1?.val ?? 0) + (l2?.val ?? 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    l1 = l1?.next; l2 = l2?.next;
  }
  return dummy.next;
};`,
  142: `var detectCycle = function (head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) {              // Floyd: restart one pointer at head
      let p = head;
      while (p !== slow) { p = p.next; slow = slow.next; }
      return p;
    }
  }
  return null;
};`,
  24: `var swapPairs = function (head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next && prev.next.next) {
    const a = prev.next, b = a.next;
    a.next = b.next;
    b.next = a;
    prev.next = b;
    prev = a;
  }
  return dummy.next;
};`,
  328: `var oddEvenList = function (head) {
  if (!head) return head;
  let odd = head, even = head.next;
  const evenHead = even;
  while (even && even.next) {
    odd.next = even.next; odd = odd.next;
    even.next = odd.next; even = even.next;
  }
  odd.next = evenHead;
  return head;
};`,
  61: `var rotateRight = function (head, k) {
  if (!head || !head.next || k === 0) return head;
  let len = 1, tail = head;
  while (tail.next) { tail = tail.next; len++; }
  k %= len;
  if (k === 0) return head;
  tail.next = head;                        // make a ring
  let newTail = head;
  for (let i = 0; i < len - k - 1; i++) newTail = newTail.next;
  const newHead = newTail.next;
  newTail.next = null;                     // cut the ring
  return newHead;
};`,
  92: `var reverseBetween = function (head, left, right) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  for (let i = 1; i < left; i++) prev = prev.next;
  const start = prev.next;
  for (let i = 0; i < right - left; i++) {   // move the next node to the front
    const moved = start.next;
    start.next = moved.next;
    moved.next = prev.next;
    prev.next = moved;
  }
  return dummy.next;
};`,
  143: `var reorderList = function (head) {
  if (!head || !head.next) return;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null, cur = slow.next;        // reverse the second half
  slow.next = null;
  while (cur) { const n = cur.next; cur.next = prev; prev = cur; cur = n; }
  let a = head, b = prev;                  // merge alternately
  while (b) {
    const an = a.next, bn = b.next;
    a.next = b; b.next = an;
    a = an; b = bn;
  }
};`,
  148: `var sortList = function (head) {
  if (!head || !head.next) return head;
  let slow = head, fast = head.next;       // split in the middle
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  const right = slow.next;
  slow.next = null;
  return merge(sortList(head), sortList(right));
};
function merge(a, b) {
  const dummy = new ListNode(0);
  let t = dummy;
  while (a && b) {
    if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
    t = t.next;
  }
  t.next = a ?? b;
  return dummy.next;
}`,
  138: `var copyRandomList = function (head) {
  const map = new Map();
  for (let p = head; p; p = p.next) map.set(p, new Node(p.val));
  for (let p = head; p; p = p.next) {
    map.get(p).next = map.get(p.next) ?? null;
    map.get(p).random = map.get(p.random) ?? null;
  }
  return map.get(head) ?? null;
};`,
  146: `// A JS Map keeps insertion order, so the first key is the least recently used.
class LRUCache {
  constructor(capacity) { this.cap = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return -1;
    const v = this.map.get(key);
    this.map.delete(key); this.map.set(key, v);   // mark as most recent
    return v;
  }
  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.cap) this.map.delete(this.map.keys().next().value);
  }
}`,
  82: `var deleteDuplicates = function (head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next) {
    let cur = prev.next;
    if (cur.next && cur.next.val === cur.val) {
      while (cur.next && cur.next.val === cur.val) cur = cur.next;
      prev.next = cur.next;               // drop the whole run
    } else prev = prev.next;
  }
  return dummy.next;
};`,
  86: `var partition = function (head, x) {
  const lessHead = new ListNode(0), moreHead = new ListNode(0);
  let less = lessHead, more = moreHead;
  for (let p = head; p; p = p.next) {
    if (p.val < x) { less.next = p; less = p; } else { more.next = p; more = p; }
  }
  more.next = null;
  less.next = moreHead.next;
  return lessHead.next;
};`,
  445: `var addTwoNumbers = function (l1, l2) {
  const s1 = [], s2 = [];
  for (; l1; l1 = l1.next) s1.push(l1.val);
  for (; l2; l2 = l2.next) s2.push(l2.val);
  let head = null, carry = 0;
  while (s1.length || s2.length || carry) {
    const sum = (s1.pop() ?? 0) + (s2.pop() ?? 0) + carry;
    carry = Math.floor(sum / 10);
    head = new ListNode(sum % 10, head);   // build from the back
  }
  return head;
};`,
  707: `class MyLinkedList {
  constructor() { this.head = new ListNode(0); this.size = 0; } // sentinel
  get(index) {
    if (index < 0 || index >= this.size) return -1;
    let p = this.head.next;
    while (index--) p = p.next;
    return p.val;
  }
  addAtHead(val) { this.addAtIndex(0, val); }
  addAtTail(val) { this.addAtIndex(this.size, val); }
  addAtIndex(index, val) {
    if (index < 0 || index > this.size) return;
    let p = this.head;
    while (index--) p = p.next;
    p.next = new ListNode(val, p.next);
    this.size++;
  }
  deleteAtIndex(index) {
    if (index < 0 || index >= this.size) return;
    let p = this.head;
    while (index--) p = p.next;
    p.next = p.next.next;
    this.size--;
  }
}`,
  // ---------------- linked lists: hard ----------------
  25: `var reverseKGroup = function (head, k) {
  const dummy = new ListNode(0, head);
  let groupPrev = dummy;
  while (true) {
    let kth = groupPrev;
    for (let i = 0; i < k && kth; i++) kth = kth.next;
    if (!kth) break;                         // fewer than k left
    const groupNext = kth.next;
    let prev = groupNext, cur = groupPrev.next;
    while (cur !== groupNext) { const n = cur.next; cur.next = prev; prev = cur; cur = n; }
    const first = groupPrev.next;
    groupPrev.next = kth;
    groupPrev = first;
  }
  return dummy.next;
};`,
  23: `// Divide and conquer: merge pairs of lists until one is left (O(N log k)).
var mergeKLists = function (lists) {
  if (!lists.length) return null;
  while (lists.length > 1) {
    const next = [];
    for (let i = 0; i < lists.length; i += 2) next.push(mergeTwo(lists[i], lists[i + 1] ?? null));
    lists = next;
  }
  return lists[0];
};
function mergeTwo(a, b) {
  const dummy = new ListNode(0);
  let t = dummy;
  while (a && b) {
    if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
    t = t.next;
  }
  t.next = a ?? b;
  return dummy.next;
}`,
  // ---------------- related practice ----------------
  1290: `var getDecimalValue = function (head) {
  let n = 0;
  for (let p = head; p; p = p.next) n = n * 2 + p.val;
  return n;
};`,
  2095: `var deleteMiddle = function (head) {
  if (!head.next) return null;
  let slow = head, fast = head.next.next;   // stop one before the middle
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  slow.next = slow.next.next;
  return head;
};`,
  1721: `var swapNodes = function (head, k) {
  let first = head;
  for (let i = 1; i < k; i++) first = first.next;
  let fast = first, second = head;          // gap pointers find the k-th from the end
  while (fast.next) { fast = fast.next; second = second.next; }
  [first.val, second.val] = [second.val, first.val];
  return head;
};`,
  2130: `var pairSum = function (head) {
  let slow = head, fast = head, prev = null;
  while (fast && fast.next) {               // reverse the first half while walking
    fast = fast.next.next;
    const n = slow.next; slow.next = prev; prev = slow; slow = n;
  }
  let best = 0;
  for (; slow; slow = slow.next, prev = prev.next) best = Math.max(best, slow.val + prev.val);
  return best;
};`,
  1669: `var mergeInBetween = function (list1, a, b, list2) {
  let before = list1;
  for (let i = 1; i < a; i++) before = before.next;
  let after = before;
  for (let i = a; i <= b + 1; i++) after = after.next;
  before.next = list2;
  let tail = list2;
  while (tail.next) tail = tail.next;
  tail.next = after;
  return list1;
};`,
  725: `var splitListToParts = function (head, k) {
  let len = 0;
  for (let p = head; p; p = p.next) len++;
  const base = Math.floor(len / k), extra = len % k, parts = [];
  let cur = head;
  for (let i = 0; i < k; i++) {
    parts.push(cur);
    const size = base + (i < extra ? 1 : 0);
    for (let j = 1; j < size; j++) cur = cur.next;
    if (cur) { const n = cur.next; cur.next = null; cur = n; }
  }
  return parts;
};`,
  2181: `var mergeNodes = function (head) {
  const dummy = new ListNode(0);
  let tail = dummy, sum = 0;
  for (let p = head.next; p; p = p.next) {
    if (p.val === 0) { tail.next = new ListNode(sum); tail = tail.next; sum = 0; }
    else sum += p.val;
  }
  return dummy.next;
};`,
  2487: `// Monotonic stack: keep nodes in decreasing order from left to right.
var removeNodes = function (head) {
  const stack = [];
  for (let p = head; p; p = p.next) {
    while (stack.length && stack.at(-1).val < p.val) stack.pop();
    stack.push(p);
  }
  for (let i = 0; i < stack.length; i++) stack[i].next = stack[i + 1] ?? null;
  return stack[0];
};`,
  2816: `var doubleIt = function (head) {
  if (head.val > 4) head = new ListNode(0, head);  // room for a new leading digit
  for (let p = head; p; p = p.next) {
    p.val = (p.val * 2) % 10;
    if (p.next && p.next.val > 4) p.val += 1;      // carry from the next digit
  }
  return head;
};`,
  147: `var insertionSortList = function (head) {
  const dummy = new ListNode(0);
  let cur = head;
  while (cur) {
    const next = cur.next;
    let prev = dummy;
    while (prev.next && prev.next.val < cur.val) prev = prev.next;
    cur.next = prev.next;
    prev.next = cur;
    cur = next;
  }
  return dummy.next;
};`,
  430: `var flatten = function (head) {
  const stack = [];
  let cur = head;
  while (cur) {
    if (cur.child) {
      if (cur.next) stack.push(cur.next);   // come back to the rest later
      cur.next = cur.child;
      cur.child.prev = cur;
      cur.child = null;
    } else if (!cur.next && stack.length) {
      const n = stack.pop();
      cur.next = n;
      n.prev = cur;
    }
    cur = cur.next;
  }
  return head;
};`,
  109: `var sortedListToBST = function (head) {
  const vals = [];
  for (let p = head; p; p = p.next) vals.push(p.val);
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const mid = (lo + hi) >> 1;               // middle becomes the root
    return new TreeNode(vals[mid], build(lo, mid - 1), build(mid + 1, hi));
  };
  return build(0, vals.length - 1);
};`,
  // ---------------- arrays and strings ----------------
  1: `var twoSum = function (nums, target) {
  const seen = new Map();                 // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
};`,
  217: `var containsDuplicate = function (nums) {
  return new Set(nums).size !== nums.length;
};`,
  242: `var isAnagram = function (s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every((c) => c === 0);
};`,
  125: `var isPalindrome = function (s) {
  const ok = (c) => /[a-z0-9]/i.test(c);
  let i = 0, j = s.length - 1;
  while (i < j) {
    if (!ok(s[i])) { i++; continue; }
    if (!ok(s[j])) { j--; continue; }
    if (s[i].toLowerCase() !== s[j].toLowerCase()) return false;
    i++; j--;
  }
  return true;
};`,
  344: `var reverseString = function (s) {
  for (let i = 0, j = s.length - 1; i < j; i++, j--) [s[i], s[j]] = [s[j], s[i]];
};`,
  283: `var moveZeroes = function (nums) {
  let write = 0;
  for (const n of nums) if (n !== 0) nums[write++] = n;
  while (write < nums.length) nums[write++] = 0;
};`,
  88: `var merge = function (nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;   // fill from the back
  while (j >= 0) {
    nums1[k--] = i >= 0 && nums1[i] > nums2[j] ? nums1[i--] : nums2[j--];
  }
};`,
  121: `var maxProfit = function (prices) {
  let minPrice = Infinity, best = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    best = Math.max(best, p - minPrice);
  }
  return best;
};`,
  53: `var maxSubArray = function (nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);  // extend or start fresh
    best = Math.max(best, cur);
  }
  return best;
};`,
  169: `var majorityElement = function (nums) {
  let candidate = 0, count = 0;            // Boyer-Moore voting
  for (const n of nums) {
    if (count === 0) candidate = n;
    count += n === candidate ? 1 : -1;
  }
  return candidate;
};`,
  268: `var missingNumber = function (nums) {
  const n = nums.length;
  return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);
};`,
  20: `var isValid = function (s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const c of s) {
    if (c in pairs) {
      if (stack.pop() !== pairs[c]) return false;
    } else stack.push(c);
  }
  return stack.length === 0;
};`,
  704: `var search = function (nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
};`,
  189: `var rotate = function (nums, k) {
  k %= nums.length;
  const rev = (i, j) => { while (i < j) { [nums[i], nums[j]] = [nums[j], nums[i]]; i++; j--; } };
  rev(0, nums.length - 1);   // reverse all
  rev(0, k - 1);             // reverse the first k
  rev(k, nums.length - 1);   // reverse the rest
};`,
  238: `var productExceptSelf = function (nums) {
  const n = nums.length, out = new Array(n).fill(1);
  let left = 1;
  for (let i = 0; i < n; i++) { out[i] = left; left *= nums[i]; }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
};`,
  11: `var maxArea = function (height) {
  let i = 0, j = height.length - 1, best = 0;
  while (i < j) {
    best = Math.max(best, Math.min(height[i], height[j]) * (j - i));
    if (height[i] < height[j]) i++; else j--;   // move the shorter wall
  }
  return best;
};`,
  15: `var threeSum = function (nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;   // skip duplicate anchors
    let lo = i + 1, hi = nums.length - 1;
    while (lo < hi) {
      const sum = nums[i] + nums[lo] + nums[hi];
      if (sum === 0) {
        res.push([nums[i], nums[lo], nums[hi]]);
        while (lo < hi && nums[lo] === nums[lo + 1]) lo++;
        while (lo < hi && nums[hi] === nums[hi - 1]) hi--;
        lo++; hi--;
      } else if (sum < 0) lo++; else hi--;
    }
  }
  return res;
};`,
  3: `var lengthOfLongestSubstring = function (s) {
  const last = new Map();                  // char -> last index
  let start = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    if (last.has(s[i]) && last.get(s[i]) >= start) start = last.get(s[i]) + 1;
    last.set(s[i], i);
    best = Math.max(best, i - start + 1);
  }
  return best;
};`,
  412: `var fizzBuzz = function (n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i));
  }
  return out;
};`,
  // ---------------- classic questions (keyed by section title) ----------------
  'Reverse a string without using Reverse()': `function reverse(s) {
  let out = '';
  for (let i = s.length - 1; i >= 0; i--) out += s[i];
  return out;
}
// one-liner: [...s].reverse().join('')  (spread keeps emoji pairs together)`,
  'Count the characters in a string': `function countChars(s) {
  const counts = new Map();
  for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
  return counts;   // e.g. Map { 'h' => 1, 'e' => 1, 'l' => 2, 'o' => 1 }
}`,
  'Find the first non-repeating character': `function firstUnique(s) {
  const counts = new Map();
  for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
  for (const c of s) if (counts.get(c) === 1) return c;
  return null;
}`,
  'Swap two numbers without a third variable': `let a = 5, b = 9;
[a, b] = [b, a];          // destructuring swap
// arithmetic version: a = a + b; b = a - b; a = a - b;`,
  'Check for a prime number': `function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}`,
  'Fibonacci: recursive versus loop': `const fibRecursive = (n) => (n < 2 ? n : fibRecursive(n - 1) + fibRecursive(n - 2)); // O(2^n)

function fib(n) {          // O(n) time, O(1) space
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}`,
  'Factorial and recursion': `const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
// big numbers: use BigInt -> const f = (n) => (n <= 1n ? 1n : n * f(n - 1n));`,
  'Check whether a number is a power of two': `const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;`,
  'Find the second largest number': `function secondLargest(nums) {
  let first = -Infinity, second = -Infinity;
  for (const n of nums) {
    if (n > first) { second = first; first = n; }
    else if (n > second && n < first) second = n;
  }
  return second === -Infinity ? null : second;
}`,
};
