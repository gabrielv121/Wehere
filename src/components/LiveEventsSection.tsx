import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EventCard } from './EventCard';
import { EventBlockRow } from './EventBlockRow';
import { useEvents } from '../context/EventsContext';
import type { Event } from '../types';

const LIVE_EVENTS_SIZE = 6;
const EVENTS_PER_SLIDE_MOBILE = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function LiveEventsSection() {
  const { events } = useEvents();
  const visible = events.filter((e) => e.visible !== false);
  const slice = visible.slice(0, LIVE_EVENTS_SIZE);

  const mobileSlides = useMemo(() => chunk(slice, EVENTS_PER_SLIDE_MOBILE), [slice]);
  const mobileSlideCount = mobileSlides.length;
  const [mobileSlide, setMobileSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [nextSlideIndex, setNextSlideIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goToMobile = useCallback(
    (direction: 1 | -1) => {
      if (mobileSlideCount <= 1 || isExiting || isEntering) return;
      const next = (mobileSlide + direction + mobileSlideCount) % mobileSlideCount;
      setNextSlideIndex(next);
      setIsExiting(true);
    },
    [mobileSlide, mobileSlideCount, isExiting, isEntering]
  );

  const handleExitEnd = useCallback(() => {
    if (!isExiting || nextSlideIndex === null) return;
    setMobileSlide(nextSlideIndex);
    setNextSlideIndex(null);
    setIsExiting(false);
    setIsEntering(true);
  }, [isExiting, nextSlideIndex]);

  const handleEnterEnd = useCallback(() => setIsEntering(false), []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    setTouchStart(null);
    if (Math.abs(dx) < 50) return;
    if (dx > 0) goToMobile(-1);
    else goToMobile(1);
  };

  if (slice.length === 0) return null;

  const animationClass = isExiting ? 'featured-exit' : isEntering ? 'featured-enter' : '';
  const pointerNone = isExiting || isEntering ? 'pointer-events-none' : '';
  const currentMobileEvents = mobileSlides[mobileSlide] ?? [];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Events</h2>
        <Link to="/events" className="text-teal-600 font-semibold hover:underline">
          View all events
        </Link>
      </div>

      {/* Mobile: compact block carousel (swipe between slides) */}
      <div
        className={`sm:hidden min-h-[200px] ${animationClass} ${pointerNone}`}
        onAnimationEnd={() => {
          if (isExiting) handleExitEnd();
          if (isEntering) handleEnterEnd();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="space-y-3">
          {currentMobileEvents.map((event: Event) => (
            <EventBlockRow key={event.id} event={event} />
          ))}
        </div>
        {mobileSlideCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => goToMobile(-1)}
              disabled={isExiting || isEntering}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-slate-500 text-sm font-medium tabular-nums min-w-[2rem] text-center">
              {mobileSlide + 1} / {mobileSlideCount}
            </span>
            <button
              type="button"
              onClick={() => goToMobile(1)}
              disabled={isExiting || isEntering}
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
      <div className="hidden sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
