import type { TelegramApiClient } from '../client/telegram-client.js';
import type { StarAmount } from '../types/telegram.js';
import type { GetBalanceOptions } from './types.js';

/**
 * Service for checking the bot's Telegram Star balance.
 */
export class BalanceService {
  constructor(private readonly client: TelegramApiClient) {}

  /**
   * Retrieves the current Telegram Stars balance of the bot.
   * Calls official Telegram Bot API `getMyStarBalance`.
   * Safe idempotent read operation with conservative retry support.
   */
  public async get(options?: GetBalanceOptions): Promise<StarAmount> {
    return this.client.callMethod<StarAmount>('getMyStarBalance', undefined, {
      signal: options?.signal,
      isSafeMethod: true, // Safe read operation
    });
  }
}
