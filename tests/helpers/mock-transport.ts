import type { FetchFunction } from '../../src/types/config.js';

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface MockResponseItem {
  status?: number;
  body: unknown;
  delayMs?: number;
}

/**
 * Creates a mock fetch function that records incoming calls and dequeues responses.
 */
export function createQueueMockFetch(responses: MockResponseItem[]): {
  fetchFn: FetchFunction;
  requests: RecordedRequest[];
} {
  const requests: RecordedRequest[] = [];
  const queue = [...responses];

  const fetchFn: FetchFunction = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? 'GET';

    let body: unknown = undefined;
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => {
          headers[k] = v;
        });
      } else if (Array.isArray(init.headers)) {
        for (const [k, v] of init.headers) {
          headers[k] = v;
        }
      } else {
        Object.assign(headers, init.headers);
      }
    }

    requests.push({ url, method, headers, body });

    const nextResponse = queue.shift();
    if (!nextResponse) {
      throw new Error(`Mock fetch queue exhausted. Unexpected call to ${method} ${url}`);
    }

    if (init?.signal?.aborted) {
      const err = new Error('This operation was aborted');
      err.name = 'AbortError';
      throw err;
    }

    if (nextResponse.delayMs && nextResponse.delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, nextResponse.delayMs);
        if (init?.signal) {
          init.signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              const err = new Error('This operation was aborted');
              err.name = 'AbortError';
              reject(err);
            },
            { once: true }
          );
        }
      });
    }

    const status = nextResponse.status ?? 200;
    const bodyStr = typeof nextResponse.body === 'string'
      ? nextResponse.body
      : JSON.stringify(nextResponse.body);

    return new Response(bodyStr, {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  return { fetchFn, requests };
}
