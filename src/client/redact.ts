/**
 * Token redaction and URI sanitization utilities to prevent credential leakage.
 */

const REDACTED = '[REDACTED]';

/**
 * Sanitizes any string (such as an endpoint URL, log message, or error text)
 * by replacing occurrences of the bot token with "[REDACTED]".
 * Also matches standard Telegram bot URL patterns: `/bot<token>/` -> `/bot[REDACTED]/`.
 */
export function redactToken(text: string, token?: string): string {
  if (!text) return '';

  let sanitized = text;

  // If a specific token is provided, replace all instances of it
  if (token && token.trim().length > 0) {
    sanitized = sanitized.split(token).join(REDACTED);
  }

  // Also replace any bot token pattern in URLs: /bot(\d+:[A-Za-z0-9_-]+)/
  sanitized = sanitized.replace(/\/bot\d+:[A-Za-z0-9_-]+/gi, `/bot${REDACTED}`);

  return sanitized;
}

/**
 * Strips secrets from headers or request objects before logging.
 */
export function sanitizeHeaders(
  headers?: HeadersInit
): Record<string, string> {
  if (!headers) return {};

  const clean: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      if (
        key.toLowerCase() === 'authorization' ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')
      ) {
        clean[key] = REDACTED;
      } else {
        clean[key] = value;
      }
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      if (
        key.toLowerCase() === 'authorization' ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')
      ) {
        clean[key] = REDACTED;
      } else {
        clean[key] = value;
      }
    }
  } else {
    for (const [key, value] of Object.entries(headers)) {
      if (
        key.toLowerCase() === 'authorization' ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')
      ) {
        clean[key] = REDACTED;
      } else {
        clean[key] = String(value);
      }
    }
  }

  return clean;
}
