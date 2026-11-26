# More interview questions

## IOptions vs IOptionsSnapshot vs IOptionsMonitor: what is the difference?

All bind configuration sections to a class. **`IOptions<T>`** is a **singleton** read once at startup (no reload). **`IOptionsSnapshot<T>`** is **scoped**: values are re-read **per request** (good for web apps with changing config). **`IOptionsMonitor<T>`** is a singleton that **notifies on change** (`OnChange`) and always returns the current value, usable from singletons and background services.

## How does model binding and validation work in ASP.NET Core?

The framework fills action parameters from the **route, query string, headers and body** (`[FromBody]` JSON, `[FromQuery]`, `[FromRoute]`). It then validates the model using **data annotations** (`[Required]`, `[Range]`) or FluentValidation. With `[ApiController]` an invalid model automatically returns **400** with a `ValidationProblemDetails` body. In minimal APIs use endpoint filters or libraries for validation.

## What is Kestrel and why put a reverse proxy in front of it?

**Kestrel** is ASP.NET Core's built-in, cross-platform web server. In production it is usually placed behind a **reverse proxy** (Nginx, IIS, YARP, a cloud load balancer) that handles **TLS termination, load balancing, compression, static files, request limits and extra hardening**. Configure `ForwardedHeaders` so the app sees the real client IP and scheme.

## How do you add health checks and what are readiness and liveness?

`builder.Services.AddHealthChecks().AddNpgSql(connectionString)` and `app.MapHealthChecks("/health")`. **Liveness** answers "is the process alive?" (restart it if not). **Readiness** answers "can it serve traffic?" (dependencies such as the database are reachable); orchestrators like Kubernetes remove an unready instance from the load balancer. Keep liveness cheap and put dependency checks in readiness.

## IMemoryCache vs IDistributedCache vs output caching: when do you use each?

- **`IMemoryCache`**: in-process, fastest, but per instance (not shared, lost on restart).
- **`IDistributedCache`** (Redis, SQL Server): shared by all instances and survives restarts, at the cost of network latency and serialization.
- **Output caching / response caching**: caches the **whole HTTP response** for matching requests.
Always choose expiry, key design and invalidation, and protect against **cache stampedes** (many requests rebuilding the same entry).

## gRPC vs REST in .NET: how do you choose?

**gRPC** uses **HTTP/2 and Protobuf** (binary, strongly typed contracts, streaming, code generation): fast and compact, ideal for **service-to-service** calls. **REST/JSON** is human-readable, cache-friendly and works in browsers and with any client, so it suits **public APIs**. gRPC in browsers needs gRPC-Web. Many systems use gRPC internally and REST at the edge.

## Lazy loading vs eager loading vs explicit loading in EF Core?

**Eager**: load related data with the query (`Include`/`ThenInclude`). **Lazy**: related data loads **on first access** (needs proxies; can cause hidden N+1 queries). **Explicit**: you load it on demand (`context.Entry(x).Collection(c => c.Orders).Load()`). Prefer **eager loading or projections** for predictable queries and avoid lazy loading in web APIs.

## What is the EF Core change tracker and how does `SaveChanges` work?

The **change tracker** remembers the entities a `DbContext` loaded or attached and their original values. On `SaveChanges()` it detects **added, modified and deleted** entities, builds the SQL, runs it in one **transaction**, and updates generated values (ids, concurrency tokens). `AsNoTracking()` skips tracking for read-only queries, and bulk operations (`ExecuteUpdateAsync`, `ExecuteDeleteAsync`) run SQL directly without loading entities.

## What is CQRS, and when is MediatR useful?

**CQRS** separates **commands** (change state) from **queries** (read state), each with its own model, so reads can be optimised and writes kept consistent. **MediatR** is a library that sends a request object to a handler (`mediator.Send(new CreateOrder(...))`), giving a clean place for cross-cutting behaviours (validation, logging, transactions) via pipeline behaviours. It is optional: use it when it clarifies a large codebase, not for tiny CRUD apps.

## How do you do structured logging and tracing in .NET?

Use `ILogger<T>` with **message templates** (`logger.LogInformation("Order {OrderId} paid", id)`) and a sink such as **Serilog** or the built-in providers, writing JSON to a central system (Seq, Elastic, Application Insights). Add a **correlation/trace id** to every log, and use **OpenTelemetry** (`AddOpenTelemetry`) for distributed traces and metrics across services. Never log secrets or personal data.

## How do you make HTTP calls resilient with Polly or the resilience handler?

Add **timeouts, retries with exponential backoff and jitter, circuit breakers and bulkhead limits** around outbound calls: `AddHttpClient<T>().AddStandardResilienceHandler()` (Microsoft.Extensions.Http.Resilience, built on Polly v8). Retry only **transient** failures (timeouts, 5xx, 429) and idempotent requests, set an overall timeout, and log retries so you can see degradation.

## Exceptions vs the Result pattern: when do you use each?

Use **exceptions** for truly exceptional, unexpected conditions (bugs, I/O failure). Use a **Result type** (`Result<T>` / discriminated union style, OneOf, ErrorOr) for **expected business outcomes** such as "email already exists" or "validation failed", because exceptions are slow when thrown often and hide the possible outcomes from the method signature. Map results to HTTP status codes (400/404/409) in one place.

## What is Native AOT and what are its limits?

**Native AOT** compiles your app **ahead of time** to a self-contained native executable: very fast startup, small memory use and no JIT, good for serverless and containers. Limits: no runtime code generation, **limited reflection** (needs source generators or trimming annotations), not every library is compatible, and ASP.NET Core supports it mainly for **minimal APIs**. Test with trimming warnings enabled.
