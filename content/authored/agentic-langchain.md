---
slug: agentic-langchain
title: Agentic AI, LangChain & LangGraph
subtitle: Agents, tools, memory, planning, multi-agent patterns, LangChain, LangGraph, MCP and production
emoji: 🤖
accent: #f97316
category: AI Engineering
---

# Start here

## What is agentic AI, in one minute

A normal LLM call is **one question → one answer**. An **agent** is an LLM running **in a loop**: it decides what to do next, **calls tools** (search, SQL, APIs, code), **reads the results**, and repeats until the goal is done or a limit is hit.

| | Chatbot | Workflow | Agent |
|---|---|---|---|
| Who decides the steps? | Nobody, one reply | **Your code** (fixed path) | **The LLM** (dynamic path) |
| Uses tools? | No | Yes, in set places | Yes, chooses which and when |
| Predictable? | Very | Very | Less: needs limits and evaluation |
| Example | FAQ answer | "Summarize → translate → email" | "Research these 5 companies and draft a report" |

> Rule of thumb: start with the **simplest thing that works**. A single good prompt, then RAG, then a fixed workflow, and only then a real agent. Agents cost more, are slower and are harder to test.

The **Playground** tab lets you run a LangGraph-style agent step by step and explore every agent pattern.

## The agent loop (ReAct)

**ReAct** = **Re**ason + **Act**. Each turn:

1. **Think**: the model looks at the goal, history and tool results.
2. **Act**: it returns either a final answer or a **tool call** (`name` + JSON `arguments`).
3. **Observe**: *your code* runs the tool and appends the result to the messages.
4. **Repeat** until a final answer, a step limit, or a human stop.

```python
messages = [{"role": "user", "content": goal}]
for step in range(MAX_STEPS):                    # always cap the loop
    reply = llm(messages, tools=TOOLS)
    if not reply.tool_calls:
        return reply.content                      # final answer
    messages.append(reply)
    for call in reply.tool_calls:
        result = run_tool(call.name, call.args)   # validate + execute in YOUR code
        messages.append({"role": "tool", "tool_call_id": call.id, "content": result})
raise RuntimeError("Step limit reached")
```

The model **never executes anything itself**. It only proposes a call; your code validates, authorizes and runs it.

## The building blocks of an agent

| Block | What it is | Examples |
|---|---|---|
| **Model** | The reasoning engine | Any tool-calling chat model |
| **Tools** | Functions the model can request | search, SQL query, send email, run Python |
| **Memory** | What it remembers | short-term = message history / state; long-term = a store or vector DB |
| **Planning** | How it breaks down a goal | ReAct, plan-and-execute, reflection |
| **Instructions** | System prompt: role, rules, limits | "Never refund over $100 without approval" |
| **Guardrails** | Checks around it | input/output validation, allow-lists, human approval |
| **Orchestration** | The loop and control flow | LangGraph, OpenAI Agents SDK, Claude Agent SDK, CrewAI, AutoGen |

# Tools & function calling

## What is tool (function) calling?

You describe tools with a **name, a description and a JSON Schema** for the arguments. The model replies with structured calls like `{"name": "get_weather", "arguments": {"city": "Lahore"}}`. Your code runs the function and sends the result back as a **tool message**. The description is a prompt: write it as if for a new teammate (what it does, when to use it, what it returns).

```json
{
  "name": "get_order",
  "description": "Look up one order by its id. Use when the user asks about an order's status or contents.",
  "parameters": {
    "type": "object",
    "properties": { "order_id": { "type": "string", "description": "Like ORD-1234" } },
    "required": ["order_id"]
  }
}
```

## How do you design good tools?

- **Few, clear, non-overlapping** tools; split or merge until each has one job.
- Strong **descriptions** and argument docs, with examples and formats.
- **Validate arguments** (Pydantic / JSON Schema) and return helpful errors the model can fix ("order_id must look like ORD-1234").
- Return **compact, relevant** output, not a 5 MB JSON dump.
- **Read tools** run freely; **write tools** (pay, delete, send) need confirmation, idempotency keys and least privilege.
- Set **timeouts and retries**; make failures visible to the model as text.

