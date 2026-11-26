# More interview questions

## What is the difference between ReAct prompting and native tool calling?

In classic **ReAct** the model writes text like `Thought: … Action: search[query]` and your code **parses** that text, which is fragile. With **native tool calling** the provider's API returns **structured tool calls** (name plus JSON arguments) that match a schema, so parsing is reliable and the model is trained for it. Modern agents (including `create_agent`) use native tool calling; ReAct is the idea (reason, act, observe), not the format.

## How do you run long-running agent tasks without blocking a request?

Move the agent to a **background worker**: the API starts a run, returns a **run id** immediately, and the client **polls** or receives a **webhook/stream**. Persist state with a **checkpointer** (Postgres) so the run survives restarts and can **resume** after a human interrupt. Use a queue (Celery, Arq, Temporal) for retries and concurrency limits, set a maximum duration and step count, and stream progress events to the UI.

## When should you use multi-agent instead of one agent with many tools?

Start with **one agent**. Split when: the prompt/tool list gets so long the model becomes unreliable; tasks need **different instructions, models or permissions** (a researcher with web access, a coder with a sandbox); work can run **in parallel**; or you want clear ownership and testing per role. Costs: more tokens, more latency, harder debugging. Prefer a **supervisor with a few specialists** over free-form agent chatter.

## What is semantic caching for LLM calls?

A **semantic cache** stores previous questions as embeddings along with their answers. For a new question, if the closest stored one is **similar enough** (above a threshold), return the saved answer instead of calling the model. It cuts cost and latency for repeated or paraphrased queries. Risks: wrong hits when similar-looking questions need different answers (so tune the threshold, scope per tenant/user, and add TTLs) and stale answers when data changes.

## What should you log and trace from an agent?

Every **step**: the input messages, model name and parameters, the **tool calls with arguments and results**, token counts, latency and cost per step, errors/retries, the final answer, and user feedback. Use **LangSmith**, OpenTelemetry or similar to view the trajectory as a tree. Redact secrets and PII, keep a sample of full traces, and build dashboards for success rate, tool-error rate, cost per task and p95 latency.

## How do you control the cost of an agent?

Use the **smallest model** that passes evals (route easy steps to small models), set **step, token and time budgets**, cache results (tool outputs and semantic cache), trim context (summaries, retrieval instead of full history), use **prompt caching** for long stable prompts, run independent tool calls in **parallel**, and stop early when the answer is good enough. Track cost per task and alert on outliers.

## How do you test an agent when the model is non-deterministic?

Layer your tests: **unit-test tools** normally; test the graph logic with a **fake/mocked model** that returns scripted tool calls; run **scenario evals** against the real model with a fixed dataset, checking outcome and trajectory (right tool, right arguments), using temperature 0 and several runs; add **LLM-as-judge** rubrics for quality; record and replay real traces for regression; and run them in CI before changing prompts or models.

## MCP: what are tools, resources and prompts?

An MCP server can expose three things: **tools** (functions the model may call, such as `create_issue`), **resources** (read-only data the app can load into context, such as files or database rows, identified by URIs), and **prompts** (reusable prompt templates the user can pick). The client (the AI app) discovers them over stdio or HTTP, and decides what to show the model. Tools **act**, resources **inform**, prompts **guide**.

## How do you write memory to an agent safely?

Decide **what** is worth remembering (stable preferences and facts, not every message), extract it with an LLM using **structured output**, attach **scope** (user id), timestamp and source, deduplicate and resolve conflicts (new overrides old), and let users **view, edit and delete** memories. Do not store secrets, and never let one user's memory leak into another's. Retrieve only relevant memories at the start of a run to keep prompts small.

## What is the difference between a retriever and a tool in LangChain?

A **retriever** takes a query and returns **documents** (usually from a vector store), and is usually part of a fixed RAG pipeline. A **tool** is a function the model **decides** to call, with a name, description and argument schema. You can wrap a retriever as a tool (`retriever.as_tool` / `create_retriever_tool`) so an agent chooses **when** to search, which is the basis of agentic RAG.

## How do you add guardrails and approval to an agent in LangGraph?

Put checks in the graph: a **validation node** before tool execution (allow-listed tools, schema and range checks), an **`interrupt()`** node for human approval of sensitive tools (it pauses and checkpoints the run), an **output check** node (groundedness, format, PII) before replying, and **budgets** (`recursion_limit`, token and cost limits). Keep approval requests specific ("Refund $79 to order 1234?") and record decisions for audit.
