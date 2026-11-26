# More interview questions

## How would you answer a question whose answer is spread across several documents?

This is **multi-hop retrieval**. Options, from simple to advanced: (1) retrieve more chunks (k = 20–30) and **re-rank** to keep the best 5–8; (2) **query decomposition**: have the LLM split the question into sub-questions, retrieve for each, then combine; (3) **agentic RAG**: an agent searches, reads, and searches again until it has enough evidence; (4) **GraphRAG**: build a knowledge graph of entities and relations so related facts are linked. Always cite sources and say "I don't know" if the evidence is incomplete.

## What is GraphRAG and when is it worth the extra work?

GraphRAG extracts **entities and relationships** from documents into a graph (and often community summaries), then retrieves by following links instead of only by vector similarity. It helps with questions about **connections** ("how is supplier A linked to incident B?") and **global questions** ("what are the main themes?"). It costs more (extraction with an LLM, graph storage, updates), so use it when plain vector + keyword search misses relationship-heavy questions.

## How do you handle tables, charts and scanned PDFs in RAG?

Use a **layout-aware parser** (Docling, Unstructured, cloud document AI) that keeps tables as structured rows/markdown, extracts text with OCR for scans, and keeps headings and page numbers as **metadata**. For charts or diagrams, caption them with a **vision model** and embed the caption (or use multimodal embeddings). Chunk tables **as whole units** with their header, and test retrieval on real table questions.

## How do you decide chunk size and overlap empirically?

Build a **golden set** of 50–100 real questions with the correct source passages. Try several settings (for example 200, 400, 800 tokens; overlap 0, 10%, 20%) and measure **recall@k** and **answer faithfulness** for each. Pick the smallest setting that keeps recall high. Different document types (policies, code, tables) may need different strategies, such as splitting by headings, sentences or functions.

## What happens when you switch to a new embedding model?

Vectors from different models are **not comparable**, so you must **re-embed the whole corpus** into a new index. Plan it as a migration: build the new index in parallel, compare quality on the golden set, switch traffic (alias swap), keep the old index for rollback, then delete it. Store the model name and version in the metadata so you always know which model made which vector.

## How do you prevent leaking personal or confidential data through RAG?

Apply **access control at retrieval time** (filter by the user's permissions in the vector query, never only in the prompt), **redact or tokenize PII** during ingestion, keep per-tenant namespaces, and filter outputs with a PII detector. Log what was retrieved for audit, avoid sending sensitive data to third-party models without a data-processing agreement, and test with "cross-tenant" probing questions.

## What is prompt caching and when does it help?

Providers can **cache the processed prefix of a prompt** (system instructions, long documents, tool definitions) so repeated requests that start with the same text are cheaper and faster. It helps when you send the same large context many times (a long policy document, few-shot examples, a codebase). Put **stable content first** and changing content (the user question) last, because only an identical prefix is reused.

## How do you version prompts and catch regressions?

Store prompts in **version control** (not scattered in code), give them versions, and run an **evaluation suite** on every change: a fixed set of inputs with expected properties (format valid, facts cited, refusal when needed), scored by code checks and an **LLM-as-judge** rubric. Compare to the previous version and block deploys that score worse. Also pin the model version, because a model update can change behaviour.

## What are guardrails and how do you implement them?

Guardrails are checks **around** the model: **input** checks (prompt-injection detection, topic filters, PII), **output** checks (JSON schema validation, toxicity, groundedness against retrieved sources, banned content), and **action** checks (allow-lists, approval for risky tools). Implement with validators in code (Pydantic, regex), classifier models, or libraries (Guardrails AI, NeMo Guardrails, provider safety APIs). Fail safe: retry once, then return a refusal or escalate to a human.

## How do you choose between long context, RAG and fine-tuning?

- **Long context**: simplest when the whole document fits and queries are rare; cost and latency grow with every token, and accuracy can drop in the middle.
- **RAG**: best for large, changing or permissioned knowledge and for citations.
- **Fine-tuning**: best for consistent style, format or a specialised skill, not for adding facts.
Often you combine them: RAG for knowledge, a good prompt for behaviour, and a small fine-tune only if prompting is not enough.

## How would you summarise a document that is longer than the context window?

Use **map-reduce**: split into sections, summarise each (map), then summarise the summaries (reduce); or **refine**: summarise the first part, then update the summary with each next part. Map-reduce is parallel and faster; refine keeps better flow but is sequential. For quality, keep headings, ask for key facts and numbers, and verify important claims against the source.

## Why do LLMs struggle with spelling, counting letters and arithmetic?

They read **tokens** (word pieces), not letters, so "strawberry" may be 2–3 chunks and the model never sees individual characters. They also predict likely text rather than execute an algorithm, so exact maths can fail. The fix is to give them **tools**: a code interpreter or calculator for arithmetic and a string function for letter counts.

## How do you evaluate a RAG system end to end?

Measure the **retriever** (recall@k, MRR, nDCG: is the right passage in the top results?) and the **generator** (faithfulness: is every claim supported by the context; answer relevance; completeness) separately, so you know which part to fix. Use a golden dataset, automated metrics (RAGAS-style) plus an LLM judge calibrated against human labels, and online signals (thumbs, escalations). Run it in CI for every change to chunking, embeddings, prompts or models.