## What is parallel tool calling?

The model can request several independent calls in one turn (for example, weather in three cities). Run them concurrently and return all results before the next model call. It cuts latency a lot for research-style tasks.

## What is MCP (Model Context Protocol)?

An **open protocol** for connecting AI apps to tools and data. An **MCP server** exposes **tools**, **resources** (readable data) and **prompts**; an **MCP client** inside the AI app (Claude, IDEs, your agent) discovers and calls them over stdio or HTTP. Write the integration once and every MCP-capable app can use it, instead of a custom plug-in per framework. Treat third-party MCP servers like any dependency: review them, limit permissions, and treat their outputs as untrusted data.

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("orders")

@mcp.tool()
def get_order(order_id: str) -> dict:
    """Look up an order by id."""
    return db.orders.find_one(order_id)

if __name__ == "__main__":
    mcp.run()
```

## MCP vs A2A?

**MCP** connects an agent to **tools and data** (agent ↔ tool). **A2A (Agent-to-Agent)** is a protocol for **agents talking to other agents** (discover each other via agent cards, delegate tasks, stream results). They are complementary.

# Memory, planning & reasoning

## Short-term vs long-term memory?

- **Short-term (working) memory**: the messages and state of the current conversation or task (a LangGraph thread). Limited by the context window, so **trim or summarize** old turns.
- **Long-term memory**: facts that survive across sessions, stored outside the model (a key-value store, database or vector store). Kinds: **semantic** (facts: "prefers vegetarian food"), **episodic** (past experiences / examples), **procedural** (learned rules or updated instructions).

Write memories **deliberately** (extract durable facts after a conversation), scope them **per user**, and let users see and delete them.

## What planning strategies do agents use?

- **ReAct**: think and act one step at a time. Flexible, can wander.
- **Plan-and-execute**: a planner writes the full plan, executors do the steps, a re-planner adjusts. Cheaper (small models execute), easier to show progress.
- **Reflection / self-critique**: generate, critique, revise.
- **Tree of Thoughts / search**: explore several branches and pick the best (expensive).
- **ReWOO**: plan all tool calls up front with variables, then run them without extra LLM calls in between.

## How do you stop an agent from looping forever?

Hard **max steps / recursion limit**, a **token or cost budget**, a **wall-clock timeout**, detection of **repeated identical tool calls**, and a clear **"stop and ask the human"** path. In LangGraph, the `recursion_limit` config raises `GraphRecursionError` when exceeded.

## How do you handle context window limits in long agent runs?

Trim old messages, **summarize** history into a running note, store large tool outputs outside the prompt and pass a reference, use **sub-agents** that return only a short result, and retrieve memories on demand instead of loading everything.

# Agentic patterns

## Workflows vs agents: what are the common patterns?

Popular building blocks (from Anthropic's "Building effective agents"):

| Pattern | How it works | Use when |
|---|---|---|
| **Prompt chaining** | Step 1 output → step 2 input, with checks between | Task splits cleanly into fixed steps |
| **Routing** | Classify the input, send it to a specialised prompt/model | Distinct categories (refund vs tech support) |
| **Parallelization** | Sectioning (split work) or voting (same task several times) | Speed, or more confidence |
| **Orchestrator–workers** | An LLM breaks the task into subtasks dynamically and delegates | You cannot predict the subtasks |
| **Evaluator–optimizer** | One LLM generates, another critiques, loop | Clear quality criteria (translation, code) |
| **Autonomous agent** | LLM + tools in a loop | Open-ended, many steps, trusted sandbox |

Try each one in the **Agentic patterns explorer** lab.

## What are multi-agent architectures?

- **Supervisor**: a manager agent routes work to specialist agents (researcher, coder, writer) and decides when done.
- **Hierarchical**: supervisors of supervisors for big tasks.
- **Network / swarm**: agents hand off to each other directly (handoffs).
- **Agents as tools**: a sub-agent wrapped as a tool the main agent can call.

Multi-agent helps with **separation of concerns, smaller prompts, parallel work and different models per role**. It costs more tokens and adds failure points. Use it only when one agent with good tools is not enough.

## What is human-in-the-loop (HITL)?

Pausing the agent so a person can **approve, edit or reject** a step (send an email, issue a refund, run a migration) or answer a question. In LangGraph you call `interrupt(...)` inside a node; the run is checkpointed, and you resume later with `Command(resume=...)`, even days later or on another server.

## What is agentic RAG?

Instead of a fixed "retrieve then answer", an agent **decides** whether to retrieve, which source to search, rewrites the query, **grades** the retrieved documents, retries, and checks the final answer for grounding. Examples: **Self-RAG**, **Corrective RAG (CRAG)**, **Adaptive RAG**. Usually built as a LangGraph with nodes such as `retrieve → grade → (rewrite | generate) → check`.

# LangChain

## What is LangChain?

An open-source framework (Python and JavaScript) with **standard interfaces** for chat models, prompts, tools, retrievers, vector stores and document loaders, plus prebuilt agents. The idea: **swap providers without rewriting your app**.

Packages:

- `langchain-core`: base abstractions (Runnables, messages, prompts, tools).
- `langchain`: agents (`create_agent`), chat model helpers, middleware.
- Partner packages: `langchain-openai`, `langchain-anthropic`, `langchain-google-genai`, `langchain-postgres`, `langchain-pinecone`…
- `langchain-community`: community integrations. `langchain-classic`: legacy chains and `AgentExecutor`.
- **LangGraph** (orchestration) and **LangSmith** (tracing and evaluation) are sister projects.

> LangChain moves fast (v1 changed agents and moved old code to `langchain-classic`). In interviews say which version you used, and check the docs for exact imports.

## How do you call a chat model in LangChain?

```python
from langchain.chat_models import init_chat_model

