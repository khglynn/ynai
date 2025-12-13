import { Command } from 'commander';
import { config } from 'dotenv';
import * as readline from 'readline';
import {
  getCategories,
  getUncategorizedTransactions,
  updateTransactions,
} from '../api/client.js';
import {
  getSuggestion,
  recordChoices,
  getAmazonOrderItems,
  getAppleReceiptInfo,
  CategorySuggestion,
} from '../services/category-suggester.js';

config();

// Budget ID mapping
const BUDGETS: Record<string, string> = {
  personal: '09155b46-e44b-48bd-9ff9-8b7d6126ae01',
  kevin: '09155b46-e44b-48bd-9ff9-8b7d6126ae01',
  joint: 'dd730b46-3428-46e7-a132-50d2d94d8e99',
  'k&r': 'dd730b46-3428-46e7-a132-50d2d94d8e99',
  hoa: 'f09ffdc3-cfb1-4ba7-aa5a-b03f5b0553d3',
};

interface PendingUpdate {
  transactionId: string;
  payeeName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
}

interface FlatCategory {
  id: string;
  name: string;
  groupName: string;
  fullName: string;
}

export function registerCategorizeCommand(program: Command) {
  program
    .command('categorize <budget>')
    .description('Interactive categorization of uncategorized transactions')
    .option('-d, --days <n>', 'Only transactions from last N days', '30')
    .option('--all', 'All uncategorized (no date limit)')
    .option('--dry-run', 'Preview mode - show what would be updated')
    .action(async (budget: string, options) => {
      try {
        const budgetId = BUDGETS[budget.toLowerCase()] || BUDGETS.personal;
        const budgetName = budget.toLowerCase();

        console.log(`\n=== Categorize Transactions (${budgetName}) ===\n`);

        // Calculate date filter
        const sinceDate = options.all
          ? undefined
          : new Date(Date.now() - parseInt(options.days) * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];

        // Fetch transactions and categories
        console.log('Fetching uncategorized transactions...');
        const transactions = await getUncategorizedTransactions(budgetId, sinceDate);

        if (transactions.length === 0) {
          console.log('No uncategorized transactions found!\n');
          return;
        }

        console.log(`Found ${transactions.length} uncategorized transactions\n`);

        console.log('Fetching categories...');
        const categoryGroups = await getCategories(budgetId);

        // Flatten categories for easy selection
        const categories: FlatCategory[] = [];
        for (const group of categoryGroups) {
          if (group.hidden) continue;
          for (const cat of group.categories) {
            if (cat.hidden) continue;
            categories.push({
              id: cat.id,
              name: cat.name,
              groupName: group.name,
              fullName: `${group.name} / ${cat.name}`,
            });
          }
        }

        console.log(`Loaded ${categories.length} categories\n`);

        // Setup readline for interactive input
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const prompt = (question: string): Promise<string> =>
          new Promise((resolve) => rl.question(question, resolve));

        // Track pending updates
        const pendingUpdates: PendingUpdate[] = [];
        let skipped = 0;

        // Process each transaction
        for (let i = 0; i < transactions.length; i++) {
          const tx = transactions[i];
          const amount = tx.amount / 1000;
          const amountStr = amount < 0 ? `-$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`;

          // Clear screen and show transaction
          console.log('\n' + '━'.repeat(70));
          console.log(`Transaction ${i + 1} of ${transactions.length}`.padEnd(50) + tx.date);
          console.log('━'.repeat(70));
          console.log();
          console.log(`  ${tx.payee_name || 'Unknown Payee'}`.padEnd(50) + amountStr.padStart(15));

          if (tx.memo) {
            console.log(`  Memo: ${tx.memo}`);
          }

          // Check for Amazon order context
          const isAmazon = (tx.payee_name || '').toLowerCase().includes('amazon') ||
                           (tx.payee_name || '').toLowerCase().includes('amzn');

          if (isAmazon) {
            const amazonOrder = await getAmazonOrderItems(tx.id);
            if (amazonOrder) {
              console.log();
              console.log(`  Order #${amazonOrder.orderId}`);
              for (const item of amazonOrder.items.slice(0, 5)) {
                const itemName = item.name.length > 55 ? item.name.slice(0, 52) + '...' : item.name;
                console.log(`     - ${itemName}`);
              }
              if (amazonOrder.items.length > 5) {
                console.log(`     ... and ${amazonOrder.items.length - 5} more items`);
              }
            }
          }

          // Check for Apple receipt context
          const isApple = (tx.payee_name || '').toLowerCase().includes('apple') ||
                          (tx.payee_name || '').toLowerCase().includes('itunes');

          if (isApple) {
            const appleReceipt = await getAppleReceiptInfo(tx.id);
            if (appleReceipt) {
              console.log();
              console.log(`  Apple Purchase: ${appleReceipt.itemName}`);
              console.log(`  Type: ${appleReceipt.itemType}`);
            }
          }

          // Get suggestion
          const suggestion = await getSuggestion(tx.payee_name || '');
          if (suggestion) {
            const confIcon = suggestion.confidence === 'high' ? '++' :
                            suggestion.confidence === 'medium' ? '+' : '?';
            console.log();
            console.log(`  Suggested: ${suggestion.categoryName} [${confIcon}]`);
          }

          console.log();
          console.log('━'.repeat(70));

          // Show category selection help
          console.log('\nEnter category (type to search) or: [s]kip, [q]uit, [?]list');

          // Get user input
          const input = await prompt('\n> ');
          const trimmed = input.trim().toLowerCase();

          if (trimmed === 'q' || trimmed === 'quit') {
            console.log('\nQuitting...');
            break;
          }

          if (trimmed === 's' || trimmed === 'skip') {
            skipped++;
            continue;
          }

          if (trimmed === '?' || trimmed === 'list') {
            // Show all categories grouped
            console.log('\n=== Categories ===');
            let currentGroup = '';
            for (const cat of categories) {
              if (cat.groupName !== currentGroup) {
                currentGroup = cat.groupName;
                console.log(`\n${currentGroup}:`);
              }
              console.log(`  - ${cat.name}`);
            }
            i--; // Repeat this transaction
            continue;
          }

          // Accept suggestion with Enter or 'y'
          if ((trimmed === '' || trimmed === 'y' || trimmed === 'yes') && suggestion) {
            pendingUpdates.push({
              transactionId: tx.id,
              payeeName: tx.payee_name || '',
              categoryId: suggestion.categoryId,
              categoryName: suggestion.categoryName,
              amount: tx.amount,
            });
            console.log(`  -> ${suggestion.categoryName}`);
            continue;
          }

          // Search for category by name
          const searchTerm = trimmed;
          const matches = categories.filter(
            (c) =>
              c.name.toLowerCase().includes(searchTerm) ||
              c.groupName.toLowerCase().includes(searchTerm) ||
              c.fullName.toLowerCase().includes(searchTerm)
          );

          if (matches.length === 0) {
            console.log(`  No categories match "${searchTerm}". Skipping.`);
            skipped++;
            continue;
          }

          if (matches.length === 1) {
            // Single match - use it
            const cat = matches[0];
            pendingUpdates.push({
              transactionId: tx.id,
              payeeName: tx.payee_name || '',
              categoryId: cat.id,
              categoryName: cat.fullName,
              amount: tx.amount,
            });
            console.log(`  -> ${cat.fullName}`);
            continue;
          }

          // Multiple matches - show options
          console.log(`\nMultiple matches for "${searchTerm}":`);
          for (let j = 0; j < Math.min(matches.length, 9); j++) {
            console.log(`  ${j + 1}. ${matches[j].fullName}`);
          }

          const choice = await prompt('\nSelect (1-9) or [s]kip: ');
          const choiceTrimmed = choice.trim().toLowerCase();

          if (choiceTrimmed === 's' || choiceTrimmed === 'skip') {
            skipped++;
            continue;
          }

          const choiceNum = parseInt(choiceTrimmed);
          if (choiceNum >= 1 && choiceNum <= matches.length) {
            const cat = matches[choiceNum - 1];
            pendingUpdates.push({
              transactionId: tx.id,
              payeeName: tx.payee_name || '',
              categoryId: cat.id,
              categoryName: cat.fullName,
              amount: tx.amount,
            });
            console.log(`  -> ${cat.fullName}`);
          } else {
            console.log('  Invalid choice. Skipping.');
            skipped++;
          }
        }

        rl.close();

        // Summary and confirmation
        console.log('\n' + '='.repeat(70));
        console.log('=== Summary ===');
        console.log('='.repeat(70));

        if (pendingUpdates.length === 0) {
          console.log('\nNo transactions to update.\n');
          return;
        }

        // Group by category for summary
        const byCategory = new Map<string, number>();
        for (const update of pendingUpdates) {
          const count = byCategory.get(update.categoryName) || 0;
          byCategory.set(update.categoryName, count + 1);
        }

        console.log(`\nReady to update ${pendingUpdates.length} transactions:`);
        for (const [category, count] of byCategory.entries()) {
          console.log(`  ${count}x -> ${category}`);
        }
        console.log(`\nSkipped: ${skipped}`);

        if (options.dryRun) {
          console.log('\n[DRY RUN] No changes applied.\n');
          return;
        }

        // Confirm
        const rl2 = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const confirm = await new Promise<string>((resolve) =>
          rl2.question('\nApply changes? [y/N] ', resolve)
        );
        rl2.close();

        if (confirm.trim().toLowerCase() !== 'y') {
          console.log('\nCancelled. No changes applied.\n');
          return;
        }

        // Apply updates
        console.log('\nUpdating YNAB...');
        await updateTransactions(
          budgetId,
          pendingUpdates.map((u) => ({
            id: u.transactionId,
            category_id: u.categoryId,
          }))
        );

        // Record patterns for learning
        console.log('Recording patterns...');
        await recordChoices(
          pendingUpdates.map((u) => ({
            payeeName: u.payeeName,
            categoryId: u.categoryId,
            categoryName: u.categoryName,
          }))
        );

        console.log(`\nDone! Updated ${pendingUpdates.length} transactions.\n`);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
