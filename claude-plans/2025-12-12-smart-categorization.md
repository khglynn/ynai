# YNAB Organizer - Smart Categorization Plan

*Created: 2025-12-12*
*Last updated: 2025-12-12*

---

## Status

| Phase | Status |
|-------|--------|
| 1A. Apple Receipts | ✅ Complete - 99% match rate |
| 1B. Amazon Scraper | ⬜ Next up |
| 2. Pattern Bootstrap | ⬜ Pending |
| 3. Triage CLI | ⬜ Pending |
| 4. Feedback & Learning | ⬜ Pending |

**Key files created:**
- `src/services/gmail.ts` - Gmail OAuth + receipt parsing
- `src/commands/apple-sync.ts` - CLI command
- `docs/apple-email-parsing.md` - Format documentation

---

## The Goal

Build a categorization system that:
1. **Gets real data first** - Apple receipts from Gmail, Amazon orders from Playwright
2. Suggests categories for uncategorized transactions
3. Lets Kevin triage with **y/n/ask** workflow
4. Tracks whether suggestions were correct (in Neon)
5. Improves accuracy over time

---

## Revised Approach: Real Data Over Heuristics

**Original plan:** Build fuzzy matching, guess on Amazon/Apple
**Better plan:** Get actual order/receipt data first, match accurately

| Payee | Data Source | What We Get |
|-------|-------------|-------------|
| Apple | Gmail receipts | App/subscription name, exact amount |
| Amazon | Order history (Playwright) | Item names, per-item prices |
| Others | Historical patterns | Payee → category mapping |

This eliminates the "Amazon could be 5 categories" problem - we'll know it was "Kitchen sponges" vs "Birthday gift".

---

## Storage: Neon Database

All patterns and feedback stored in Neon for durability and queryability.

### Tables