model = init_chat_model("anthropic:claude-sonnet-5-5", temperature=0)
reply = model.invoke("Explain RAG in one sentence.")
print(reply.content)

for chunk in model.stream("Write a haiku about vectors"):
    print(chunk.content, end="")

replies = model.batch(["Hi", "Bonjour"])     # run several inputs
```

Every model is a **Runnable**, so it has `invoke`, `stream`, `batch` and their async versions (`ainvoke`, `astream`, `abatch`).

## What is LCEL (LangChain Expression Language)?

A way to **compose Runnables with the pipe operator `|`**: the output of one step is the input of the next. The result is itself a Runnable, so you get streaming, batching, async, retries and tracing for free.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a concise tutor."),
    ("human", "Explain {topic} to a beginner in 3 bullet points."),
])
chain = prompt | model | StrOutputParser()
print(chain.invoke({"topic": "vector databases"}))
```

Useful pieces: `RunnablePassthrough` (pass input through), `RunnableParallel` / dicts (run branches side by side), `RunnableLambda` (wrap a function), `.with_retry()`, `.with_fallbacks([...])`.

## How do you get structured output?

Use `with_structured_output` with a Pydantic model (or JSON Schema). The model is forced to return that shape, validated for you.

```python
from pydantic import BaseModel, Field

class Ticket(BaseModel):
    category: str = Field(description="billing, technical or other")
    urgency: int = Field(ge=1, le=5)
    summary: str

extractor = model.with_structured_output(Ticket)
t = extractor.invoke("My card was charged twice and I need it fixed today!")
print(t.category, t.urgency)
```

## How do you build RAG with LangChain?

Loaders → splitters → embeddings → vector store → retriever → prompt → model.

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.runnables import RunnablePassthrough

docs = PyPDFLoader("handbook.pdf").load()
chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100).split_documents(docs)
store = InMemoryVectorStore.from_documents(chunks, OpenAIEmbeddings())
retriever = store.as_retriever(search_kwargs={"k": 4})

def fmt(docs):
    return "\n\n".join(f"[{d.metadata.get('page')}] {d.page_content}" for d in docs)

