# Completed Work

*Newest at top. When completing roadmap items, move here.*

---

## December 2024

### Favicon + OG Image Assets
**Completed:** Dec 27, 2024

Created app icons and social share image for ynai.app.

**Built:**
- **Favicon** (`icon.png`, `apple-icon.png`): 1024x1024, happy basketball sticker on cream background
- **OG Image** (`opengraph-image.png`): 1200x630, "AI for your YNAB" in Fredoka Bold
  - Retro-teal text (#2D7A7A) on paper texture background (#ede9e0)
  - 6 HUGE stickers (300-380px) bleeding off edges
  - Uses only beige-background stickers that blend with canvas

**Generator Script:**
- `scripts/generate_og_image.py` - Python Pillow script with Inkscape SVG conversion
- `scripts/Fredoka-Bold.ttf` - Cached Google Font for offline generation

**Key patterns:**
- Beige-background stickers blend seamlessly with canvas (no post-it look)
- Sticker selection: eco badges, sports badges, ice cream badges
- Paper texture: dual-layer grain (fine specks + horizontal fibers)

**Files:**
- `web/app/icon.png` - Favicon (Next.js auto-detects)
- `web/app/apple-icon.png` - Apple touch icon
- `web/app/opengraph-image.png` - Social share image
- `scripts/generate_og_image.py` - OG image generator

---

### Sticker Float-to-Top Layout
**Completed:** Dec 27, 2024

Improved card layout for shorter viewports - sticker floats to top, text at bottom with gradient.

**Built:**
- Sticker container uses `bottom-[45%]` to occupy top 55% of card
- Added `object-top` to anchor sticker image at top
- Gradient behind text: `transparent → 80% opacity → solid` for readability
- Removed spacer div (no longer needed with separated zones)

**File:**
- `web/app/components/TransactionContent.tsx` - lines 32-43 (sticker), 46-51 (gradient)

---

### Responsive Card Sizing
**Completed:** Dec 27, 2024

Added vh-based card sizing for short viewport compatibility.

**Built:**
- SwipeCard now uses `min()` for responsive height:
  - Mobile: `h-[min(520px,75vh)]` - caps at 75% viewport height
  - Desktop: `h-[min(640px,80vh)]` - caps at 80% viewport height
- Cards no longer clip on short viewports (tested at 390×550)
- Desktop buttons still appear at md breakpoint

**File:**
- `web/app/components/SwipeCard.tsx` - lines 131-132

---

### Smart Stickers + Confidence UI
**Completed:** Dec 26, 2024

Enhanced swipe card UX with semantic sticker matching and confidence display.

**Built:**
- Smart sticker pairing: Matches sticker graphics to transaction payee/category
  - `STICKER_GROUPS`: Groups stickers by theme (food, shopping, tech, health, etc.)
  - `PAYEE_KEYWORDS`: Maps payees to sticker groups (Amazon→shopping, CVS→health)
  - `CATEGORY_KEYWORDS`: Maps categories to sticker groups
  - `getSmartSticker()`: Picks semantically relevant sticker with color distance check
- Confidence % in CategoryPicker: Only shown on first 4-5 suggestions in collapsed view
  - Disappears when expanded or searching (keeps list clean)
- Confidence % in BulkApprovalList: Hover-only reveal (category stays prominent)

**UX Refinements (Dec 26):**
- BulkApprovalList: Returned to chunky standalone header/footer blocks (removed unified container)
- CategoryPicker: Confidence % constrained to initial collapsed suggestions only
- BulkApprovalList: Added button-like styling to header/footer (rounded-2xl, shadow-lg, font-display uppercase)
- StampOverlay: Changed "Stamped!" → "Approved" (renders as "APPROVED" via CSS uppercase)

**Files:**
- `web/app/lib/stickers.ts` - Smart matching: `STICKER_GROUPS`, `PAYEE_KEYWORDS`, `getSmartSticker()`
- `web/app/components/CardStack.tsx` - Uses `getSmartSticker()` for semantic assignment
- `web/app/components/CategoryPicker.tsx` - Shows confidence % on first 4-5 collapsed only
- `web/app/components/BulkApprovalList.tsx` - Hover-only confidence, chunky standalone blocks

---

### Sticker Demo + Visual Foundation (ynai.app)
**Completed:** Dec 13, 2024

Visual patterns for the YNAB web UI - sticker shuffle demo deployed to ynai.app.

**Built:**
- 64 SVG stickers with extracted `bgColor` + `textColor`
- Color distance algorithm (prevents similar colors back-to-back)
- Paper texture overlay (SVG turbulence filter, multiply blend)
- Full-screen card slide animation
- Dynamic text/button coloring

**Files (reusable for YNAB app):**
- `web/app/page.tsx` - STICKERS array, `colorDistance()`, `hexToRgb()`, shuffle logic
- `web/app/globals.css` - `.paper-texture` class, `.animate-card-in` animation
- `web/docs/color-extraction-method.md` - SVG color extraction guide

**Reference:** `claude-plans/2025-12-13-sticker-demo-colors.md`

---

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
