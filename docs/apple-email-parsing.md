# Apple Receipt Email Parsing

*Last updated: 2025-12-12*

Guide for understanding and maintaining the Apple receipt parsing logic in `src/services/gmail.ts`.

---

## Email Formats Handled

Apple receipts come in several formats. The parser handles:

### 1. Standard Subscriptions
```
App Name (Monthly) Renews Dec 10, 2025 ... $12.99
```

Pattern: `([name])\s*\((Monthly|Yearly|Annual|Weekly)\)`

Examples:
- `Buffer: Plan & Schedule Posts Essentials - 5 Channels (Monthly)`
- `MuseScore: sheet music MuseScore Pro+ (Yearly)`

### 2. Days/Weeks Format
```
App Name (7 Days) Renews Dec 10, 2025 ... $15.99
```

Pattern: `([name])\s*\((\d+\s*Days?|\d+\s*Weeks?)\)`

Examples:
- `Grindr - Gay Dating & Chat XTRA 1 Week (7 Days)`
- `SCRUFF - Gay Dating & Chat SCRUFF Pro (7 Days)`

### 3. Inline Monthly (No Parentheses)
```
Apple TV Monthly Renews Dec 20, 2025 ... $12.99
```

Pattern: `([name])\s+(Monthly|Yearly|Annual)\s+Renews`

Examples:
- `Apple TV Monthly`

### 4. AppleCare Format
```
AppleCare+ with Theft & Loss Technical support... Monthly Plan ... $13.49
```

Special handling - looks for `AppleCare+` followed by `Monthly Plan` or `Yearly`.

---

## Amount Extraction

YNAB records the **total charged** (including tax). Receipts show both item prices and totals.

**Priority order:**
1. `TOTAL $XX.XX` - explicit total line
2. Payment line: `American Express •••• 5004 $14.06`
3. First line item price (fallback)
4. `Subtotal` (fallback)

---

## Name Cleanup

Extracted names often have metadata prefixes. These are stripped:

| Pattern | Example |
|---------|---------|
| Email prefix | `kevn.hg@gmail.com App Name` → `App Name` |
| Order ID | `MVWSZ09QF1 DOCUMENT NO. 694059976280 App` → `App` |
| Store prefix | `App Store SmartWOD` → `SmartWOD` |
| Metadata | `Renews Dec 10`, `Report a Problem`, etc. |

---

## Multi-Item Receipts

Receipts can contain multiple items:
```
Grindr (7 Days) ... $15.99
Vercel Mobile (Annual) ... $9.99
TOTAL $28.12
```

Current behavior: **First item name extracted, total amount used.**

This works for YNAB matching (one transaction per receipt), but means only the first app name is captured.

---

## Testing Parsing

Debug script to inspect raw receipt text:

```bash
npx tsx src/debug-receipt.ts
```

Edit the date range in the script to target specific receipts:
```typescript
q: 'from:apple.com subject:receipt after:2025-12-01 before:2025-12-05'
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/services/gmail.ts` | OAuth + parsing logic |
| `src/commands/apple-sync.ts` | CLI command |
| `src/debug-receipt.ts` | Debug script (temporary) |
| `data/credentials/gmail-oauth-credentials.json` | OAuth app credentials |
| `data/credentials/gmail-token.json` | User access token |

---

## Adding New Formats

1. Use debug script to see raw receipt text
2. Identify the pattern (name + plan type + price)
3. Add regex to `extractLineItems()` in `gmail.ts`
4. Test with `apple-sync --max 10 --dry-run`
