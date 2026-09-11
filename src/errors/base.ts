import { redactToken } from '../client/redact.js';

/**
 * Base error class for all Telegram Stars SDK errors.
 * Ensures bot tokens and sensitive values are never leaked in error messages,
 * stack traces, or serialized JSON.
 */
export class TelegramStarsError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'TELEGRAM_STARS_ERROR') {
    // Redact any potential tokens that might be in the message
    super(redactToken(message));
    this.name = 'TelegramStarsError';
    this.code = code;

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Safe serialization for structured logging systems.
   * Guaranteed never to include credentials or tokens.
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }
}

/**
 * Thrown when client configuration is missing or invalid.
 */
export class TelegramConfigurationError extends TelegramStarsError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'TelegramConfigurationError';
  }
}

/**
 * Thrown when method arguments fail client-side validation.
 */
export class TelegramValidationError extends TelegramStarsError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'TelegramValidationError';
    this.field = field;
  }

  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}
