import type { Event } from '../types';
import { apiFetch } from './client.js';

export interface TicketmasterEvent {
  id: string;
  ticketmasterId: string;
  title: string;
  category: string;
  venue: { id: string; name: string; city: string; state: string };
  date: string;
  image: string;
  minPrice: number;
  maxPrice?: number;
  externalUrl?: string;
}

export interface TicketmasterSearchResult {
  events: TicketmasterEvent[];
  total: number;
}

/** Search Ticketmaster events. Returns 503 if TICKETMASTER_API_KEY not configured. */
export async function searchTicketmasterEvents(params?: {
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<TicketmasterSearchResult> {
  const sp = new URLSearchParams();
  if (params?.keyword) sp.set('keyword', params.keyword);
  if (params?.page != null) sp.set('page', String(params.page));
  if (params?.size != null) sp.set('size', String(params.size));
  const q = sp.toString();
  return apiFetch<TicketmasterSearchResult>(`/api/ticketmaster/events${q ? `?${q}` : ''}`);
}

/** Create or update our Event from Ticketmaster data; returns our Event. */
export async function createEventFromTicketmaster(tm: TicketmasterEvent): Promise<Event> {
  return apiFetch<Event>('/api/events/from-ticketmaster', {
    method: 'POST',
    body: JSON.stringify({
      id: tm.id,
      title: tm.title,
      category: tm.category,
      venue: tm.venue,
      date: tm.date,
      image: tm.image,
      externalUrl: tm.externalUrl,
    }),
  });
}
