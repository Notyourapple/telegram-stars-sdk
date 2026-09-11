import { TelegramStarsError } from './base.js';
import { redactToken } from '../client/redact.js';

/**
 * Thrown when an HTTP network failure occurs (e.g. connection refused, DNS error).
 */
export class TelegramNetworkError extends TelegramStarsError {
  public readonly method: string;
  public readonly url: string;
  public override readonly cause?: unknown;

  constructor(options: {
    message: string;
    method: string;
    url: string;
    cause?: unknown;
    token?: string;
  }) {
    super(
      `Network request failed for ${options.method} (${redactToken(options.url, options.token)}): ${options.message}`,
      'NETWORK_ERROR'
    );
    this.name = 'TelegramNetworkError';
    this.method = options.method;
    this.url = redactToken(options.url, options.token);
    this.cause = options.cause;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      method: this.method,
      url: this.url,
      cause: this.cause instanceof Error ? this.cause.message : String(this.cause),
    };
  }
}

/**
 * Thrown when an HTTP request exceeds the configured timeout.
 */
export class TelegramTimeoutError extends TelegramStarsError {
  public readonly method: string;
  public readonly url: string;
  public readonly timeoutMs: number;

  constructor(options: {
    method: string;
    url: string;
    timeoutMs: number;
    token?: string;
  }) {
    super(
      `Request timed out after ${options.timeoutMs}ms for ${options.method} (${redactToken(options.url, options.token)})`,
      'TIMEOUT_ERROR'
    );
    this.name = 'TelegramTimeoutError';
    this.method = options.method;
    this.url = redactToken(options.url, options.token);
    this.timeoutMs = options.timeoutMs;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      method: this.method,
      url: this.url,
      timeoutMs: this.timeoutMs,
    };
  }
}
