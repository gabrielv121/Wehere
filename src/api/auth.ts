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

export interface RegisterRes {
  message: string;
  verifyLink?: string;
}

export async function register(email: string, password: string, name: string): Promise<RegisterRes> {
  return apiFetch<RegisterRes>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
    token: undefined,
  });
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

export interface ForgotPasswordRes {
  message: string;
  resetLink?: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordRes> {
  return apiFetch<ForgotPasswordRes>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    token: undefined,
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
    token: undefined,
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export interface ResendVerificationRes {
  message: string;
  verifyLink?: string;
}

export async function resendVerification(email: string): Promise<ResendVerificationRes> {
  return apiFetch<ResendVerificationRes>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
    token: undefined,
  });
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  country?: string | null;
  phone?: string | null;
  paymentMethodOnFile?: boolean;
  createdAt: string;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  return apiFetch<AdminUserRow[]>('/api/auth/users');
}

export interface AdminUserDetailListing {
  id: string;
  eventId: string;
  event: { id: string; title: string; date: string };
  section: string;
  row: string | null;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface AdminUserDetailPurchase {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  totalPrice: number;
  status: string;
  orderDate: string;
  sellerSentAt: string | null;
  ticketVerifiedAt: string | null;
  sellerPayoutReleasedAt: string | null;
}

export interface AdminUserDetailSale {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  totalPrice: number;
  status: string;
  orderDate: string;
  buyerName: string | null;
  buyerEmail: string | null;
  sellerSentAt: string | null;
  sellerPayoutReleasedAt: string | null;
  sellerPayout: number | null;
  stripeSessionId: string | null;
}

export interface AdminUserDetailUser {
  id: string;
  email: string;
  name: string;
  role: string;
  provider: string | null;
  emailVerifiedAt: string | null;
  country: string | null;
  phone: string | null;
  paymentMethodOnFile: boolean | null;
  cardLast4: string | null;
  cardBrand: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUserDetailUser;
  listings: AdminUserDetailListing[];
  purchases: AdminUserDetailPurchase[];
  sales: AdminUserDetailSale[];
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/api/auth/users/${encodeURIComponent(userId)}`);
}
