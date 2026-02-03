import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { getTicketsForEvent, getSeatsForEvent, getVenueMapForEvent } from '../data/events';
import { getListingsByEvent, listingToTicketListing } from '../data/listings';
import { TicketListingRow } from '../components/TicketListingRow';
import { TicketQuantityFilter } from '../components/TicketQuantityFilter';
import { SeatMap } from '../components/SeatMap';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getEventById } = useEvents();
  const isAdmin = user?.role === 'admin';
  const event = id ? getEventById(id) : undefined;

  const notFound = !event || event.visible === false;

  const marketplaceListings = useMemo(() => {
    if (!id) return [];
    return getListingsByEvent(id).map(listingToTicketListing);
  }, [id]);
  const mockTickets = id ? getTicketsForEvent(id) : [];
  const tickets = marketplaceListings.length > 0 ? marketplaceListings : mockTickets;
  const hasMarketplaceListings = marketplaceListings.length > 0;
  const seats = id ? getSeatsForEvent(id) : [];
  const venueSections = id ? getVenueMapForEvent(id) : [];

  const [quantity, setQuantity] = useState(1);

  const filteredTickets = useMemo(() => {
    const minQty = quantity >= 5 ? 5 : quantity;
    return tickets
      .filter((t) => t.quantity >= minQty)
      .sort((a, b) => a.totalPrice - b.totalPrice);
  }, [tickets, quantity]);

  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 mb-4">Event not found or not available.</p>
        <Link to="/events" className="text-teal-600 font-semibold hover:underline">
          Browse events
        </Link>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/events" className="text-teal-600 font-medium hover:underline mb-6 inline-block">
        ← Back to events
      </Link>

      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="grid sm:grid-cols-[1fr,320px] gap-0">
          <div className="relative aspect-[2/1] sm:aspect-auto sm:min-h-[320px] bg-slate-200">
            <img
              src={event.image}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <span className="text-sm font-medium uppercase tracking-wider text-teal-300">
                {event.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold mt-1">{event.title}</h1>
              <p className="mt-2 text-slate-200">
                {event.venue.name} · {event.venue.city}, {event.venue.state}
              </p>
              <p className="text-slate-300 text-sm mt-1">{formatDate(event.date)}</p>
            </div>
          </div>
          <div className="p-6 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200">
            <p className="text-slate-500 text-sm">From</p>
            <p className="text-3xl font-bold text-teal-600">
              {formatPrice(event.minPrice)}
              {event.maxPrice != null && event.maxPrice > event.minPrice && (
                <span className="text-lg font-normal text-slate-500"> – {formatPrice(event.maxPrice)}</span>
              )}
            </p>
            <p className="text-slate-600 text-sm mt-2">
              {tickets.length} listing{tickets.length !== 1 ? 's' : ''}
            </p>
            {!isAdmin && (
              <button
                type="button"
                onClick={() => document.getElementById('available-tickets')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-6 w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
              >
                Find tickets
              </button>
            )}
          </div>
        </div>
      </div>

      <div id="available-tickets" className="mt-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Available tickets</h2>
          {hasMarketplaceListings && (
            <p className="text-slate-600 text-sm mb-2 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2">
              Resale from other fans. WeHere holds your payment until you get the tickets — no buyer fees.
            </p>
          )}
          <p className="text-slate-500 text-sm mb-4">
            How many tickets? We’ll show listings that have enough seats and highlight the best total price.
          </p>
          <TicketQuantityFilter value={quantity} onChange={setQuantity} />
          <div className="mt-6 space-y-4">
            {filteredTickets.length === 0 ? (
              <p className="text-slate-500 py-8">
                No listings with {quantity >= 5 ? '5 or more' : quantity} ticket{quantity === 1 ? '' : 's'} right now. Try a different party size.
              </p>
            ) : (
              filteredTickets.map((listing, index) => (
                <TicketListingRow
                  key={listing.id}
                  listing={listing}
                  isBestDeal={index === 0}
                />
              ))
            )}
          </div>
          {!isAdmin && (
            <p className="mt-6 text-slate-600 text-sm">
              Have tickets to sell?{' '}
              <Link to="/account/list-tickets" state={{ eventId: id }} className="text-teal-600 font-semibold hover:underline">
                List your tickets
              </Link>
            </p>
          )}
        </div>
        <div>
          {venueSections.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Seat map</h2>
              <SeatMap seats={seats} sections={venueSections} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
