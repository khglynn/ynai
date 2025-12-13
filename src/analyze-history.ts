import { config } from 'dotenv';
import * as ynab from 'ynab';

config();

const api = new ynab.API(process.env.YNAB_TOKEN!);
const budgetId = '09155b46-e44b-48bd-9ff9-8b7d6126ae01'; // Kevin Personal

async function main() {
  console.log('Fetching all transactions (this may take a moment)...\n');

  const txResponse = await api.transactions.getTransactions(budgetId);
  const transactions = txResponse.data.transactions;

  // Find date range
  const dates = transactions.map(t => t.date).sort();
  const earliest = dates[0];
  const latest = dates[dates.length - 1];

  // Count categorized (not Uncategorized)
  const categorized = transactions.filter(t => t.category_name !== 'Uncategorized');

  // Find Apple transactions
  const apple = transactions.filter(t =>
    t.payee_name?.toLowerCase().includes('apple') ||
    t.memo?.toLowerCase().includes('apple')
  );

  // Find Amazon transactions
  const amazon = transactions.filter(t =>
    t.payee_name?.toLowerCase().includes('amazon') ||
    t.memo?.toLowerCase().includes('amazon')
  );

  // Category distribution for Apple
  const appleCategories: Record<string, number> = {};
  apple.forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    appleCategories[cat] = (appleCategories[cat] || 0) + 1;
  });

  // Category distribution for Amazon
  const amazonCategories: Record<string, number> = {};
  amazon.forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    amazonCategories[cat] = (amazonCategories[cat] || 0) + 1;
  });

  console.log('=== YNAB Historical Data Summary ===\n');
  console.log('Date range:', earliest, 'to', latest);
  console.log('Total transactions:', transactions.length);
  console.log('Categorized:', categorized.length, `(${(categorized.length/transactions.length*100).toFixed(1)}%)`);

  console.log('\n--- Apple Transactions ---');
  console.log('Total:', apple.length);
  console.log('Categories used:');
  Object.entries(appleCategories)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 15)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  console.log('\n--- Amazon Transactions ---');
  console.log('Total:', amazon.length);
  console.log('Categories used:');
  Object.entries(amazonCategories)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 15)
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  // Show some example Apple transactions to understand memo patterns
  console.log('\n--- Sample Apple Transactions (last 20) ---');
  apple.slice(-20).forEach(t => {
    console.log(`  ${t.date} | $${(t.amount/1000).toFixed(2).padStart(8)} | ${(t.category_name || 'Uncategorized').padEnd(25)} | ${t.memo || ''}`);
  });
}

main();
