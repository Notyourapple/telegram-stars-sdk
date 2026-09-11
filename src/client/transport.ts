import type { FetchFunction, Logger } from '../types/config.js';
import type { TelegramResponse } from '../types/telegram.js';
import { redactToken } from './redact.js';
import { TelegramNetworkError, TelegramTimeoutError } from '../errors/network.js';
import { TelegramApiError, TelegramRateLimitError } from '../errors/api.js';

export interface TransportRequestOptions {
  url: string;
  method: string;
  telegramMethod: string;
  body?: unknown;
  token: string;
  timeoutMs: number;
  fetchFn: FetchFunction;
  signal?: AbortSignal;
  logger?: Logger;
}

/**
 * Handles raw HTTP communication with Telegram Bot API with timeout and error mapping.
 */
export async function sendHttpRequest<T>(
  options: TransportRequestOptions
): Promise<T> {
  const {
    url,
    method,
    telegramMethod,
    body,
    token,
    timeoutMs,
    fetchFn,
    signal,
    logger,
  } = options;

  const sanitizedUrl = redactToken(url, token);
  logger?.debug?.(`Sending request to Telegram API`, {
    method,
    telegramMethod,
    url: sanitizedUrl,
  });

  const controller = new AbortController();
  let isTimedOut = false;

  const timer = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, timeoutMs);

  // Link caller signal to our controller
  const callerAbortHandler = () => {
    controller.abort();
  };

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new Error('Request already aborted');
    }
    signal.addEventListener('abort', callerAbortHandler);
  }

  let response: Response;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    response = await fetchFn(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', callerAbortHandler);

    if (isTimedOut) {
      throw new TelegramTimeoutError({
        method: telegramMethod,
        url,
        timeoutMs,
        token,
      });
    }

    if (signal?.aborted) {
      throw err;
    }

    throw new TelegramNetworkError({
      message: err instanceof Error ? err.message : String(err),
      method: telegramMethod,
      url,
      cause: err,
      token,
    });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', callerAbortHandler);
  }

  // Read response body as text first to handle malformed non-JSON payloads
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (readErr) {
    throw new TelegramNetworkError({
      message: `Failed to read response body: ${readErr instanceof Error ? readErr.message : String(readErr)}`,
      method: telegramMethod,
      url,
      cause: readErr,
      token,
    });
  }

  let data: TelegramResponse<T>;
  try {
    data = JSON.parse(responseText) as TelegramResponse<T>;
  } catch (jsonErr) {
    logger?.error?.(`Failed to parse Telegram API response JSON`, {
      status: response.status,
      bodySnippet: responseText.slice(0, 200),
    });

    throw new TelegramNetworkError({
      message: `Invalid JSON response from Telegram API (HTTP ${response.status}): ${responseText.slice(0, 100)}`,
      method: telegramMethod,
      url,
      cause: jsonErr,
      token,
    });
  }

  if (!data.ok || !response.ok) {
    const errorCode = data.error_code ?? response.status;
    const description = data.description ?? `HTTP error ${response.status}`;

    logger?.warn?.(`Telegram API error received`, {
      method: telegramMethod,
      errorCode,
      description: redactToken(description, token),
    });

    if (errorCode === 429) {
      const retryAfter = data.parameters?.retry_after ?? 1;
      throw new TelegramRateLimitError({
        description,
        method: telegramMethod,
        retryAfter,
        parameters: data.parameters,
      });
    }

    throw new TelegramApiError({
      errorCode,
      description,
      method: telegramMethod,
      parameters: data.parameters,
    });
  }

  if (data.result === undefined) {
    throw new TelegramNetworkError({
      message: `Telegram API response missing "result" field`,
      method: telegramMethod,
      url,
      token,
    });
  }

  return data.result;
}
