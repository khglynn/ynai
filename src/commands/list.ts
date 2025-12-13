import { getBudgets, getCategories, getUncategorizedTransactions } from '../api/client.js';
import { formatCurrency, formatDate, truncate } from '../utils/format.js';

/**
 * List all budgets
 */
export async function listBudgets() {
  console.log('\nFetching budgets...\n');

  const budgets = await getBudgets();

  console.log('Your Budgets:');
  console.log('─'.repeat(60));

  for (const budget of budgets) {
    console.log(`  ${budget.name}`);
    console.log(`    ID: ${budget.id}`);
    console.log(`    Last modified: ${formatDate(budget.last_modified_on || '')}`);
    console.log('');
  }

  console.log(`Total: ${budgets.length} budget(s)\n`);
  return budgets;
}

/**
 * List categories for a budget
 */
export async function listCategories(budgetId: string) {
  console.log('\nFetching categories...\n');

  const categoryGroups = await getCategories(budgetId);

  for (const group of categoryGroups) {
    // Skip internal/hidden groups
    if (group.hidden) continue;

    console.log(`\n${group.name}`);
    console.log('─'.repeat(40));

    for (const category of group.categories) {
      if (category.hidden) continue;

      const balance = formatCurrency(category.balance);
      const budgeted = formatCurrency(category.budgeted);
      console.log(`  ${truncate(category.name, 25).padEnd(25)} ${balance.padStart(12)} budgeted: ${budgeted}`);
    }
  }

  console.log('');
}

/**
 * List uncategorized transactions for a budget
 * @param sinceDate - optional ISO date string to filter transactions
 */
export async function listUncategorized(budgetId: string, sinceDate?: string) {
  const dateInfo = sinceDate ? ` (since ${sinceDate})` : ' (all time)';
  console.log(`\nFetching uncategorized transactions${dateInfo}...\n`);

  const transactions = await getUncategorizedTransactions(budgetId, sinceDate);

  if (transactions.length === 0) {
    console.log('No uncategorized transactions found.\n');
    return transactions;
  }

  console.log(`Found ${transactions.length} uncategorized transaction(s):\n`);
  console.log('─'.repeat(80));

  for (const tx of transactions) {
    const date = formatDate(tx.date);
    const amount = formatCurrency(tx.amount);
    const payee = truncate(tx.payee_name, 30);
    const memo = truncate(tx.memo, 25);

    console.log(`  ${date.padEnd(12)} ${amount.padStart(12)}  ${payee?.padEnd(30) || ''.padEnd(30)}  ${memo}`);
  }

  console.log('─'.repeat(80));
  console.log(`\nTotal: ${transactions.length} transaction(s)\n`);

  return transactions;
}
