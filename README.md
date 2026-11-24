# Study Hub

**Live site:** https://study-hub-eight-nu-74.vercel.app (deploys automatically on every push to `main`)

An interactive Next.js study site built from your own notes: GenAI & RAG, Agentic AI & LangChain/LangGraph, Voice AI agents, AI Engineer / FastAPI / Flask, React & Node, C# lessons 1–99, plus new .NET, MongoDB and PostgreSQL guides.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run dev` and `npm run build` first run `scripts/build-content.mjs`, which converts every source file into JSON pages, flashcards and a search index.

## Features

- **Reader**: every topic split into parts and sections. Questions start collapsed so you can test yourself first. Search, flashcards and quizzes work on every topic.
- **Search** (`/` or `Ctrl K`): full-text search across ~1,000 sections in every topic.
- **Flashcards**: Leitner boxes, weakest cards first, keyboard shortcuts (Space, ← →).
- **Quiz**: hand-written multiple choice (for .NET, MongoDB, PostgreSQL) mixed with questions generated from each topic's flashcards.
- **Playgrounds**:
  - PostgreSQL: a real Postgres (PGlite, WebAssembly) running in the browser with a shop database, plus a JOIN visualizer.
  - MongoDB: real `find()` and aggregation pipelines (via mingo), plus an index explain simulator.
  - .NET: middleware pipeline, DI lifetimes, LINQ chain builder.
  - JavaScript: event loop puzzles, HTTP status quiz. C#: predict the output.
  - GenAI: chunking playground, cosine similarity, timed mock interview on the 10 design scenarios.
  - Agentic AI: LangGraph agent run (tool calls, failures, human-approval interrupt) and an agentic patterns explorer.
  - Voice AI: pipeline stepper, latency budget and cost calculator. FastAPI: request lifecycle.
- **Original page**: the original interactive HTML guides, embedded unchanged.
- Light/dark theme, works on phones.

## Add your own files

1. Drop a `.docx`, `.html` or `.md` file into `content/sources/` (or a `.md` file into `content/authored/`).
2. Optional: add an entry in `content/topics.json` keyed by the file name to set `title`, `subtitle`, `emoji`, `accent`, `category`, `order`.
3. Restart `npm run dev` (or run `npm run content`).

How files are split:

- **Word (.docx)**: Heading 1 → part, Heading 2 → group, Heading 3 → section. Monospace paragraphs (Consolas, Courier) become highlighted code blocks.
- **Markdown**: `#` → part, `##` → section. Add `name.quiz.json` next to `name.md` for hand-written quiz questions.
- **HTML**: `h1` → part, `h2`/`h3` → sections.

Any section titled like `Q12. …` or ending with `?` becomes a flashcard and a quiz item.
