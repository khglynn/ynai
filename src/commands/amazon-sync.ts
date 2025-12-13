import { Command } from 'commander';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { scrapeOrderHistory, testAmazonConnection, AmazonOrder } from '../services/amazon-scraper.js';
import * as ynab from 'ynab';

config();

const sql = neon(process.env.NEON_DATABASE_URL!);
const ynabApi = new ynab.API(process.env.YNAB_TOKEN!);

// Budget ID mapping
const BUDGETS: Record<string, string> = {
  personal: '09155b46-e44b-48bd-9ff9-8b7d6126ae01',
  kevin: '09155b46-e44b-48bd-9ff9-8b7d6126ae01',
  joint: 'dd730b46-3428-46e7-a132-50d2d94d8e99',
  'k&r': 'dd730b46-3428-46e7-a132-50d2d94d8e99',
  hoa: 'f09ffdc3-cfb1-4ba7-aa5a-b03f5b0553d3',
};

export function registerAmazonSyncCommand(program: Command) {
  program
    .command('amazon-sync')
    .description('Sync Amazon orders and match to YNAB transactions')
    .option('--test', 'Test Amazon connection only')
    .option('--after <date>', 'Only fetch orders after this date (YYYY-MM-DD)')
    .option('--max <n>', 'Maximum orders to fetch', '50')
    .option('--budget <name>', 'Budget to match against (personal|joint)', 'personal')
    .option('--dry-run', 'Show matches without updating Neon')
    .action(async (options) => {
      try {
        // Test mode - just check connection
        if (options.test) {
          const connected = await testAmazonConnection();
          process.exit(connected ? 0 : 1);
        }

        console.log('=== Amazon Order Sync ===\n');

        // Step 1: Scrape Amazon orders
        console.log('Scraping Amazon orders...');
        const result = await scrapeOrderHistory({
          maxOrders: parseInt(options.max),
          afterDate: options.after,
          onProgress: console.log,
        });

        if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }

        if (result.needsLogin) {
          console.log('\nPlease log in to Amazon and try again.');
          process.exit(1);
        }

        console.log(`\nFound ${result.orders.length} orders\n`);

        if (result.orders.length === 0) {
          console.log('No orders to process.');
          return;
        }

        // Step 2: Store in Neon
        console.log('Storing orders in Neon...');
        let newOrders = 0;
        let existingOrders = 0;

        for (const order of result.orders) {
          try {
            const insertResult = await sql`
              INSERT INTO amazon_orders (
                order_id, order_date, total_cents, items
              ) VALUES (
                ${order.orderId},
                ${order.orderDate.toISOString().split('T')[0]},
                ${order.totalCents},
                ${JSON.stringify(order.items)}
              )
              ON CONFLICT (order_id) DO NOTHING
              RETURNING id
            `;

            if (insertResult.length > 0) {
              newOrders++;
            } else {
              existingOrders++;
            }
          } catch (e: any) {
            console.error(`Error storing order ${order.orderId}:`, e.message);
          }
        }
        console.log(`Stored ${newOrders} new orders (${existingOrders} already existed)\n`);

        // Step 3: Fetch YNAB transactions to match
        const budgetId = BUDGETS[options.budget.toLowerCase()] || BUDGETS.personal;
        console.log(`Fetching YNAB transactions from ${options.budget}...`);

        const ynabResponse = await ynabApi.transactions.getTransactions(budgetId);
        const amazonTransactions = ynabResponse.data.transactions.filter(
          (t) =>
            t.payee_name?.toLowerCase().includes('amazon') ||
            t.payee_name?.toLowerCase().includes('amzn')
        );
        console.log(`Found ${amazonTransactions.length} Amazon transactions in YNAB\n`);

        // Step 4: Match orders to transactions
        console.log('Matching orders to transactions...');
        const matches: Array<{
          order: AmazonOrder;
          transaction: (typeof amazonTransactions)[0];
          confidence: 'exact' | 'close';
        }> = [];

        for (const order of result.orders) {
          // Convert cents to milliunits (YNAB uses milliunits = cents * 10)
          const orderMilliunits = -order.totalCents * 10; // Negative because it's an expense

          // Find matching transaction by amount and date (within 3 days)
          const orderDate = order.orderDate.getTime();
          const threeDays = 3 * 24 * 60 * 60 * 1000;

          for (const txn of amazonTransactions) {
            const txnDate = new Date(txn.date).getTime();
            const dateDiff = Math.abs(txnDate - orderDate);

            // Exact amount match within date range
            if (txn.amount === orderMilliunits && dateDiff <= threeDays) {
              matches.push({ order, transaction: txn, confidence: 'exact' });
              break;
            }

            // Close amount match (within 3%) within date range
            // Amazon sometimes has slight differences due to timing/taxes
            const amountDiff = Math.abs(txn.amount - orderMilliunits);
            if (amountDiff / Math.abs(orderMilliunits) < 0.03 && dateDiff <= threeDays) {
              matches.push({ order, transaction: txn, confidence: 'close' });
              break;
            }
          }
        }

        console.log(`Found ${matches.length} matches\n`);

        // Step 5: Display matches
        if (matches.length > 0) {
          console.log('=== Matches ===\n');
          for (const match of matches) {
            const amount = (Math.abs(match.transaction.amount) / 1000).toFixed(2);
            const conf = match.confidence === 'exact' ? '=' : '~';
            console.log(
              `${conf} ${match.order.orderDate.toISOString().split('T')[0]} | $${amount} | Order #${match.order.orderId}`
            );

            // Show items
            if (match.order.items.length > 0) {
              console.log(`  Items:`);
              for (const item of match.order.items.slice(0, 3)) {
                console.log(`    - ${item.name.slice(0, 60)}${item.name.length > 60 ? '...' : ''}`);
              }
              if (match.order.items.length > 3) {
                console.log(`    ... and ${match.order.items.length - 3} more items`);
              }
            }

            console.log(`  YNAB: ${match.transaction.payee_name} -> ${match.transaction.category_name || 'Uncategorized'}`);
            console.log(`  Transaction ID: ${match.transaction.id}`);
            console.log('');
          }
        }

        // Step 6: Update Neon with matched transaction IDs
        if (!options.dryRun && matches.length > 0) {
          console.log('Updating match records in Neon...');
          for (const match of matches) {
            await sql`
              UPDATE amazon_orders
              SET matched_transaction_id = ${match.transaction.id}
              WHERE order_id = ${match.order.orderId}
            `;
          }
          console.log('Match records updated.\n');
        }

        // Summary
        console.log('=== Summary ===');
        console.log(`Orders scraped: ${result.orders.length}`);
        console.log(`New orders stored: ${newOrders}`);
        console.log(`Transactions matched: ${matches.length}`);
        console.log(`Unmatched orders: ${result.orders.length - matches.length}`);

        // Show unmatched orders
        const matchedOrderIds = new Set(matches.map((m) => m.order.orderId));
        const unmatched = result.orders.filter((o) => !matchedOrderIds.has(o.orderId));
        if (unmatched.length > 0) {
          console.log('\n=== Unmatched Orders ===');
          for (const order of unmatched.slice(0, 10)) {
            const amount = (order.totalCents / 100).toFixed(2);
            console.log(`  ${order.orderDate.toISOString().split('T')[0]} | $${amount} | #${order.orderId}`);
            if (order.items.length > 0) {
              console.log(`    ${order.items[0].name.slice(0, 50)}...`);
            }
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
