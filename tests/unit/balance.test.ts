import { describe, it, expect } from 'vitest';
import { TelegramApiClient } from '../../src/client/telegram-client.js';
import { BalanceService } from '../../src/balance/balance.js';
import { createQueueMockFetch } from '../helpers/mock-transport.js';
import starBalanceFixture from '../fixtures/star-balance.json' with { type: 'json' };

describe('BalanceService', () => {
  const token = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

  it('retrieves bot Star balance with StarAmount schema', async () => {
    const { fetchFn, requests } = createQueueMockFetch([
      {
        status: 200,
        body: starBalanceFixture,
      },
    ]);

    const client = new TelegramApiClient({ token, fetch: fetchFn });
    const balance = new BalanceService(client);

    const result = await balance.get();

    expect(result).toEqual({
      amount: 2500,
      nanostar_amount: 750000000,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toContain('/getMyStarBalance');
  });

  it('retries safely on transient network glitch when getting balance', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount++;
      if (callCount === 1) {
        throw new TypeError('fetch failed: connection reset');
      }
      return new Response(JSON.stringify(starBalanceFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const client = new TelegramApiClient({
      token,
      fetch: fetchFn,
      maxRetries: 2,
      retryDelayMs: 10,
    });
    const balance = new BalanceService(client);

    const result = await balance.get();
    expect(result.amount).toBe(2500);
    expect(callCount).toBe(2);
  });
});
