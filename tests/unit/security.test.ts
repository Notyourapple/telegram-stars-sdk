import { describe, it, expect } from 'vitest';
import { redactToken, sanitizeHeaders } from '../../src/client/redact.js';
import { TelegramApiClient } from '../../src/client/telegram-client.js';
import { TelegramStarsClient } from '../../src/sdk.js';
import { TelegramNetworkError, TelegramTimeoutError } from '../../src/errors/network.js';
import { TelegramStarsError } from '../../src/errors/base.js';

describe('Security and Token Redaction', () => {
  const secretToken = '987654321:SecretTokenPayload_12345';

  it('redacts explicit token from arbitrary string', () => {
    const raw = `Failed to connect to https://api.telegram.org/bot${secretToken}/sendMessage`;
    const sanitized = redactToken(raw, secretToken);

    expect(sanitized).not.toContain(secretToken);
    expect(sanitized).toBe(
      'Failed to connect to https://api.telegram.org/bot[REDACTED]/sendMessage'
    );
  });

  it('redacts regex-matched bot tokens even without explicit token argument', () => {
    const raw = 'Request to https://api.telegram.org/bot55555:SomeOtherSecret_99/getMe failed';
    const sanitized = redactToken(raw);

    expect(sanitized).not.toContain('55555:SomeOtherSecret_99');
    expect(sanitized).toContain('/bot[REDACTED]/getMe');
  });

  it('sanitizes authorization and token headers', () => {
    const headers = {
      Authorization: `Bearer ${secretToken}`,
      'X-Bot-Token': secretToken,
      'Content-Type': 'application/json',
    };

    const clean = sanitizeHeaders(headers);
    expect(clean['Authorization']).toBe('[REDACTED]');
    expect(clean['X-Bot-Token']).toBe('[REDACTED]');
    expect(clean['Content-Type']).toBe('application/json');

    // Test with Headers instance
    const headersInstance = new Headers();
    headersInstance.set('Authorization', `Bearer ${secretToken}`);
    headersInstance.set('Accept', 'application/json');
    const cleanFromInstance = sanitizeHeaders(headersInstance);
    expect(cleanFromInstance['authorization']).toBe('[REDACTED]');
    expect(cleanFromInstance['accept']).toBe('application/json');

    // Test with array of entries
    const cleanFromArray = sanitizeHeaders([
      ['Authorization', secretToken],
      ['X-Custom', 'Value'],
    ]);
    expect(cleanFromArray['Authorization']).toBe('[REDACTED]');
    expect(cleanFromArray['X-Custom']).toBe('Value');

    // Test undefined
    expect(sanitizeHeaders(undefined)).toEqual({});
  });

  it('never includes bot token in TelegramStarsError message or toJSON', () => {
    const err = new TelegramStarsError(
      `Error at https://api.telegram.org/bot${secretToken}/sendInvoice`
    );

    expect(err.message).not.toContain(secretToken);
    expect(err.message).toContain('[REDACTED]');

    const json = JSON.stringify(err.toJSON());
    expect(json).not.toContain(secretToken);
  });

  it('never includes bot token in TelegramNetworkError or TelegramTimeoutError', () => {
    const netErr = new TelegramNetworkError({
      message: 'ECONNREFUSED',
      method: 'sendInvoice',
      url: `https://api.telegram.org/bot${secretToken}/sendInvoice`,
      token: secretToken,
    });

    expect(netErr.message).not.toContain(secretToken);
    expect(netErr.url).not.toContain(secretToken);
    expect(JSON.stringify(netErr.toJSON())).not.toContain(secretToken);

    const timeoutErr = new TelegramTimeoutError({
      method: 'getMyStarBalance',
      url: `https://api.telegram.org/bot${secretToken}/getMyStarBalance`,
      timeoutMs: 5000,
      token: secretToken,
    });

    expect(timeoutErr.message).not.toContain(secretToken);
    expect(timeoutErr.url).not.toContain(secretToken);
    expect(JSON.stringify(timeoutErr.toJSON())).not.toContain(secretToken);
  });

  it('custom inspect hook redacts token on console.log/util.inspect for TelegramApiClient and TelegramStarsClient', () => {
    const client = new TelegramApiClient({
      token: secretToken,
    });

    // @ts-expect-error accessing node inspect symbol
    const inspectedApi = client[Symbol.for('nodejs.util.inspect.custom')]();
    expect(JSON.stringify(inspectedApi)).not.toContain(secretToken);
    expect(inspectedApi.token).toBe('[REDACTED]');

    const sdk = new TelegramStarsClient({
      token: secretToken,
    });
    // @ts-expect-error accessing node inspect symbol
    const inspectedSdk = sdk[Symbol.for('nodejs.util.inspect.custom')]();
    expect(JSON.stringify(inspectedSdk)).not.toContain(secretToken);
    expect(inspectedSdk.token).toBe('[REDACTED]');
  });
});
