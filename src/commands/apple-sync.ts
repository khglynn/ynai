import { Command } from 'commander';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { getAuthenticatedClient, searchAppleReceipts, testConnection } from '../services/gmail';
import * as ynab from 'ynab';

config();

const sql = neon(process.env.NEON_DATABASE_URL!);
const ynabApi = new ynab.API(process.env.YNAB_TOKEN!);

// Budget ID mapping
const BUDGETS: Record<string, string> = {
  personal: '09155b46-e44b-48bd-9ff9-8b7d6126ae01',
  joint: 'dd730b46-3428-46e7-a132-50d2d94d8e99',
};

export function registerAppleSyncCommand(program: Command) {
  program
    .command('apple-sync')
    .description('Sync Apple receipts from Gmail and match to YNAB transactions')
    .option('--test', 'Test Gmail connection only')
    .option('--after <date>', 'Only fetch receipts after this date (YYYY-MM-DD)')
    .option('--max <n>', 'Maximum receipts to fetch', '50')
    .option('--budget <name>', 'Budget to match against (personal|joint)', 'personal')
    .option('--dry-run', 'Show matches without updating')
    .action(async (options) => {
      try {
        if (options.test) {
          await testConnection();
          return;
        }

        console.log('=== Apple Receipt Sync ===\n');

        // Step 1: Authenticate with Gmail
        console.log('Connecting to Gmail...');
        const auth = await getAuthenticatedClient();
        console.log('✓ Gmail connected\n');

        // Step 2: Fetch receipts
        console.log('Fetching Apple receipts...');
        const receipts = await searchAppleReceipts(auth, {
          after: options.after,
          maxResults: parseInt(options.max),
        });
        console.log(`✓ Found ${receipts.length} receipts\n`);

        if (receipts.length === 0) {
          console.log('No receipts to process.');
          return;
        }

        // Step 3: Store in Neon
        console.log('Storing receipts in Neon...');
        let newReceipts = 0;
        let existingReceipts = 0;

        for (const receipt of receipts) {
          try {
            await sql`
              INSERT INTO apple_receipts (
                gmail_message_id, receipt_date, amount_cents, item_name, item_type
              ) VALUES (
                ${receipt.messageId},
                ${receipt.date.toISOString().split('T')[0]},
                ${receipt.amountCents},
                ${receipt.itemName},
                ${receipt.itemType}
              )
              ON CONFLICT (gmail_message_id) DO NOTHING
            `;
            newReceipts++;
          } catch (e: any) {
            if (e.message?.includes('duplicate')) {
              existingReceipts++;
            } else {
              console.error(`Error storing receipt ${receipt.messageId}:`, e.message);
            }
          }
        }
        console.log(`✓ Stored ${newReceipts} new receipts (${existingReceipts} already existed)\n`);

        // Step 4: Fetch YNAB transactions to match
        const budgetId = BUDGETS[options.budget] || BUDGETS.personal;
        console.log(`Fetching YNAB transactions from ${options.budget}...`);

        // Get Apple transactions (various payee names Apple uses)
        const ynabResponse = await ynabApi.transactions.getTransactions(budgetId);
        const appleTransactions = ynabResponse.data.transactions.filter((t) =>
          t.payee_name?.toLowerCase().includes('apple') ||
          t.payee_name?.toLowerCase().includes('itunes')
        );
        console.log(`✓ Found ${appleTransactions.length} Apple transactions in YNAB\n`);

        // Step 5: Match receipts to transactions
        console.log('Matching receipts to transactions...');
        const matches: Array<{
          receipt: typeof receipts[0];
          transaction: typeof appleTransactions[0];
          confidence: 'exact' | 'close';
        }> = [];

        for (const receipt of receipts) {
          // Convert cents to milliunits (YNAB uses milliunits = cents * 10)
          const receiptMilliunits = -receipt.amountCents * 10; // Negative because it's an expense

          // Find matching transaction by amount and date (±3 days)
          const receiptDate = receipt.date.getTime();
          const threeDays = 3 * 24 * 60 * 60 * 1000;

          for (const txn of appleTransactions) {
            const txnDate = new Date(txn.date).getTime();
            const dateDiff = Math.abs(txnDate - receiptDate);

            // Exact amount match within date range
            if (txn.amount === receiptMilliunits && dateDiff <= threeDays) {
              matches.push({ receipt, transaction: txn, confidence: 'exact' });
              break;
            }

            // Close amount match (within 1%) within date range - for currency conversion etc
            const amountDiff = Math.abs(txn.amount - receiptMilliunits);
            if (amountDiff / Math.abs(receiptMilliunits) < 0.01 && dateDiff <= threeDays) {
              matches.push({ receipt, transaction: txn, confidence: 'close' });
              break;
            }
          }
        }

        console.log(`✓ Found ${matches.length} matches\n`);

        // Step 6: Display matches
        if (matches.length > 0) {
          console.log('=== Matches ===\n');
          for (const match of matches) {
            const amount = (Math.abs(match.transaction.amount) / 1000).toFixed(2);
            const conf = match.confidence === 'exact' ? '✓' : '~';
            console.log(`${conf} ${match.receipt.date.toISOString().split('T')[0]} | $${amount}`);
            console.log(`  Receipt: ${match.receipt.itemName} (${match.receipt.itemType})`);
            console.log(`  YNAB: ${match.transaction.payee_name} → ${match.transaction.category_name || 'Uncategorized'}`);
            console.log(`  Transaction ID: ${match.transaction.id}`);
            console.log('');
          }
        }

        // Step 7: Update Neon with matched transaction IDs
        if (!options.dryRun && matches.length > 0) {
          console.log('Updating match records in Neon...');
          for (const match of matches) {
            await sql`
              UPDATE apple_receipts
              SET matched_transaction_id = ${match.transaction.id}
              WHERE gmail_message_id = ${match.receipt.messageId}
            `;
          }
          console.log('✓ Match records updated\n');
        }

        // Summary
        console.log('=== Summary ===');
        console.log(`Receipts fetched: ${receipts.length}`);
        console.log(`Transactions matched: ${matches.length}`);
        console.log(`Unmatched receipts: ${receipts.length - matches.length}`);

        // Show unmatched receipts
        const matchedMessageIds = new Set(matches.map((m) => m.receipt.messageId));
        const unmatched = receipts.filter((r) => !matchedMessageIds.has(r.messageId));
        if (unmatched.length > 0) {
          console.log('\n=== Unmatched Receipts ===');
          for (const r of unmatched.slice(0, 10)) {
            console.log(`  ${r.date.toISOString().split('T')[0]} | $${(r.amountCents / 100).toFixed(2)} | ${r.itemName}`);
          }
          if (unmatched.length > 10) {
            console.log(`  ... and ${unmatched.length - 10} more`);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
