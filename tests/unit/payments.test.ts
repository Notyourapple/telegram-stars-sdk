import { describe, it, expect } from 'vitest';
import { TelegramApiClient } from '../../src/client/telegram-client.js';
import { PaymentsService } from '../../src/payments/payments.js';
import { TelegramValidationError } from '../../src/errors/base.js';
import { createQueueMockFetch } from '../helpers/mock-transport.js';

describe('PaymentsService', () => {
  const token = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

  it('sends invoice with correct official Telegram Stars fields', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: {
          ok: true,
          result: { message_id: 123, text: 'Invoice message' },
        },
      },
    ]);

    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    const result = await payments.sendInvoice({
      chatId: 987654,
      title: 'Diamond Sword',
      description: 'In-game rare item',
      payload: 'inv_order_1001',
      amount: 150,
      photoUrl: 'https://example.com/sword.png',
      needName: true,
    });

    expect(result).toEqual({ message_id: 123, text: 'Invoice message' });
    expect(requests).toHaveLength(1);

    const req = requests[0]!;
    expect(req.url).toContain('/sendInvoice');
    const body = req.body as Record<string, unknown>;

    // Verify official Telegram Stars specifications
    expect(body['chat_id']).toBe(987654);
    expect(body['title']).toBe('Diamond Sword');
    expect(body['description']).toBe('In-game rare item');
    expect(body['payload']).toBe('inv_order_1001');
    expect(body['currency']).toBe('XTR'); // MUST be XTR
    expect(body['provider_token']).toBe(''); // MUST be empty string for Stars
    expect(body['prices']).toEqual([
      {
        label: 'Diamond Sword',
        amount: 150,
      },
    ]);
    expect(body['photo_url']).toBe('https://example.com/sword.png');
    expect(body['need_name']).toBe(true);
  });

  it('validates invoice parameters client-side before sending', async () => {
    const { fetchFn, requests } = createQueueMockFetch([]);
    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    // Empty title
    await expect(
      payments.sendInvoice({
        chatId: 123,
        title: '',
        description: 'Valid description',
        payload: 'valid_payload',
        amount: 50,
      })
    ).rejects.toThrow(TelegramValidationError);

    // Title too long (> 32 chars)
    await expect(
      payments.sendInvoice({
        chatId: 123,
        title: 'This title is definitely longer than thirty-two characters long',
        description: 'Valid description',
        payload: 'valid_payload',
        amount: 50,
      })
    ).rejects.toThrow('title must be between 1 and 32 characters');

    // Invalid amount (non-integer, zero, negative)
    await expect(
      payments.sendInvoice({
        chatId: 123,
        title: 'Title',
        description: 'Valid description',
        payload: 'valid_payload',
        amount: 0,
      })
    ).rejects.toThrow('amount must be a positive integer');

    await expect(
      payments.sendInvoice({
        chatId: 123,
        title: 'Title',
        description: 'Valid description',
        payload: 'valid_payload',
        amount: 12.5,
      })
    ).rejects.toThrow(TelegramValidationError);

    // Payload too large (> 128 bytes)
    await expect(
      payments.sendInvoice({
        chatId: 123,
        title: 'Title',
        description: 'Valid description',
        payload: 'x'.repeat(129),
        amount: 10,
      })
    ).rejects.toThrow('payload must be between 1 and 128 bytes');

    // Network request was never attempted
    expect(requests).toHaveLength(0);
  });

  it('creates an invoice link with official Telegram Stars fields', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: {
          ok: true,
          result: 'https://t.me/$ABCDEFGHIJKLMN',
        },
      },
    ]);

    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    const link = await payments.createInvoiceLink({
      title: 'Supporter Pass',
      description: '30-day VIP supporter badge',
      payload: 'sub_vip_1',
      amount: 500,
      subscriptionPeriod: 2592000,
    });

    expect(link).toBe('https://t.me/$ABCDEFGHIJKLMN');
    expect(requests).toHaveLength(1);

    const body = requests[0]!.body as Record<string, unknown>;
    expect(body['currency']).toBe('XTR');
    expect(body['provider_token']).toBe('');
    expect(body['subscription_period']).toBe(2592000);
    expect(body['prices']).toEqual([{ label: 'Supporter Pass', amount: 500 }]);
  });

  it('rejects invalid subscriptionPeriod or price > 10000 for Star subscriptions', async () => {
    const { fetchFn } = createQueueMockFetch([]);
    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    // Non-30-day subscription
    await expect(
      payments.createInvoiceLink({
        title: 'Supporter Pass',
        description: 'Pass',
        payload: 'sub_1',
        amount: 500,
        subscriptionPeriod: 86400, // 1 day
      })
    ).rejects.toThrow('subscriptionPeriod for Telegram Stars subscriptions must currently be 2592000');

    // Amount > 10000 Stars
    await expect(
      payments.createInvoiceLink({
        title: 'Supporter Pass',
        description: 'Pass',
        payload: 'sub_1',
        amount: 15000,
        subscriptionPeriod: 2592000,
      })
    ).rejects.toThrow('Subscription price must not exceed 10000 Telegram Stars');
  });

  it('answers pre-checkout query with approval or rejection', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: { ok: true, result: true },
      },
      {
        status: 200,
        body: { ok: true, result: true },
      },
    ]);

    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    // Approval
    const approved = await payments.approvePreCheckoutQuery('query_123');
    expect(approved).toBe(true);
    expect(requests[0]!.body).toEqual({
      pre_checkout_query_id: 'query_123',
      ok: true,
    });

    // Rejection
    const rejected = await payments.rejectPreCheckoutQuery(
      'query_456',
      'Out of stock'
    );
    expect(rejected).toBe(true);
    expect(requests[1]!.body).toEqual({
      pre_checkout_query_id: 'query_456',
      ok: false,
      error_message: 'Out of stock',
    });
  });

  it('validates pre-checkout query rejection requires error message', async () => {
    const { fetchFn } = createQueueMockFetch([]);
    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    await expect(
      payments.answerPreCheckoutQuery({
        preCheckoutQueryId: 'query_123',
        ok: false,
        errorMessage: '',
      })
    ).rejects.toThrow('errorMessage is required when rejecting a pre-checkout query');
  });

  it('executes refunds using official refundStarPayment method', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: { ok: true, result: true },
      },
    ]);

    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    const refunded = await payments.refund({
      userId: 12345678,
      telegramPaymentChargeId: 'chg_tg_stars_9999',
    });

    expect(refunded).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toContain('/refundStarPayment');
    expect(requests[0]!.body).toEqual({
      user_id: 12345678,
      telegram_payment_charge_id: 'chg_tg_stars_9999',
    });
  });

  it('edits user star subscription with editUserStarSubscription', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: { ok: true, result: true },
      },
    ]);

    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const payments = new PaymentsService(client);

    const result = await payments.editSubscription({
      userId: 12345678,
      telegramPaymentChargeId: 'chg_sub_123',
      isCanceled: true,
    });

    expect(result).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toContain('/editUserStarSubscription');
    expect(requests[0]!.body).toEqual({
      user_id: 12345678,
      telegram_payment_charge_id: 'chg_sub_123',
      is_canceled: true,
    });
  });
});
