import { describe, it, expect } from 'vitest';
import { validateConfig } from '../../src/client/config-validator.js';
import { TelegramConfigurationError } from '../../src/errors/base.js';

describe('validateConfig', () => {
  const validToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';

  it('validates a correct configuration with defaults', () => {
    const config = validateConfig({ token: validToken });

    expect(config.token).toBe(validToken);
    expect(config.apiBaseUrl).toBe('https://api.telegram.org');
    expect(config.timeoutMs).toBe(30000);
    expect(config.maxRetries).toBe(3);
    expect(config.retryDelayMs).toBe(500);
    expect(typeof config.fetch).toBe('function');
  });

  it('accepts custom valid configuration', () => {
    const customFetch = () => Promise.resolve(new Response());
    const config = validateConfig({
      token: validToken,
      apiBaseUrl: 'https://my-custom-tg-proxy.internal/',
      timeoutMs: 15000,
      maxRetries: 5,
      retryDelayMs: 250,
      fetch: customFetch,
    });

    expect(config.apiBaseUrl).toBe('https://my-custom-tg-proxy.internal');
    expect(config.timeoutMs).toBe(15000);
    expect(config.maxRetries).toBe(5);
    expect(config.retryDelayMs).toBe(250);
    expect(config.fetch).toBe(customFetch);
  });

  it('rejects missing or non-string token', () => {
    // @ts-expect-error testing runtime validation
    expect(() => validateConfig({})).toThrow(TelegramConfigurationError);
    // @ts-expect-error testing runtime validation
    expect(() => validateConfig({ token: null })).toThrow(TelegramConfigurationError);
    expect(() => validateConfig({ token: '' })).toThrow(TelegramConfigurationError);
    expect(() => validateConfig({ token: '   ' })).toThrow(TelegramConfigurationError);
  });

  it('rejects malformed token format', () => {
    expect(() => validateConfig({ token: 'not-a-token' })).toThrow(
      'Malformed Telegram Bot token'
    );
  });

  it('rejects malformed base URLs', () => {
    expect(() =>
      validateConfig({ token: validToken, apiBaseUrl: 'ftp://api.telegram.org' })
    ).toThrow('Invalid protocol');

    expect(() =>
      validateConfig({ token: validToken, apiBaseUrl: 'not a valid url' })
    ).toThrow('Malformed apiBaseUrl');
  });

  it('rejects invalid timeout values', () => {
    expect(() =>
      validateConfig({ token: validToken, timeoutMs: -100 })
    ).toThrow(TelegramConfigurationError);

    expect(() =>
      validateConfig({ token: validToken, timeoutMs: 0 })
    ).toThrow(TelegramConfigurationError);

    expect(() =>
      validateConfig({ token: validToken, timeoutMs: Infinity })
    ).toThrow(TelegramConfigurationError);
  });

  it('rejects invalid retry configuration', () => {
    expect(() =>
      validateConfig({ token: validToken, maxRetries: -1 })
    ).toThrow(TelegramConfigurationError);

    expect(() =>
      validateConfig({ token: validToken, maxRetries: 15 })
    ).toThrow(TelegramConfigurationError);

    expect(() =>
      validateConfig({ token: validToken, maxRetries: 2.5 })
    ).toThrow(TelegramConfigurationError);

    expect(() =>
      validateConfig({ token: validToken, retryDelayMs: -50 })
    ).toThrow(TelegramConfigurationError);
  });
});
