import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { getMarketPriceStats } from '../data/listings';

const LIST_DRAFT_KEY = 'wehere_listing_draft';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function SellTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { events, getEventById } = useEvents();
  const visibleEvents = events.filter((e) => e.visible !== false);

  const state = location.state as { eventId?: string } | null;
  const initialEventId = state?.eventId ?? '';

  const [eventId, setEventId] = useState(initialEventId);
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [pricePerTicket, setPricePerTicket] = useState('');
  const [useDynamicPricing, setUseDynamicPricing] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const event = eventId ? getEventById(eventId) : undefined;
  const marketStats = event ? getMarketPriceStats(eventId, { minPrice: event.minPrice, maxPrice: event.maxPrice }) : null;

  useEffect(() => {
    if (initialEventId) {
      setEventId(initialEventId);
    }
  }, [initialEventId]);

  const handleSubmit: React.FormEventHandler = async (e) => {
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
    const finalPrice = useDynamicPricing && marketStats ? marketStats.suggested : price;
    if (Number.isNaN(finalPrice) || finalPrice < 1) {
      setError(useDynamicPricing ? 'No market data to set price. Enter a price manually.' : 'Enter a valid price per ticket.');
      return;
    }

    // Save draft to session storage so we can restore it on the account list-tickets page
    const draft = {
      eventId,
      section: section.trim(),
      row: row || undefined,
      quantity,
      pricePerTicket: finalPrice,
      useDynamicPricing,
    };
    try {
      sessionStorage.setItem(LIST_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage errors, user will just have to re-enter if it fails
    }

    setSubmitting(true);
    // If already logged in (and not admin), go straight to account list-tickets (step 2 will pick up draft)
    if (user && user.role !== 'admin') {
      navigate('/account/list-tickets', { state: { eventId } });
    } else {
      // Not logged in: send to login, then redirect to account listing flow
      const params = new URLSearchParams({ redirect: '/account/list-tickets' });
      navigate(`/login?${params.toString()}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link to="/events" className="text-teal-600 font-medium hover:underline mb  -6 inline-block">
        ← Back to events
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Sell your tickets</h1>
      <p className="text-slate-500 text-sm mb-2">
        Start by telling us which event and seats you’re selling. You’ll be asked to log in or create an account before confirming your listing.
      </p>
      <p className="text-slate-600 text-sm font-medium mb-8">Step 1 of 2 — Ticket details</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="sell-event" className="block text-sm font-medium text-slate-700 mb-1">
            Event *
          </label>
          <select
            id="sell-event"
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

        {event && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 space-y-3">
            <h3 className="font-semibold text-slate-900">Smart pricing suggestions</h3>
            {marketStats && marketStats.count > 0 ? (
              <>
                <p className="text-sm text-slate-700">
                  Current market for this event: {formatPrice(marketStats.min)} – {formatPrice(marketStats.max)} per ticket
                  {marketStats.count > 1 && ` (${marketStats.count} listings)`}.
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Suggested list price:</strong> {formatPrice(marketStats.suggested)} per ticket
                  {marketStats.count > 1 && ' (about 3% below lowest to help your listing sell faster).'}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-700">
                No other listings for this event yet. Suggested starting price: {formatPrice(marketStats?.suggested ?? event.minPrice)} per
                ticket
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sell-section" className="block text-sm font-medium text-slate-700 mb-1">
              Section *
            </label>
            <input
              id="sell-section"
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Floor, 101"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
              required
            />
          </div>
          <div>
            <label htmlFor="sell-row" className="block text-sm font-medium text-slate-700 mb-1">
              Row (optional)
            </label>
            <input
              id="sell-row"
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
            <label htmlFor="sell-qty" className="block text-sm font-medium text-slate-700 mb-1">
              Quantity
            </label>
            <input
              id="sell-qty"
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="sell-price" className="block text-sm font-medium text-slate-700 mb-1">
              Price per ticket ($) *
            </label>
            <input
              id="sell-price"
              type="number"
              min={1}
              step={0.01}
              value={useDynamicPricing && marketStats ? String(marketStats.suggested) : pricePerTicket}
              onChange={(e) => setPricePerTicket(e.target.value)}
              placeholder={useDynamicPricing ? undefined : 'e.g. 150'}
              readOnly={useDynamicPricing}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={useDynamicPricing}
            onChange={(e) => {
              const checked = e.target.checked;
              setUseDynamicPricing(checked);
              if (checked && marketStats) {
                setPricePerTicket(String(marketStats.suggested));
              }
            }}
            className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-700 group-hover:text-slate-900">
            <strong>AutoPrice – Dynamic pricing</strong>: Automatically set my price from market ({formatPrice(marketStats?.suggested ?? (event?.minPrice ?? 0))} per
            ticket). We’ll use the suggested price above and may adjust it over time based on demand. You can turn this off to set a fixed price
            instead.
          </span>
        </label>

        {(pricePerTicket || (useDynamicPricing && marketStats)) && !Number.isNaN(parseFloat(useDynamicPricing && marketStats ? String(marketStats.suggested) : pricePerTicket)) && (
          <p className="text-slate-600 text-sm">
            Total listing: $
            {(quantity * (useDynamicPricing && marketStats ? marketStats!.suggested : parseFloat(pricePerTicket || '0'))).toFixed(2)}. Seller
            fee (10%) applied when sold.
          </p>
        )}
        {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : 'Continue to seller info'}
        </button>
      </form>
    </div>
  );
}

