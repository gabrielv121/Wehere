import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { getListingsBySeller } from '../data/listings';
import { isApiEnabled } from '../api/client';
import * as listingsApi from '../api/listings';
import type { MarketplaceListing } from '../types';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MyListings() {
  const { user } = useAuth();
  const { getEventById } = useEvents();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  useEffect(() => {
    if (!user) {
      setListings([]);
      return;
    }
    if (isApiEnabled) {
      listingsApi.getListingsBySeller(user.id).then(setListings).catch(() => setListings([]));
    } else {
      setListings(getListingsBySeller(user.id));
    }
  }, [user?.id]);
  if (!user) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">My listings</h2>
        <Link
          to="/account/list-tickets"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors"
        >
          List tickets
        </Link>
      </div>
      {listings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600 mb-4">You haven’t listed any tickets yet.</p>
          <Link to="/account/list-tickets" className="text-teal-600 font-semibold hover:underline">
            List your first tickets
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => {
            const event = getEventById(listing.eventId);
            return (
              <li
                key={listing.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{event?.title ?? 'Event'}</p>
                  <p className="text-slate-500 text-sm">
                    {listing.section}
                    {listing.row ? ` · Row ${listing.row}` : ''} · {listing.quantity} ticket{listing.quantity > 1 ? 's' : ''}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Listed {formatDate(listing.createdAt)} · {formatPrice(listing.totalPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      listing.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : listing.status === 'sold'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {listing.status === 'available' ? 'Available' : listing.status === 'sold' ? 'Sold' : 'Pending'}
                  </span>
                  {event && listing.status === 'available' && (
                    <Link
                      to={`/events/${listing.eventId}`}
                      className="text-teal-600 text-sm font-medium hover:underline"
                    >
                      View event
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
