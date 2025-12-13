# YNAB API Constraints & Safety

*Created: 2025-12-12*

## What We CAN Do via API

| Action | Method | Notes |
|--------|--------|-------|
| Read budgets | `GET /budgets` | Safe, no limits beyond rate |
| Read transactions | `GET /transactions` | Can filter by date, category |
| Read categories | `GET /categories` | Includes balances, budgeted amounts |
| Create transactions | `POST /transactions` | Including split transactions |
| Update single transaction | `PUT /transactions/{id}` | Category, memo, flag, etc. |
| Update multiple transactions | `PATCH /transactions` | Batch updates |
| Delete transaction | `DELETE /transactions/{id}` | Permanent! |

## What We CANNOT Do

| Action | Why |
|--------|-----|
| Update existing splits | API limitation - subtransactions can't be modified |
| Restore to point-in-time | YNAB doesn't support this |
| Access reconciled transaction details | Limited info after reconciliation |

## API Limitations

### Split Transactions
```
CREATE split: ✅ Supported
- Set category_id to null
- Provide subtransactions array

UPDATE existing split: ❌ Not supported
- Must DELETE and recreate
- Dates cannot be changed on splits
- Amounts cannot be changed on splits
```

### Rate Limiting
- **200 requests per hour** per access token
- Use `server_knowledge` parameter for delta requests
- Cache aggressively

### Gotchas

| Issue | Reality | Workaround |
|-------|---------|------------|
| Uncategorized transactions | NOT `category_id: null` | Filter by `category_name === 'Uncategorized'` |
| Currency | Stored as milliunits | Divide by 1000 for display |
| Dates | ISO format YYYY-MM-DD | Use string comparison |

## Safety Measures (Our Approach)

### Before Any Write Operation
1. **Preview** - Show user what will change
2. **Confirm** - Require explicit approval
3. **Snapshot** - Save original to `data/backups/`
4. **Log** - Record operation in `data/changelog.json`

### Backup Strategy
| Layer | What | Where |
|-------|------|-------|
| Per-change | Original transaction JSON | `data/backups/{date}-{txn_id}.json` |
| Weekly | Full budget export | Neon `ynab_backup` database |
| Changelog | All CLI operations | `data/changelog.json` |

### Restore Process
**Single transaction:**
1. Find backup in `data/backups/`
2. Re-apply original values via API

**Full rollback:**
1. Query Neon for historical state
2. Bulk restore via API (within rate limits)

## YNAB's Built-in Safety

| Feature | Capability |
|---------|------------|
| Undo (Cmd-Z) | Recent actions in current session only |
| Fresh Start | Archives budget, creates new one (loses history) |
| Point-in-time restore | **Not available** |

## Sources
- [YNAB API Docs](https://api.ynab.com/v1)
- [YNAB Undo/Redo](https://support.ynab.com/en_us/how-to-fix-mistakes-with-undo-and-redo-HJzO5CfA9)
- [Can I Recover?](https://support.ynab.com/en_us/can-i-revert-or-recover-my-plan-ry5zD7GQ1e)
