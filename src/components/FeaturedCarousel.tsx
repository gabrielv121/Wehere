import { useState, useCallback, useMemo } from 'react';
import { EventCard } from './EventCard';
import type { Event } from '../types';

const EVENTS_PER_SLIDE = 3;
const MAX_SLIDES = 7;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

interface FeaturedCarouselProps {
  events: Event[];
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const slides = useMemo(() => chunk(events, EVENTS_PER_SLIDE).slice(0, MAX_SLIDES), [events]);
  const slideCount = slides.length;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [nextSlideIndex, setNextSlideIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      if (slideCount <= 1 || isExiting || isEntering) return;
      const next = (currentSlide + direction + slideCount) % slideCount;
      setNextSlideIndex(next);
      setIsExiting(true);
    },
    [currentSlide, slideCount, isExiting, isEntering]
  );

  const handleExitEnd = useCallback(() => {
    if (!isExiting || nextSlideIndex === null) return;
    setCurrentSlide(nextSlideIndex);
    setNextSlideIndex(null);
    setIsExiting(false);
    setIsEntering(true);
  }, [isExiting, nextSlideIndex]);

  const handleEnterEnd = useCallback(() => {
    setIsEntering(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    setTouchStart(null);
    if (Math.abs(dx) < 50) return;
    if (dx > 0) goTo(-1);
    else goTo(1);
  };

  if (slideCount === 0) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured events</h2>
        <p className="text-slate-500">No featured events right now.</p>
      </section>
    );
  }

  const currentEvents = slides[currentSlide] ?? [];
  const animationClass = isExiting ? 'featured-exit' : isEntering ? 'featured-enter' : '';

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Featured events</h2>
        {slideCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(-1)}
              disabled={isExiting || isEntering}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              aria-label="Previous slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center justify-center gap-0.5 px-2 min-w-[2rem] text-slate-500 text-sm">
              {Array.from({ length: slideCount }, (_, i) => (
                <span key={i} className="flex items-center gap-0.5">
                  <span
                    className={`font-medium tabular-nums ${
                      i === currentSlide ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {i < slideCount - 1 && <span className="text-slate-300">·</span>}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(1)}
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

      <div
        className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[280px] ${animationClass} ${
          isExiting || isEntering ? 'pointer-events-none' : ''
        }`}
        onAnimationEnd={() => {
          if (isExiting) handleExitEnd();
          if (isEntering) handleEnterEnd();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
