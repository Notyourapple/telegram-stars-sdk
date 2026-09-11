import { TelegramStarsError } from './base.js';
import type { TelegramResponseParameters } from '../types/telegram.js';

/**
 * Thrown when the Telegram Bot API responds with ok: false.
 */
export class TelegramApiError extends TelegramStarsError {
  public readonly errorCode: number;
  public readonly description: string;
  public readonly method: string;
  public readonly parameters?: TelegramResponseParameters;
  public readonly retryAfter?: number;
  public readonly migrateToChatId?: number;
  public readonly status: number;

  constructor(options: {
    errorCode: number;
    description: string;
    method: string;
    parameters?: TelegramResponseParameters;
  }) {
    super(
      `Telegram API error during ${options.method} [${options.errorCode}]: ${options.description}`,
      'API_ERROR'
    );
    this.name = 'TelegramApiError';
    this.errorCode = options.errorCode;
    this.status = options.errorCode;
    this.description = options.description;
    this.method = options.method;
    this.parameters = options.parameters;
    this.retryAfter = options.parameters?.retry_after;
    this.migrateToChatId = options.parameters?.migrate_to_chat_id;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errorCode: this.errorCode,
      status: this.status,
      description: this.description,
      method: this.method,
      retryAfter: this.retryAfter,
      migrateToChatId: this.migrateToChatId,
    };
  }
}

/**
 * Thrown specifically when Telegram responds with HTTP 429 Too Many Requests (Rate Limit).
 */
export class TelegramRateLimitError extends TelegramApiError {
  public override readonly retryAfter: number;

  constructor(options: {
    description: string;
    method: string;
    retryAfter: number;
    parameters?: TelegramResponseParameters;
  }) {
    super({
      errorCode: 429,
      description: options.description,
      method: options.method,
      parameters: {
        ...options.parameters,
        retry_after: options.retryAfter,
      },
    });
    this.name = 'TelegramRateLimitError';
    this.retryAfter = options.retryAfter;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}
