/**
 * Example: Creating and sending a Telegram Stars invoice
 *
 * To run:
 *   TELEGRAM_BOT_TOKEN="your_token" node --loader ts-node/esm examples/basic-payment/index.ts
 */

import { TelegramStarsClient } from '../../src/index.js';

async function main() {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  if (!token) {
    console.error('Please set TELEGRAM_BOT_TOKEN environment variable.');
    process.exit(1);
  }

  const client = new TelegramStarsClient({ token });

  // 1. Send an invoice directly to a chat
  const targetChatId = process.env['TARGET_CHAT_ID'] ?? 123456789;
  console.log(`Sending Stars invoice to chat ${targetChatId}...`);

  const message = await client.payments.createInvoice({
    chatId: targetChatId,
    title: 'VIP Supporter Badge',
    description: 'Get exclusive access to the VIP community channel.',
    payload: `order_vip_${Date.now()}`,
    amount: 100, // 100 Telegram Stars (XTR)
    photoUrl: 'https://placehold.co/600x400/png?text=VIP+Supporter',
    photoWidth: 600,
    photoHeight: 400,
  });

  console.log('Invoice message sent successfully:', message);

  // 2. Create a shareable Stars invoice link (can be used in Web Apps, channels, or inline mode)
  console.log('Creating a shareable Stars invoice link...');
  const invoiceLink = await client.payments.createInvoiceLink({
    title: 'Digital E-Book: Advanced TypeScript',
    description: 'A 200-page deep dive into TypeScript architecture.',
    payload: `order_ebook_${Date.now()}`,
    amount: 250, // 250 Telegram Stars
  });

  console.log('Shareable invoice link created:', invoiceLink);
}

main().catch(err => {
  console.error('Failed to create Stars invoice:', err);
  process.exit(1);
});
