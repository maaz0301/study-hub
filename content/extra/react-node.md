# More interview questions

## useMemo vs useCallback vs React.memo: what does each do and when is it worth it?

`useMemo(fn, deps)` caches a **computed value**; `useCallback(fn, deps)` caches a **function reference**; `React.memo(Component)` skips re-rendering a component when its **props are shallow-equal**. They matter when a child is wrapped in `React.memo` and you pass it a new object or function every render, or when a calculation is truly expensive. Using them everywhere adds overhead and complexity: **measure first** (React DevTools Profiler).

## Why do list items need a stable `key`, and why is the array index a bad key?

React uses `key` to match elements between renders. With **stable unique ids**, React moves and reuses the right component instances. With **index keys**, inserting, deleting or reordering items makes React reuse the wrong instance, so **state and DOM (like input text) stick to the wrong row** and updates are wasted. Index keys are only safe for static lists that never reorder.

## Controlled vs uncontrolled components?

A **controlled** input's value lives in React state (`value` + `onChange`), so React is the single source of truth: easy validation and conditional logic. An **uncontrolled** input keeps its value in the DOM and you read it with a `ref` (or `FormData`) when needed: less code and fewer re-renders. Use controlled for live validation or dependent fields; uncontrolled for simple forms and file inputs.

## What are useTransition and Suspense in React 18?

React 18's **concurrent rendering** lets React prepare updates without blocking input. `useTransition` marks a state update as **non-urgent** (`startTransition(() => setFilter(x))`) so typing stays responsive while a heavy list re-renders, with an `isPending` flag. **Suspense** shows a **fallback** while a part of the tree is waiting (lazy-loaded code, data fetching with supporting libraries or Server Components). Together they improve perceived performance.

## What are React Server Components and how do they differ from SSR?

**SSR** renders your normal components to HTML on the server, then the **whole component code is sent to the browser and hydrated**. **Server Components** run **only on the server**: they can read databases or files directly, ship **no JavaScript** to the browser, and stream their result; interactive parts are marked `"use client"`. The benefit is smaller bundles and simpler data access; the constraint is no hooks or browser APIs in server components.

## How do you avoid unnecessary re-renders with Context?

Every component that reads a context **re-renders when its value changes**. Reduce it by: **splitting contexts** (one for rarely changing data, one for frequently changing), **memoising the value** (`useMemo`) so you do not create a new object each render, keeping state close to where it is used, and using a state library with selectors (Zustand, Redux Toolkit, Jotai) for frequently changing data.

## What are error boundaries and what do they not catch?

An **error boundary** is a class component (or a library wrapper like `react-error-boundary`) that catches errors thrown **while rendering**, in lifecycle methods and in constructors of its children, and shows a fallback UI. It does **not** catch errors in **event handlers**, **async code** (promises, `setTimeout`), server-side rendering, or errors in the boundary itself. Wrap sections of the app so one broken widget does not blank the whole page.

## worker_threads vs cluster vs child_process in Node.js?

- **cluster**: starts several **processes** that share the same server port, to use all CPU cores for request handling.
- **worker_threads**: runs JavaScript in separate **threads** inside one process, sharing memory (SharedArrayBuffer): best for **CPU-heavy tasks** (hashing, image processing) without blocking the event loop.
- **child_process**: starts a separate **program** (another script or a command like `ffmpeg`) and communicates through pipes or messages.
In production, containers per core or a process manager (PM2, Kubernetes replicas) often replace `cluster`.

## What are streams and backpressure in Node.js?

A **stream** processes data in **chunks** instead of loading everything into memory (files, HTTP bodies, compression). **Backpressure** is the signal that the destination cannot keep up: `writable.write()` returns `false` and you should pause until the `drain` event. Using `pipeline()` (or `.pipe()`) handles this automatically and propagates errors, so you can copy a 5 GB file with a few MB of memory.

## How do you shut down a Node.js server gracefully?

On `SIGTERM`/`SIGINT`: stop accepting new connections (`server.close()`), let in-flight requests finish, close database/Redis/queue connections, flush logs, then `process.exit(0)`, with a **timeout** that forces exit if something hangs. This matters in Kubernetes and Docker, which send `SIGTERM` before killing the container, and prevents dropped requests during deploys.

## What is a CORS preflight request?

For "non-simple" cross-origin requests (methods like PUT/DELETE, custom headers, `application/json`), the browser first sends an **OPTIONS** request asking the server whether the real request is allowed. The server replies with `Access-Control-Allow-Origin`, `-Methods` and `-Headers` (and `-Max-Age` to cache the answer). If the answer is missing, the browser blocks the real request. CORS is enforced by **browsers**, not by the server or tools like curl.

## How do you design authentication with JWT and refresh tokens?

Issue a short-lived **access token** (5–15 minutes) sent as `Authorization: Bearer` and a long-lived **refresh token** stored in an **httpOnly, Secure, SameSite cookie** (or rotated server-side). When the access token expires, the client calls a refresh endpoint to get a new one; **rotate** refresh tokens and revoke them on logout or reuse. Keep secrets out of the JWT payload, verify signature, expiry, issuer and audience, and keep a revocation list for emergencies.

## How do you prevent the N+1 query problem in a Node.js API?

N+1 happens when you load a list (1 query) and then run one extra query for each item (N queries). Fix it by **eager loading/joins** (`include` in Sequelize/Prisma, `populate` in Mongoose, `JOIN` in SQL), **batching** with **DataLoader** (collects ids in one tick and runs a single query), or denormalising read models. Detect it with query logging and tracing.

## How do you make a POST endpoint idempotent?

Clients send an **Idempotency-Key** header (a unique id). The server stores the key with the result (in Redis or a table with a unique constraint); if the same key arrives again it returns the **saved response** instead of repeating the action. This makes retries safe for payments, orders and emails. Combine with database unique constraints and a TTL for old keys.
