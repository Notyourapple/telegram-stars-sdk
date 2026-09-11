import { describe, it, expect } from 'vitest';
import { sendHttpRequest } from '../../src/client/transport.js';
import { createQueueMockFetch } from '../helpers/mock-transport.js';
import { TelegramApiError, TelegramRateLimitError } from '../../src/errors/api.js';
import { TelegramNetworkError, TelegramTimeoutError } from '../../src/errors/network.js';

describe('HTTP Transport', () => {
  const token = '12345:TOKEN_SECRET';
  const url = `https://api.telegram.org/bot${token}/getMyStarBalance`;

  it('successfully executes request and returns parsed result', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: {
          ok: true,
          result: { amount: 100 },
        },
      },
    ]);

    const result = await sendHttpRequest<{ amount: number }>({
      url,
      method: 'POST',
      telegramMethod: 'getMyStarBalance',
      token,
      timeoutMs: 5000,
      fetchFn,
    });

    expect(result).toEqual({ amount: 100 });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.headers['Content-Type']).toBe('application/json');
  });

  it('throws TelegramApiError on Telegram ok: false response', async () => {
    const { fetchFn } = createQueueMockFetch([
      {
        status: 400,
        body: {
          ok: false,
          error_code: 400,
          description: 'Bad Request: CHAT_NOT_FOUND',
        },
      },
    ]);

    await expect(
      sendHttpRequest({
        url,
        method: 'POST',
        telegramMethod: 'sendInvoice',
        token,
        timeoutMs: 5000,
        fetchFn,
      })
    ).rejects.toThrow(TelegramApiError);
  });

  it('throws TelegramRateLimitError on HTTP 429 response with retry_after', async () => {
    const { fetchFn } = createQueueMockFetch([
      {
        status: 429,
        body: {
          ok: false,
          error_code: 429,
          description: 'Too Many Requests: retry after 7',
          parameters: {
            retry_after: 7,
          },
        },
      },
    ]);

    let caughtError: unknown;
    try {
      await sendHttpRequest({
        url,
        method: 'POST',
        telegramMethod: 'getMyStarBalance',
        token,
        timeoutMs: 5000,
        fetchFn,
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(TelegramRateLimitError);
    const rateLimitErr = caughtError as TelegramRateLimitError;
    expect(rateLimitErr.errorCode).toBe(429);
    expect(rateLimitErr.retryAfter).toBe(7);
  });

  it('throws TelegramTimeoutError when timeoutMs expires', async () => {
    const { fetchFn } = createQueueMockFetch([
      {
        status: 200,
        body: { ok: true, result: true },
        delayMs: 200,
      },
    ]);

    await expect(
      sendHttpRequest({
        url,
        method: 'POST',
        telegramMethod: 'sendInvoice',
        token,
        timeoutMs: 50, // shorter than delay
        fetchFn,
      })
    ).rejects.toThrow(TelegramTimeoutError);
  });

  it('handles caller AbortSignal', async () => {
    const controller = new AbortController();
    const { fetchFn } = createQueueMockFetch([
      {
        status: 200,
        body: { ok: true, result: true },
        delayMs: 200,
      },
    ]);

    const promise = sendHttpRequest({
      url,
      method: 'POST',
      telegramMethod: 'sendInvoice',
      token,
      timeoutMs: 5000,
      fetchFn,
      signal: controller.signal,
    });

    controller.abort();
    await expect(promise).rejects.toThrow();
  });

  it('throws TelegramNetworkError on invalid non-JSON response from proxy', async () => {
    const { fetchFn } = createQueueMockFetch([
      {
        status: 502,
        body: '<html><body>502 Bad Gateway</body></html>',
      },
    ]);

    await expect(
      sendHttpRequest({
        url,
        method: 'POST',
        telegramMethod: 'getMyStarBalance',
        token,
        timeoutMs: 5000,
        fetchFn,
      })
    ).rejects.toThrow(TelegramNetworkError);
  });
});
