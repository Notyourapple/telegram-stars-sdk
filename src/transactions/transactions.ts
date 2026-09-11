import type { TelegramApiClient } from '../client/telegram-client.js';
import type {
  StarTransaction,
  StarTransactions,
} from '../types/telegram.js';
import type {
  ListTransactionsOptions,
  IterateTransactionsOptions,
} from './types.js';
import { TelegramValidationError } from '../errors/base.js';

export class TransactionsService {
  constructor(private readonly client: TelegramApiClient) {}

  /**
   * Retrieves a list of Telegram Star transactions in chronological order.
   * Calls official Telegram Bot API `getStarTransactions`.
   * Safe idempotent read operation with conservative retry support.
   */
  public async list(
    options?: ListTransactionsOptions
  ): Promise<StarTransactions> {
    const payload: Record<string, unknown> = {};

    if (options?.offset !== undefined) {
      if (
        typeof options.offset !== 'number' ||
        !Number.isInteger(options.offset) ||
        options.offset < 0
      ) {
        throw new TelegramValidationError(
          'offset must be a non-negative integer.',
          'offset'
        );
      }
      payload['offset'] = options.offset;
    }

    if (options?.limit !== undefined) {
      if (
        typeof options.limit !== 'number' ||
        !Number.isInteger(options.limit) ||
        options.limit < 1 ||
        options.limit > 100
      ) {
        throw new TelegramValidationError(
          'limit must be an integer between 1 and 100.',
          'limit'
        );
      }
      payload['limit'] = options.limit;
    }

    return this.client.callMethod<StarTransactions>(
      'getStarTransactions',
      Object.keys(payload).length > 0 ? payload : undefined,
      {
        signal: options?.signal,
        isSafeMethod: true, // Safe read operation
      }
    );
  }

  /**
   * Returns an AsyncIterable that pages through transactions automatically.
   * Handles limit, offset, and termination conditions safely without infinite loops.
   */
  public async *iterate(
    options?: IterateTransactionsOptions
  ): AsyncIterable<StarTransaction> {
    const batchSize = options?.batchSize ?? 100;
    if (
      typeof batchSize !== 'number' ||
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > 100
    ) {
      throw new TelegramValidationError(
        'batchSize must be an integer between 1 and 100.',
        'batchSize'
      );
    }

    const maxTransactions = options?.maxTransactions;
    if (
      maxTransactions !== undefined &&
      (typeof maxTransactions !== 'number' ||
        !Number.isInteger(maxTransactions) ||
        maxTransactions <= 0)
    ) {
      throw new TelegramValidationError(
        'maxTransactions must be a positive integer if provided.',
        'maxTransactions'
      );
    }

    let offset = 0;
    let yieldedCount = 0;

    while (true) {
      if (options?.signal?.aborted) {
        return;
      }

      const response = await this.list({
        offset,
        limit: batchSize,
        signal: options?.signal,
      });

      const transactions = response.transactions ?? [];

      // If no transactions returned, we reached the end
      if (transactions.length === 0) {
        return;
      }

      for (const tx of transactions) {
        yield tx;
        yieldedCount++;

        if (maxTransactions !== undefined && yieldedCount >= maxTransactions) {
          return;
        }
      }

      // If fewer items than the batch size were returned, we have reached the end
      if (transactions.length < batchSize) {
        return;
      }

      offset += transactions.length;
    }
  }
}
