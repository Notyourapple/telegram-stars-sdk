import { TelegramApiError, TelegramRateLimitError } from '../errors/api.js';
import { TelegramNetworkError } from '../errors/network.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  isSafeMethod: boolean;
  signal?: AbortSignal;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
}

const DEFAULT_MAX_DELAY_MS = 15000;

/**
 * Calculates exponential backoff with full jitter.
 */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number = DEFAULT_MAX_DELAY_MS
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const ceiling = Math.min(exponential, maxDelayMs);
  // Full jitter: random between 0 and ceiling
  return Math.floor(Math.random() * ceiling);
}

/**
 * Determines whether an error is retryable.
 * Crucial rule: mutations must NEVER be retried.
 */
export function isRetryableError(error: unknown, isSafeMethod: boolean): boolean {
  if (!isSafeMethod) {
    return false;
  }

  // 429 Rate limits are retryable for safe methods
  if (error instanceof TelegramRateLimitError) {
    return true;
  }

  // Transient 5xx server errors
  if (error instanceof TelegramApiError) {
    return error.errorCode >= 500 && error.errorCode <= 599;
  }

  // Transient network connection drops
  if (error instanceof TelegramNetworkError) {
    return true;
  }

  return false;
}

/**
 * Executes an operation with conservative retries for safe idempotent methods.
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      if (options.signal?.aborted) {
        throw new Error('Operation aborted');
      }
      return await operation();
    } catch (error) {
      if (options.signal?.aborted) {
        throw error;
      }

      // Check if retrying is allowed for this method and error
      if (
        attempt >= options.maxRetries ||
        !isRetryableError(error, options.isSafeMethod)
      ) {
        throw error;
      }

      let delayMs: number;

      // If Telegram sent a retry_after recommendation, honor it
      if (error instanceof TelegramRateLimitError && error.retryAfter > 0) {
        delayMs = Math.min(
          error.retryAfter * 1000,
          options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
        );
      } else if (
        error instanceof TelegramApiError &&
        error.retryAfter &&
        error.retryAfter > 0
      ) {
        delayMs = Math.min(
          error.retryAfter * 1000,
          options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
        );
      } else {
        delayMs = calculateBackoff(
          attempt,
          options.baseDelayMs,
          options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
        );
      }

      attempt++;
      options.onRetry?.(attempt, delayMs, error);

      // Sleep with abort signal support
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          options.signal?.removeEventListener('abort', onAbort);
          resolve();
        }, delayMs);

        const onAbort = () => {
          clearTimeout(timer);
          options.signal?.removeEventListener('abort', onAbort);
          reject(new Error('Operation aborted during retry backoff'));
        };

        options.signal?.addEventListener('abort', onAbort);
      });
    }
  }
}
