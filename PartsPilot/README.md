# PartsPilot — Agentic Rack Telegram Support Bot

A conversational product-support bot for a computer accessories store, built on **n8n**. It answers questions about the product catalog over **Telegram** using Retrieval-Augmented Generation (RAG) and a **semantic QA cache** to keep every repeated question instant and cheap.

## Features

- Answers customer questions about the product catalog via Telegram.
- RAG over the catalog using Gemini embeddings + Supabase pgvector.
- Semantic caching: identical/similar questions are answered from cache (similarity >= 0.9) without calling the LLM.
- Cache write-back: new answers are embedded and stored automatically for future reuse.
- Simple per-chat memory so follow-up questions have context.

## Workflows

| Workflow | File | Purpose |
| --- | --- | --- |
| Catalog Ingestion | `Electronics ingest (1).json` | One-time / scheduled indexing of the Google Sheets catalog into the vector store. |
| Chat + Semantic Cache | `Electronics retrive + Semantic QA cache (2).json` | Telegram chat loop with RAG retrieval and semantic cache. |

### 1. Catalog Ingestion

```
Google Sheets (catalog)
        → Edit Fields (format row into content + metadata)
        → Recursive Text Splitter (1,200 chars)
        → Gemini Embeddings
        → Supabase pgvector · knowledge_base
```

- Reads all product rows from the `Products` sheet.
- Builds a text blob per row (`Name · Category · SKU · Price · Description`) plus `Category` / `SKU` metadata.
- Chunks the blob, embeds each chunk with **Gemini Embeddings**, and upserts into the `knowledge_base` table.

### 2. Chat + Semantic Cache

```
Telegram message
        → Supabase pgvector · qa_cache search (top-1, queryName match_qa_cache)
        → Semantic Cache Hit? (score >= 0.9)
            ├─ hit  → Cached Answer → Telegram reply
            └─ miss → AI Agent (Gemini + OpenAI fallback)
                      · Simple Memory (per chat id)
                      · Retriever tool → knowledge_base
                      → Telegram reply
                      → Edit Fields (question/answer)
                      → Gemini Embeddings → qa_cache (write-back)
```

- Every message is first checked against the QA cache.
- If a cached answer scores **>= 0.9**, it is returned instantly — no LLM call.
- On a miss, the **AI Agent** retrieves relevant catalog chunks and answers. The Q&A pair is then embedded and written back to `qa_cache` so the same question is instant next time.

## Prerequisites

- n8n instance (self-hosted or cloud)
- Supabase project (pgvector enabled)
- Google Cloud project with Sheets API + Drive API
- Telegram bot token (via BotFather)
- Google Gemini API key
- OpenAI API key (fallback model)
- A product catalog in a Google Sheet

## Setup

1. **Create the Supabase tables and match functions** (SQL below).
2. **Import** both workflows into n8n (`Import from File`).
3. **Connect credentials** for every node: Google Sheets, Supabase, Gemini (or OpenAI), Telegram.
4. In `Electronics ingest (1).json`, point the Google Sheets node at your catalog and set the document/table IDs.
5. In the chat workflow, set your Telegram **Bot Username** on the trigger, and set the AI Agent's Gemini/OpenAI model names.
6. **Activate** the chat workflow (Telegram trigger) and optionally the ingest workflow.
7. Activate the ingest workflow once to index the catalog, then send your first message on Telegram.

### Supabase SQL (schema + match functions)

```sql
-- Catalog store
create table knowledge_base (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768)
);
create index on knowledge_base using hnsw (embedding vector_cosine_ops);

create or replace function match_knowledge_base(
  query_embedding vector(768),
  match_count int,
  filter jsonb default '{}'
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
  return query
  select id, content, metadata, 1 - (embedding <=> query_embedding) as similarity
  from knowledge_base
  where metadata @> filter
  order by embedding <=> query_embedding
  limit match_count;
end $$;

-- Semantic QA cache
create table qa_cache (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768)
);
create index on qa_cache using hnsw (embedding vector_cosine_ops);

create or replace function match_qa_cache(
  query_embedding vector(768),
  match_count int,
  filter jsonb default '{}'
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
  return query
  select id, content, metadata, 1 - (embedding <=> query_embedding) as similarity
  from qa_cache
  where metadata @> filter
  order by embedding <=> query_embedding
  limit match_count;
end $$;
```

> Note: `vector(768)` matches the Gemini text-embedding model's output size. Adjust if you use a different embedding model.

## Usage

1. Open Telegram and find your bot.
2. Ask anything about the catalog, e.g. *"How much is the AirPods Pro?"* or *"Do you sell mechanical keyboards?"*
3. Ask the same question again — the second reply is served from the semantic cache (check the reply time: it should be near-instant).

## Notes

- Cache threshold (`score >= 0.9`) lives in the **Semantic Cache Hit?** node — tune it for your data.
- The ingest workflow embeds ~1,200-character chunks; adjust the splitter for longer/shorter descriptions.
- Media files in this folder are screenshots and demo videos used by the portfolio page.
