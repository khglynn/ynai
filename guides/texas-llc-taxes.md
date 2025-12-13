# Texas LLC Tax Requirements

*Created: 2025-12-12*

## Overview

Kevin operates as a **single-member LLC** doing freelance/contract work in Texas.

## Federal Requirements

### Income Reporting
- Single-member LLC = **disregarded entity**
- Report income on personal **Form 1040** using **Schedule C**
- No separate business tax return needed

### Forms You'll Receive
| Form | From | What |
|------|------|------|
| 1099-NEC | Each client who paid $600+ | Reports your income to IRS |
| W-9 | You provide to clients | So they can issue 1099s |

### Quarterly Estimated Taxes
If you expect to owe $1,000+ for the year, pay quarterly:

| Quarter | Due Date |
|---------|----------|
| Q1 (Jan-Mar) | April 15 |
| Q2 (Apr-May) | June 15 |
| Q3 (Jun-Aug) | September 15 |
| Q4 (Sep-Dec) | January 15 (next year) |

Use **Form 1040-ES** to calculate and pay.

### Self-Employment Tax
- **15.3%** on net self-employment income
- Covers Social Security (12.4%) + Medicare (2.9%)
- Can deduct half on your 1040

## Texas State Requirements

### Income Tax
**None** - Texas has no state income tax.

### Franchise Tax
- Threshold: **$2.47 million** annual revenue (2024-2025)
- If below threshold: No franchise tax owed
- Still may need to file **Public Information Report (PIR)** or **Ownership Information Report (OIR)**

## What Your CPA Needs

### Income Documentation
| Document | Purpose |
|----------|---------|
| All 1099-NECs received | Verify reported income |
| Income not on 1099s | Any client who paid <$600 |
| Quarterly payment records | If you made estimated payments |

### Expense Documentation
| Category | Examples | Keep |
|----------|----------|------|
| Office supplies | Computer, software, desk | Receipts |
| Professional services | Accountant, legal, subscriptions | Invoices |
| Travel | Flights, hotels, meals (50%) | Receipts + business purpose |
| Vehicle | Mileage log OR actual expenses | Log or receipts |
| Home office | % of rent/mortgage, utilities | Calculation method |
| Health insurance | If self-paid | Statements |

### Schedule C Categories (IRS)
Map your YNAB categories to these for export:
- Line 8: Advertising
- Line 10: Car and truck expenses
- Line 11: Commissions and fees
- Line 13: Depreciation
- Line 14: Employee benefit programs
- Line 17: Legal and professional services
- Line 18: Office expense
- Line 21: Repairs and maintenance
- Line 22: Supplies
- Line 24a: Travel
- Line 24b: Meals (50% deductible)
- Line 25: Utilities
- Line 27a: Other expenses

## Record Keeping Requirements

### IRS Requirements
- Keep records for **3 years** from filing date (or 6 years if >25% underreporting)
- Must be able to substantiate deductions with receipts/documentation

### What to Track Per Transaction
| Field | Why |
|-------|-----|
| Date | When expense occurred |
| Amount | How much |
| Payee | Who you paid |
| Business purpose | Why it's deductible |
| Receipt | Proof of purchase |

## YNAB Tax Tracking (Planned)

### Commands
```bash
ynab tax-flag <transaction>    # Flag for tax export
ynab tax-list                  # Show all flagged
ynab tax-export 2024           # Export to CSV for CPA
```

### Export Format
- CSV with: Date, Payee, Amount, Category, Memo, Receipt link
- Summary by category (maps to Schedule C lines)
- Quarterly breakdown

## Sources
- [IRS Forms for Contractors](https://www.irs.gov/businesses/small-businesses-self-employed/forms-and-associated-taxes-for-independent-contractors)
- [Texas Franchise Tax](https://comptroller.texas.gov/taxes/franchise/ntd-rpt-updates-2024.php)
- [Texas LLC Requirements](https://www.upcounsel.com/texas-llc-tax-filing-requirements)
- [Contractor Taxes in Texas](https://remote.com/blog/contractor-management/contractor-taxes-texas)
