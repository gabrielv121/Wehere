import { apiFetch, setToken, clearToken } from './client.js';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  country?: string;
  phone?: string;
  paymentMethodOnFile?: boolean;
  cardLast4?: string;
  cardBrand?: string;
}

export interface LoginRes {
  token: string;
  user: ApiUser;
}

export async function login(email: string, password: string): Promise<LoginRes> {
  const res = await apiFetch<LoginRes>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    token: undefined,
  });
  setToken(res.token);
  return res;
}

export async function register(email: string, password: string, name: string): Promise<LoginRes> {
  const res = await apiFetch<LoginRes>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
    token: undefined,
  });
  setToken(res.token);
  return res;
}

export async function getMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/auth/me');
}

export async function updateProfile(name: string, email: string): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ name, email }),
  });
}

export async function updateSellerInfo(data: {
  country: string;
  phone: string;
  paymentMethodOnFile: boolean;
  cardLast4?: string;
  cardBrand?: string;
}): Promise<ApiUser> {
  return apiFetch<ApiUser>('/api/auth/seller-info', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function logoutApi(): void {
  clearToken();
}
