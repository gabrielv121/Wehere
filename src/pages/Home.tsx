import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { LiveEventsSection } from '../components/LiveEventsSection';
import { CategoriesSection } from '../components/CategoriesSection';
import { PopularThisWeekend } from '../components/PopularThisWeekend';
import { CategoryCarouselSection } from '../components/CategoryCarouselSection';
import { EventCard } from '../components/EventCard';
import { EventBlockRow } from '../components/EventBlockRow';
import { useEvents } from '../context/EventsContext';
import type { Event } from '../types';

const EVENTS_PER_SLIDE_MOBILE = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function Home() {
  const { events } = useEvents();
  const featured = events.filter((e) => e.visible !== false && e.featured);
  const more = events.filter((e) => e.visible !== false && !e.featured).slice(0, 4);

  const moreMobileSlides = useMemo(() => chunk(more, EVENTS_PER_SLIDE_MOBILE), [more]);
  const moreMobileSlideCount = moreMobileSlides.length;
  const [moreMobileSlide, setMoreMobileSlide] = useState(0);
  const [moreExiting, setMoreExiting] = useState(false);
  const [moreEntering, setMoreEntering] = useState(false);
  const [moreNextSlideIndex, setMoreNextSlideIndex] = useState<number | null>(null);
  const [moreTouchStart, setMoreTouchStart] = useState<number | null>(null);

  const goToMoreMobile = useCallback(
    (direction: 1 | -1) => {
      if (moreMobileSlideCount <= 1 || moreExiting || moreEntering) return;
      const next = (moreMobileSlide + direction + moreMobileSlideCount) % moreMobileSlideCount;
      setMoreNextSlideIndex(next);
      setMoreExiting(true);
    },
    [moreMobileSlide, moreMobileSlideCount, moreExiting, moreEntering]
  );

  const handleMoreExitEnd = useCallback(() => {
    if (!moreExiting || moreNextSlideIndex === null) return;
    setMoreMobileSlide(moreNextSlideIndex);
    setMoreNextSlideIndex(null);
    setMoreExiting(false);
    setMoreEntering(true);
  }, [moreExiting, moreNextSlideIndex]);

  const handleMoreEnterEnd = useCallback(() => setMoreEntering(false), []);

  const handleMoreTouchStart = (e: React.TouchEvent) => setMoreTouchStart(e.touches[0].clientX);
  const handleMoreTouchEnd = (e: React.TouchEvent) => {
    if (moreTouchStart === null) return;
    const dx = e.changedTouches[0].clientX - moreTouchStart;
    setMoreTouchStart(null);
    if (Math.abs(dx) < 50) return;
    if (dx > 0) goToMoreMobile(-1);
    else goToMoreMobile(1);
  };

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

          {/* Mobile: compact block carousel (swipe between slides) */}
          <div
            className={`sm:hidden min-h-[200px] ${moreExiting ? 'featured-exit' : moreEntering ? 'featured-enter' : ''} ${moreExiting || moreEntering ? 'pointer-events-none' : ''}`}
            onAnimationEnd={() => {
              if (moreExiting) handleMoreExitEnd();
              if (moreEntering) handleMoreEnterEnd();
            }}
            onTouchStart={handleMoreTouchStart}
            onTouchEnd={handleMoreTouchEnd}
          >
            <div className="space-y-3">
              {(moreMobileSlides[moreMobileSlide] ?? []).map((event: Event) => (
                <EventBlockRow key={event.id} event={event} />
              ))}
            </div>
            {moreMobileSlideCount > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => goToMoreMobile(-1)}
                  disabled={moreExiting || moreEntering}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Previous slide"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-slate-500 text-sm font-medium tabular-nums min-w-[2rem] text-center">
                  {moreMobileSlide + 1} / {moreMobileSlideCount}
                </span>
                <button
                  type="button"
                  onClick={() => goToMoreMobile(1)}
                  disabled={moreExiting || moreEntering}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  aria-label="Next slide"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Desktop: grid of cards */}
          <div className="hidden sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <PopularThisWeekend />

      <CategoryCarouselSection
        title="Top Teams"
        category="sports"
        viewAllHref="/events?category=sports"
        eventsPerSlide={3}
      />
      <CategoryCarouselSection
        title="Concerts"
        category="concert"
        viewAllHref="/events?category=concert"
        eventsPerSlide={4}
      />
      <CategoryCarouselSection
        title="Top Broadway Shows"
        category="theater"
        viewAllHref="/events?category=theater"
        eventsPerSlide={3}
      />
      <CategoryCarouselSection
        title="Comedy"
        category="comedy"
        viewAllHref="/events?category=comedy"
        eventsPerSlide={4}
      />
    </>
  );
}
