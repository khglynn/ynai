import { config } from 'dotenv';
import * as ynab from 'ynab';
import { neon } from '@neondatabase/serverless';

config();

const ynabApi = new ynab.API(process.env.YNAB_TOKEN!);
const sql = neon(process.env.NEON_DATABASE_URL!);

// Mapping: YNAB budget ID -> Neon budget UUID
const BUDGET_MAP: Record<string, { neonId: string; name: string }> = {
  '09155b46-e44b-48bd-9ff9-8b7d6126ae01': { neonId: '19ae8d09-d4d9-49a2-a85d-a123c6713cc4', name: 'Personal' },
  'dd730b46-3428-46e7-a132-50d2d94d8e99': { neonId: '786d71a4-a6cf-40c9-bd23-46f11d191782', name: 'Joint' },
  'f09ffdc3-cfb1-4ba7-aa5a-b03f5b0553d3': { neonId: 'f89cab41-0f2c-4507-8956-d6b7ea9caaf2', name: 'HOA' },
};

const today = new Date().toISOString().split('T')[0];

async function backupBudget(ynabBudgetId: string) {
  const { neonId, name } = BUDGET_MAP[ynabBudgetId];
  console.log(`\nBacking up ${name}...`);

  // Fetch all transactions from YNAB
  const response = await ynabApi.transactions.getTransactions(ynabBudgetId);
  const transactions = response.data.transactions;
  console.log(`  Fetched ${transactions.length} transactions from YNAB`);

  // Insert one at a time using tagged template (Neon serverless requirement)
  let inserted = 0;
  let skipped = 0;

  for (const t of transactions) {
    try {
      await sql`
        INSERT INTO transactions (
          ynab_transaction_id, budget_id, date, amount_milliunits, memo,
          payee_name, category_name, ynab_category_id, flag_color, cleared, approved, snapshot_date
        ) VALUES (
          ${t.id},
          ${neonId}::uuid,
          ${t.date},
          ${t.amount},
          ${t.memo || null},
          ${t.payee_name || null},
          ${t.category_name || null},
          ${t.category_id || null},
          ${t.flag_color || null},
          ${t.cleared},
          ${t.approved},
          ${today}
        )
        ON CONFLICT (ynab_transaction_id, snapshot_date) DO NOTHING
      `;
      inserted++;
    } catch (e: any) {
      if (e.message?.includes('duplicate')) {
        skipped++;
      } else {
        console.error(`  Error inserting ${t.id}:`, e.message);
      }
    }

    if ((inserted + skipped) % 500 === 0) {
      console.log(`  Progress: ${inserted + skipped}/${transactions.length}`);
    }
  }

  console.log(`  ✓ Inserted ${inserted}, skipped ${skipped} duplicates`);
  return inserted;
}

async function main() {
  console.log('=== YNAB → Neon Backup ===');
  console.log(`Snapshot date: ${today}\n`);

  let total = 0;
  for (const ynabBudgetId of Object.keys(BUDGET_MAP)) {
    total += await backupBudget(ynabBudgetId);
  }

  // Verify
  const count = await sql`SELECT COUNT(*) as count FROM transactions WHERE snapshot_date = ${today}`;
  console.log(`\n=== Complete ===`);
  console.log(`Total inserted: ${total} transactions`);
  console.log(`Verified in Neon: ${count[0].count} rows for today's snapshot`);
}

main().catch(console.error);
