# YNAB Organizer - Smart Web UI Plan

*Created: 2025-12-12*
*Archive to: `claude-plans/2025-12-12-web-ui-plan.md`*

## Context

Previous CLI interface (`src/commands/categorize.ts`) was too rigid:
- Exact text matching for categories (no semantic understanding)
- One-by-one workflow for all transactions
- No AI smarts for interpreting natural language

Kevin wants an **AI-powered web UI** that:
1. Understands natural language ("snack" → Coffee/Snacks)
2. Bulk-approves high-confidence suggestions
3. Smart triage for ambiguous transactions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web App                          │
│                  (localhost:3000)                           │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)                                           │
│  ├── BulkReview - High-confidence batch approve             │
│  ├── SmartTriage - AI-assisted categorization               │
│  └── CategoryInput - Natural language → category            │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                 │
│  ├── /api/transactions - Fetch uncategorized from YNAB      │
│  ├── /api/suggest - LLM suggests category + confidence      │
│  ├── /api/match-category - "snack" → category ID            │
│  └── /api/apply - Batch update to YNAB                      │
├─────────────────────────────────────────────────────────────┤
│  Services (existing + new)                                  │
│  ├── YNAB API client (exists)                               │
│  ├── Amazon/Apple context (exists in Neon)                  │
│  └── LLM service (new - Claude API)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Two-Tier Workflow

### Tier 1: Bulk Review (High Confidence)

For transactions where LLM is 90%+ confident:
- Show as a list with suggested category
- "Approve All" button
- Click to expand details if curious
- Quick reject to send to Triage

**Visual:** Full-screen card with rotating background color, sticker graphic, and transaction summary. Swipe animation between transactions.

```
┌─────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← paper texture
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░                                                      ░░ │
│ ░░    ┌─────────────────────────────────────────────┐   ░░ │
│ ░░    │  [STICKER: Grocery Truck]                   │   ░░ │
│ ░░    │                                             │   ░░ │
│ ░░    │     H-E-B                        -$127.43   │   ░░ │
│ ░░    │     Dec 10, 2024                            │   ░░ │
│ ░░    │                                             │   ░░ │
│ ░░    │     Suggested: Groceries                    │   ░░ │
│ ░░    │                                             │   ░░ │
│ ░░    │   ╭─────────────╮   ╭─────────────╮         │   ░░ │
│ ░░    │   │  APPROVE ✓  │   │   CHANGE    │         │   ░░ │
│ ░░    │   ╰─────────────╯   ╰─────────────╯         │   ░░ │
│ ░░    └─────────────────────────────────────────────┘   ░░ │
│ ░░                                                      ░░ │
│ ░░                         3 of 12                      ░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────┘
```

Background color rotates: teal → coral → mustard → pink → green

### Tier 2: Smart Triage (Needs Review)

For ambiguous transactions:
- Full context displayed (Amazon items, Apple receipt)
- AI explains why it's uncertain
- Natural language category input
- Quick category buttons for common choices

**Example:**
```
┌─────────────────────────────────────────────────────────────┐
│ Amazon                                           -$89.47    │
│ Dec 10, 2024                                                │
├─────────────────────────────────────────────────────────────┤
│ Order Items:                                                │
│   • Anker USB-C Cable                                       │
│   • Protein Bars (12-pack)                                  │
│   • Birthday Card                                           │
│                                                             │
│ 🤔 Mixed categories: Electronics, Groceries, Gifts         │
│    "This order has items in multiple categories"           │
├─────────────────────────────────────────────────────────────┤
│ Category: [type or pick...]                                 │
│                                                             │
│ [Electronics] [Groceries] [Gifts] [Split...]               │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Category Input

When Kevin types natural language, LLM interprets it:

| Input | Matches To |
|-------|------------|
| "freelance" | Freelance Income |
| "snack" | Coffee/Snacks |
| "uber" | Transportation |
| "birthday present" | Gifts |
| "work stuff" | Office Supplies |

**Implementation:**
- Send input + all category names to Claude
- Claude returns best match + confidence
- Show suggested match, allow override

---

## Visual Style Guide

**Inspiration:** "The Good Store" vintage logo badges

### Aesthetic
- **Era:** 1960s-70s retro badge/seal style
- **Vibe:** Playful, trustworthy, hand-crafted
- **Characters:** Anthropomorphic objects with expressive faces

### Color Palette
| Name | Hex | Use |
|------|-----|-----|
| Teal | `#2D7A7A` | Primary backgrounds |
| Coral/Salmon | `#E8846B` | Secondary backgrounds |
| Mustard Yellow | `#D4A84B` | Accent, highlights |
| Dusty Pink | `#E8B4B4` | Soft backgrounds |
| Forest Green | `#4A7C59` | Success, approve |
| Cream | `#F5F0E6` | Paper base |
| Charcoal | `#3D3D3D` | Text, outlines |

