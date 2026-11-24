---
slug: dotnet
title: .NET & ASP.NET Core
subtitle: Runtime, ASP.NET Core, DI, middleware, EF Core, LINQ, async and interview questions
emoji: 🔷
accent: #6366f1
category: .NET
---

# Start here

## What is .NET, in one minute

**.NET** is a free, open-source, cross-platform developer platform from Microsoft. You write code in **C#** (or F#, VB), it compiles to **IL** (Intermediate Language), and the **CLR** (Common Language Runtime) turns that IL into machine code at run time with the **JIT** compiler.

| Piece | What it is | Everyday picture |
|---|---|---|
| C# | The language you write | The recipe |
| IL | Compiled, CPU-neutral instructions inside a `.dll` | A recipe translated into a universal shorthand |
| CLR | Runtime: JIT, garbage collector, type safety, exceptions | The chef who reads the shorthand and cooks |
| BCL | Base Class Library: `System.*`, collections, IO, HTTP | The pantry of ready ingredients |
| SDK / `dotnet` CLI | Tools to create, build, run, test, publish | The kitchen equipment |

> Names you will hear: **.NET Framework** (old, Windows-only, v4.8 is the last), **.NET Core** (the cross-platform rewrite), and modern **.NET 5, 6, 7, 8, 9…** (the continuation of .NET Core; even numbers are LTS). Today "**.NET**" means the modern one.

## Your first app with the dotnet CLI

```bash
dotnet --version                 # check the SDK
dotnet new console -n HelloApp   # create a console app
cd HelloApp
dotnet run                       # build + run

dotnet new webapi -n ShopApi     # an ASP.NET Core Web API
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet watch                     # hot reload while you code
dotnet test                      # run xUnit / NUnit / MSTest tests
dotnet publish -c Release        # build for deployment
```

A modern `Program.cs` uses **top-level statements**, so you do not need `class Program { static void Main() }`:

```csharp
Console.WriteLine("Hello, .NET!");
var name = args.Length > 0 ? args[0] : "world";
Console.WriteLine($"Hi {name}");
```

## How a .NET program runs

1. **Compile**: `csc`/Roslyn turns C# into IL + metadata inside an assembly (`.dll`).
2. **Load**: the CLR loads the assembly and checks types.
3. **JIT**: each method is compiled to native machine code the first time it is called (tiered compilation makes hot methods faster later).
4. **Run**: the **garbage collector** frees objects you no longer use; exceptions unwind the stack safely.

**Native AOT** skips the JIT: the app is compiled ahead of time to a single native file. Faster start-up and lower memory, but no runtime code generation (some reflection-heavy libraries will not work).

# C# essentials for interviews

## What is the difference between value types and reference types?

- **Value types** (`int`, `double`, `bool`, `struct`, `enum`) hold the data directly. Assigning copies the value.
- **Reference types** (`class`, `string`, arrays, `delegate`, `record class`) hold a reference to an object on the heap. Assigning copies the reference, so both variables point to the same object.

```csharp
struct PointS { public int X; }
class PointC { public int X; }

var a = new PointS { X = 1 }; var b = a; b.X = 99;   // a.X is still 1 (copy)
var c = new PointC { X = 1 }; var d = c; d.X = 99;   // c.X is now 99 (same object)
```

`string` is a reference type but **immutable**, so it behaves like a value in practice.

## What are class, struct, record and interface?

| Kind | Use it for |
|---|---|
| `class` | Objects with identity and behaviour (services, entities) |
| `struct` | Small, short-lived values (Point, Money) — avoid big structs |
| `record` | Immutable data with value equality and `with` copies (DTOs, events) |
| `interface` | A contract: what something can do, not how |

```csharp
public record Product(int Id, string Name, decimal Price);
var p1 = new Product(1, "Pen", 2.5m);
var p2 = p1 with { Price = 3m };     // copy with one change
Console.WriteLine(p1 == new Product(1, "Pen", 2.5m)); // True: value equality
```

## What are boxing and unboxing?

**Boxing** wraps a value type in an `object` on the heap; **unboxing** copies it back out. It costs allocations and GC pressure, which is why generics (`List<int>`) beat old non-generic collections (`ArrayList`).

```csharp
int n = 42;
object o = n;      // boxing
int m = (int)o;    // unboxing
```

## What does nullable reference types (NRT) give you?

With `<Nullable>enable</Nullable>`, `string` means "never null" and `string?` means "may be null". The compiler warns when you might dereference null. Use `?.`, `??` and `??=`:

```csharp
string? city = user?.Address?.City;
string label = city ?? "Unknown";
cache ??= new Dictionary<string, int>();
```

## What is the difference between IEnumerable, ICollection, IList and IQueryable?

