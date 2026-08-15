# HR Agent — Agentic Recruiting Assistant

An agentic HR system built on **n8n**. It ingests candidate resumes from a form, sanitizes **PII before any LLM call**, scores candidates against a job description, stores them in Postgres + a Supabase vector index, and lets an HR chatbot retrieve, mail, and schedule them — all conversationally.

## Features

- **Privacy-first ingestion**: PII (name, email, phone) is extracted and redacted *before* the resume ever reaches an LLM.
- **ATS scoring** with **Gemini**: produces an ATS score, resume summary, and skill list per candidate, stored in Postgres.
- **Vector indexing** into Supabase pgvector (`candidate_2`) with per-candidate metadata (including batch).
- **RAG chat agent** that retrieves only sanitized candidate data (no raw PII to the LLM).
- **Mail agent** that sends shortlist emails (with a Zoom invite) using only the stored email.
- **Meeting scheduling** agent that checks Google Calendar availability and books a Zoom meeting.

## Workflows

| Workflow | File | Role |
| --- | --- | --- |
| Ingestion | `HR agent ingestion P2.json` | Form → extract → sanitize → score → store → index. |
| Orchestrator | `Main HR agent.json` | HR chatbot that routes to sub-agents. |
| RAG | `HR Agentic RAG.json` | Retrieves/scores candidates via Supabase vector search. |
| Mail | `Mail agent.json` | Shortlist + interview email (Gmail draft, Zoom link). |
| Scheduling | `Shedule meeting.json` | Finds a slot and creates the calendar event. |

### Ingestion flow

```
Candidate form (name, email, phone, resume)
        → File type? (PDF / DOCX)
        → Text extraction
        → PII extraction (Postgres) → PII sanitization (redact → placeholders)
        → Google Drive: JD file → extract job description
        → Gemini · ATS scoring (structured: ATS, Resume_summary, Resume_skills)
        → Postgres · candidates (store)
        → Batch → Edit Fields → exists in candidate_2? (upsert)
        → Supabase pgvector · candidate_2
```

### Orchestrator + sub-agents

```
HR chat
        → Main Agent · Gemini (Redis memory)
            Tools (Call Workflow Tool):
            · HR Agentic RAG   → "Find candidates for a role"
            · Mail agent       → "Send shortlist email"
            · Shedule meeting  → "Book an interview"

HR Agentic RAG:
    Chat input → Redis cache check → get active batch → download JD → extract
    → AI Agent (Supabase pgvector retriever · candidate_2, filtered by batch)
    → structured output { candidate_id, output } → Redis cache set

Mail agent:
    candidate_id → SQL get email → AI Agent drafts shortlist mail → Gmail draft (+ Zoom)

Shedule meeting:
    description → AI Agent → date/time tool → Google Calendar availability
    → create event (Google Calendar, Zoom)
```

## Prerequisites

- n8n instance
- Supabase project (pgvector) + Postgres (the Supabase project's Postgres works for both)
- Google Drive (JD storage), Gmail, Google Calendar API access
- Redis instance
- Gemini (or OpenAI) API key

## Setup

1. **Create the database objects** (SQL below).
2. **Import** all five workflows into n8n.
3. **Connect credentials** on every node: Google Drive, Google Sheets (if used), Postgres/Supabase, Gmail, Google Calendar, Redis, Gemini.
4. Point the ingestion workflow at your **candidate form** and **JD folder** (Drive File node).
5. In the orchestrator, set the *Call Workflow Tool* nodes to the imported sub-agent workflow IDs.
6. **Activate** the orchestrator (chat trigger) and the ingestion workflow, then submit a test application.

### SQL (Postgres / Supabase)

```sql
-- Candidate records
create table candidates (
  id bigserial primary key,
  name text,
  email text,
  phone text,
  ats numeric,
  resume_summary text,
  resume_skills text,
  created_at timestamptz default now()
);

-- Application batches
create table batches (
  id bigserial primary key,
  batch_id text unique,
  created_at timestamptz default now()
);

-- Vector index (sanitized data only)
create table candidate_2 (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768)
);
create index on candidate_2 using hnsw (embedding vector_cosine_ops);
```

> `vector(768)` matches Gemini embeddings; adjust for your embedding model.

## Usage

1. **Ingest**: submit the candidate form with a resume (PDF/DOCX). The pipeline extracts text, redacts PII, scores the resume against the latest JD, stores it, and indexes it.
2. **Query**: chat with the HR agent, e.g. *"Who are the top 3 candidates for the backend role?"*
3. **Mail**: *"Send a shortlist email to candidate 12."* — the mail agent drafts and files the email with a Zoom invite.
4. **Schedule**: *"Book a 30-minute interview for candidate 12 next Monday."* — the agent checks availability and creates the calendar event.

## Notes

- Raw PII is never sent to the LLM — only sanitized/aggregated candidate data.
- The RAG sub-agent caches results in Redis keyed by query + active batch, so repeated questions are fast.
- Media files in this folder are the demo videos and screenshots used by the portfolio page.
