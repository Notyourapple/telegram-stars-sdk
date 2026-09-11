import { describe, it, expect } from 'vitest';
import {
  TelegramStarsError,
  TelegramConfigurationError,
  TelegramValidationError,
  TelegramNetworkError,
  TelegramTimeoutError,
  TelegramApiError,
  TelegramRateLimitError,
} from '../../src/errors/index.js';

describe('Error Hierarchy', () => {
  it('instantiates TelegramStarsError as base class', () => {
    const err = new TelegramStarsError('General error', 'CUSTOM_CODE');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err.name).toBe('TelegramStarsError');
    expect(err.code).toBe('CUSTOM_CODE');
    expect(err.message).toBe('General error');
    expect(err.toJSON()).toEqual({
      name: 'TelegramStarsError',
      code: 'CUSTOM_CODE',
      message: 'General error',
    });
  });

  it('instantiates TelegramConfigurationError', () => {
    const err = new TelegramConfigurationError('Missing token');
    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err).toBeInstanceOf(TelegramConfigurationError);
    expect(err.name).toBe('TelegramConfigurationError');
    expect(err.code).toBe('CONFIGURATION_ERROR');
  });

  it('instantiates TelegramValidationError with field information', () => {
    const err = new TelegramValidationError('Amount must be positive', 'amount');
    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err).toBeInstanceOf(TelegramValidationError);
    expect(err.name).toBe('TelegramValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.field).toBe('amount');
    expect(err.toJSON()).toMatchObject({
      field: 'amount',
      code: 'VALIDATION_ERROR',
    });
  });

  it('instantiates TelegramNetworkError with method and sanitized URL', () => {
    const err = new TelegramNetworkError({
      message: 'Connection failed',
      method: 'sendInvoice',
      url: 'https://api.telegram.org/bot12345:TOKEN/sendInvoice',
      cause: new Error('getaddrinfo ENOTFOUND'),
    });
    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err).toBeInstanceOf(TelegramNetworkError);
    expect(err.name).toBe('TelegramNetworkError');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.method).toBe('sendInvoice');
    expect(err.url).toContain('[REDACTED]');
    expect(err.cause).toBeDefined();
    expect(err.toJSON()).toMatchObject({
      method: 'sendInvoice',
      url: 'https://api.telegram.org/bot[REDACTED]/sendInvoice',
      cause: 'getaddrinfo ENOTFOUND',
    });
  });

  it('instantiates TelegramTimeoutError', () => {
    const err = new TelegramTimeoutError({
      method: 'getMyStarBalance',
      url: 'https://api.telegram.org/bot12345:TOKEN/getMyStarBalance',
      timeoutMs: 15000,
    });
    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err).toBeInstanceOf(TelegramTimeoutError);
    expect(err.name).toBe('TelegramTimeoutError');
    expect(err.code).toBe('TIMEOUT_ERROR');
    expect(err.timeoutMs).toBe(15000);
  });

  it('instantiates TelegramApiError with structured Telegram response properties', () => {
    const err = new TelegramApiError({
      errorCode: 400,
      description: 'Bad Request: INVOICE_PAYLOAD_INVALID',
      method: 'sendInvoice',
      parameters: {
        migrate_to_chat_id: 999888,
      },
    });

    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err).toBeInstanceOf(TelegramApiError);
    expect(err.name).toBe('TelegramApiError');
    expect(err.code).toBe('API_ERROR');
    expect(err.errorCode).toBe(400);
    expect(err.status).toBe(400);
    expect(err.description).toBe('Bad Request: INVOICE_PAYLOAD_INVALID');
    expect(err.migrateToChatId).toBe(999888);
    expect(err.toJSON()).toMatchObject({
      errorCode: 400,
      status: 400,
      description: 'Bad Request: INVOICE_PAYLOAD_INVALID',
      migrateToChatId: 999888,
    });
  });

  it('instantiates TelegramRateLimitError subclass of TelegramApiError', () => {
    const err = new TelegramRateLimitError({
      description: 'Too Many Requests: retry after 5',
      method: 'getMyStarBalance',
      retryAfter: 5,
    });

    expect(err).toBeInstanceOf(TelegramStarsError);
    expect(err).toBeInstanceOf(TelegramApiError);
    expect(err).toBeInstanceOf(TelegramRateLimitError);
    expect(err.name).toBe('TelegramRateLimitError');
    expect(err.errorCode).toBe(429);
    expect(err.retryAfter).toBe(5);
    expect(err.toJSON()).toMatchObject({
      errorCode: 429,
      retryAfter: 5,
    });
  });
});