### UI Elements
- **Buttons:** Thick-outlined pills with rounded corners
- **Cards:** Badge-shaped containers with subtle shadows
- **Backgrounds:** Rotating colors per transaction (swipe animation)
- **Texture:** Paper/cardboard texture overlay (CSS-generated)
- **Stickers:** Vintage badge graphics accompany each transaction

### Typography
- **Headlines:** Bold display font (vintage feel)
- **Body:** Clean sans-serif for readability
- **Badges:** Hand-lettered style for labels

### Interaction
- **Transitions:** Horizontal swipe-down animation between transactions
- **Feedback:** Satisfying approve/reject animations
- **Stickers:** Appear alongside transactions for personality

---

## Tech Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | Next.js 14 (App Router) | Kevin knows it, API routes built-in |
| Hosting | **Vercel** | Deploy from start, iterate in prod |
| Styling | Tailwind CSS | Fast iteration, clean |
| LLM | **OpenRouter → Haiku** | Model flexibility, can swap later |
| Database | Neon (existing) | Already has patterns, receipts |
| YNAB | Existing client | `src/api/client.ts` |

---

## Files to Create

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main categorization UI
│   ├── layout.tsx                # App shell
│   ├── globals.css               # Tailwind
│   └── api/
│       ├── transactions/route.ts # GET uncategorized
│       ├── suggest/route.ts      # POST - LLM suggestion
│       ├── match-category/route.ts # POST - natural lang → category
│       └── apply/route.ts        # POST - batch update YNAB
├── components/
│   ├── BulkReview.tsx            # High-confidence list
│   ├── SmartTriage.tsx           # Detailed view
│   ├── TransactionCard.tsx       # Single transaction
│   ├── CategoryInput.tsx         # Natural language input
│   └── AmazonContext.tsx         # Order items display
└── lib/
    ├── openrouter.ts             # OpenRouter API wrapper (Haiku default)
    └── types.ts                  # Shared types
```

---

## LLM Prompts

### Category Suggestion Prompt
```
You are categorizing a YNAB transaction.

Transaction:
- Payee: {payee}
- Amount: {amount}
- Date: {date}
- Amazon items: {items}
- Apple receipt: {receipt_info}

Available categories:
{category_list}

Historical patterns for this payee:
{patterns}

Respond with:
- suggested_category: string
- confidence: "high" | "medium" | "low"
- reasoning: string (brief explanation)
- alternatives: string[] (if ambiguous)
```

### Natural Language Match Prompt
```
User typed: "{input}"

Match to one of these categories:
{category_list}

