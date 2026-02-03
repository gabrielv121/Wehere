import { Link } from 'react-router-dom';
import type { Event } from '../types';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function EventCard({ event, size = 'default' }: { event: Event; size?: 'default' | 'large' }) {
  const isLarge = size === 'large';
  return (
    <Link
      to={`/events/${event.id}`}
      className={`group block rounded-xl overflow-hidden bg-white border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-200 ${isLarge ? 'sm:flex' : ''}`}
    >
      <div className={`relative aspect-[4/3] bg-slate-200 overflow-hidden ${isLarge ? 'sm:w-72 sm:aspect-auto sm:min-h-[200px]' : ''}`}>
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {event.featured && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-teal-500 text-white text-xs font-semibold">
            Featured
          </span>
        )}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs capitalize">
          {event.category}
        </span>
      </div>
      <div className={`p-4 ${isLarge ? 'sm:flex-1 sm:flex sm:flex-col sm:justify-center' : ''}`}>
        <h3 className={`font-semibold text-slate-900 group-hover:text-teal-600 transition-colors ${isLarge ? 'text-lg sm:text-xl' : ''}`}>
          {event.title}
        </h3>
        <p className="text-slate-500 text-sm mt-0.5">{event.venue.name} · {event.venue.city}, {event.venue.state}</p>
        <p className="text-slate-600 text-sm mt-1">{formatDate(event.date)}</p>
        <p className="text-teal-600 font-semibold mt-2">
          From {formatPrice(event.minPrice)}
          {event.maxPrice != null && event.maxPrice > event.minPrice && ` – ${formatPrice(event.maxPrice)}`}
        </p>
      </div>
    </Link>
  );
}
