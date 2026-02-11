import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { getTicketsForEvent, getVenueMapForEvent, getVenueMapByVenueId } from '../data/events';
import { getListingsByEvent, listingToTicketListing } from '../data/listings';
import { isApiEnabled } from '../api/client';
import * as listingsApi from '../api/listings';
import type { TicketListing } from '../types';
import { TicketListingRow } from '../components/TicketListingRow';
import { TicketQuantityFilter } from '../components/TicketQuantityFilter';
import { SeaticsMapEmbed } from '../components/SeaticsMapEmbed';
import { isSeaticsEnabled } from '../config/seatics';

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
  const { getEventById, ensureEventInList } = useEvents();
  const isAdmin = user?.role === 'admin';
  const event = id ? getEventById(id) : undefined;
  const [eventFetching, setEventFetching] = useState(false);

  useEffect(() => {
    if (event) setEventFetching(false);
    if (!id || event || !isApiEnabled) return;
    setEventFetching(true);
    ensureEventInList(id).finally(() => setEventFetching(false));
  }, [id, event, isApiEnabled, ensureEventInList]);

  const notFound = !eventFetching && (!event || event.visible === false);

  const [marketplaceListings, setMarketplaceListings] = useState<TicketListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  function fetchListings() {
    if (!id) return;
    if (isApiEnabled) {
      setListingsLoading(true);
      setListingsError(null);
      listingsApi
        .getListingsByEvent(id)
        .then((list) => {
          setMarketplaceListings(list.map(listingToTicketListing));
          setListingsLoading(false);
        })
        .catch(() => {
          setMarketplaceListings([]);
          setListingsLoading(false);
          setListingsError('Could not load tickets. Please try again.');
        });
    } else {
      setMarketplaceListings(getListingsByEvent(id).map(listingToTicketListing));
    }
  }

  useEffect(() => {
    if (!id) {
      setMarketplaceListings([]);
      setListingsError(null);
      return;
    }
    fetchListings();
  }, [id]);

  const mockTickets = id ? getTicketsForEvent(id) : [];
  const tickets = marketplaceListings.length > 0 ? marketplaceListings : mockTickets;
  const hasMarketplaceListings = marketplaceListings.length > 0;
  const venueId = event?.venue?.id;
  const sectionsByEvent = id ? getVenueMapForEvent(id) : [];
  const venueSections =
    sectionsByEvent.length > 0
      ? sectionsByEvent
      : venueId
        ? getVenueMapByVenueId(venueId)
        : [];

  const [quantity, setQuantity] = useState(1);
  const [sortBy, setSortBy] = useState<'value' | 'price'>('value');
  const [adaOnly, setAdaOnly] = useState(false);
  const leftColumnRef = useRef<HTMLDivElement>(null);

  /** Row order for "best value" (lower = closer to stage). */
  const getRowOrder = (row: string | undefined): number => {
    if (row == null || row === '') return 999;
    const n = parseInt(row, 10);
    if (!Number.isNaN(n)) return n;
    const c = row.toUpperCase().replace(/\s/g, '');
    return c.length === 1 ? c.charCodeAt(0) - 64 : 999;
  };

  /** Tier order: floor=0, lower=1, upper=2 (lower = better). */
  const getTierOrder = (sectionName: string): number => {
    const s = venueSections.find((v) => v.name === sectionName);
    if (!s) return 3;
    if (s.tier === 'floor') return 0;
    if (s.tier === 'lower') return 1;
    if (s.tier === 'upper') return 2;
    return 3;
  };

  /** Deal score: lower = better (section tier + row + price). */
  const getDealScore = (listing: TicketListing): number => {
    const tier = getTierOrder(listing.section);
    const row = getRowOrder(listing.row);
    return tier * 1e6 + row * 1e3 + listing.pricePerTicket;
  };

  const filteredTickets = useMemo(() => {
    const minQty = quantity >= 5 ? 5 : quantity;
    let list = tickets.filter((t) => t.quantity >= minQty);
    if (adaOnly) {
      list = list.filter((t) => t.ada === true);
    }
    if (sortBy === 'value') {
      return [...list].sort((a, b) => getDealScore(a) - getDealScore(b));
    }
    return list.sort((a, b) => a.totalPrice - b.totalPrice);
  }, [tickets, quantity, sortBy, adaOnly]);

  if (eventFetching) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Loading event…</p>
      </div>
    );
  }

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

  const useSeaticsMap = isSeaticsEnabled && event != null;

  return (
    <div
      className={`min-h-screen bg-slate-50 ${useSeaticsMap ? 'lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden' : ''}`}
    >
      {/* Left: event info (scrollable) – 50% when map present, constrained width when no map */}
      <div
        ref={leftColumnRef}
        className={`overflow-y-auto px-4 py-6 space-y-6 ${useSeaticsMap ? 'lg:pr-4' : 'max-w-3xl mx-auto w-full'}`}
      >
          <Link to="/events" className="text-teal-600 font-medium hover:underline inline-block">
            ← Back to events
          </Link>

          <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <div className="relative aspect-[2/1] sm:aspect-[21/9] sm:min-h-[200px] bg-slate-200">
              <img
                src={event.image}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                <span className="text-xs font-medium uppercase tracking-wider text-teal-300">
                  {event.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">{event.title}</h1>
                <p className="mt-1.5 text-slate-200 text-sm">
                  {event.venue.name} · {event.venue.city}, {event.venue.state}
                </p>
                <p className="text-slate-300 text-sm">{formatDate(event.date)}</p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-slate-500 text-sm">From</p>
                <p className="text-2xl font-bold text-teal-600">
                  {formatPrice(event.minPrice)}
                  {event.maxPrice != null && event.maxPrice > event.minPrice && (
                    <span className="text-base font-normal text-slate-500"> – {formatPrice(event.maxPrice)}</span>
                  )}
                </p>
                <p className="text-slate-600 text-sm mt-1">
                  {tickets.length} listing{tickets.length !== 1 ? 's' : ''}
                </p>
              </div>
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => document.getElementById('available-tickets')?.scrollIntoView({ behavior: 'smooth' })}
                  className="py-3 px-5 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
                >
                  Find tickets
                </button>
              )}
            </div>
          </div>

          <div id="available-tickets" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-900">Available tickets</h2>
            </div>
            {hasMarketplaceListings && (
              <p className="text-slate-600 text-sm mb-3 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2">
                Resale from other fans. WeHere holds your payment until you get the tickets — no buyer fees.
              </p>
            )}
            <p className="text-slate-500 text-sm mb-4">
              How many tickets? We’ll show listings that have enough seats and highlight the best total price.
            </p>
            <TicketQuantityFilter value={quantity} onChange={setQuantity} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-slate-500 text-sm">Sort by</span>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setSortBy('value')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'value' ? 'bg-white text-teal-700 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Best value
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('price')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'price' ? 'bg-white text-teal-700 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Price
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adaOnly}
                  onChange={(e) => setAdaOnly(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Wheelchair accessible only</span>
              </label>
            </div>
            <div className="mt-6 space-y-4">
              {listingsLoading ? (
                <div className="py-8 space-y-4" aria-busy="true" aria-live="polite">
                  <p className="text-slate-500">Loading tickets…</p>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : listingsError ? (
                <div className="py-8 text-center">
                  <p className="text-slate-600 mb-3">{listingsError}</p>
                  <button
                    type="button"
                    onClick={() => fetchListings()}
                    className="px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredTickets.length === 0 ? (
                <p className="text-slate-500 py-8">
                  {adaOnly
                    ? 'No wheelchair accessible listings match your filters. Try turning off “Wheelchair accessible only” or change quantity/section.'
                    : `No listings with ${quantity >= 5 ? '5 or more' : quantity} ticket${quantity === 1 ? '' : 's'} right now. Try a different party size.`}
                </p>
              ) : (
                filteredTickets.map((listing, index) => (
                  <TicketListingRow
                    key={listing.id}
                    listing={listing}
                    isBestValue={index === 0 && sortBy === 'value'}
                    isBestPrice={index === 0 && sortBy === 'price'}
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
        </div>

        {/* Right: seat map – Seatics when configured, else our SVG map */}
        {useSeaticsMap && (
          <div className="mt-8 lg:mt-0 lg:h-full lg:flex lg:flex-col lg:min-h-0">
            <SeaticsMapEmbed
              eventName={event.title}
              venueName={event.venue.name}
              eventDateIso={event.date}
              listings={tickets}
              className="lg:h-full lg:min-h-0"
              minHeight={420}
            />
          </div>
        )}
    </div>
  );
}
