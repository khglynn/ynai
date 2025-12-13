# YNAB Organizer Roadmap

*Last updated: 2025-12-12*

What's next, in order. When done, move to `COMPLETED.md`.

---

## 1. Amazon Scraper

- Playwright scraper for Amazon order history
- Parse order details (items, prices, dates)
- Store in `amazon_orders` table
- Match to YNAB transactions by date + amount

**Reference:** `claude-plans/2025-12-12-smart-categorization.md`

---

## 2. Pattern Bootstrap

- Scan 11k historical categorized transactions
- Build `payee_patterns` table from actual data
- Detect subscriptions (recurring same-amount charges)
- Identify ambiguous payees

**Reference:** `claude-plans/2025-12-12-smart-categorization.md`

---

## 3. Smart Categorization Web UI

- AI-powered web UI for transaction categorization
- Natural language input ("snack" → Coffee/Snacks, "freelance" → Freelance Income)
- Bulk approve high-confidence suggestions
- Smart triage for ambiguous transactions (Amazon multi-item, etc.)
- Context from Amazon orders + Apple receipts
- Learns from corrections

**Reference:** `claude-plans/2025-12-12-web-ui-plan.md`

---

## 4. Feedback & Learning

- Update confidence scores after each decision
- Track accuracy by source (gmail, amazon, pattern, manual)
- Surface problem payees in stats

**Reference:** `claude-plans/2025-12-12-smart-categorization.md`

---

## 5. Cross-Budget Reconciliation

- Mirror splits between Personal ↔ Joint transfers
- Fetch "Darn it- shoulda split" transactions
- Calculate net owed, generate split suggestion
- Apply split (delete + recreate if needed)

**Reference:** `claude-plans/2025-12-12-phase2-plan.md`

---

## 6. Tax Tracking (LLC)

- Flag business expenses for Schedule C
- Export flagged transactions with receipts
- Summary by category for CPA

**Reference:** `claude-plans/2025-12-12-phase2-plan.md`

---

## 7. Subscription Management

- Detect recurring same-payee, same-amount charges
- List active subscriptions with amounts and dates
- **Unsubscribe help** - Open cancellation page in Playwright, guide through
- **Request refunds** - For items in `Refund Subscription / Fee` category:
  - Draft email template
  - Open email composer with populated content
  - Track refund status

**Key categories:**
- `Refund Subscription / Fee` - items to request refunds for
- `Software Subscriptions` - bulk Apple charges to review

---

## Optional / Future

| Feature | Notes |
|---------|-------|
| Notion integration | Category notes + agent memory |
| Stats dashboard | Accuracy tracking, problem payees |
| Receipt linking | Attach receipt images to transactions |
