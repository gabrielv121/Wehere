import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, sellerRequirementsComplete } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { addListing, getMarketPriceStats } from '../data/listings';
import { isApiEnabled } from '../api/client';
import * as listingsApi from '../api/listings';
import { EventSearchPicker } from '../components/EventSearchPicker';
import type { Event } from '../types';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'];
const LIST_DRAFT_KEY = 'wehere_listing_draft';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function ListTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateSellerInfo } = useAuth();
  const { events, getEventById } = useEvents();
  const visibleEvents = events.filter((e) => e.visible !== false);
  const stateEventId = (location.state as { eventId?: string } | null)?.eventId ?? '';

  const canSell = user ? sellerRequirementsComplete(user) : false;
  const [step, setStep] = useState<1 | 2>(1);

  const [eventId, setEventId] = useState(stateEventId);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [pricePerTicket, setPricePerTicket] = useState('');
  const [useDynamicPricing, setUseDynamicPricing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [country, setCountry] = useState(user?.country ?? 'US');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [cardLast4, setCardLast4] = useState(user?.cardLast4 ?? '');
  const [cardBrand, setCardBrand] = useState(user?.cardBrand ?? 'Visa');
  const [savingSeller, setSavingSeller] = useState(false);

  const event = selectedEvent ?? (eventId ? getEventById(eventId) : undefined);
  const marketStats = useMemo(
    () => getMarketPriceStats(eventId, event ? { minPrice: event.minPrice, maxPrice: event.maxPrice } : undefined),
    [eventId, event]
  );

  useEffect(() => {
    // If we arrived from the public /sell flow, restore draft and jump to step 2.
    try {
      const raw = sessionStorage.getItem(LIST_DRAFT_KEY);
      if (raw) {
        const draft: {
          eventId: string;
          section: string;
          row?: string;
          quantity: number;
          pricePerTicket: number;
          useDynamicPricing: boolean;
        } = JSON.parse(raw);
        if (draft.eventId) setEventId(draft.eventId);
        setSection(draft.section ?? '');
        setRow(draft.row ?? '');
        setQuantity(draft.quantity ?? 2);
        setPricePerTicket(String(draft.pricePerTicket ?? ''));
        setUseDynamicPricing(Boolean(draft.useDynamicPricing));
        setStep(2);
      } else if (stateEventId) {
        setEventId(stateEventId);
      }
    } catch {
      if (stateEventId) setEventId(stateEventId);
    }
  }, [stateEventId]);

  useEffect(() => {
    if (user) {
      setCountry(user.country ?? 'US');
      setPhone(user.phone ?? '');
      setCardLast4(user.cardLast4 ?? '');
      setCardBrand(user.cardBrand ?? 'Visa');
    }
  }, [user]);

  if (!user || user.role === 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Sign in as a user to list tickets. Admins cannot sell.</p>
        <Link to="/events" className="text-teal-600 font-semibold hover:underline mt-2 inline-block">Browse events</Link>
      </div>
    );
  }

  function handleTicketStepSubmit(e: React.FormEvent) {
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
    const finalPrice = useDynamicPricing ? marketStats.suggested : price;
    if (Number.isNaN(finalPrice) || finalPrice < 1) {
      setError(useDynamicPricing ? 'No market data to set price. Enter a price manually.' : 'Enter a valid price per ticket.');
      return;
    }
    setStep(2);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const price = parseFloat(pricePerTicket);
    const finalPrice = useDynamicPricing ? marketStats.suggested : price;

    if (!canSell) {
      const last4 = cardLast4.replace(/\D/g, '').slice(-4);
      if (last4.length !== 4) {
        setError('Enter the last 4 digits of your card.');
        return;
      }
      setSavingSeller(true);
      const result = await updateSellerInfo({
        country: country.trim(),
        phone: phone.trim(),
        paymentMethodOnFile: true,
        cardLast4: last4,
        cardBrand: cardBrand.trim() || 'Visa',
      });
      setSavingSeller(false);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isApiEnabled) {
        await listingsApi.addListing({
          eventId,
          section: section.trim(),
          row: row.trim() || undefined,
          quantity,
          pricePerTicket: finalPrice,
          dynamicPricing: useDynamicPricing,
        });
      } else {
        addListing({
          eventId,
          sellerId: user!.id,
          sellerName: user!.name,
          section: section.trim(),
          row: row.trim() || undefined,
          quantity,
          pricePerTicket: finalPrice,
          dynamicPricing: useDynamicPricing,
        });
      }
      try {
        sessionStorage.removeItem(LIST_DRAFT_KEY);
      } catch {
        // ignore
      }
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
      <p className="text-slate-500 text-sm mb-2">
        WeHere holds the buyer’s payment until tickets are delivered. We charge sellers a fee; buyers pay nothing extra.
      </p>
      <p className="text-slate-600 text-sm font-medium mb-8">
        Step {step} of 2 — {step === 1 ? 'Ticket details' : 'Seller info'}
      </p>

      {step === 1 && (
        <form onSubmit={handleTicketStepSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <EventSearchPicker
            id="list-event"
            label="Event"
            value={eventId}
            onChange={(id, ev) => {
              setEventId(id);
              setSelectedEvent(ev ?? undefined);
            }}
            fallbackEvents={visibleEvents}
            placeholder="Search events by name…"
          />

          {eventId && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Smart pricing suggestions</h3>
              {marketStats.count > 0 ? (
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
                  No other listings for this event yet. Suggested starting price: {formatPrice(marketStats.suggested)} per ticket
                  {event && ` (from event range ${formatPrice(event.minPrice)} – ${event.maxPrice != null ? formatPrice(event.maxPrice) : '…'}).`}
                </p>
              )}
            </div>
          )}

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
                value={useDynamicPricing ? String(marketStats.suggested) : pricePerTicket}
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
                setUseDynamicPricing(e.target.checked);
                if (e.target.checked) setPricePerTicket(String(marketStats.suggested));
              }}
              className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900">
              <strong>AutoPrice – Dynamic pricing</strong>: Automatically set my price from market ({formatPrice(marketStats.suggested)} per ticket).
              We’ll use the suggested price above and may adjust it over time based on demand. You can turn this off to set a fixed price instead.
            </span>
          </label>

          {(pricePerTicket || useDynamicPricing) && !Number.isNaN(parseFloat(useDynamicPricing ? String(marketStats.suggested) : pricePerTicket)) && (
            <p className="text-slate-600 text-sm">
              Total listing: ${(quantity * (useDynamicPricing ? marketStats.suggested : parseFloat(pricePerTicket))).toFixed(2)}. Seller fee (10%) applied when sold.
            </p>
          )}
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
          >
            Continue to seller info
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => { setError(''); setStep(1); }}
            className="text-sm text-teal-600 hover:underline"
          >
            ← Edit ticket details
          </button>
          <p className="text-slate-700 text-sm">
            Last step: we need a few details so we can pay you after the buyer confirms they received the tickets.
          </p>
          <div>
            <label htmlFor="list-seller-country" className="block text-sm font-medium text-slate-700 mb-1">Country of residence *</label>
            <select
              id="list-seller-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 bg-slate-50"
            >
              <option value="US">United States</option>
            </select>
            <p className="text-slate-500 text-xs mt-1">We currently only support sellers in the United States.</p>
          </div>
          <div>
            <label htmlFor="list-seller-phone" className="block text-sm font-medium text-slate-700 mb-1">Contact phone number *</label>
            <input
              id="list-seller-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (555) 123-4567"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
              required
            />
            <p className="text-slate-500 text-xs mt-1">Used for payouts and verification.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <h3 className="font-medium text-slate-900">Credit card on file</h3>
            <p className="text-sm text-slate-600">
              We pay out your profit to your card after the buyer confirms they received the ticket. We only store the last 4 digits for your security.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="list-seller-card-brand" className="block text-sm font-medium text-slate-700 mb-1">Card type</label>
                <select
                  id="list-seller-card-brand"
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
                >
                  {CARD_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="list-seller-card-last4" className="block text-sm font-medium text-slate-700 mb-1">Last 4 digits *</label>
                <input
                  id="list-seller-card-last4"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
                />
              </div>
            </div>
          </div>
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={savingSeller || submitting}
            className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {savingSeller ? 'Saving…' : submitting ? 'Listing…' : 'List tickets'}
          </button>
        </form>
      )}
    </div>
  );
}
