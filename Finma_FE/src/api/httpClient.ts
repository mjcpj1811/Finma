import { API_CONFIG } from './config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  token?: string;
  signal?: AbortSignal;
};

const buildUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path;
  }

  return `${API_CONFIG.baseUrl}${path}`;
};

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, token, signal } = options;

  const controller = signal ? null : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => {
        controller.abort();
      }, API_CONFIG.timeoutMs)
    : null;

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller?.signal,
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!response.ok) {
      const message = typeof data.message === 'string' ? data.message : 'Request failed';
      throw new Error(message);
    }

    return data as T;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
