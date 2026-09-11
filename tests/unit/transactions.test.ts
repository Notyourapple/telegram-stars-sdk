import { describe, it, expect } from 'vitest';
import { TelegramApiClient } from '../../src/client/telegram-client.js';
import { TransactionsService } from '../../src/transactions/transactions.js';
import { TelegramValidationError } from '../../src/errors/base.js';
import { createQueueMockFetch } from '../helpers/mock-transport.js';
import starTransactionsFixture from '../fixtures/star-transactions.json' with { type: 'json' };

describe('TransactionsService', () => {
  const token = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

  describe('list', () => {
    it('lists transactions without parameters by default', async () => {
      const { fetchFn, requests } = createQueueMockFetch([
        {
          status: 200,
          body: starTransactionsFixture,
        },
      ]);

      const client = new TelegramApiClient({ token, fetch: fetchFn });
      const txService = new TransactionsService(client);

      const res = await txService.list();
      expect(res.transactions).toHaveLength(4);
      expect(requests[0]!.url).toContain('/getStarTransactions');
      expect(requests[0]!.body).toBeUndefined();
    });

    it('passes validated offset and limit', async () => {
      const { fetchFn, requests } = createQueueMockFetch([
        {
          status: 200,
          body: { ok: true, result: { transactions: [] } },
        },
      ]);

      const client = new TelegramApiClient({ token, fetch: fetchFn });
      const txService = new TransactionsService(client);

      await txService.list({ offset: 10, limit: 50 });
      expect(requests[0]!.body).toEqual({ offset: 10, limit: 50 });
    });

    it('validates invalid offset and limit', async () => {
      const { fetchFn } = createQueueMockFetch([]);
      const client = new TelegramApiClient({ token, fetch: fetchFn });
      const txService = new TransactionsService(client);

      await expect(txService.list({ offset: -1 })).rejects.toThrow(
        TelegramValidationError
      );
      await expect(txService.list({ limit: 0 })).rejects.toThrow(
        TelegramValidationError
      );
      await expect(txService.list({ limit: 101 })).rejects.toThrow(
        TelegramValidationError
      );
    });
  });

  describe('iterate', () => {
    it('automatically paginates through transactions and terminates cleanly', async () => {
      // First page returns 2 items with batchSize = 2
      const page1 = {
        ok: true,
        result: {
          transactions: [
            { id: 'tx_1', amount: 100, date: 1718000000 },
            { id: 'tx_2', amount: 200, date: 1718000100 },
          ],
        },
      };
      // Second page returns 1 item (< batchSize, indicating end)
      const page2 = {
        ok: true,
        result: {
          transactions: [{ id: 'tx_3', amount: 300, date: 1718000200 }],
        },
      };

      const { fetchFn, requests } = createQueueMockFetch([
        { status: 200, body: page1 },
        { status: 200, body: page2 },
      ]);

      const client = new TelegramApiClient({ token, fetch: fetchFn });
      const txService = new TransactionsService(client);

      const collected: string[] = [];
      for await (const tx of txService.iterate({ batchSize: 2 })) {
        collected.push(tx.id);
      }

      expect(collected).toEqual(['tx_1', 'tx_2', 'tx_3']);
      expect(requests).toHaveLength(2);
      expect(requests[0]!.body).toEqual({ offset: 0, limit: 2 });
      expect(requests[1]!.body).toEqual({ offset: 2, limit: 2 });
    });

    it('stops pagination when maxTransactions is reached', async () => {
      const page1 = {
        ok: true,
        result: {
          transactions: [
            { id: 'tx_1', amount: 100, date: 1718000000 },
            { id: 'tx_2', amount: 200, date: 1718000100 },
            { id: 'tx_3', amount: 300, date: 1718000200 },
          ],
        },
      };

      const { fetchFn } = createQueueMockFetch([{ status: 200, body: page1 }]);
      const client = new TelegramApiClient({ token, fetch: fetchFn });
      const txService = new TransactionsService(client);

      const collected: string[] = [];
      for await (const tx of txService.iterate({ batchSize: 10, maxTransactions: 2 })) {
        collected.push(tx.id);
      }

      expect(collected).toEqual(['tx_1', 'tx_2']);
    });

    it('handles empty transaction history without error', async () => {
      const { fetchFn } = createQueueMockFetch([
        { status: 200, body: { ok: true, result: { transactions: [] } } },
      ]);

      const client = new TelegramApiClient({ token, fetch: fetchFn });
      const txService = new TransactionsService(client);

      const collected: unknown[] = [];
      for await (const tx of txService.iterate()) {
        collected.push(tx);
      }

      expect(collected).toHaveLength(0);
    });
  });
});
