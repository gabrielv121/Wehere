const EXPLICIT_API_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') ?? '';
const USE_PROXY = import.meta.env.DEV && import.meta.env.VITE_PROXY_API === 'true';

// When no explicit API URL is provided (e.g. Railway hosting both frontend and backend),
// fall back to same-origin so the app uses the real API instead of demo data.
const RUNTIME_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const BASE_URL = EXPLICIT_API_URL || (USE_PROXY ? '' : RUNTIME_ORIGIN);
const TOKEN_KEY = 'wehere_token';

// Enable API mode when we either have an explicit API URL, are using the dev proxy,
// or are running in a browser with a known origin (e.g. Railway same-origin hosting).
export const isApiEnabled = Boolean(EXPLICIT_API_URL || USE_PROXY || RUNTIME_ORIGIN);

/** Base URL for API (and OAuth) requests. Empty when using Vite proxy. */
export function getBaseUrl(): string {
  return BASE_URL;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  error: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token = getToken(), ...init } = options;
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    const msg = e instanceof TypeError && e.message === 'Failed to fetch'
      ? `Cannot reach API at ${BASE_URL}. Is the server running?`
      : e instanceof Error ? e.message : 'Network error';
    throw new Error(msg);
  }
  const data = (await res.json().catch(() => ({}))) as T | ApiError;
  if (!res.ok) {
    const bodyError = (data as ApiError).error;
    const err = typeof bodyError === 'string' ? bodyError : res.statusText ?? 'Request failed';
    if (res.status === 401) {
      clearToken();
      window.dispatchEvent(new CustomEvent('wehere:unauthorized'));
      throw new Error(err || 'Session expired. Please log in again.');
    }
    if (res.status === 404 && path.includes('/api/auth/me')) {
      clearToken();
      window.dispatchEvent(new CustomEvent('wehere:unauthorized'));
      throw new Error('Session invalid. Please log in again.');
    }
    throw new Error(err);
  }
  return data as T;
}
