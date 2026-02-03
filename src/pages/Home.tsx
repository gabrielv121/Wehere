import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { LiveEventsSection } from '../components/LiveEventsSection';
import { CategoriesSection } from '../components/CategoriesSection';
import { PopularThisWeekend } from '../components/PopularThisWeekend';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../context/EventsContext';

export function Home() {
  const { events } = useEvents();
  const featured = events.filter((e) => e.visible !== false && e.featured);
  const more = events.filter((e) => e.visible !== false && !e.featured).slice(0, 4);

  return (
    <>
      <section className="bg-gradient-to-b from-teal-600 to-teal-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Buy & sell tickets with confidence
          </h1>
          <p className="mt-4 text-teal-100 text-lg">
            Resale marketplace: we hold the money, verify delivery, and charge sellers only — no buyer fees.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {['Concerts', 'Sports', 'Theater', 'Comedy'].map((label) => (
              <Link
                key={label}
                to={`/events?category=${label.toLowerCase()}`}
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FeaturedCarousel events={featured} />

      <LiveEventsSection />

      <CategoriesSection />

      {more.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">More events</h2>
            <Link to="/events" className="text-teal-600 font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <PopularThisWeekend />
    </>
  );
}
