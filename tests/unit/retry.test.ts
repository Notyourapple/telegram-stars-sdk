import { describe, it, expect } from 'vitest';
import {
  calculateBackoff,
  isRetryableError,
  executeWithRetry,
} from '../../src/client/retry.js';
import {
  TelegramApiError,
  TelegramRateLimitError,
} from '../../src/errors/api.js';
import { TelegramNetworkError } from '../../src/errors/network.js';
import { TelegramValidationError } from '../../src/errors/base.js';

describe('Retry Engine', () => {
  describe('calculateBackoff', () => {
    it('returns delays bounded between 0 and exponential ceiling', () => {
      for (let i = 0; i < 20; i++) {
        const delay = calculateBackoff(0, 100, 1000);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(100);
      }

      for (let i = 0; i < 20; i++) {
        const delay = calculateBackoff(3, 100, 500);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(500); // capped by maxDelay
      }
    });
  });

  describe('isRetryableError', () => {
    const rateLimit = new TelegramRateLimitError({
      description: 'Flood wait',
      method: 'getMyStarBalance',
      retryAfter: 1,
    });

    const server500 = new TelegramApiError({
      errorCode: 500,
      description: 'Internal Server Error',
      method: 'getMyStarBalance',
    });

    const server502 = new TelegramApiError({
      errorCode: 502,
      description: 'Bad Gateway',
      method: 'getMyStarBalance',
    });

    const client400 = new TelegramApiError({
      errorCode: 400,
      description: 'Bad Request',
      method: 'getMyStarBalance',
    });

    const client403 = new TelegramApiError({
      errorCode: 403,
      description: 'Forbidden',
      method: 'getMyStarBalance',
    });

    const networkErr = new TelegramNetworkError({
      message: 'ECONNRESET',
      method: 'getMyStarBalance',
      url: 'https://api.telegram.org/botTOKEN/getMyStarBalance',
    });

    const validationErr = new TelegramValidationError('Invalid field');

    it('NEVER retries if isSafeMethod is false, regardless of error type', () => {
      expect(isRetryableError(rateLimit, false)).toBe(false);
      expect(isRetryableError(server500, false)).toBe(false);
      expect(isRetryableError(networkErr, false)).toBe(false);
    });

    it('retries rate limits (429) for safe methods', () => {
      expect(isRetryableError(rateLimit, true)).toBe(true);
    });

    it('retries 5xx server errors for safe methods', () => {
      expect(isRetryableError(server500, true)).toBe(true);
      expect(isRetryableError(server502, true)).toBe(true);
    });

    it('retries network connection drops for safe methods', () => {
      expect(isRetryableError(networkErr, true)).toBe(true);
    });

    it('never retries 4xx client errors (e.g. 400, 403) even for safe methods', () => {
      expect(isRetryableError(client400, true)).toBe(false);
      expect(isRetryableError(client403, true)).toBe(false);
    });

    it('never retries client validation errors', () => {
      expect(isRetryableError(validationErr, true)).toBe(false);
    });
  });

  describe('executeWithRetry', () => {
    it('succeeds on first attempt without retrying', async () => {
      let calls = 0;
      const result = await executeWithRetry(
        async () => {
          calls++;
          return 'ok';
        },
        {
          maxRetries: 3,
          baseDelayMs: 10,
          isSafeMethod: true,
        }
      );

      expect(result).toBe('ok');
      expect(calls).toBe(1);
    });

    it('retries safe operations on transient network error and succeeds', async () => {
      let calls = 0;
      const retryEvents: number[] = [];

      const result = await executeWithRetry(
        async () => {
          calls++;
          if (calls === 1) {
            throw new TelegramNetworkError({
              message: 'socket hangup',
              method: 'getMyStarBalance',
              url: 'https://api.telegram.org/bot[REDACTED]/getMyStarBalance',
            });
          }
          return { amount: 500 };
        },
        {
          maxRetries: 2,
          baseDelayMs: 5,
          isSafeMethod: true,
          onRetry: attempt => retryEvents.push(attempt),
        }
      );

      expect(result).toEqual({ amount: 500 });
      expect(calls).toBe(2);
      expect(retryEvents).toEqual([1]);
    });

    it('fails immediately without retry when isSafeMethod is false (e.g. payment mutation)', async () => {
      let calls = 0;
      const rateLimitErr = new TelegramRateLimitError({
        description: 'Rate limited',
        method: 'sendInvoice',
        retryAfter: 1,
      });

      await expect(
        executeWithRetry(
          async () => {
            calls++;
            throw rateLimitErr;
          },
          {
            maxRetries: 3,
            baseDelayMs: 5,
            isSafeMethod: false, // Mutation!
          }
        )
      ).rejects.toThrow(TelegramRateLimitError);

      expect(calls).toBe(1); // Never retried
    });

    it('throws after exceeding maxRetries', async () => {
      let calls = 0;
      const netErr = new TelegramNetworkError({
        message: 'offline',
        method: 'getMyStarBalance',
        url: 'https://api.telegram.org/bot[REDACTED]/getMyStarBalance',
      });

      await expect(
        executeWithRetry(
          async () => {
            calls++;
            throw netErr;
          },
          {
            maxRetries: 2,
            baseDelayMs: 5,
            isSafeMethod: true,
          }
        )
      ).rejects.toThrow(TelegramNetworkError);

      expect(calls).toBe(3); // Initial try + 2 retries
    });
  });
});
