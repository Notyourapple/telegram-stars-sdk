/**
 * Example: Checking Stars balance and iterating transaction history
 */

import { TelegramStarsClient } from '../../src/index.js';

async function main() {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  if (!token) {
    console.error('Please set TELEGRAM_BOT_TOKEN environment variable.');
    process.exit(1);
  }

  const client = new TelegramStarsClient({ token });

  // 1. Get current bot Stars balance
  console.log('Fetching bot Star balance...');
  const balance = await client.balance.get();
  console.log(`Current Balance: ${balance.amount} Stars (nanostars: ${balance.nanostar_amount ?? 0})`);

  // 2. Fetch recent transactions with pagination parameters
  console.log('\nFetching last 5 transactions:');
  const recent = await client.transactions.list({ limit: 5 });
  for (const tx of recent.transactions) {
    console.log(`- Transaction ID: ${tx.id}, Amount: ${tx.amount} Stars, Date: ${new Date(tx.date * 1000).toISOString()}`);
    if (tx.source) {
      console.log(`  Source Partner Type: ${tx.source.type}`);
    }
  }

  // 3. Automatically iterate over all transactions using the async generator
  console.log('\nStreaming transactions via auto-paginated async iterator:');
  let count = 0;
  for await (const tx of client.transactions.iterate({ batchSize: 20, maxTransactions: 50 })) {
    count++;
    console.log(`[#${count}] ID: ${tx.id} | Amount: ${tx.amount} Stars`);
  }
  console.log(`Finished streaming ${count} transactions.`);
}

main().catch(err => {
  console.error('Error fetching transactions:', err);
  process.exit(1);
});
