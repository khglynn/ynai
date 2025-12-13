import * as ynab from 'ynab';
import { config } from 'dotenv';

config();

const token = process.env.YNAB_TOKEN;
if (!token) {
  throw new Error('YNAB_TOKEN not found in environment. Check your .env file.');
}

export const api = new ynab.API(token);

/**
 * Get all budgets for the user
 */
export async function getBudgets() {
  const response = await api.budgets.getBudgets();
  return response.data.budgets;
}

/**
 * Get a single budget by ID (includes accounts, categories, payees)
 */
export async function getBudget(budgetId: string) {
  const response = await api.budgets.getBudgetById(budgetId);
  return response.data.budget;
}

/**
 * Get categories for a budget
 */
export async function getCategories(budgetId: string) {
  const response = await api.categories.getCategories(budgetId);
  return response.data.category_groups;
}

/**
 * Get transactions for a budget
 * @param sinceDate - optional ISO date string to filter transactions
 */
export async function getTransactions(budgetId: string, sinceDate?: string) {
  const response = await api.transactions.getTransactions(budgetId, sinceDate);
  return response.data.transactions;
}

/**
 * Get uncategorized transactions
 * Note: YNAB uses a category named "Uncategorized" rather than null category_id
 */
export async function getUncategorizedTransactions(budgetId: string, sinceDate?: string) {
  const transactions = await getTransactions(budgetId, sinceDate);
  return transactions.filter(t => t.category_name === 'Uncategorized');
}

/**
 * Update a transaction's category
 */
export async function updateTransactionCategory(
  budgetId: string,
  transactionId: string,
  categoryId: string
) {
  const response = await api.transactions.updateTransaction(budgetId, transactionId, {
    transaction: {
      category_id: categoryId,
    },
  });
  return response.data.transaction;
}

/**
 * Update multiple transactions at once
 */
export async function updateTransactions(
  budgetId: string,
  transactions: Array<{ id: string; category_id: string }>
) {
  const response = await api.transactions.updateTransactions(budgetId, {
    transactions: transactions.map(t => ({
      id: t.id,
      category_id: t.category_id,
    })),
  });
  return response.data.transactions;
}