```sql
-- Learned payee → category patterns
CREATE TABLE payee_patterns (
  id SERIAL PRIMARY KEY,
  payee_name VARCHAR NOT NULL,
  category_id VARCHAR,
  category_name VARCHAR,
  confidence DECIMAL(3,2),
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  is_ambiguous BOOLEAN DEFAULT false,
  last_used DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Exact match cache (payee + amount)
CREATE TABLE exact_matches (
  id SERIAL PRIMARY KEY,
  payee_name VARCHAR NOT NULL,
  amount_milliunits INT NOT NULL,
  category_id VARCHAR,
  category_name VARCHAR,
  confidence DECIMAL(3,2),
  UNIQUE(payee_name, amount_milliunits)
);

-- Detected subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  payee_name VARCHAR NOT NULL,
  amount_milliunits INT NOT NULL,
  category_id VARCHAR,
  category_name VARCHAR,
  frequency VARCHAR, -- 'monthly', 'yearly'
  last_dates JSONB,
  UNIQUE(payee_name, amount_milliunits)
);

-- Every categorization decision (for learning)
CREATE TABLE categorization_feedback (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR NOT NULL,
  budget_id UUID REFERENCES budgets(id),
  date DATE,
  payee VARCHAR,
  amount_milliunits INT,
  suggested_category VARCHAR,
  suggested_confidence DECIMAL(3,2),
  actual_category VARCHAR,
  action VARCHAR, -- 'y', 'n', 'ask', 'skip'
  was_correct BOOLEAN,
  source VARCHAR, -- 'pattern', 'exact_match', 'gmail', 'amazon', 'manual'
  decided_at TIMESTAMP DEFAULT NOW()
);

-- Apple receipts from Gmail
CREATE TABLE apple_receipts (
  id SERIAL PRIMARY KEY,
  gmail_message_id VARCHAR UNIQUE,
  receipt_date DATE,
  amount_cents INT,
  item_name VARCHAR,
  item_type VARCHAR, -- 'app', 'subscription', 'icloud', 'music'
  matched_transaction_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Amazon orders from scraping
CREATE TABLE amazon_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR UNIQUE,
  order_date DATE,
  total_cents INT,
  items JSONB, -- [{name, price, quantity}]
  matched_transaction_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Order

### Phase 1: External Data Sources (Do First)

**1A. Gmail API for Apple Receipts** ✅ COMPLETE
- [x] OAuth credentials set up
- [x] `src/services/gmail.ts` - authenticate, search, parse receipts
- [x] `ynab apple-sync` command
- [x] Store receipts in `apple_receipts` table
- [x] Match to YNAB transactions by date + amount
- [x] Handle multiple email formats (standard, AppleCare, inline, days/weeks)
- [x] Extract total amounts (including tax) for accurate matching
- **Result:** 99/100 receipts matched to YNAB transactions

**1B. Playwright for Amazon Orders** ⬜ NEXT
- Use existing global Playwright MCP
- Build `src/services/amazon-scraper.ts` - login, scrape order history
- Build `ynab amazon-sync` command
- Store orders in `amazon_orders` table
- Match to YNAB transactions (handle multi-item orders)

### Phase 2: Pattern Bootstrap

**2A. Analyze History**
- Scan 11k historical transactions
- Build payee_patterns from actual categorizations
- Detect subscriptions (recurring same-amount)
- Identify ambiguous payees
- Store in Neon tables

### Phase 3: Triage Workflow

**3A. Categorize Command**
```bash
ynab categorize personal
```
- Pull uncategorized transactions
- For each, check in order:
  1. Apple receipt match? → use item name
  2. Amazon order match? → use item names
  3. Exact match in history? → high confidence
  4. Subscription pattern? → high confidence
  5. Payee pattern? → medium confidence
  6. Unknown → ask
- Group by confidence, batch approve high, review rest
- Record every decision to `categorization_feedback`

### Phase 4: Feedback & Learning

**4A. Update Patterns**
- After each y/n, update confidence scores
- Track accuracy by source (gmail vs pattern vs manual)
- Surface problem payees in stats

**4B. Stats Command**
```bash
ynab stats
```
- Overall accuracy
- Accuracy by source
- Top performers vs problem areas

---

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Gmail     │     │   Amazon    │     │ YNAB History│
│  (Apple)    │     │  (Orders)   │     │ (11k txns)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    NEON DATABASE                     │
│  apple_receipts | amazon_orders | payee_patterns    │
└─────────────────────────────────────────────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │ Suggestion Engine│
                  │ (src/services/   │
                  │  predictions.ts) │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ ynab categorize │
                  │ (triage CLI)    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   YNAB API      │
                  │ (apply changes) │
                  └─────────────────┘
```

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/services/gmail.ts` | Gmail API auth + Apple receipt parsing |
| `src/services/amazon-scraper.ts` | Playwright scraper for Amazon orders |
| `src/services/predictions.ts` | Suggestion engine (checks all sources) |
| `src/services/feedback.ts` | Record decisions, update confidence |
| `src/commands/apple-sync.ts` | `ynab apple-sync` command |
| `src/commands/amazon-sync.ts` | `ynab amazon-sync` command |
| `src/commands/categorize.ts` | `ynab categorize` triage CLI |
| `src/commands/analyze.ts` | `ynab analyze --bootstrap` + stats |

**Neon schema changes:** 6 new tables (see SQL above)

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Storage | Neon database (not JSON files) |
| Ambiguous payees | Get real data first (Gmail/Amazon), then pattern match |
| Batch vs interactive | Hybrid - batch high-confidence, interactive for rest |

---

## Suggestion Algorithm

```
For each uncategorized transaction:

1. EXACT MATCH (confidence: 0.95-0.99)
   - Same payee + same amount seen before?
   - If yes and always same category → suggest with high confidence

2. SUBSCRIPTION DETECTION (confidence: 0.90-0.95)
   - Same payee + amount recurring monthly?
   - If 3+ occurrences with ~30 day gaps → flag as subscription

3. PAYEE PATTERN (confidence: varies)
   - Look up payee in patterns
   - If >80% go to one category → suggest with 0.85 confidence
   - If ambiguous (no category >50%) → show distribution, ask

4. AMOUNT HEURISTIC (confidence: 0.60-0.75)
   - Small amounts ($5-15) at coffee-like payees → Coffee/Snacks
   - Subscription amounts ($10, $15, $20/mo) → likely subscription

5. FALLBACK (confidence: 0.0)
   - No pattern → must ask
```

---

## Learning Mechanics

### After each decision:

```typescript
function recordDecision(txn, suggested, actual, action) {
  // 1. Log to categorization_feedback table
  // 2. Update pattern confidence
  if (action === 'y') {
    patterns[payee].correct++;
    patterns[payee].confidence = recalculate();
  } else if (action === 'n') {
    patterns[payee].incorrect++;
    patterns[payee].confidence = recalculate();
  }
  // 3. Update global stats
}
```

### Confidence recalculation:

```
base_confidence = correct / (correct + incorrect)
recency_boost = if used in last 30 days: +0.05
sample_penalty = if total < 5: -0.10

final_confidence = clamp(base + recency - penalty, 0.5, 0.99)
```

### Pattern evolution:

- If a payee's dominant category changes, the pattern updates
- Low-confidence patterns (<0.6) trigger "ask" instead of suggest
- Patterns unused for 90+ days decay in confidence
