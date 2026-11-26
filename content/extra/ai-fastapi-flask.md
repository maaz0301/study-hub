# More interview questions

## How do you stream an LLM response with FastAPI?

Return a `StreamingResponse` (or use Server-Sent Events) from an **async generator** that yields tokens as the model produces them, so the user sees text immediately.

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def token_stream(prompt: str):
    async for chunk in llm.astream(prompt):      # your async LLM client
        yield f"data: {chunk}\n\n"                # SSE format

@app.get("/chat")
async def chat(q: str):
    return StreamingResponse(token_stream(q), media_type="text/event-stream")
```

Handle client disconnects (stop generating) and send a final `[DONE]` event.

## How do you load an ML model once instead of on every request?

Use the **lifespan** handler (startup/shutdown) and store the model on `app.state`, or a module-level singleton.

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model()      # runs once at startup
    yield
    app.state.model = None              # cleanup on shutdown

app = FastAPI(lifespan=lifespan)
```

Loading per request makes every call slow and can exhaust memory.

## How do you serve a CPU-heavy or blocking model without freezing the server?

`async def` endpoints run on the event loop, so a long blocking call freezes **all** requests. Options: define the endpoint with plain `def` (FastAPI runs it in a **thread pool**), use `run_in_threadpool` / `asyncio.to_thread`, move heavy work to a **process pool** or a **worker queue** (Celery, RQ, Arq), or a dedicated inference server (vLLM, Triton, BentoML). Run several Uvicorn/Gunicorn workers to use all CPU cores.

## How do you structure a large FastAPI project?

Split by responsibility: **routers** (`APIRouter`, HTTP only), **schemas** (Pydantic models), **services** (business logic), **repositories** (database access), **dependencies** (`Depends`), **core** (config, security), and **tests**. Keep route functions thin, inject services with `Depends`, load settings with `pydantic-settings`, and version the API (`/api/v1`). This keeps logic testable without HTTP.

## How do you test FastAPI endpoints and override dependencies?

Use `TestClient` (or `httpx.AsyncClient`) with pytest. Replace real dependencies, such as the database or an external API, using `app.dependency_overrides`.

```python
def fake_db():
    yield FakeSession()

app.dependency_overrides[get_db] = fake_db
client = TestClient(app)
assert client.get("/items/1").status_code == 200
```

Test validation errors (422), auth failures (401/403) and edge cases too.

## What is the difference between Pydantic validation and parsing, and what changed in v2?

Pydantic **parses and validates**: it converts input to the declared types (`"5"` → `5` in lax mode) and raises `ValidationError` when it cannot. v2 (Rust core) is much faster and renamed APIs: `model_validate`, `model_dump`, `field_validator`, `model_config`. Use **strict** types when you must not coerce, `Field(...)` for constraints, and separate **input** and **output** models so you never expose internal fields.

## How do you use async database access with SQLAlchemy in FastAPI?

Use SQLAlchemy 2.0's **async engine and `AsyncSession`** with an async driver (`asyncpg`, `aiosqlite`). Create a session dependency that yields a session per request and closes it, `await` all queries, and avoid lazy loading outside the session (use `selectinload`/`joinedload`). Use Alembic for migrations. Never mix a sync driver into `async def` code.

## How do you add rate limiting and caching to an API?

**Rate limiting**: a library such as `slowapi` or `fastapi-limiter` (Redis-backed counters per IP/API key) or do it at the gateway/proxy (Nginx, API gateway). Return `429` with a `Retry-After` header. **Caching**: `Cache-Control`/ETag headers for HTTP caching, an in-process or **Redis** cache for expensive results (key by normalised input, set a TTL), and cache **LLM responses** for repeated prompts when it is safe to do so.

## How do WebSockets work in FastAPI, and when would you use them?

Declare `@app.websocket("/ws")`, `await websocket.accept()`, then loop with `receive_text()` / `send_text()`. Use them for **bidirectional, real-time** features: chat, live dashboards, collaborative editing. For one-way streaming (LLM tokens) **Server-Sent Events** are simpler and work through most proxies. Manage connections with a connection manager, handle disconnects, and scale out with Redis pub/sub so every instance can reach every client.

## Flask vs FastAPI vs Django: how do you choose?

- **Flask**: small, flexible, synchronous (WSGI); good for simple services and when you want to pick every library yourself.
- **FastAPI**: async (ASGI), automatic validation and OpenAPI docs, type hints; best for modern APIs and ML serving.
- **Django**: batteries included (ORM, admin, auth, migrations); best for full web apps with a database and admin.
Choose by need: API-first and performance → FastAPI; content site/admin → Django; tiny or legacy → Flask.

## How do you secure a FastAPI service?

Terminate **HTTPS**, authenticate with **OAuth2/JWT** (`OAuth2PasswordBearer`, short-lived access tokens, refresh tokens), hash passwords with bcrypt/argon2, authorise per route with dependencies (roles/scopes), validate every input with Pydantic, configure **CORS** with explicit origins, set security headers, rate limit, keep secrets in environment variables, pin and audit dependencies, and never run with debug/reload in production.

## How do you deploy a FastAPI app in production?

Run it with **Uvicorn** behind **Gunicorn** (`gunicorn -k uvicorn.workers.UvicornWorker`) or Uvicorn workers, in a **Docker** container, behind a reverse proxy (Nginx/Traefik/cloud load balancer) that handles TLS. Add health endpoints, structured logging, metrics (Prometheus), graceful shutdown, a CI pipeline (lint, tests, build image), and a rollout strategy (rolling or blue-green). Size workers to CPU cores and keep the app stateless.
