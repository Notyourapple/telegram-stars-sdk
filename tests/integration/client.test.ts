import { describe, it, expect } from 'vitest';
import { TelegramStarsClient } from '../../src/sdk.js';
import {
  parseSuccessfulPayment,
  getPreCheckoutQuery,
} from '../../src/updates/update-helpers.js';
import { createQueueMockFetch } from '../helpers/mock-transport.js';

describe('TelegramStarsClient End-to-End Integration', () => {
  const token = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

  it('runs through complete Telegram Stars merchant lifecycle', async () => {
    // 1. Balance Response
    const balanceResp = {
      ok: true,
      result: { amount: 5000, nanostar_amount: 0 },
    };

    // 2. sendInvoice Response
    const invoiceResp = {
      ok: true,
      result: {
        message_id: 101,
        chat: { id: 777888, type: 'private' },
        date: 1718000000,
      },
    };

    // 3. createInvoiceLink Response
    const linkResp = {
      ok: true,
      result: 'https://t.me/$xyz123invoice',
    };

    // 4. answerPreCheckoutQuery Response
    const preCheckoutResp = {
      ok: true,
      result: true,
    };

    // 5. getStarTransactions Response
    const transactionsResp = {
      ok: true,
      result: {
        transactions: [
          {
            id: 'chg_tg_charge_998877',
            amount: 150,
            date: 1718000010,
          },
        ],
      },
    };

    // 6. refundStarPayment Response
    const refundResp = {
      ok: true,
      result: true,
    };

    const { fetchFn, requests } = createQueueMockFetch([
      { status: 200, body: balanceResp },
      { status: 200, body: invoiceResp },
      { status: 200, body: linkResp },
      { status: 200, body: preCheckoutResp },
      { status: 200, body: transactionsResp },
      { status: 200, body: refundResp },
    ]);

    const stars = new TelegramStarsClient({
      token,
      fetch: fetchFn,
    });

    // Step 1: Check bot Star balance
    const balance = await stars.balance.get();
    expect(balance.amount).toBe(5000);

    // Step 2: Create and send Stars invoice
    const invoiceMsg = await stars.payments.createInvoice({
      chatId: 777888,
      title: 'E-Book: Master TypeScript',
      description: 'Comprehensive digital guide to TypeScript',
      payload: 'order_book_99',
      amount: 150,
    });
    expect(invoiceMsg['message_id']).toBe(101);

    // Step 3: Create shareable Stars invoice link
    const invoiceLink = await stars.payments.createInvoiceLink({
      title: 'E-Book: Master TypeScript',
      description: 'Comprehensive digital guide to TypeScript',
      payload: 'order_book_99',
      amount: 150,
    });
    expect(invoiceLink).toBe('https://t.me/$xyz123invoice');

    // Step 4: Incoming pre-checkout query update arrives
    const preCheckoutUpdate = {
      update_id: 20001,
      pre_checkout_query: {
        id: 'query_incoming_123',
        from: { id: 777888, is_bot: false, first_name: 'Bob' },
        currency: 'XTR',
        total_amount: 150,
        invoice_payload: 'order_book_99',
      },
    };

    const incomingQuery = getPreCheckoutQuery(preCheckoutUpdate);
    expect(incomingQuery).toBeDefined();
    expect(incomingQuery?.invoice_payload).toBe('order_book_99');

    // Merchant validates business rules and approves within 10 seconds
    const approved = await stars.payments.approvePreCheckoutQuery(
      incomingQuery!.id
    );
    expect(approved).toBe(true);

    // Step 5: Successful payment update arrives after user pays
    const successfulPaymentUpdate = {
      update_id: 20002,
      message: {
        message_id: 102,
        from: { id: 777888, is_bot: false, first_name: 'Bob' },
        chat: { id: 777888, type: 'private' },
        date: 1718000005,
        successful_payment: {
          currency: 'XTR',
          total_amount: 150,
          invoice_payload: 'order_book_99',
          telegram_payment_charge_id: 'chg_tg_charge_998877',
          provider_payment_charge_id: '',
        },
      },
    };

    const parsedPayment = parseSuccessfulPayment(successfulPaymentUpdate);
    expect(parsedPayment).toBeDefined();
    expect(parsedPayment?.telegramPaymentChargeId).toBe('chg_tg_charge_998877');
    expect(parsedPayment?.totalAmount).toBe(150);

    // Merchant stores the telegramPaymentChargeId in their database for future refunds
    const savedChargeId = parsedPayment!.telegramPaymentChargeId;

    // Step 6: Review transactions
    const history = await stars.transactions.list({ limit: 10 });
    expect(history.transactions).toHaveLength(1);
    expect(history.transactions[0]!.id).toBe(savedChargeId);

    // Step 7: User requests refund, merchant issues refund using saved charge ID
    const refunded = await stars.payments.refund({
      userId: 777888,
      telegramPaymentChargeId: savedChargeId,
    });
    expect(refunded).toBe(true);

    // Verify request sequence
    expect(requests).toHaveLength(6);
    expect(requests[0]!.url).toContain('/getMyStarBalance');
    expect(requests[1]!.url).toContain('/sendInvoice');
    expect(requests[2]!.url).toContain('/createInvoiceLink');
    expect(requests[3]!.url).toContain('/answerPreCheckoutQuery');
    expect(requests[4]!.url).toContain('/getStarTransactions');
    expect(requests[5]!.url).toContain('/refundStarPayment');
  });
});
