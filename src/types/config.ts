/**
 * Configuration options for TelegramStarsClient
 */

/**
 * Standard fetch function type matching the global fetch signature.
 */
export type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/**
 * Optional logger interface for debugging and auditing.
 * Implementations MUST NOT log sensitive credentials or full bot tokens.
 */
export interface Logger {
  debug?(message: string, metadata?: Record<string, unknown>): void;
  info?(message: string, metadata?: Record<string, unknown>): void;
  warn?(message: string, metadata?: Record<string, unknown>): void;
  error?(message: string, metadata?: Record<string, unknown>): void;
}

/**
 * User-supplied configuration for the Telegram Stars SDK.
 */
export interface TelegramStarsConfig {
  /**
   * Telegram Bot API token obtained from @BotFather.
   * Required. Must not be empty.
   */
  token: string;

  /**
   * Base URL of the Telegram Bot API server.
   * Defaults to "https://api.telegram.org".
   */
  apiBaseUrl?: string;

  /**
   * Request timeout in milliseconds.
   * Defaults to 30000 (30 seconds). Must be greater than 0.
   */
  timeoutMs?: number;

  /**
   * Maximum number of automatic retries for safe, idempotent read operations.
   * Defaults to 3. Must be between 0 and 10.
   * Note: Payment mutations are NEVER retried automatically.
   */
  maxRetries?: number;

  /**
   * Initial backoff delay in milliseconds for retrying safe read operations.
   * Defaults to 500ms. Must be greater than 0.
   */
  retryDelayMs?: number;

  /**
   * Custom fetch implementation (useful for tests, proxies, or specific environments).
   * Defaults to globalThis.fetch.
   */
  fetch?: FetchFunction;

  /**
   * Optional logger instance.
   */
  logger?: Logger;
}

/**
 * Fully resolved and validated configuration.
 */
export interface ResolvedTelegramStarsConfig {
  token: string;
  apiBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  fetch: FetchFunction;
  logger?: Logger;
}
