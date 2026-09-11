/**
 * Example: Handling pre_checkout_query and successful_payment updates
 *
 * Merchants MUST answer pre-checkout queries within 10 seconds.
 * Merchants MUST persist telegramPaymentChargeId from successful payments if refunds are needed later.
 */

import {
  TelegramStarsClient,
  isPreCheckoutQueryUpdate,
  getPreCheckoutQuery,
  isSuccessfulPaymentUpdate,
  parseSuccessfulPayment,
  type TelegramUpdate,
} from '../../src/index.js';

// Simulated merchant database
const merchantDatabase = {
  activeOrders: new Set(['order_vip_123', 'order_ebook_456']),
  persistedPayments: new Map<string, { userId: number; amount: number; payload: string }>(),
};

async function handleTelegramUpdate(client: TelegramStarsClient, update: TelegramUpdate) {
  // 1. Handle incoming pre-checkout query (final confirmation before Telegram debits Stars)
  if (isPreCheckoutQueryUpdate(update)) {
    const query = getPreCheckoutQuery(update)!;
    console.log(`Received pre_checkout_query #${query.id} for ${query.total_amount} Stars`);

    // Merchant verification: check if payload is valid and item in stock
    const isOrderValid = merchantDatabase.activeOrders.has(query.invoice_payload);

    if (isOrderValid) {
      console.log(`Approving payment for payload: ${query.invoice_payload}`);
      await client.payments.approvePreCheckoutQuery(query.id);
    } else {
      console.warn(`Rejecting payment for invalid or expired order: ${query.invoice_payload}`);
      await client.payments.rejectPreCheckoutQuery(
        query.id,
        'Sorry, this item is no longer available or the order has expired.'
      );
    }
    return;
  }

  // 2. Handle successful payment update (Telegram completed transaction)
  if (isSuccessfulPaymentUpdate(update)) {
    const payment = parseSuccessfulPayment(update)!;
    console.log(`Payment confirmed! Charge ID: ${payment.telegramPaymentChargeId}`);
    console.log(`Amount: ${payment.totalAmount} ${payment.currency}`);
    console.log(`Order Payload: ${payment.invoicePayload}`);

    // CRITICAL: Persist telegramPaymentChargeId in your database!
    // Telegram requires this charge ID to issue refunds or verify transactions later.
    merchantDatabase.persistedPayments.set(payment.telegramPaymentChargeId, {
      userId: update.message!.from!.id,
      amount: payment.totalAmount,
      payload: payment.invoicePayload,
    });

    console.log('Payment recorded successfully in database.');
    return;
  }

  console.log('Update was not a Stars payment event.');
}

async function main() {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  if (!token) {
    console.error('Please set TELEGRAM_BOT_TOKEN environment variable.');
    process.exit(1);
  }

  const client = new TelegramStarsClient({ token });

  // Simulate an incoming pre-checkout query update
  const samplePreCheckoutUpdate: TelegramUpdate = {
    update_id: 1001,
    pre_checkout_query: {
      id: 'query_demo_123',
      from: { id: 888999, is_bot: false, first_name: 'Jane' },
      currency: 'XTR',
      total_amount: 100,
      invoice_payload: 'order_vip_123',
    },
  };

  console.log('Simulating incoming pre_checkout_query update:');
  await handleTelegramUpdate(client, samplePreCheckoutUpdate);
}

main().catch(err => {
  console.error('Handler error:', err);
  process.exit(1);
});