- `IEnumerable<T>`: can be looped over (`foreach`), lazy, read-only.
- `ICollection<T>`: adds `Count`, `Add`, `Remove`.
- `IList<T>`: adds index access `list[i]`.
- `IQueryable<T>`: a query that is **translated** (for example to SQL by EF Core) and runs on the data source. Filtering an `IQueryable` filters in the database; calling `.ToList()` first pulls everything into memory.

## What are delegates, Func, Action and events?

A **delegate** is a type-safe reference to a method. `Func<T, TResult>` returns a value, `Action<T>` returns nothing, `Predicate<T>` returns bool. An **event** is a delegate that outside code can only subscribe (`+=`) or unsubscribe (`-=`) to.

```csharp
Func<int, int> square = x => x * x;
Action<string> log = msg => Console.WriteLine(msg);

public class Order
{
    public event EventHandler? Paid;
    public void Pay() => Paid?.Invoke(this, EventArgs.Empty);
}
```

## How does garbage collection work in .NET?

The GC is **generational**: new objects go to **Gen 0**, survivors move to **Gen 1**, then **Gen 2**. Most objects die young, so Gen 0 collections are cheap and frequent. Objects of 85 KB or more go to the **Large Object Heap**. You do not free memory yourself, but you **do** release unmanaged resources (files, sockets, DB connections) with `IDisposable` and `using`:

```csharp
using var file = File.OpenRead("data.csv");   // Dispose() runs at end of scope
```

## What are generics and constraints?

Generics let you write type-safe code once for many types without boxing. Constraints limit which types are allowed.

```csharp
public T Max<T>(T a, T b) where T : IComparable<T> => a.CompareTo(b) >= 0 ? a : b;
public class Repo<T> where T : class, IEntity, new() { }
```

## What is the difference between const and readonly?

`const` is a compile-time constant baked into callers (only primitives and strings). `readonly` is set once at run time (in the declaration or constructor) and can hold any type. Changing a public `const` in a library requires recompiling the callers.

# LINQ

## What is LINQ?

**Language Integrated Query**: one set of operators (`Where`, `Select`, `OrderBy`, `GroupBy`, `Join`…) for any data source — lists, XML, databases. Try the **LINQ lab** on the Playground tab to see each operator run.

```csharp
var cheapByCategory = products
    .Where(p => p.Price < 50)
    .OrderBy(p => p.Price)
    .GroupBy(p => p.Category)
    .Select(g => new { Category = g.Key, Count = g.Count(), Avg = g.Average(p => p.Price) });
```

Query syntax compiles to the same thing:

```csharp
var q = from p in products
        where p.Price < 50
        orderby p.Price
        select p.Name;
```

## What is deferred execution in LINQ?

Most LINQ operators do **not** run when you write them. They build a pipeline that runs when you enumerate (`foreach`, `ToList()`, `Count()`, `First()`). If the source changes before you enumerate, you see the new data; if you enumerate twice, the work runs twice. Materialize with `ToList()` when you need a snapshot.

```csharp
var nums = new List<int> { 1, 2, 3 };
var big = nums.Where(n => n > 1);   // nothing runs yet
nums.Add(10);
Console.WriteLine(big.Count());     // 3  (2, 3, 10)
```

## First vs FirstOrDefault vs Single vs SingleOrDefault?

- `First()`: first match, throws if none.
- `FirstOrDefault()`: first match or `default` (null / 0).
- `Single()`: exactly one match, throws if zero **or more than one**.
- `SingleOrDefault()`: zero or one match, throws if more than one.

Use `Single` when duplicates would be a bug (lookup by primary key).

## Select vs SelectMany?

`Select` maps each item to one result (a list of lists stays nested). `SelectMany` flattens: each item maps to a sequence and all sequences are joined.

```csharp
var allTags = posts.SelectMany(p => p.Tags).Distinct();
```

# Async and parallel

## How do async and await work?

`async` lets a method use `await`. When you `await` an unfinished `Task`, the method **returns to its caller** and the thread is free to do other work. When the task completes, the rest of the method continues (a state machine generated by the compiler). For I/O (HTTP, DB, files) no thread is blocked while waiting, so a web server can handle many more requests.

```csharp
public async Task<string> GetTitleAsync(HttpClient http, string url)
{
    var html = await http.GetStringAsync(url);   // thread is released here
    return html[..Math.Min(80, html.Length)];
}
```

## Task vs Thread vs ValueTask?

- **Thread**: an OS thread. Expensive; you rarely create one directly.
- **Task**: a promise of a future result, usually run on the **thread pool** or completed by I/O.
- **ValueTask**: avoids an allocation when the result is often already available (hot paths, caches). Await it only once.

Use `Task.Run` for **CPU-bound** work you want off the current thread; do not wrap I/O calls in `Task.Run`.

## Why should you avoid .Result and .Wait()?

