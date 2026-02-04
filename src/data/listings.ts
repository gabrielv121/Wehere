import type { MarketplaceListing, MarketplaceListingStatus } from '../types';

const LISTINGS_KEY = 'wehere_listings';

/** We charge sellers a fee; buyers pay no fee. */
export const SELLER_FEE_PERCENT = 10;
export const BUYER_FEE_PERCENT = 0;

function loadListings(): MarketplaceListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MarketplaceListing[];
  } catch {
    return [];
  }
}

function saveListings(listings: MarketplaceListing[]) {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

/** Get all listings for an event (available first, then by price). */
export function getListingsByEvent(eventId: string): MarketplaceListing[] {
  const list = loadListings().filter(
    (l) => l.eventId === eventId && (l.status === 'available' || l.status === 'pending')
  );
  return list.sort((a, b) => a.pricePerTicket - b.pricePerTicket);
}

export interface MarketPriceStats {
  min: number;
  max: number;
  avg: number;
  suggested: number;
  count: number;
}

/** Get current market price stats for an event from existing listings. Optional eventFallback for when there are no listings. */
export function getMarketPriceStats(
  eventId: string,
  eventFallback?: { minPrice: number; maxPrice?: number }
): MarketPriceStats {
  const listings = getListingsByEvent(eventId);
  if (listings.length === 0) {
    const min = eventFallback?.minPrice ?? 0;
    const max = eventFallback?.maxPrice ?? min;
    const avg = (min + max) / 2;
    const suggested = Math.max(1, Math.round(min * 100) / 100);
    return { min, max, avg, suggested, count: 0 };
  }
  const prices = listings.map((l) => l.pricePerTicket);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  // Suggested: slightly below current lowest to be competitive (or avg if only one listing)
  const suggested =
    listings.length === 1
      ? Math.max(1, Math.round(avg * 100) / 100)
      : Math.max(1, Math.round(min * 0.97 * 100) / 100);
  return { min, max, avg, suggested, count: listings.length };
}

/** Get all listings created by a seller. */
export function getListingsBySeller(sellerId: string): MarketplaceListing[] {
  const list = loadListings().filter((l) => l.sellerId === sellerId);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Get a single listing by id. */
export function getListingById(listingId: string): MarketplaceListing | null {
  return loadListings().find((l) => l.id === listingId) ?? null;
}

export interface AddListingInput {
  eventId: string;
  sellerId: string;
  sellerName: string;
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  /** When true, price is from market and may be adjusted (dynamic pricing). */
  dynamicPricing?: boolean;
}

export function addListing(input: AddListingInput): MarketplaceListing {
  const totalPrice = input.quantity * input.pricePerTicket;
  const listing: MarketplaceListing = {
    id: crypto.randomUUID(),
    eventId: input.eventId,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    section: input.section,
    row: input.row,
    quantity: input.quantity,
    pricePerTicket: input.pricePerTicket,
    totalPrice,
    status: 'available',
    createdAt: new Date().toISOString(),
    dynamicPricing: input.dynamicPricing ?? false,
  };
  const list = loadListings();
  list.push(listing);
  saveListings(list);
  return listing;
}

export function updateListingStatus(listingId: string, status: MarketplaceListingStatus): boolean {
  const list = loadListings();
  const idx = list.findIndex((l) => l.id === listingId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], status };
  saveListings(list);
  return true;
}

/** Convert marketplace listing to TicketListing shape for display/checkout. */
export function listingToTicketListing(listing: MarketplaceListing): import('../types').TicketListing {
  return {
    id: listing.id,
    eventId: listing.eventId,
    section: listing.section,
    row: listing.row,
    quantity: listing.quantity,
    pricePerTicket: listing.pricePerTicket,
    totalPrice: listing.totalPrice,
    seller: listing.sellerName,
    listingId: listing.id,
    sellerId: listing.sellerId,
  };
}
