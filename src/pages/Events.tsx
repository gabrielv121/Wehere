import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { EventCard } from '../components/EventCard';
import { SearchBar } from '../components/SearchBar';
import { useEvents } from '../context/EventsContext';
import type { Category } from '../types';

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'concert', label: 'Concerts' },
  { value: 'sports', label: 'Sports' },
  { value: 'theater', label: 'Theater' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'family', label: 'Family' },
];

/** Date presets: [label, dateFrom (YYYY-MM-DD), dateTo] */
const DATE_PRESETS: { value: string; label: string; from: string; to: string }[] = [
  { value: '', label: 'Any date', from: '', to: '' },
  { value: '2025-02', label: 'Feb 2025', from: '2025-02-01', to: '2025-02-28' },
  { value: '2025-03', label: 'Mar 2025', from: '2025-03-01', to: '2025-03-31' },
  { value: '2025-04', label: 'Apr 2025', from: '2025-04-01', to: '2025-04-30' },
  { value: '2025-05', label: 'May 2025', from: '2025-05-01', to: '2025-05-31' },
  { value: '2025-06', label: 'Jun 2025', from: '2025-06-01', to: '2025-06-30' },
  { value: '2025-04-06', label: 'Apr–Jun 2025', from: '2025-04-01', to: '2025-06-30' },
  { value: '2026', label: '2026', from: '2026-01-01', to: '2026-12-31' },
];

function isEventInDateRange(eventDate: string, from: string, to: string): boolean {
  const d = new Date(eventDate);
  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (d < start) return false;
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
}

export function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, getUniqueCities } = useEvents();
  const q = searchParams.get('q') ?? '';
  const category = (searchParams.get('category') ?? '') as Category | '';
  const city = searchParams.get('city') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  const cities = useMemo(() => getUniqueCities(), []);

  const filtered = useMemo(() => {
    let list = events.filter((e) => e.visible !== false);
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(lower) ||
          e.venue.name.toLowerCase().includes(lower) ||
          e.venue.city.toLowerCase().includes(lower)
      );
    }
    if (category) list = list.filter((e) => e.category === category);
    if (city) list = list.filter((e) => e.venue.city === city);
    if (dateFrom || dateTo) list = list.filter((e) => isEventInDateRange(e.date, dateFrom, dateTo));
    return list;
  }, [events, q, category, city, dateFrom, dateTo]);

  const setCategory = (value: Category | '') => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value);
    else next.delete('category');
    setSearchParams(next);
  };

  const setCity = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('city', value);
    else next.delete('city');
    setSearchParams(next);
  };

  const setDatePreset = (preset: (typeof DATE_PRESETS)[number]) => {
    const next = new URLSearchParams(searchParams);
    if (preset.from) next.set('dateFrom', preset.from);
    else next.delete('dateFrom');
    if (preset.to) next.set('dateTo', preset.to);
    else next.delete('dateTo');
    setSearchParams(next);
  };

  const activeDatePreset = useMemo(() => {
    if (!dateFrom && !dateTo) return '';
    return DATE_PRESETS.find((p) => p.from === dateFrom && p.to === dateTo)?.value ?? 'custom';
  }, [dateFrom, dateTo]);

  const activeFilterCount = [category, city, dateFrom || dateTo].filter(Boolean).length;
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Events</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar key={q} defaultValue={q} />
      </div>

      {/* Filters: retractable panel */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 mb-8 overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-100/80 transition-colors"
          aria-expanded={filtersOpen}
        >
          <span className="text-sm font-medium text-slate-700">
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 text-teal-600 font-semibold">({activeFilterCount} active)</span>
            )}
          </span>
          <span
            className={`shrink-0 text-slate-500 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {filtersOpen && (
        <div className="border-t border-slate-200 p-4 space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Category</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value || 'all'}
                  onClick={() => setCategory(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === value
                      ? 'bg-teal-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">City</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCity('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !city ? 'bg-teal-500 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300'
                }`}
              >
                All cities
              </button>
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    city === c ? 'bg-teal-500 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Date</span>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => {
                const isActive = preset.value ? activeDatePreset === preset.value : !dateFrom && !dateTo;
                return (
                  <button
                    key={preset.value || 'any'}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-teal-500 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(category || city || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('category');
                next.delete('city');
                next.delete('dateFrom');
                next.delete('dateTo');
                setSearchParams(next);
              }}
              className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Clear all filters
            </button>
          )}
        </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-center py-12">
          No events match your filters. Try changing category, city, or date.
        </p>
      ) : (
        <>
          <p className="text-slate-500 text-sm mb-4">{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
