import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { Event } from '../types';
import { DEFAULT_EVENTS } from '../data/events';
import { isApiEnabled } from '../api/client';
import * as eventsApi from '../api/events';

const STORAGE_KEY = 'wehere_events';

interface EventsState {
  events: Event[];
}

interface EventsContextValue extends EventsState {
  getEventById: (id: string) => Event | undefined;
  getUniqueCities: () => string[];
  getUniqueStates: () => string[];
  addEvent: (event: Omit<Event, 'id'>) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<Omit<Event, 'id'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setFeatured: (id: string, featured: boolean) => Promise<void>;
  setVisible: (id: string, visible: boolean) => Promise<void>;
  eventsLoading: boolean;
}

const EventsContext = createContext<EventsContextValue | null>(null);

function loadStoredEvents(): Event[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Event[];
    return parsed.map((e) => ({ ...e, visible: e.visible !== false, featured: e.featured === true }));
  } catch {
    return [];
  }
}

function saveEvents(events: Event[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(() => {
    if (isApiEnabled) return [];
    const stored = loadStoredEvents();
    if (stored.length > 0) return stored;
    saveEvents(DEFAULT_EVENTS);
    return DEFAULT_EVENTS;
  });
  const [eventsLoading, setEventsLoading] = useState(isApiEnabled);

  useEffect(() => {
    if (isApiEnabled) {
      eventsApi
        .getEvents()
        .then(setEvents)
        .catch(() => setEvents([]))
        .finally(() => setEventsLoading(false));
    }
  }, []);
  useEffect(() => {
    if (!isApiEnabled) saveEvents(events);
  }, [events]);

  const getEventById = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events]
  );

  const getUniqueCities = useCallback(() => {
    const set = new Set(events.map((e) => e.venue.city));
    return Array.from(set).sort();
  }, [events]);

  const getUniqueStates = useCallback(() => {
    const set = new Set(events.map((e) => e.venue.state));
    return Array.from(set).sort();
  }, [events]);

  const addEvent = useCallback(async (event: Omit<Event, 'id'>): Promise<Event> => {
    if (isApiEnabled) {
      const created = await eventsApi.createEvent(event);
      setEvents((prev) => [...prev, created]);
      return created;
    }
    const id = crypto.randomUUID();
    const venueId = event.venue.id || `v-${id}`;
    const newEvent: Event = {
      ...event,
      id,
      venue: { ...event.venue, id: venueId },
      visible: event.visible !== false,
      featured: event.featured === true,
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<Event, 'id'>>) => {
    if (isApiEnabled) {
      await eventsApi.updateEvent(id, updates);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    if (isApiEnabled) await eventsApi.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setFeatured = useCallback(async (id: string, featured: boolean) => {
    if (isApiEnabled) await eventsApi.updateEvent(id, { featured });
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, featured } : e)));
  }, []);

  const setVisible = useCallback(async (id: string, visible: boolean) => {
    if (isApiEnabled) await eventsApi.updateEvent(id, { visible });
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, visible } : e)));
  }, []);

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      getEventById,
      getUniqueCities,
      getUniqueStates,
      addEvent,
      updateEvent,
      deleteEvent,
      setFeatured,
      setVisible,
      eventsLoading,
    }),
    [events, getEventById, getUniqueCities, getUniqueStates, addEvent, updateEvent, deleteEvent, setFeatured, setVisible, eventsLoading]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
