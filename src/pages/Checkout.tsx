import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { addPurchase } from '../data/userPurchases';
import { SELLER_FEE_PERCENT, BUYER_FEE_PERCENT } from '../data/listings';
import type { TicketListing } from '../types';

const CHECKOUT_STORAGE_KEY = 'wehere_checkout';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEventById } = useEvents();

  const state = location.state as { eventId?: string; listing?: TicketListing } | null;
  const [eventId, setEventId] = useState<string | null>(state?.eventId ?? null);
  const [listing, setListing] = useState<TicketListing | null>(state?.listing ?? null);

  useEffect(() => {
    if (!state?.eventId && !state?.listing) {
      try {
        const stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { eventId: string; listing: TicketListing };
          setEventId(parsed.eventId);
          setListing(parsed.listing);
        }
      } catch {
        // ignore
      }
    }
  }, [state]);

  const event = eventId ? getEventById(eventId) : null;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/" replace />;
  }

  if (!event || !listing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 mb-4">No ticket selection. Choose tickets from an event.</p>
        <Link to="/events" className="text-teal-600 font-semibold hover:underline">Browse events</Link>
      </div>
    );
  }

  const subtotal = listing.totalPrice;
  const isMarketplace = Boolean(listing.listingId && listing.sellerId);
  const buyerFee = isMarketplace ? (subtotal * BUYER_FEE_PERCENT) / 100 : 0;
  const total = subtotal + buyerFee;
  const sellerFeePercent = isMarketplace ? SELLER_FEE_PERCENT : 0;
  const sellerPayout = isMarketplace ? subtotal * (1 - sellerFeePercent / 100) : undefined;

  function handleConfirm() {
    setError('');
    if (!user || !event || !listing) return;
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setConfirming(true);
    try {
      const status = Math.random() > 0.2 ? 'confirmed' : 'pending'; // demo: mostly confirmed
      const purchase = addPurchase({
        userId: user.id,
        eventId: listing.eventId,
        eventName: event.title,
        eventDate: event.date,
        eventImage: event.image,
        venue: { name: event.venue.name, city: event.venue.city, state: event.venue.state },
        section: listing.section,
        row: listing.row,
        quantity: listing.quantity,
        pricePerTicket: listing.pricePerTicket,
        totalPrice: total,
        status,
        buyerName: user.name,
        buyerEmail: user.email,
        listingId: listing.listingId,
        sellerId: listing.sellerId,
        sellerFeePercent: listing.listingId ? sellerFeePercent : undefined,
        sellerPayout: sellerPayout,
      });
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      navigate('/checkout/success', { state: { orderId: purchase.id, status } });
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirming(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to={`/events/${event.id}`} className="text-teal-600 font-medium hover:underline mb-6 inline-block">
        ← Back to event
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Checkout</h1>
      <p className="text-slate-500 text-sm mb-8">Review your order and confirm</p>

      <div className="space-y-8">
        {/* Event + ticket selection */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Ticket selection</h2>
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-200 shrink-0">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="text-slate-500 text-sm">{event.venue.name} · {formatDate(event.date)}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  {listing.section}
                  {listing.row != null && ` · Row ${listing.row}`}
                </span>
                <span className="text-slate-600">{listing.quantity} ticket{listing.quantity > 1 ? 's' : ''}</span>
                <span className="text-slate-600">{listing.seller}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">
                {formatPrice(listing.pricePerTicket)} × {listing.quantity}
              </dt>
              <dd className="font-medium text-slate-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Buyer fees</dt>
              <dd className="text-slate-600">{buyerFee === 0 ? '—' : formatPrice(buyerFee)}</dd>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-semibold">
              <dt className="text-slate-900">Total</dt>
              <dd className="text-teal-600">{formatPrice(total)}</dd>
            </div>
          </dl>
        </section>

        {/* User info */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Contact information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="checkout-name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                id="checkout-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
                required
              />
            </div>
            <div>
              <label htmlFor="checkout-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
                required
              />
            </div>
          </div>
        </section>

        <p className="text-slate-500 text-xs">
          {isMarketplace
            ? 'Resale from other fans. WeHere holds your payment until delivery is confirmed. Sellers pay our fee; buyers pay no extra fees.'
            : 'Tickets are provided by third-party sellers. Delivery and entry are subject to their terms.'}
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {confirming ? 'Processing…' : 'Confirm & continue'}
        </button>
      </div>
    </div>
  );
}
