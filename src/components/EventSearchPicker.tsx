import { useState, useEffect, useCallback, useRef } from 'react';
import type { Event } from '../types';
import { searchTicketmasterEvents, createEventFromTicketmaster, type TicketmasterEvent } from '../api/ticketmaster';
import { isApiEnabled } from '../api/client';

interface EventSearchPickerProps {
  value: string;
  onChange: (eventId: string, event?: Event) => void;
  fallbackEvents: Event[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

type DisplayEvent = Event | TicketmasterEvent;

function formatEventLabel(ev: { title: string; venue?: { name?: string }; date: string }) {
  const venue = ev.venue?.name ?? 'TBA';
  const d = new Date(ev.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${ev.title} · ${venue} · ${dateStr}`;
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function EventOptionCard({ ev, onClick, selected }: { ev: DisplayEvent; onClick: () => void; selected?: boolean }) {
  const img = 'image' in ev ? ev.image : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'border-teal-500 bg-teal-50'
          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
      }`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-200">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{ev.title}</p>
        <p className="truncate text-sm text-slate-500">
          {ev.venue?.name ?? 'TBA'} · {formatEventDate(ev.date)}
        </p>
      </div>
      {selected && (
        <svg className="h-5 w-5 shrink-0 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

export function EventSearchPicker({
  value,
  onChange,
  fallbackEvents,
  label = 'Event',
  placeholder = 'Search events by name…',
  disabled = false,
  id = 'event-search',
}: EventSearchPickerProps) {
  const [mode, setMode] = useState<'loading' | 'tm' | 'fallback'>('loading');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Event | TicketmasterEvent)[]>([]);
  const [savedFromTm, setSavedFromTm] = useState<Map<string, Event>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchTm = useCallback(async (keyword: string) => {
    if (!isApiEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const { events } = await searchTicketmasterEvents({ keyword: keyword || undefined, size: 30 });
      setResults(Array.isArray(events) ? events : []);
      setMode('tm');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      if (msg.includes('503') || msg.includes('not configured')) {
        setMode('fallback');
        setResults([]);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isApiEnabled) {
      setMode('fallback');
      setResults([]);
      setLoading(false);
      return;
    }
    searchTm('');
  }, [searchTm]);

  useEffect(() => {
    if (mode !== 'tm') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTm(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode, searchTm]);

  const handleSelectTm = async (ev: TicketmasterEvent) => {
    setLoading(true);
    setError(null);
    try {
      const our = await createEventFromTicketmaster(ev);
      setSavedFromTm((prev) => new Map(prev).set(our.id, our));
      onChange(our.id, our);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFallback = (ev: Event) => {
    onChange(ev.id, ev);
  };

  const displayEvents = mode === 'fallback' ? fallbackEvents : [...results, ...Array.from(savedFromTm.values())];
  const selectedEvent =
    displayEvents.find((e) => e.id === value) ??
    savedFromTm.get(value ?? '') ??
    (mode === 'fallback' ? fallbackEvents.find((e) => e.id === value) : undefined);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label} *
      </label>

      {mode === 'tm' && (
        <div ref={dropdownRef} className="relative">
          <input type="hidden" name={id} value={value} required />
          <div className="relative">
            <input
              type="text"
              role="combobox"
              id={id}
              value={selectedEvent && !dropdownOpen ? formatEventLabel(selectedEvent) : query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!dropdownOpen) setDropdownOpen(true);
                if (selectedEvent) {
                  onChange('');
                  setSavedFromTm((prev) => {
                    const next = new Map(prev);
                    next.delete(value);
                    return next;
                  });
                }
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={!!selectedEvent && !dropdownOpen}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pl-11 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50 disabled:opacity-70 read-only:cursor-pointer read-only:bg-slate-50"
              autoComplete="off"
            />
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => !disabled && setDropdownOpen((o) => !o)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Toggle dropdown"
            >
              <svg
                className={`h-5 w-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {loading && <p className="mt-1 text-sm text-slate-500">Loading…</p>}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="space-y-2">
                    {(results.length > 0 || savedFromTm.size > 0) ? (
                      <>
                        {results.map((ev) => (
                          <EventOptionCard
                            key={ev.id}
                            ev={ev}
                            selected={value === ev.id}
                            onClick={() => {
                              setDropdownOpen(false);
                              setQuery('');
                              if ('ticketmasterId' in ev) handleSelectTm(ev);
                              else onChange(ev.id, ev);
                            }}
                          />
                        ))}
                        {Array.from(savedFromTm.values()).map((ev) => (
                          <EventOptionCard
                            key={ev.id}
                            ev={ev}
                            selected={value === ev.id}
                            onClick={() => {
                              setDropdownOpen(false);
                              setQuery('');
                              onChange(ev.id, ev);
                            }}
                          />
                        ))}
                      </>
                    ) : (
                      <p className="py-4 text-center text-sm text-slate-500">
                        {query ? 'No events found. Try a different search.' : 'Type to search events by name'}
                      </p>
                    )}
                  </div>
                </div>
          )}
        </div>
      )}

      {mode === 'fallback' && (
        <div ref={dropdownRef} className="relative">
          <input type="hidden" name={id} value={value} required />
          <button
            type="button"
            id={id}
            onClick={() => !disabled && setDropdownOpen((o) => !o)}
            disabled={disabled}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-teal-300 hover:shadow-md focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50 disabled:opacity-70"
          >
            {selectedEvent ? (
              <>
                {selectedEvent.image ? (
                  <img
                    src={selectedEvent.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{selectedEvent.title}</p>
                  <p className="truncate text-sm text-slate-500">
                    {selectedEvent.venue?.name ?? 'TBA'} · {formatEventDate(selectedEvent.date)}
                  </p>
                </div>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="flex-1 text-slate-500">Select an event</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="space-y-2">
                {fallbackEvents.map((ev) => (
                  <EventOptionCard
                    key={ev.id}
                    ev={ev}
                    selected={value === ev.id}
                    onClick={() => {
                      handleSelectFallback(ev);
                      setDropdownOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'loading' && <p className="text-sm text-slate-500">Loading events…</p>}

      {mode === 'fallback' && isApiEnabled && (
        <p className="text-xs text-slate-500">Ticketmaster API not configured. Showing local events.</p>
      )}

      {selectedEvent && (
        <p className="text-sm text-slate-600">
          Selected: <strong>{formatEventLabel(selectedEvent)}</strong>
        </p>
      )}
    </div>
  );
}
