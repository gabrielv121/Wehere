import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPurchases } from '../data/userPurchases';
import { useMemo } from 'react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
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

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return { label: 'Pending', class: 'bg-amber-100 text-amber-800' };
    case 'confirmed':
      return { label: 'Confirmed', class: 'bg-teal-100 text-teal-700' };
    case 'delivered':
      return { label: 'Delivered', class: 'bg-emerald-100 text-emerald-700' };
    case 'cancelled':
      return { label: 'Cancelled', class: 'bg-red-100 text-red-700' };
    default:
      return { label: status, class: 'bg-slate-100 text-slate-600' };
  }
}

export function PurchaseHistory() {
  const { user } = useAuth();
  const purchases = useMemo(() => (user ? getPurchases(user.id) : []), [user]);

  const orders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return purchases.map((p) => {
      const eventDate = new Date(p.eventDate);
      const isUpcoming = eventDate >= today;
      return { purchase: p, isUpcoming };
    });
  }, [purchases]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Purchase history</h2>
      <p className="text-slate-500 text-sm mb-6">All your orders, past and upcoming</p>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600 mb-4">No orders yet.</p>
          <Link
            to="/events"
            className="inline-flex px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
          >
            Browse events
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map(({ purchase: p, isUpcoming }) => {
            const statusInfo = statusLabel(p.status);
            return (
              <li key={p.id}>
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                  <Link
                    to={`/events/${p.eventId}`}
                    className="sm:w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-slate-200 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={p.eventImage ?? ''}
                      alt={p.eventName}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUpcoming && (
                        <span className="rounded-full bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-0.5">
                          Upcoming
                        </span>
                      )}
                      {!isUpcoming && (
                        <span className="rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5">
                          Past event
                        </span>
                      )}
                      <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <Link to={`/events/${p.eventId}`} className="font-semibold text-slate-900 hover:text-teal-600 mt-1 block">
                      {p.eventName}
                    </Link>
                    <p className="text-slate-500 text-sm">
                      {p.venue.name} · {formatDate(p.eventDate)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Order placed {formatDateTime(p.orderDate)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span className="text-slate-700">
                        {p.section}
                        {p.row != null && ` · Row ${p.row}`} · {p.quantity} ticket{p.quantity > 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-slate-900">{formatPrice(p.totalPrice)}</span>
                    </div>
                  </div>
                  <div className="self-center sm:self-auto shrink-0">
                    <Link
                      to={`/events/${p.eventId}`}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      View event
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
