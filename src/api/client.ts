const BASE_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') ?? '';
const TOKEN_KEY = 'wehere_token';

export const isApiEnabled = Boolean(BASE_URL);

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
  const res = await fetch(url, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T | ApiError;
  if (!res.ok) {
    const err = (data as ApiError).error ?? res.statusText ?? 'Request failed';
    throw new Error(typeof err === 'string' ? err : 'Request failed');
  }
  return data as T;
}
