# Completed Work

*Newest at top. When completing roadmap items, move here.*

---

## December 2024

### Apple Receipt Sync
**Completed:** Dec 12, 2024

- Gmail OAuth authentication flow
- Apple receipt email parsing (multiple formats)
- App/subscription name extraction (99% success rate)
- Total amount extraction (including tax)
- YNAB transaction matching (99% match rate on 100 receipts)
- Neon storage for receipts

**Files:**
- `src/services/gmail.ts` - Gmail API + parsing logic
- `src/commands/apple-sync.ts` - CLI command
- `docs/apple-email-parsing.md` - Parsing patterns guide

**Reference:** `claude-plans/2025-12-12-smart-categorization.md`

---

### Neon Database Schema
**Completed:** Dec 12, 2024

- Created categorization tables: `payee_patterns`, `exact_matches`, `subscriptions`
- Created feedback table: `categorization_feedback`
- Created external data tables: `apple_receipts`, `amazon_orders`

**Reference:** `claude-plans/2025-12-12-smart-categorization.md`

---

### Foundation CLI
**Completed:** Dec 12, 2024

- Commander.js CLI setup
- YNAB API integration
- Budget listing (`ynab budgets`)
- Category listing (`ynab categories <budget>`)
- Uncategorized transaction listing (`ynab uncategorized <budget>`)

**Files:**
- `src/index.ts` - CLI entry point
- `src/api/client.ts` - YNAB API wrapper
- `src/commands/list.ts` - List commands
