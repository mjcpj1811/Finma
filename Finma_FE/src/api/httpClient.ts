import { API_CONFIG } from './config';
import { getAccessToken } from '../utils/authTokenStorage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  token?: string;
  signal?: AbortSignal;
  omitAuth?: boolean;
  timeoutMs?: number;
};

const buildUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path;
  }

  return `${API_CONFIG.baseUrl}${path}`;
};

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, token, signal, omitAuth = false, timeoutMs } = options;
  const authToken = omitAuth ? undefined : token ?? (await getAccessToken()) ?? undefined;

  const controller = signal ? null : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeoutMs ?? API_CONFIG.timeoutMs)
    : null;

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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


export type ApiResponse<T> = { code: number; message?: string; result: T; };
export const requestApi = async <T>(path: string, options?: RequestOptions): Promise<T> => {
  const res = await request<ApiResponse<T>>(path, options);
  return res.result;
};
