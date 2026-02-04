import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../context/EventsContext';
import type { Category } from '../../types';

const CATEGORIES: Category[] = ['concert', 'sports', 'theater', 'comedy', 'family'];

function toInputDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminEventForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEventById, addEvent, updateEvent } = useEvents();
  const isEdit = Boolean(id);

  const existing = id ? getEventById(id) : null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('concert');
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueState, setVenueState] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featured, setFeatured] = useState(false);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setCategory(existing.category);
      setVenueName(existing.venue.name);
      setVenueCity(existing.venue.city);
      setVenueState(existing.venue.state);
      setDate(toInputDateTime(existing.date));
      setImage(existing.image);
      setMinPrice(String(existing.minPrice));
      setMaxPrice(existing.maxPrice != null ? String(existing.maxPrice) : '');
      setFeatured(existing.featured === true);
      setVisible(existing.visible !== false);
    } else {
      setDate(toInputDateTime(new Date().toISOString()));
    }
  }, [existing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const min = parseInt(minPrice, 10);
    const max = maxPrice.trim() ? parseInt(maxPrice, 10) : undefined;
    if (!title.trim()) {
      setError('Title is required');
      setSaving(false);
      return;
    }
    if (!venueName.trim() || !venueCity.trim() || !venueState.trim()) {
      setError('Venue name, city, and state are required');
      setSaving(false);
      return;
    }
    if (Number.isNaN(min) || min < 0) {
      setError('Min price must be a number ≥ 0');
      setSaving(false);
      return;
    }
    if (max != null && (Number.isNaN(max) || max < min)) {
      setError('Max price must be ≥ min price');
      setSaving(false);
      return;
    }
    const venue = {
      id: existing?.venue.id ?? `v-${crypto.randomUUID()}`,
      name: venueName.trim(),
      city: venueCity.trim(),
      state: venueState.trim(),
    };
    const dateIso = new Date(date).toISOString();
    try {
      if (isEdit && id) {
        await updateEvent(id, {
          title: title.trim(),
          category,
          venue,
          date: dateIso,
          image: image.trim() || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
          minPrice: min,
          maxPrice: max,
          featured,
          visible,
        });
      } else {
        await addEvent({
          title: title.trim(),
          category,
          venue,
          date: dateIso,
          image: image.trim() || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
          minPrice: min,
          maxPrice: max,
          featured,
          visible,
        });
      }
      navigate('/admin/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && !existing) {
    return (
      <div>
        <p className="text-slate-500">Event not found.</p>
        <button type="button" onClick={() => navigate('/admin/events')} className="mt-4 text-teal-600 font-medium">
          ← Back to events
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{isEdit ? 'Edit event' : 'New event'}</h1>
      <p className="text-slate-500 text-sm mb-6">{isEdit ? 'Update event details' : 'Add a new event to the site'}</p>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue name *</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
            <input
              type="text"
              value={venueCity}
              onChange={(e) => setVenueCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
            <input
              type="text"
              value={venueState}
              onChange={(e) => setVenueState(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date & time *</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min price ($) *</label>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max price ($)</label>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-slate-300 text-teal-600"
            />
            <span className="text-sm font-medium text-slate-700">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="rounded border-slate-300 text-teal-600"
            />
            <span className="text-sm font-medium text-slate-700">Visible on site</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
