import { Link } from 'react-router-dom';
import type { Event } from '../types';

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Compact block row for mobile: image | title + date | small image */
export function EventBlockRow({ event }: { event: Event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all"
    >
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-200">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 truncate">{event.title}</h3>
        <p className="text-slate-500 text-sm mt-0.5">{formatShortDate(event.date)}</p>
      </div>
      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-200">
        <img src={event.image} alt="" className="w-full h-full object-cover" aria-hidden />
      </div>
    </Link>
  );
}
