# RevFlow — Multi-Agent Sales Automation

A **multi-agent sales system** built on n8n. A single orchestrator agent chats with a user (or another agent) and delegates work to specialized sub-agents for prospect research, CRM data entry, email drafting, deal creation, and demo booking.

## Features

- **Orchestrator agent** with Redis conversation memory routes every request.
- **Info-gen sub-agent** — researches prospects via the **Hunter.io MCP** server.
- **RevOps sub-agent** — creates organizations, persons, and leads in **Pipedrive**.
- **SDR sub-agent** — pulls leads from Pipedrive and drafts outreach emails in Gmail.
- **Deal creation sub-agent** — creates a deal in Pipedrive and notifies via **Pushover**.
- **Demo booking sub-agent** — checks Google Calendar availability and schedules a demo (with Zoom).

## Workflows

| Workflow | File | Role |
| --- | --- | --- |
| Orchestrator | `Bussiness Development.json` | Chat entry point; routes to sub-agents via workflow tools. |
| Research | `Info gen Sub-agent.json` | Hunter.io MCP research; structured output. |
| CRM sync | `RevOps Sub-Agent.json` | Pipedrive org / person / lead creation. |
| Outreach | `SDR Sub-agent.json` | Pipedrive lead fetch → Gmail draft. |
| Deal | `deal_creation Sub-agent.json` | Pipedrive deal + Pushover notification. |
| Demo | `Demo booking Sub agent.json` | Google Calendar availability + event creation. |

### Orchestrator flow

```
Chat message
        → AI Agent · Gemini (Redis memory)
            Tools (Call Workflow Tool):
            · Info-gen       → "Research prospects"
            · RevOps         → "Create CRM entries"
            · SDR            → "Draft outreach emails"
            · Deal creation  → "Create a deal"
            · Demo booking   → "Book a demo"
```

The orchestrator decides which sub-agent to call based on intent and passes the collected context along. Each sub-agent is itself an n8n workflow called as a **tool**, so they can be reused or extended independently.

### Sub-agent flows

- **Info-gen** — `Chat input → Hunter.io MCP → OpenAI model → structured output` of researched prospect data.
- **RevOps** — creates Organization → Person → Lead in Pipedrive from structured input.
- **SDR** — `List persons (Pipedrive) → select lead → OpenAI drafts email → Create draft (Gmail)`.
- **Deal creation** — `Pipedrive Create deal → Pushover notification` on approval/request.
- **Demo booking** — `AI Agent → Get calendar availability → Create event (Google Calendar, Zoom)`.

## Prerequisites

- n8n instance (with Workflow Tool / AI features enabled)
- Pipedrive account + API token
- Hunter.io account + **MCP server** configured in n8n
- Gmail + Google Calendar API access
- Pushover app/user keys
- Redis instance (memory)
- OpenAI or Gemini API key

## Setup

1. **Import** all six workflows into n8n.
2. **Create and enable the MCP server** for Hunter.io in n8n (Settings → MCP Servers) and reference it in the Info-gen sub-agent.
3. **Connect credentials** per workflow: Pipedrive, Gmail, Google Calendar, Pushover, Redis, and the LLM provider.
4. In the **orchestrator** (`Bussiness Development.json`), the *Call Workflow Tool* nodes must point at the correct imported sub-agent workflow IDs.
5. **Activate** the orchestrator workflow and open its chat/chat trigger URL.

## Usage

Talk to the orchestrator in plain language, for example:

- *"Research Acme Corp and add them as a lead in Pipedrive."*
- *"Draft an outreach email to our newest lead."*
- *"Create a deal for Acme for $12,000."*
- *"Book a demo for next Tuesday."*

The orchestrator routes each request to the right sub-agent and returns the result in the chat.

## Notes

- The orchestrator keeps conversation context in Redis, so multi-turn flows (research → CRM → email) work across messages.
- Sub-agents are ordinary workflows — tune each one without touching the orchestrator.
- Media files in this folder are the demo video and screenshots used by the portfolio page.