Respond with the best matching category name or "none" if no match.
```

---

## Implementation Steps

### Phase 0: Setup & Asset Prep
- [ ] Archive this plan to `claude-plans/2025-12-12-web-ui-plan.md`
- [ ] Update ROADMAP.md: Replace CLI item with Web UI, link to plan
- [ ] Kevin creates GitHub repo (public - .gitignore already covers secrets)
- [ ] Install Inkscape: `brew install inkscape`
- [ ] Test convert 1-2 .ai stickers → SVG to verify quality
- [ ] If good: batch convert all stickers
- [ ] If not: Kevin exports from Illustrator (fallback)
- [ ] Copy SVGs to `web/public/stickers/`
- [ ] Extract colors from SVGs → build extended palette (20-30 colors)
- [ ] Create `manifest.json` with category → sticker mappings
- [ ] Create CSS paper texture

### Phase 1: Setup
- [ ] Initialize git repo (project has no git yet)
- [ ] Create GitHub repo, push initial code
- [ ] Add Next.js to existing project (new `web/` folder)
- [ ] Configure Tailwind with custom color palette (style guide)
- [ ] Add retro fonts (Google Fonts or local)
- [ ] Set up OpenRouter for LLM calls
- [ ] Add `OPENROUTER_API_KEY` env var
- [ ] Create Vercel project, connect to GitHub
- [ ] Configure env vars in Vercel (YNAB_TOKEN, NEON_*, OPENROUTER_API_KEY)

### Phase 2: API Routes
- [ ] `/api/transactions` - Fetch from YNAB, enrich with Amazon/Apple
- [ ] `/api/suggest` - LLM categorization with confidence
- [ ] `/api/match-category` - Natural language → category
- [ ] `/api/apply` - Batch update to YNAB

### Phase 3: UI Components
- [ ] Main page layout with two-tier view
- [ ] BulkReview component with approve all
- [ ] SmartTriage component with AI assistance
- [ ] CategoryInput with natural language
- [ ] AmazonContext / AppleContext displays

### Phase 4: Polish & Documentation
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Set up Storybook (`npx storybook@latest init`)
- [ ] Document core components (TransactionCard, CategoryInput, buttons)

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Hosting | **Vercel from start** - deploy and iterate in prod |
| LLM | **Haiku via OpenRouter** - model flexibility |
| Split workflow | TBD (defer - get basic categorization working first) |

---

## Graphics System

### Matching Strategy

**v1: Category → Graphics mapping**
- Tag each graphic with 1+ categories during asset prep
- Create `web/public/stickers/manifest.json` with mappings:
  ```json
  {
    "grocery-truck.svg": ["Groceries", "Food"],
    "coffee-cup.svg": ["Coffee/Snacks", "Eating Out"],
    "electronics-badge.svg": ["House / Electronics", "Software Subscriptions"]
  }
  ```
- When showing transaction, pick random graphic from its category's set
- Fallback: generic "money" or "receipt" graphic for untagged categories

**v2: Semantic boost (future)**
- LLM picks best graphic from category set based on transaction context
- Input: Amazon items, Apple receipt info, payee name
- "Batteries in order → electronics badge over generic grocery truck"

### Color Extraction

After .ai → SVG conversion:
1. Run color extraction script on all SVGs
2. Pull 3-5 dominant colors per graphic
3. Dedupe and cluster similar colors
4. Build extended palette (20-30 colors) for background rotation
5. Store in `web/lib/colors.ts` as CSS custom properties

**Tools:** Extract from SVG fill/stroke values directly, or use `color-thief-node` on rasterized versions

### Storybook Integration

Add component documentation after core UI works:

**Setup (Phase 4):**
```bash
cd web && npx storybook@latest init
```

**Components to document:**
- TransactionCard (states: loading, high-confidence, ambiguous)
- CategoryInput (empty, typing, matched, error)
- StickerDisplay (various graphics, sizes)
- Background (all colors, texture overlay)
- Button variants (approve, reject, neutral)

---

## Existing Code to Reuse

| File | What to Reuse |
|------|---------------|
| `src/api/client.ts` | YNAB API functions |
| `src/services/amazon-scraper.ts` | Amazon order context |
| `src/services/gmail.ts` | Apple receipt context |
| `src/services/category-suggester.ts` | Pattern lookup from Neon |

The existing services provide the data - we're adding LLM smarts on top.