They **block** a thread until the task finishes. In apps with a synchronization context (old ASP.NET, WinForms, WPF) this can **deadlock**: the task waits for the blocked thread to continue. In ASP.NET Core it wastes thread-pool threads and causes thread starvation under load. Rule: **async all the way down**.

## How do you run tasks in parallel and cancel them?

```csharp
var t1 = http.GetStringAsync(urlA);
var t2 = http.GetStringAsync(urlB);
var results = await Task.WhenAll(t1, t2);   // both run at the same time

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
await DoWorkAsync(cts.Token);               // pass the token down to every async call
```

In ASP.NET Core, accept a `CancellationToken` in your endpoint; it is cancelled when the client disconnects.

## What does ConfigureAwait(false) do?

It tells `await` not to resume on the captured synchronization context. In **library** code it avoids deadlocks and is slightly faster. ASP.NET Core has no synchronization context, so in app code it makes no difference.

# ASP.NET Core

## What is ASP.NET Core?

The cross-platform web framework of .NET: Web APIs, MVC, Razor Pages, Blazor, SignalR and gRPC, all on the fast **Kestrel** web server. Everything is built from three ideas: **dependency injection**, a **middleware pipeline**, and **configuration**.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ShopDb>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("Shop")));
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/products/{id:int}", async (int id, ShopDb db) =>
    await db.Products.FindAsync(id) is { } p ? Results.Ok(p) : Results.NotFound());

app.Run();
```

## What is middleware and why does order matter?

Middleware are components chained into a **pipeline**. Each one can act on the request, call `next()` to pass it on, then act on the response on the way back. **Order matters** because the request flows down in registration order and the response flows back up in reverse. A middleware can also **short-circuit** (return without calling next), like static files or an auth failure. Play with it in the **Middleware pipeline** lab.

```csharp
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();
    await next();                                        // the rest of the pipeline
    Console.WriteLine($"{context.Request.Path} took {sw.ElapsedMilliseconds} ms");
});
```

Typical order: exception handler → HSTS → HTTPS redirection → static files → routing → CORS → authentication → authorization → endpoints.

## What is dependency injection and what are the three lifetimes?

**DI** means classes ask for what they need in their constructor and the container creates and passes it in. It makes code testable (swap a fake) and loosely coupled.

| Lifetime | One instance per… | Typical use |
|---|---|---|
| **Singleton** | the whole app | caches, config, `HttpClient` factories |
| **Scoped** | HTTP request | `DbContext`, unit of work, current user |
| **Transient** | every resolve | light, stateless helpers |

**Captive dependency** bug: a singleton that takes a scoped service keeps one `DbContext` forever (stale data, thread-safety bugs). The DI container throws for this in Development when scope validation is on. Try the **DI lifetimes** lab.

## Minimal APIs vs controllers?

**Minimal APIs** (`app.MapGet(...)`) are short and fast, great for microservices and small APIs. **Controllers** (`[ApiController]` classes) give structure for big APIs: filters, model binding conventions, and grouping. Both share routing, DI, validation and OpenAPI, and you can mix them.

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController(ShopDb db) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> Get(int id) =>
        await db.Products.FindAsync(id) is { } p ? p : NotFound();
}
```

## How does configuration work in ASP.NET Core?

Configuration is layered; later sources override earlier ones: `appsettings.json` → `appsettings.{Environment}.json` → **user secrets** (dev) → **environment variables** → command line. Bind sections to classes with the **Options pattern**:

```csharp
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
public class Mailer(IOptions<SmtpOptions> opt) { /* opt.Value.Host */ }
```

Never commit secrets: use user secrets locally and a vault (Azure Key Vault, AWS Secrets Manager) in production.

## How do authentication and authorization work?

**Authentication** = who are you (cookie, JWT bearer, OpenID Connect). **Authorization** = what may you do (roles, policies, claims). `UseAuthentication()` must come before `UseAuthorization()`.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddAuthorization(o => o.AddPolicy("Admin", p => p.RequireRole("admin")));
app.MapDelete("/products/{id}", Delete).RequireAuthorization("Admin");
```

## What are filters in ASP.NET Core MVC?

Filters run around controller actions in a set order: **authorization → resource → action → exception → result**. Use them for cross-cutting concerns that need MVC context (validation, caching, audit). Middleware runs for every request; filters only for MVC endpoints.

## How do you handle errors globally?

Use `app.UseExceptionHandler()` with **ProblemDetails** so every error returns a standard JSON shape, plus `IExceptionHandler` (.NET 8+) for custom mapping. Log with `ILogger<T>` and never leak stack traces in production.

```csharp
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
app.UseStatusCodePages();
```

## How do you make HTTP calls correctly with HttpClient?

Do not `new HttpClient()` per request (socket exhaustion) and do not keep one forever without DNS refresh. Use **IHttpClientFactory** with typed clients, and add retries/timeouts with resilience handlers (Polly).

```csharp
builder.Services.AddHttpClient<GitHubClient>(c => c.BaseAddress = new("https://api.github.com"))
                .AddStandardResilienceHandler();
