import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { addListing } from '../data/listings';

export function ListTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { events } = useEvents();
  const visibleEvents = events.filter((e) => e.visible !== false);
  const stateEventId = (location.state as { eventId?: string } | null)?.eventId ?? '';

  const [eventId, setEventId] = useState(stateEventId);
  useEffect(() => {
    if (stateEventId) setEventId(stateEventId);
  }, [stateEventId]);
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [pricePerTicket, setPricePerTicket] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.role === 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Sign in as a user to list tickets. Admins cannot sell.</p>
        <Link to="/events" className="text-teal-600 font-semibold hover:underline mt-2 inline-block">Browse events</Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const price = parseFloat(pricePerTicket);
    if (!eventId.trim()) {
      setError('Please select an event.');
      return;
    }
    if (!section.trim()) {
      setError('Section is required.');
      return;
    }
    if (quantity < 1 || quantity > 20) {
      setError('Quantity must be between 1 and 20.');
      return;
    }
    if (Number.isNaN(price) || price < 1) {
      setError('Enter a valid price per ticket.');
      return;
    }
    setSubmitting(true);
    try {
      const listing = addListing({
        eventId,
        sellerId: user.id,
        sellerName: user.name,
        section: section.trim(),
        row: row.trim() || undefined,
        quantity,
        pricePerTicket: price,
      });
      navigate(`/events/${eventId}`, { state: { listed: true } });
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link to="/account/listings" className="text-teal-600 font-medium hover:underline mb-6 inline-block">
        ← Back to My listings
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">List tickets for sale</h1>
      <p className="text-slate-500 text-sm mb-8">
        WeHere holds the buyer’s payment until tickets are delivered. We charge sellers a fee; buyers pay nothing extra.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="list-event" className="block text-sm font-medium text-slate-700 mb-1">Event *</label>
          <select
            id="list-event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
            required
          >
            <option value="">Select an event</option>
            {visibleEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} · {ev.venue.name} · {new Date(ev.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="list-section" className="block text-sm font-medium text-slate-700 mb-1">Section *</label>
            <input
              id="list-section"
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Floor, 101"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
              required
            />
          </div>
          <div>
            <label htmlFor="list-row" className="block text-sm font-medium text-slate-700 mb-1">Row (optional)</label>
            <input
              id="list-row"
              type="text"
              value={row}
              onChange={(e) => setRow(e.target.value)}
              placeholder="e.g. A, 12"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="list-qty" className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input
              id="list-qty"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="list-price" className="block text-sm font-medium text-slate-700 mb-1">Price per ticket ($) *</label>
            <input
              id="list-price"
              type="number"
              min={1}
              step={0.01}
              value={pricePerTicket}
              onChange={(e) => setPricePerTicket(e.target.value)}
              placeholder="e.g. 150"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
              required
            />
          </div>
        </div>
        {pricePerTicket && !Number.isNaN(parseFloat(pricePerTicket)) && (
          <p className="text-slate-600 text-sm">
            Total listing: ${(quantity * parseFloat(pricePerTicket)).toFixed(2)}. Seller fee (10%) applied when sold.
          </p>
        )}
        {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Listing…' : 'List tickets'}
        </button>
      </form>
    </div>
  );
}
