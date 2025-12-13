# YNAB → Neon Backup Setup

*Created: 2025-12-12*

---

## Database Design Concepts

### The Big Idea

A database is like spreadsheets (tables) that can reference each other, with the database enforcing rules so data stays consistent.

### Key Concepts

**Tables = Types of things**
Each table holds one *type* of thing. You don't mix them.
```
budgets      → stores budget info (Personal, Joint, HOA)
transactions → stores transaction info
```

**Rows = Individual items**
Each row is one instance (one budget, one transaction).

**Columns = Properties**
What info you track about each thing (date, amount, payee, etc.).

**Primary Key (PK) = Unique ID**
Every row needs a unique identifier. No two rows can share the same PK.
```
id: 19ae8d09-d4d9-49a2-a85d-a123c6713cc4  ← this specific budget
```

**Foreign Key (FK) = Reference to another table**
Instead of duplicating data, you *point* to it:
```
transactions table:
┌─────────────┬────────────────────────┬─────────┐
│ id          │ budget_id (FK)         │ payee   │
├─────────────┼────────────────────────┼─────────┤
│ txn-001     │ 19ae8d09-... → Personal│ HubSpot │
│ txn-002     │ 19ae8d09-... → Personal│ Adobe   │
│ txn-003     │ 786d71a4-... → Joint   │ HEB     │
└─────────────┴────────────────────────┴─────────┘
```

Benefits of foreign keys:
- Don't repeat "Personal" 11,000 times (just the ID)
- Rename "Personal" → updates everywhere automatically
- Database prevents orphans (can't point to non-existent budget)

### One Table vs Many?

| Situation | Approach |
|-----------|----------|
| Same structure, different instances | One table + identifier column |
| Different structures | Separate tables |

Our 3 budgets have identical transaction structures, so **one table with `budget_id`** makes sense.

### Normalized vs Denormalized

| Approach | Pros | Cons |
|----------|------|------|
| **Normalized** (references between tables) | Less duplication, easier updates | Queries need JOINs |
| **Denormalized** (everything in one table) | Faster reads | More duplication, harder to update |

For 14k rows, normalized is cleaner and performance is identical.

### Our Schema Visualized

```
┌─────────────────┐         ┌─────────────────────────┐
│    budgets      │         │     transactions        │
├─────────────────┤         ├─────────────────────────┤
│ id (PK)         │◄───────┐│ id (PK)                 │
│ ynab_budget_id  │        ││ ynab_transaction_id     │
│ name            │        └┤ budget_id (FK)          │
│ created_at      │         │ date                    │
└─────────────────┘         │ amount_milliunits       │
                            │ payee_name              │
                            │ category_name           │
                            │ snapshot_date           │
                            └─────────────────────────┘
```

The arrow shows the relationship: each transaction belongs to one budget.

---

## Overview

All YNAB transactions are backed up to a Neon PostgreSQL database. This provides:
- Point-in-time recovery (YNAB has no native restore)
- Historical analysis across all budgets
- Safe foundation before making bulk changes

## Database Connection

**Project:** `neondb` (default Neon project)
**Connection String:** Stored in `.env` as `NEON_DATABASE_URL`

```
postgresql://neondb_owner:***@ep-muddy-brook-ade4fip7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Schema

### `budgets` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Internal Neon ID |
| ynab_budget_id | VARCHAR | YNAB's budget ID |
| name | VARCHAR | Human-readable name |
| created_at | TIMESTAMP | When added |

### `transactions` table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL (PK) | Auto-increment |
| ynab_transaction_id | VARCHAR | YNAB's transaction ID |
| budget_id | UUID (FK) | Links to budgets table |
| date | DATE | Transaction date |
| amount_milliunits | INTEGER | Amount × 1000 (YNAB format) |
| memo | TEXT | Transaction memo |
| payee_name | VARCHAR | Payee display name |
| category_name | VARCHAR | Category at snapshot time |
| ynab_category_id | VARCHAR | YNAB's category ID |
| flag_color | VARCHAR | YNAB flag color |
| cleared | VARCHAR | cleared/uncleared/reconciled |
| approved | BOOLEAN | Approved status |
| snapshot_date | DATE | When this snapshot was taken |
| created_at | TIMESTAMP | Row creation time |

**Unique constraint:** `(ynab_transaction_id, snapshot_date)` - same transaction can appear multiple times with different snapshot dates to track changes.

## Budget ID Mapping

| Budget | YNAB ID | Neon UUID |
|--------|---------|-----------|
| Personal | `09155b46-e44b-48bd-9ff9-8b7d6126ae01` | `19ae8d09-d4d9-49a2-a85d-a123c6713cc4` |
| Joint | `dd730b46-3428-46e7-a132-50d2d94d8e99` | `786d71a4-a6cf-40c9-bd23-46f11d191782` |
| HOA | `f09ffdc3-cfb1-4ba7-aa5a-b03f5b0553d3` | `f89cab41-0f2c-4507-8956-d6b7ea9caaf2` |

## Running Backups

```bash
# From ynab-organizer directory
npx tsx src/backup-to-neon.ts
```

Output:
```
=== YNAB → Neon Backup ===
Snapshot date: 2025-12-12

Backing up Personal...
  Fetched 11071 transactions from YNAB
  Progress: 500/11071
  ...
  ✓ Inserted 11071, skipped 0 duplicates

Backing up Joint...
  Fetched 2907 transactions from YNAB
  ✓ Inserted 2907, skipped 0 duplicates

Backing up HOA...
  Fetched 4 transactions from YNAB
  ✓ Inserted 4, skipped 0 duplicates

=== Complete ===
Total inserted: 13982 transactions
Verified in Neon: 13982 rows for today's snapshot
```

## Useful Queries

### Count by budget
```sql
SELECT b.name, COUNT(*) as transactions
FROM transactions t
JOIN budgets b ON t.budget_id = b.id
WHERE t.snapshot_date = CURRENT_DATE
GROUP BY b.name;
```

### Uncategorized transactions
```sql
SELECT date, payee_name, amount_milliunits/1000.0 as amount
FROM transactions
WHERE category_name = 'Uncategorized'
  AND snapshot_date = CURRENT_DATE
  AND payee_name NOT LIKE '%Transfer%'
ORDER BY date DESC;
```

### Find transaction changes over time
```sql
SELECT snapshot_date, category_name, memo
FROM transactions
WHERE ynab_transaction_id = 'some-id'
ORDER BY snapshot_date;
```

## Neon MCP Integration

Claude has read access to Neon via MCP. Useful tools:
- `mcp__Neon__run_sql` - Execute queries
- `mcp__Neon__get_database_tables` - List tables
- `mcp__Neon__describe_table_schema` - See columns

## Backup Schedule

Currently manual. Future options:
- Daily cron job
- GitHub Action on schedule
- Cloudflare Worker with cron trigger
