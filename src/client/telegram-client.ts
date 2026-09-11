import type {
  TelegramStarsConfig,
  ResolvedTelegramStarsConfig,
  Logger,
} from '../types/config.js';
import { validateConfig } from './config-validator.js';
import { sendHttpRequest } from './transport.js';
import { executeWithRetry } from './retry.js';
import { redactToken } from './redact.js';

export interface CallMethodOptions {
  signal?: AbortSignal;
  isSafeMethod?: boolean;
  timeoutMs?: number;
}

/**
 * Low-level typed Telegram Bot API client.
 * Handles HTTPS request construction, token security, and conservative retry policies.
 */
export class TelegramApiClient {
  private readonly config: ResolvedTelegramStarsConfig;

  constructor(config: TelegramStarsConfig) {
    this.config = validateConfig(config);
  }

  /**
   * Returns the configured API base URL.
   */
  public get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  /**
   * Returns the configured default request timeout in ms.
   */
  public get timeoutMs(): number {
    return this.config.timeoutMs;
  }

  /**
   * Returns the configured max retries for safe operations.
   */
  public get maxRetries(): number {
    return this.config.maxRetries;
  }

  /**
   * Returns the optional configured logger.
   */
  public get logger(): Logger | undefined {
    return this.config.logger;
  }

  /**
   * Invokes an official Telegram Bot API method.
   *
   * @param method - The official Telegram method name (e.g. "sendInvoice", "getMyStarBalance")
   * @param params - Method parameters to serialize as JSON
   * @param options - Execution options (signal, retry safety flag, timeout override)
   */
  public async callMethod<TResult, TParams = Record<string, unknown>>(
    method: string,
    params?: TParams,
    options?: CallMethodOptions
  ): Promise<TResult> {
    const url = `${this.config.apiBaseUrl}/bot${this.config.token}/${method}`;
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs;
    const isSafeMethod = options?.isSafeMethod ?? false;

    return executeWithRetry(
      () =>
        sendHttpRequest<TResult>({
          url,
          method: 'POST',
          telegramMethod: method,
          body: params,
          token: this.config.token,
          timeoutMs,
          fetchFn: this.config.fetch,
          signal: options?.signal,
          logger: this.config.logger,
        }),
      {
        maxRetries: this.config.maxRetries,
        baseDelayMs: this.config.retryDelayMs,
        isSafeMethod,
        signal: options?.signal,
        onRetry: (attempt, delayMs, error) => {
          this.config.logger?.warn?.(
            `Retrying ${method} (attempt ${attempt}/${this.config.maxRetries}) in ${delayMs}ms`,
            {
              method,
              attempt,
              delayMs,
              error: error instanceof Error ? redactToken(error.message, this.config.token) : error,
            }
          );
        },
      }
    );
  }

  /**
   * Node.js custom inspection hook to ensure bot token is NEVER printed during console.log().
   */
  [Symbol.for('nodejs.util.inspect.custom')](): Record<string, unknown> {
    return {
      apiBaseUrl: this.config.apiBaseUrl,
      timeoutMs: this.config.timeoutMs,
      maxRetries: this.config.maxRetries,
      token: '[REDACTED]',
    };
  }
}