prompt = ChatPromptTemplate.from_template(
    "Answer ONLY from the context. Cite page numbers. If it is not there, say you don't know.\n\n"
    "Context:\n{context}\n\nQuestion: {question}"
)
rag = {"context": retriever | fmt, "question": RunnablePassthrough()} | prompt | model | StrOutputParser()
print(rag.invoke("How many vacation days do I get?"))
```

Swap `InMemoryVectorStore` for PGVector, Pinecone, Qdrant or Chroma in production.

## How do you define tools in LangChain?

The `@tool` decorator turns a typed, documented function into a tool. The docstring becomes the description and the type hints become the schema.

```python
from langchain.tools import tool

@tool
def get_order(order_id: str) -> str:
    """Look up an order by id (like ORD-1234) and return its status."""
    return orders.get(order_id, "not found")

model_with_tools = model.bind_tools([get_order])
msg = model_with_tools.invoke("Where is ORD-1234?")
print(msg.tool_calls)   # [{'name': 'get_order', 'args': {'order_id': 'ORD-1234'}, 'id': '...'}]
```

## How do you create an agent with LangChain?

In LangChain v1, `create_agent` builds a production-ready ReAct agent (it runs on LangGraph underneath).

```python
from langchain.agents import create_agent

agent = create_agent(
    model="anthropic:claude-sonnet-5-5",
    tools=[get_order, search_docs],
    system_prompt="You are a support agent. Always check the order before answering.",
)
result = agent.invoke({"messages": [{"role": "user", "content": "Where is ORD-1234?"}]})
print(result["messages"][-1].content)
```

**Middleware** hooks into the loop: human approval for chosen tools, summarizing long histories, PII redaction, model fallbacks, call limits. Older code used `AgentExecutor` (now in `langchain-classic`) or LangGraph's `create_react_agent`.

## What is LangSmith?

A platform for **tracing, debugging, evaluating and monitoring** LLM apps (works with or without LangChain). You see every step of a run (prompts, tool calls, tokens, latency, cost), build **datasets** of examples, run **evaluators** (LLM-as-judge, exact match, custom code) and compare versions. Turn it on with `LANGSMITH_TRACING=true` and an API key.

# LangGraph

## What is LangGraph and why use it?

A low-level library for building **stateful, controllable agents as graphs**. You define a **state** (a typed dict), **nodes** (functions that read the state and return updates) and **edges** (what runs next, including **conditional** edges and **cycles**). It adds what simple chains lack:

- **Loops and branching** (agents are cycles, not straight lines).
- **Persistence** via checkpointers: every step is saved per `thread_id`, so runs survive crashes and can resume.
- **Human-in-the-loop** with `interrupt`, plus **time travel** (replay or fork from an old checkpoint).
- **Streaming** of tokens, node updates and custom events.
- **Subgraphs** and **multi-agent** setups.

## Build a ReAct agent from scratch in LangGraph

```python
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import InMemorySaver

class State(TypedDict):
    messages: Annotated[list, add_messages]   # reducer: append, don't overwrite

tools = [get_order, search_docs]
llm = model.bind_tools(tools)

