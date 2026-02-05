import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUpcomingPurchases } from '../data/userPurchases';
import { isApiEnabled } from '../api/client';
import * as ordersApi from '../api/orders';
import type { Purchase } from '../types';

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

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Purchase[]>([]);
  useEffect(() => {
    if (!user) {
      setTickets([]);
      return;
    }
    if (isApiEnabled) {
      ordersApi.getMyOrders().then((list) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = list
          .filter((p) => p.status !== 'cancelled' && new Date(p.eventDate) >= today)
          .sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1));
        setTickets(upcoming);
      }).catch(() => setTickets([]));
    } else {
      setTickets(getUpcomingPurchases(user.id).sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1)));
    }
  }, [user?.id]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">My tickets</h2>
      <p className="text-slate-500 text-sm mb-6">Upcoming events you have tickets for</p>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600 mb-4">No upcoming tickets yet.</p>
          <Link
            to="/events"
            className="inline-flex px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
          >
            Find events
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {tickets.map((p) => (
            <li key={p.id}>
              <Link
                to={`/events/${p.eventId}`}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all"
              >
                <div className="sm:w-32 shrink-0 aspect-video rounded-lg overflow-hidden bg-slate-200">
                  <img
                    src={p.eventImage ?? ''}
                    alt={p.eventName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{p.eventName}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {p.venue.name} · {p.venue.city}, {p.venue.state}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">{formatDate(p.eventDate)}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm items-center">
                    <span className="font-medium text-slate-700">
                      {p.section}
                      {p.row != null && ` · Row ${p.row}`}
                    </span>
                    <span className="text-slate-500">
                      {p.quantity} ticket{p.quantity > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-teal-600">{formatPrice(p.totalPrice)}</span>
                    {p.status === 'pending' && (
                      <span className="rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5">
                        Pending · tickets not delivered yet
                      </span>
                    )}
                    {p.status === 'delivered' && (
                      <span className="rounded-full bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5">
                        Delivered · you’re all set
                      </span>
                    )}
                  </div>
                </div>
                <span className="self-center sm:self-auto shrink-0 text-sm font-medium text-teal-600">
                  View event →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
