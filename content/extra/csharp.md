# More interview questions

## What is the difference between an abstract class and an interface?

An **interface** defines a **contract** (what a type can do) and a class can implement **many**; since C# 8 interfaces can have default methods but still no instance state. An **abstract class** can hold **fields, constructors and shared code**, cannot be instantiated, and a class can inherit only **one**. Use an interface for capabilities (`IDisposable`, `IComparable`) and an abstract class when related types share state and behaviour.

## What is the difference between `ref`, `out` and `in` parameters?

- `ref`: pass a variable **by reference**; it must be initialised first; the method can read and change it.
- `out`: the method **must assign** it before returning; the caller need not initialise it (`int.TryParse(s, out var n)`).
- `in`: pass by reference as **read-only** (avoids copying large structs).

```csharp
void Add(ref int x) => x += 1;
bool TryGet(string s, out int value) => int.TryParse(s, out value);
```

## Why is `async void` dangerous?

An `async void` method cannot be awaited, so the caller cannot know when it finishes, and an **exception cannot be caught** by the caller: it is raised on the synchronization context and can crash the process. Use `async Task` everywhere. `async void` is only acceptable for **event handlers**.

## What is the difference between `==` and `Equals()` in C#?

For **value types** both compare values. For **reference types**, `==` compares **references** by default and `Equals()` also does unless overridden. `string` overloads `==` to compare **content**. Classes can override `Equals`/`GetHashCode` (and `==`); **records** do value-based equality automatically. Always override `GetHashCode` together with `Equals`.

## Why is string concatenation in a loop slow, and what do you use instead?

Strings are **immutable**: every `+=` creates a **new string** and copies the old one, which is O(n²) overall. Use **`StringBuilder`** (mutable buffer, amortised O(1) appends) or `string.Join`.

```csharp
var sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.Append(i).Append(',');
string result = sb.ToString();
```

## What are covariance and contravariance?

They describe how generic types relate when their type arguments are related. **Covariance** (`out T`) lets `IEnumerable<Dog>` be used as `IEnumerable<Animal>` (you only read items). **Contravariance** (`in T`) lets `Action<Animal>` be used as `Action<Dog>` (you only put items in). Arrays are covariant but unsafe (runtime error on wrong write); `List<T>` is invariant.

## What does `IDisposable` do and why use `using`?

`IDisposable.Dispose()` releases **unmanaged resources** (files, sockets, DB connections) deterministically instead of waiting for the garbage collector. `using var x = new FileStream(...)` calls `Dispose()` automatically at the end of the scope, even if an exception occurs. Implement the **dispose pattern** (and a finalizer only if you hold unmanaged handles directly), and `IAsyncDisposable` with `await using` for async cleanup.

## What are `Span<T>` and `Memory<T>`?

`Span<T>` is a **stack-only view** over a contiguous block of memory (array, stackalloc, part of a string) with no copying and no allocation: great for fast parsing and slicing. Because it lives on the stack it cannot be stored in fields or used across `await`. `Memory<T>` is the heap-friendly version that can be stored and used in async code.

## How does `lock` work and what are its pitfalls?

`lock (obj) { … }` lets only **one thread at a time** enter the block, using a monitor on `obj`. Pitfalls: locking on `this`, a `string` or a `Type` (others can lock it too, causing deadlocks), holding a lock while calling unknown code or doing I/O, **inconsistent lock order** (deadlock), and using `lock` with `await` (not allowed). Prefer a private `readonly object`, concurrent collections, `Interlocked`, or `SemaphoreSlim` for async.

## What is the difference between `IEnumerable<T>`, `List<T>` and `IReadOnlyList<T>` as a return type?

`IEnumerable<T>` promises only **forward iteration** (possibly lazy, possibly multiple enumerations costly). `IReadOnlyList<T>` adds **Count and index** access without allowing changes: a good public API return type. `List<T>` exposes **mutation** and ties callers to a concrete type. Accept the **most general** type as a parameter and return the **most useful read-only** type.

## What is the garbage collector's generational model, and what is the Large Object Heap?

Objects start in **Gen 0**; survivors move to **Gen 1** and then **Gen 2**. Gen 0 collections are fast and frequent because most objects die young. Objects of about **85,000 bytes or more** go to the **Large Object Heap**, which is collected with Gen 2 and was historically not compacted, so big short-lived arrays can cause fragmentation and pauses. Reuse buffers (`ArrayPool<T>`) and avoid unnecessary large allocations.

## What are nullable reference types and how do they help?

With `<Nullable>enable</Nullable>`, the compiler tracks whether a reference **may be null** (`string?`) or **should not** (`string`) and warns about possible null dereferences. They do not change runtime behaviour but catch most `NullReferenceException`s at compile time. Use `?.`, `??`, `??=`, and `is not null`, and the `!` (null-forgiving) operator sparingly.

## What is pattern matching in C#?

A way to **test a value's shape and extract data** in one step: type patterns (`obj is string s`), `switch` expressions, property patterns (`p is { Age: > 18 }`), relational and logical patterns (`>= 10 and < 20`), and list patterns (`[1, 2, ..]`).

```csharp
string Describe(object o) => o switch
{
    int n when n < 0 => "negative",
    int n => $"int {n}",
    string { Length: 0 } => "empty string",
    null => "null",
    _ => "other",
};
```
