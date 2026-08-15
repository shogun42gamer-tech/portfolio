# Portfolio Agent — AI Rebalancing Agent

An n8n AI agent that reads your portfolio from a Google Sheet, fetches end-of-day prices, recomputes the equity/fixed-income split, rebalances holdings toward your target ratio, and notifies you — all from a single form submission.

## Features

- Triggered by a web form where you enter your target **equity / income ratio**.
- Gemini agent with structured output (`success` + `output`).
- Reads current holdings and prices from Google Sheets.
- Fetches end-of-day prices via **Marketstack**.
- Rebalances quantities directly in the spreadsheet.
- Sends a **Pushover** notification and drafts a **Gmail** summary.
- Explicit success/failure paths with a Pushover alert on errors.

## Workflow

| File | Purpose |
| --- | --- |
| `Portfolio Agent.json` | The full agentic rebalancing workflow. |

### Flow

```
Web Form (target equity / income ratio)
        → AI Agent · Gemini (structured output)
            Tools:
            · Google Sheets — Get row(s) in sheet (read holdings)
            · Google Sheets — Update row (current price)
            · Google Sheets — Update row (new quantity after rebalancing)
            · Marketstack   — Get many EoD data (prices)
            · Gmail         — Create draft (summary)
            · Pushover      — Push a message (notification)
        → Success? (output.success)
            ├─ true  → Pushover: "Operation Successful!" + Gmail summary draft
            └─ false → Pushover: "Operation Failed!" + agent output
```

### Agent instructions (as defined in the workflow)

1. Fetch all rows from the holdings sheet.
2. Update the **Price** column with the current Marketstack EoD price.
3. Read the desired equity/fixed-income ratio from the form input.
4. Compute each holding's current total value and the target split.
5. Update the **New Quantity After Rebalancing** column.
6. Run a final Google Sheets "Get" to confirm the update.
7. Send a Pushover success/failure message and draft a Gmail summary of what changed.

## Prerequisites

- n8n instance
- Google account with **Google Sheets** and **Gmail** APIs
- **Marketstack** API key
- **Pushover** application + user key
- **Gemini** (or OpenAI) API key

## Setup

1. **Create the holdings sheet** with at least these columns (row 1 = headers):

   | Ticker | Quantity | Equity ratio | Fixed income ratio | Price | Total Value | New Quantity After Rebalancing | New Total Value |
   | --- | --- | --- | --- | --- | --- | --- | --- |

   Fill the rows with your current holdings and target ratios.

2. **Import** `Portfolio Agent.json` into n8n (`Import from File`).
3. **Connect credentials** on every node:
   - Google Sheets (point to your spreadsheet + sheet)
   - Marketstack (your API key)
   - Gmail (your account)
   - Pushover (your app/user keys)
   - Gemini/OpenAI chat model
4. **Host the form**: the Form trigger is embedded in the workflow; open its URL or embed it in your own page, with the field `Please Provide the ratio of equity and income.`
5. **Activate** the workflow, then submit the form with a ratio such as `70:30`.

## Usage

1. Submit the form with your desired equity/income split.
2. The agent fetches prices, recomputes the split, and writes the new quantities into the sheet.
3. You receive a Pushover notification with the result and a Gmail draft summarizing the rebalance.
4. If anything fails, you get a Pushover alert with the agent's error output.

## Notes

- The agent updates **Price** and **New Quantity After Rebalancing** in place — the sheet is the source of truth and the audit trail.
- Keep the target ratio columns filled per holding; the agent uses them to compute the split.
- Media files in this folder are the demo video and screenshots used by the portfolio page.
