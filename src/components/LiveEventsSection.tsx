import { Link } from 'react-router-dom';
import { EventCard } from './EventCard';
import { useEvents } from '../context/EventsContext';

const LIVE_EVENTS_SIZE = 6;

export function LiveEventsSection() {
  const { events } = useEvents();
  const visible = events.filter((e) => e.visible !== false);
  const slice = visible.slice(0, LIVE_EVENTS_SIZE);

  if (slice.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Events</h2>
        <Link
          to="/events"
          className="text-teal-600 font-semibold hover:underline"
        >
          View all events
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
