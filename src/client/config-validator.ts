import type {
  TelegramStarsConfig,
  ResolvedTelegramStarsConfig,
} from '../types/config.js';
import { TelegramConfigurationError } from '../errors/base.js';

const DEFAULT_BASE_URL = 'https://api.telegram.org';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

/**
 * Validates user configuration synchronously without performing network calls.
 */
export function validateConfig(
  config: TelegramStarsConfig
): ResolvedTelegramStarsConfig {
  if (!config) {
    throw new TelegramConfigurationError('Configuration object must be provided.');
  }

  // 1. Validate Token
  if (typeof config.token !== 'string' || config.token.trim().length === 0) {
    throw new TelegramConfigurationError(
      'Telegram Bot token must be a non-empty string.'
    );
  }

  // Basic format sanity check for bot tokens (e.g. 123456:ABC...)
  const trimmedToken = config.token.trim();
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(trimmedToken)) {
    throw new TelegramConfigurationError(
      'Malformed Telegram Bot token. Expected format: "<bot_id>:<token_secret>".'
    );
  }

  // 2. Validate Base URL
  let baseUrl = config.apiBaseUrl ?? DEFAULT_BASE_URL;
  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    throw new TelegramConfigurationError(
      'Telegram API base URL must be a non-empty string.'
    );
  }
  baseUrl = baseUrl.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new TelegramConfigurationError(
        `Invalid protocol in apiBaseUrl: "${parsed.protocol}". Must be "https:" or "http:".`
      );
    }
  } catch (err) {
    if (err instanceof TelegramConfigurationError) throw err;
    throw new TelegramConfigurationError(
      `Malformed apiBaseUrl: "${baseUrl}". Must be a valid URL.`
    );
  }

  // 3. Validate Timeout
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (
    typeof timeoutMs !== 'number' ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new TelegramConfigurationError(
      `Invalid timeoutMs: "${timeoutMs}". Must be a positive finite number.`
    );
  }

  // 4. Validate Retries
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  if (
    typeof maxRetries !== 'number' ||
    !Number.isInteger(maxRetries) ||
    maxRetries < 0 ||
    maxRetries > 10
  ) {
    throw new TelegramConfigurationError(
      `Invalid maxRetries: "${maxRetries}". Must be an integer between 0 and 10.`
    );
  }

  const retryDelayMs = config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  if (
    typeof retryDelayMs !== 'number' ||
    !Number.isFinite(retryDelayMs) ||
    retryDelayMs <= 0
  ) {
    throw new TelegramConfigurationError(
      `Invalid retryDelayMs: "${retryDelayMs}". Must be a positive finite number.`
    );
  }

  // 5. Validate Fetch
  const fetchFn = config.fetch ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    throw new TelegramConfigurationError(
      'A valid fetch function must be provided or available globally.'
    );
  }

  return {
    token: trimmedToken,
    apiBaseUrl: baseUrl,
    timeoutMs,
    maxRetries,
    retryDelayMs,
    fetch: fetchFn,
    logger: config.logger,
  };
}
