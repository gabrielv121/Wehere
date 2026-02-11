import { useNavigate } from 'react-router-dom';
import type { TicketListing } from '../types';
import { useAuth } from '../context/AuthContext';

const CHECKOUT_STORAGE_KEY = 'wehere_checkout';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function TicketListingRow({
  listing,
  isBestValue,
  isBestPrice,
  externalUrl,
}: {
  listing: TicketListing;
  /** Top listing when sorted by Best value (section + row + price) */
  isBestValue?: boolean;
  /** Top listing when sorted by Price (lowest total) */
  isBestPrice?: boolean;
  /** When set, "Get tickets" opens this URL (e.g. Ticketmaster) instead of checkout */
  externalUrl?: string;
}) {
  const isBestDeal = isBestValue ?? isBestPrice;
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwnMarketplaceListing = Boolean(user && listing.sellerId && user.id === listing.sellerId);

  function handleGetTickets() {
    if (externalUrl) return; // handled by link
    if (!user) {
      try {
        sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({ eventId: listing.eventId, listing }));
      } catch {
        // ignore
      }
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }
    navigate('/checkout', { state: { eventId: listing.eventId, listing } });
  }

  const getTicketsButton = user?.role === 'admin' ? (
    <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-sm font-medium">Admin</span>
  ) : isOwnMarketplaceListing ? (
    <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium" title="You can’t buy your own listing.">
      Your listing
    </span>
  ) : externalUrl ? (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
    >
      Get tickets
    </a>
  ) : (
    <button
      type="button"
      onClick={handleGetTickets}
      className="px-4 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
    >
      Get tickets
    </button>
  );

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-white transition-colors ${
        isBestDeal ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'border-slate-200 hover:border-teal-300'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          {isBestValue && (
            <span className="rounded-full bg-teal-500 text-white text-xs font-bold px-2 py-0.5">
              Best value
            </span>
          )}
          {isBestPrice && !isBestValue && (
            <span className="rounded-full bg-slate-600 text-white text-xs font-bold px-2 py-0.5">
              Lowest price
            </span>
          )}
          {listing.ada && (
            <span className="rounded-full bg-slate-500 text-white text-xs font-medium px-2 py-0.5" title="Wheelchair accessible">
              ADA
            </span>
          )}
          <p className="font-semibold text-slate-900">
            {listing.section}
            {listing.row != null && ` · Row ${listing.row}`}
          </p>
        </div>
        <p className="text-slate-500 text-sm">
          {listing.quantity} ticket{listing.quantity > 1 ? 's' : ''} · {listing.seller}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-600 text-sm">
          {formatPrice(listing.pricePerTicket)} each
        </span>
        <span className="font-bold text-teal-600 text-lg">{formatPrice(listing.totalPrice)}</span>
        {getTicketsButton}
      </div>
    </div>
  );
}