def agent(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

def route(state: State):
    last = state["messages"][-1]
    return "tools" if last.tool_calls else END

g = StateGraph(State)
g.add_node("agent", agent)
g.add_node("tools", ToolNode(tools))
g.add_edge(START, "agent")
g.add_conditional_edges("agent", route, ["tools", END])
g.add_edge("tools", "agent")                       # the loop
app = g.compile(checkpointer=InMemorySaver())

cfg = {"configurable": {"thread_id": "user-42"}, "recursion_limit": 25}
app.invoke({"messages": [("user", "Where is ORD-1234?")]}, cfg)
app.invoke({"messages": [("user", "And when will it arrive?")]}, cfg)   # remembers the thread
```

## What are state, reducers and channels in LangGraph?

The **state** is shared data every node reads. A node returns a **partial update**. A **reducer** says how an update is merged into a key: by default it **overwrites**; `Annotated[list, add_messages]` **appends** messages (and replaces ones with the same id); `operator.add` concatenates lists, which is needed when parallel branches write to the same key.

## How do checkpointers and threads work?

A **checkpointer** saves a snapshot of the state after every super-step, keyed by `thread_id`. Use `InMemorySaver` for tests and `PostgresSaver` / `SqliteSaver` / Redis in production. This gives conversation memory, fault tolerance (resume after a crash), HITL pauses and **time travel** (`get_state_history`, resume from an old `checkpoint_id`). Long-term memory across threads goes in a **Store** (`InMemoryStore`, `PostgresStore`) with namespaces like `("user", user_id)`.

## How do you add human approval in LangGraph?

```python
from langgraph.types import interrupt, Command

def send_email(state: State):
    draft = state["draft"]
    decision = interrupt({"question": "Send this email?", "draft": draft})   # pauses here
    if decision["approved"]:
        mailer.send(decision.get("edited", draft))
        return {"status": "sent"}
    return {"status": "cancelled"}

# first call stops at the interrupt and returns it to your UI
app.invoke(inputs, cfg)
# later, after the human clicks Approve:
app.invoke(Command(resume={"approved": True}), cfg)
```

A checkpointer is required, because the run must be saved while it waits.

## How do you stream from a LangGraph app?

`app.stream(inputs, cfg, stream_mode=...)`: `"values"` (full state after each step), `"updates"` (only what each node changed), `"messages"` (LLM tokens as they are generated), `"custom"` (your own progress events), or several at once. Streaming keeps users engaged during long agent runs.

## How do you build a multi-agent supervisor in LangGraph?

Each specialist is a node (often its own sub-agent). The supervisor node uses an LLM with structured output to choose the **next** worker or `FINISH`, and a conditional edge routes there. Workers return to the supervisor. Alternatives: the `langgraph-supervisor` / `langgraph-swarm` helpers, or **handoff tools** that return `Command(goto="other_agent", update=...)`.

```python
class Route(BaseModel):
    next: Literal["researcher", "coder", "FINISH"]

def supervisor(state):
    choice = model.with_structured_output(Route).invoke(
        [("system", "Pick who acts next, or FINISH.")] + state["messages"])
    return {"next": choice.next}

g.add_conditional_edges("supervisor", lambda s: s["next"],
                        {"researcher": "researcher", "coder": "coder", "FINISH": END})
g.add_edge("researcher", "supervisor")
g.add_edge("coder", "supervisor")
```

## LangChain vs LangGraph vs other frameworks?

- **LangChain**: components and integrations, plus a ready-made agent (`create_agent`). Start here for standard agents and RAG.
- **LangGraph**: when you need custom control flow, durable state, HITL or multi-agent. LangChain agents are built on it.
- **LlamaIndex**: strongest at data ingestion and indexing for RAG; also has agents and workflows.
- **CrewAI**: role-based multi-agent crews, quick to set up.
- **AutoGen / Microsoft Agent Framework**: conversational multi-agent systems.
- **OpenAI Agents SDK, Claude Agent SDK, Google ADK**: vendor SDKs with agents, tools, handoffs and tracing.
- **No framework**: a plain loop over the provider SDK is fine for simple agents and easiest to debug.

# Production & evaluation

## How do you evaluate an agent?

- **Final outcome**: task success rate on a fixed set of scenarios, correctness vs a reference.
- **Trajectory**: right tools, right arguments, right order; no unnecessary steps.
- **Efficiency**: steps, tokens, latency, cost per task.
- **Safety**: refusals where needed, no forbidden actions, injection resistance.
- Methods: unit tests per tool, **LLM-as-judge** with a rubric, human review samples, simulated users, and online metrics (thumbs, escalations). Run evals in CI on every prompt or model change.

## What are the main risks of agents and how do you mitigate them?

| Risk | Mitigation |
|---|---|
| **Prompt injection** (instructions hidden in web pages, emails, documents) | Treat tool output as data, least-privilege tools, allow-lists, HITL for sensitive actions, separate "quarantined" LLM for untrusted text |
| Wrong or harmful actions | Validation, confirmation for writes, dry-run mode, idempotency keys, undo paths |
| Infinite loops / runaway cost | Step, token and time budgets; loop detection |
| Hallucinated tool arguments | Strict schemas, validate, ask the user when a field is missing |
| Data leaks | Per-user permissions enforced in tools (not in the prompt), PII redaction, audit logs |
| Non-determinism | Low temperature, structured outputs, evals, tracing |

## How do you make an agent production-ready?

Tracing for every run (LangSmith, OpenTelemetry), durable state (Postgres checkpointer), retries with backoff and timeouts on tools, rate limits, caching, model fallbacks, cost dashboards, versioned prompts, evaluation datasets in CI, feature flags, gradual rollout, and a human escalation path.

## How do you reduce agent latency and cost?

Use the smallest model that passes the evals (route easy steps to small models), **parallel tool calls**, prompt caching for long system prompts, fewer and shorter tool outputs, plan-and-execute instead of an LLM call per step, cache tool results, stream partial output, and stop early when confident.

# Interview questions

## Agent vs workflow: when would you NOT use an agent?

When the steps are known in advance, when the task must be fully predictable or auditable, when latency or cost is tight, or when one LLM call or a fixed chain already solves it. Workflows are easier to test and debug; use an agent only when the path truly depends on what the model discovers.

## Walk me through designing a customer-support agent.

1. **Scope**: what it may do (look up orders, refunds under $50, FAQs) and what goes to humans.
2. **Tools**: `get_order`, `search_kb` (RAG), `create_refund` (needs approval above the limit), `escalate`.
3. **Graph**: classify intent → route; agent loop with tools; HITL interrupt before refunds; final answer with citations.
4. **State & memory**: thread per conversation (Postgres checkpointer), long-term customer preferences in a store.
5. **Safety**: permissions per customer enforced in tools, injection defences on KB/email text, PII redaction.
6. **Evaluation**: 200 scenario dataset, task success, tool-call accuracy, CSAT, escalation rate; tracing in LangSmith.
7. **Ops**: step and cost limits, fallbacks, latency budget, gradual rollout.

## How does an LLM decide which tool to call?

It is trained to emit structured tool calls. It reads the tool **names, descriptions and schemas** in its context and picks the best match for the current step, like choosing a function from documentation. That is why tool descriptions matter so much, and why too many similar tools confuse it. You can force a choice with `tool_choice` (any / a specific tool / none).

## What does `add_messages` do and why is it needed?

It is a **reducer** for the `messages` key. Without it, each node's returned list would **replace** the whole history. With it, new messages are **appended** (and a message with an existing id is updated), so the conversation accumulates across nodes and turns.

## What happens when a tool fails inside an agent?

Catch the error and return it to the model **as a tool message** ("Timeout after 5 s, try again or use cached data") so it can retry, choose another tool, or tell the user. Add retries with backoff in the tool itself, idempotency keys for writes, and a cap on retries. `ToolNode` in LangGraph can convert exceptions into error messages for you.

## How would you give an agent memory of a user across sessions?

After a session, extract durable facts with an LLM (structured output), store them per user in a long-term store or vector DB with timestamps, and at the start of a session retrieve the relevant ones into the system prompt. Handle updates and conflicts ("moved to Karachi" replaces "lives in Lahore"), and give users a way to view and delete their memories.

## What is the difference between `invoke`, `stream` and `batch`?

All Runnables share them: `invoke` = one input → one output; `stream` = yields chunks as they are produced (better UX); `batch` = many inputs, run concurrently. Async versions (`ainvoke`, `astream`, `abatch`) fit async web servers like FastAPI.

## Explain Corrective RAG (CRAG) as a graph.

`retrieve` → `grade_documents` (an LLM marks each chunk relevant or not) → if enough are relevant, `generate`; otherwise `rewrite_query` → `web_search` (or another retriever) → `generate`. Optionally `check_hallucination` loops back to `generate` with a limit. The graph makes each decision explicit, testable and traceable.
