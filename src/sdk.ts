import type { TelegramStarsConfig } from './types/config.js';
import { TelegramApiClient } from './client/telegram-client.js';
import { PaymentsService } from './payments/payments.js';
import { BalanceService } from './balance/balance.js';
import { TransactionsService } from './transactions/transactions.js';

/**
 * Main entry point for the Telegram Stars SDK.
 * Provides access to typed payment helpers, balance inquiries, and transaction records.
 */
export class TelegramStarsClient {
  /**
   * Low-level typed Telegram Bot API client.
   */
  public readonly api: TelegramApiClient;

  /**
   * High-level payment operations (invoices, pre-checkout queries, refunds, subscriptions).
   */
  public readonly payments: PaymentsService;

  /**
   * Bot Telegram Star balance operations.
   */
  public readonly balance: BalanceService;

  /**
   * Bot Telegram Star transaction history and auto-pagination operations.
   */
  public readonly transactions: TransactionsService;

  constructor(config: TelegramStarsConfig) {
    this.api = new TelegramApiClient(config);
    this.payments = new PaymentsService(this.api);
    this.balance = new BalanceService(this.api);
    this.transactions = new TransactionsService(this.api);
  }

  /**
   * Node.js custom inspection hook ensuring token is NEVER printed.
   */
  [Symbol.for('nodejs.util.inspect.custom')](): Record<string, unknown> {
    return {
      apiBaseUrl: this.api.apiBaseUrl,
      timeoutMs: this.api.timeoutMs,
      maxRetries: this.api.maxRetries,
      token: '[REDACTED]',
    };
  }
}
