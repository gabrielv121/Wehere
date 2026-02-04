import type { Purchase, AdminOrder } from '../types';
import { apiFetch } from './client.js';

export interface CreateOrderInput {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventImage?: string;
  venue: { name: string; city: string; state: string };
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  listingId: string;
  sellerId: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Purchase> {
  return apiFetch<Purchase>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getMyOrders(): Promise<Purchase[]> {
  const list = await apiFetch<(Purchase & { venue: string })[]>('/api/orders/me');
  return list.map((o) => ({ ...o, venue: typeof o.venue === 'string' ? JSON.parse(o.venue) : o.venue }));
}

export async function getMySales(): Promise<Purchase[]> {
  const list = await apiFetch<(Purchase & { venue: string })[]>('/api/orders/sales');
  return list.map((o) => ({ ...o, venue: typeof o.venue === 'string' ? JSON.parse(o.venue) : o.venue }));
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const list = await apiFetch<(AdminOrder & { venue: string })[]>('/api/orders/admin');
  return list.map((o) => ({ ...o, venue: typeof o.venue === 'string' ? JSON.parse(o.venue) : o.venue }));
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Purchase> {
  const raw = await apiFetch<Purchase & { venue: unknown }>(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  const venue =
    raw.venue && typeof raw.venue === 'object' && 'name' in raw.venue
      ? (raw.venue as { name: string; city: string; state: string })
      : { name: '', city: '', state: '' };
  return { ...raw, venue };
}

export async function setOrderTicketVerified(orderId: string): Promise<Purchase> {
  const raw = await apiFetch<Purchase & { venue: unknown }>(`/api/orders/${orderId}/verify`, {
    method: 'PATCH',
  });
  const venue =
    raw.venue && typeof raw.venue === 'object' && 'name' in raw.venue
      ? (raw.venue as { name: string; city: string; state: string })
      : { name: '', city: '', state: '' };
  return { ...raw, venue };
}

export async function setOrderPayoutReleased(orderId: string): Promise<Purchase> {
  const raw = await apiFetch<Purchase & { venue: unknown }>(`/api/orders/${orderId}/release-payout`, {
    method: 'PATCH',
  });
  const venue =
    raw.venue && typeof raw.venue === 'object' && 'name' in raw.venue
      ? (raw.venue as { name: string; city: string; state: string })
      : { name: '', city: '', state: '' };
  return { ...raw, venue };
}
