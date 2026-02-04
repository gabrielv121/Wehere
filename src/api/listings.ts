import type { MarketplaceListing } from '../types';
import { apiFetch } from './client.js';

export async function getListingsByEvent(eventId: string): Promise<MarketplaceListing[]> {
  return apiFetch<MarketplaceListing[]>(`/api/listings/event/${eventId}`);
}

export async function getListingsBySeller(sellerId: string): Promise<MarketplaceListing[]> {
  return apiFetch<MarketplaceListing[]>(`/api/listings/seller/${sellerId}`);
}

export async function getListingById(id: string): Promise<MarketplaceListing | null> {
  try {
    return await apiFetch<MarketplaceListing>(`/api/listings/${id}`);
  } catch {
    return null;
  }
}

export interface AddListingInput {
  eventId: string;
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  dynamicPricing?: boolean;
}

export async function addListing(input: AddListingInput): Promise<MarketplaceListing> {
  return apiFetch<MarketplaceListing>('/api/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateListingStatus(
  listingId: string,
  status: 'available' | 'pending' | 'sold'
): Promise<MarketplaceListing> {
  return apiFetch<MarketplaceListing>(`/api/listings/${listingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
