# YNAB Organizer (ynai) - Agent Instructions

*Inherits from ~/DevKev/CLAUDE.md*
*Created: 2025-12-12*

## Project Links

| Resource | Link |
|----------|------|
| **GitHub** | https://github.com/khglynn/ynai |
| **Domain** | ynai.app (Cloudflare) |
| **Hosting** | Vercel (ynai.app - live) |

## About This Project

AI-powered YNAB transaction categorization with vintage cartoon vibes:
- **Bulk categorizing transactions** - primary use case, with smart suggestions
- **Updating budgets** - assign money to categories
- **Insights & trends** - periodic analysis (later)

## Key Project Files

| File | Purpose |
|------|---------|
| `STYLE-GUIDE.md` | **Voice & tone** - Cuphead/cartoon energy, UI copy examples |
| `ROADMAP.md` | What's next, in priority order |
| `COMPLETED.md` | Finished work with file references |
| `claude-plans/` | Archived implementation plans |

### Web Visual Patterns (ready to reuse)

| File | What's in it |
|------|--------------|
| `web/app/page.tsx` | STICKERS array (64 stickers w/ bgColor + textColor), `colorDistance()`, shuffle logic |
| `web/app/globals.css` | `.paper-texture` (SVG turbulence), `.animate-card-in` (slide animation) |
| `web/docs/color-extraction-method.md` | How to extract colors from SVGs |
| `web/public/stickers/selected/` | 64 curated SVG stickers |
| `web/public/stickers/converted/` | Full library (232 SVGs) |

## Kevin's Budgets

Only work with these 4 budgets (ignore family shares like "Molly's Plan" or "Smith Home Budget"):

| Budget | ID | CLI shorthand |
|--------|----|----|
| Kevin's Personal Budget | `09155b46-e44b-48bd-9ff9-8b7d6126ae01` | `personal`, `kevin` |
| K&R Joint Account | `dd730b46-3428-46e7-a132-50d2d94d8e99` | `joint`, `k&r` |
| 2512 6th HOA | `f09ffdc3-cfb1-4ba7-aa5a-b03f5b0553d3` | `hoa` |
| My Budget (Archived) | `3029c5fd-bf4e-4ff1-adea-5e9e9e3241f4` | `archived` |

## Tech Stack

**Current (CLI):**
- **Runtime**: Node.js + TypeScript (ES modules)
- **YNAB SDK**: `ynab` (official)
- **CLI**: `commander` + `inquirer` for interactive prompts
- **Dev**: `tsx` for running TS directly

**Web UI (in progress):**
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom paper texture
- **LLM**: OpenRouter → Haiku (model flexibility)
- **Hosting**: Vercel
- **Database**: Neon (existing - patterns, receipts)

## YNAB API Gotchas

| Concept | How it actually works |
|---------|----------------------|
| **Uncategorized** | NOT `category_id: null`. YNAB uses a category **named** "Uncategorized" with a real ID. Filter by `category_name === 'Uncategorized'` |
| **Milliunits** | Amounts are in thousandths (divide by 1000 for dollars). $123.45 = 123450 milliunits |
| **Rate limit** | 200 requests/hour (rolling window) - use caching! |
| **Delta requests** | Use `server_knowledge` param to only fetch changes since last call |

## Commands

```bash
npm run dev -- budgets              # List all budgets
npm run dev -- categories personal  # List categories for a budget
npm run dev -- uncategorized joint  # Show uncategorized transactions
npm run dev -- categorize hoa       # Interactive categorization (TODO)
```

## Local Caching (TODO)

- `data/budgets.json` - cached budget list
- `data/categories/{budget_id}.json` - per-budget categories
- `data/patterns.json` - learned payee→category mappings

## YNAB Write Safety (CRITICAL)

**YNAB has NO point-in-time restore.** Before ANY write operation:

1. **Preview** - Show exactly what will change
2. **Confirm** - Require explicit "yes" from Kevin
3. **Snapshot** - Save original transaction to `data/backups/{date}-{txn_id}.json`
4. **Log** - Record operation in `data/changelog.json`

**API Limitations:**
- Split transactions can be CREATED but NOT UPDATED - must delete and recreate
- Deletes are permanent - always snapshot first
- Rate limit: 200 req/hour - batch operations when possible

**When building write commands:**
- Always implement --dry-run flag
- Default to preview mode, require --apply to execute
- Log all changes with timestamps

## Project-Specific Notes

- Token stored in `.env` as `YNAB_TOKEN` (gitignored)
- Gmail OAuth credentials at `data/credentials/gmail-oauth-credentials.json` (gitignored)
- Pattern learning: when Kevin corrects a suggestion, save for next time

## Relevant Docs & Links

- [YNAB API Docs](https://api.ynab.com/)
- [YNAB JS SDK](https://github.com/ynab/ynab-sdk-js)
- [API Endpoints](https://api.ynab.com/v1)
