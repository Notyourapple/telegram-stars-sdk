/**
 * Example: Issuing a refund for a Telegram Stars payment
 *
 * To issue a refund, you need:
 * 1. The userId of the customer
 * 2. The telegramPaymentChargeId received during successful_payment
 */

import { TelegramStarsClient, TelegramApiError } from '../../src/index.js';

async function main() {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  if (!token) {
    console.error('Please set TELEGRAM_BOT_TOKEN environment variable.');
    process.exit(1);
  }

  const client = new TelegramStarsClient({ token });

  const userId = Number(process.env['REFUND_USER_ID'] ?? 12345678);
  const chargeId = process.env['REFUND_CHARGE_ID'] ?? 'chg_sample_charge_id_from_db';

  console.log(`Attempting refund for user ${userId}, charge: ${chargeId}...`);

  try {
    const success = await client.payments.refund({
      userId,
      telegramPaymentChargeId: chargeId,
    });

    if (success) {
      console.log('Refund successfully processed by Telegram!');
      console.log('The Stars have been returned to the user and deducted from the bot balance.');
    }
  } catch (err) {
    if (err instanceof TelegramApiError) {
      console.error(`Telegram API rejected refund [${err.errorCode}]: ${err.description}`);
    } else {
      console.error('Unexpected error while issuing refund:', err);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
