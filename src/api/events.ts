import type { Event } from '../types';
import { apiFetch } from './client.js';

export async function getEvents(params?: { category?: string; city?: string; hasListings?: boolean }): Promise<Event[]> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set('category', params.category);
  if (params?.city) sp.set('city', params.city);
  if (params?.hasListings === true) sp.set('hasListings', 'true');
  const q = sp.toString();
  const list = await apiFetch<Event[]>(`/api/events${q ? `?${q}` : ''}`);
  return list.map((e) => ({ ...e, visible: e.visible !== false, featured: e.featured === true }));
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const e = await apiFetch<Event>(`/api/events/${id}`);
    return { ...e, visible: e.visible !== false, featured: e.featured === true };
  } catch {
    return null;
  }
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event> {
  return apiFetch<Event>('/api/events', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
}