```

## What are background services?

Implement `BackgroundService` (an `IHostedService`) for long-running work inside the app: queue consumers, scheduled clean-ups. Create a scope inside it to use scoped services like `DbContext`.

```csharp
public class Cleanup(IServiceScopeFactory scopes) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ShopDb>();
            await db.Database.ExecuteSqlRawAsync("DELETE FROM carts WHERE updated < now() - interval '7 days'", ct);
            await Task.Delay(TimeSpan.FromHours(1), ct);
        }
    }
}
```

# Entity Framework Core

## What is EF Core?

An **ORM**: you work with C# classes and LINQ, and EF Core translates to SQL for PostgreSQL, SQL Server, SQLite, MySQL and more. Key parts: `DbContext` (a unit of work + change tracker), `DbSet<T>` (a table), **migrations** (versioned schema changes).

```csharp
public class ShopDb(DbContextOptions<ShopDb> o) : DbContext(o)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
}

// dotnet ef migrations add Init
// dotnet ef database update
```

## Code-first vs database-first?

**Code-first**: write classes, generate migrations, the database follows the code (common for new apps). **Database-first**: scaffold classes from an existing database with `dotnet ef dbcontext scaffold`.

## What is the N+1 problem and how do you fix it in EF Core?

Loading 100 orders, then running 1 extra query per order to load its customer = 101 queries. Fix with **eager loading** (`Include`), **projection** (`Select` only what you need), or split queries for big graphs.

```csharp
var orders = await db.Orders
    .Include(o => o.Customer)
    .Where(o => o.Total > 100)
    .Select(o => new { o.Id, o.Total, Customer = o.Customer.Name })
    .ToListAsync();
```

## What is AsNoTracking and when do you use it?

By default EF tracks every loaded entity to detect changes. For **read-only** queries, `AsNoTracking()` skips that work: less memory, faster. Use tracking when you will modify and `SaveChanges()`.

## How do you handle concurrency in EF Core?

Use **optimistic concurrency**: add a concurrency token (a `rowversion` in SQL Server, or `xmin` in PostgreSQL). If two users edit the same row, the second `SaveChanges()` throws `DbUpdateConcurrencyException`, and you decide: retry, merge, or show a conflict.

## How do transactions work in EF Core?

`SaveChanges()` is already one transaction. For several `SaveChanges()` calls or raw SQL in one unit, use an explicit transaction:

```csharp
await using var tx = await db.Database.BeginTransactionAsync();
db.Accounts.Find(1)!.Balance -= 100;
db.Accounts.Find(2)!.Balance += 100;
await db.SaveChangesAsync();
await tx.CommitAsync();
```

# Architecture & testing

## What are SOLID principles?

- **S**ingle responsibility: one reason to change.
- **O**pen/closed: extend by adding code, not editing working code.
- **L**iskov substitution: subclasses must work wherever the base type works.
- **I**nterface segregation: small, focused interfaces.
- **D**ependency inversion: depend on abstractions (interfaces), injected by DI.

## What is Clean Architecture in .NET?

Layers point **inward**: `Domain` (entities, rules, no dependencies) ← `Application` (use cases, interfaces) ← `Infrastructure` (EF Core, email, files) and `Api` (controllers/endpoints). The core does not know about databases or web frameworks, so it is easy to test and change. Often combined with **CQRS** (separate commands and queries) and **MediatR**.

## How do you test an ASP.NET Core app?

- **Unit tests** with xUnit + a mocking library (Moq/NSubstitute) for services.
- **Integration tests** with `WebApplicationFactory<Program>`: spin up the real app in memory and call it with an `HttpClient`; use Testcontainers for a real PostgreSQL/MongoDB.

```csharp
public class ApiTests(WebApplicationFactory<Program> f) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Health_returns_ok()
    {
        var res = await f.CreateClient().GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }
}
```

## How do you improve ASP.NET Core performance?

Async I/O everywhere, `AsNoTracking` + projections, response caching / output caching, `IMemoryCache` or Redis (`IDistributedCache`), compression, pagination, connection pooling, avoid large allocations (`Span<T>`, `ArrayPool`), and measure with `dotnet-counters`, `dotnet-trace` and BenchmarkDotNet before optimizing.

## How do you deploy a .NET app?

`dotnet publish -c Release`, then run it in a container (`mcr.microsoft.com/dotnet/aspnet` image, or `dotnet publish /t:PublishContainer`), on Azure App Service, Kubernetes, or behind a reverse proxy (Nginx/IIS). Add health checks (`app.MapHealthChecks("/health")`), structured logging (Serilog/OpenTelemetry), and config via environment variables.
