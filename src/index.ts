#!/usr/bin/env node

import { Command } from 'commander';
import { listBudgets, listCategories, listUncategorized } from './commands/list.js';
import { registerAppleSyncCommand } from './commands/apple-sync.js';
import { registerAmazonSyncCommand } from './commands/amazon-sync.js';
import { registerCategorizeCommand } from './commands/categorize.js';

const program = new Command();

program
  .name('ynab')
  .description('CLI tool to manage YNAB budgets')
  .version('1.0.0');

// List budgets
program
  .command('budgets')
  .description('List all your YNAB budgets')
  .action(async () => {
    try {
      await listBudgets();
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// List categories for a budget
program
  .command('categories <budget>')
  .description('List categories for a budget (use budget ID or "first" for first budget)')
  .action(async (budget: string) => {
    try {
      const budgetId = await resolveBudgetId(budget);
      await listCategories(budgetId);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// List uncategorized transactions
program
  .command('uncategorized <budget>')
  .description('List uncategorized transactions for a budget')
  .option('-d, --days <number>', 'Only show transactions from last N days', '30')
  .option('--all', 'Show all uncategorized (no date filter)')
  .action(async (budget: string, options: { days: string; all?: boolean }) => {
    try {
      const budgetId = await resolveBudgetId(budget);
      const sinceDate = options.all
        ? undefined
        : new Date(Date.now() - parseInt(options.days) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
      await listUncategorized(budgetId, sinceDate);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Helper to resolve budget ID from name, partial ID, or "first"
 */
async function resolveBudgetId(budget: string): Promise<string> {
  const { getBudgets } = await import('./api/client.js');
  const budgets = await getBudgets();

  if (budget === 'first' || budget === '1') {
    if (budgets.length === 0) throw new Error('No budgets found');
    return budgets[0].id;
  }

  // Try exact ID match
  const exactMatch = budgets.find(b => b.id === budget);
  if (exactMatch) return exactMatch.id;

  // Try name match (case-insensitive)
  const nameMatch = budgets.find(b =>
    b.name.toLowerCase().includes(budget.toLowerCase())
  );
  if (nameMatch) return nameMatch.id;

  // Try partial ID match
  const partialMatch = budgets.find(b => b.id.startsWith(budget));
  if (partialMatch) return partialMatch.id;

  throw new Error(`Budget not found: "${budget}". Run 'ynab budgets' to see available budgets.`);
}

// Register sync commands
registerAppleSyncCommand(program);
registerAmazonSyncCommand(program);
registerCategorizeCommand(program);

program.parse();
