import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EventCard } from './EventCard';
import { EventBlockRow } from './EventBlockRow';
import { useEvents } from '../context/EventsContext';
import type { Event } from '../types';
import type { Category } from '../types';

const EVENTS_PER_SLIDE_MOBILE = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

interface CategoryCarouselSectionProps {
  title: string;
  category: Category;
  viewAllHref: string;
  /** Number of events per slide on desktop (and max per slide on mobile). */
  eventsPerSlide: 3 | 4;
}

export function CategoryCarouselSection({
  title,
  category,
  viewAllHref,
  eventsPerSlide,
}: CategoryCarouselSectionProps) {
  const { events } = useEvents();

  const list = useMemo(() => {
    return events
      .filter((e) => e.visible !== false && e.category === category)
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, category]);

  const mobileChunkSize = Math.min(EVENTS_PER_SLIDE_MOBILE, eventsPerSlide);
  const mobileSlides = useMemo(() => chunk(list, mobileChunkSize), [list, mobileChunkSize]);
  const desktopSlides = useMemo(() => chunk(list, eventsPerSlide), [list, eventsPerSlide]);

  const mobileSlideCount = mobileSlides.length;
  const desktopSlideCount = desktopSlides.length;
  const slideCount = desktopSlideCount;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [nextSlideIndex, setNextSlideIndex] = useState<number | null>(null);
  const [isMobileNav, setIsMobileNav] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goTo = useCallback(
    (direction: 1 | -1) => {
      if (slideCount <= 1 || isExiting || isEntering) return;
      const next = (currentSlide + direction + slideCount) % slideCount;
      setNextSlideIndex(next);
      setIsMobileNav(false);
      setIsExiting(true);
    },
    [currentSlide, slideCount, isExiting, isEntering]
  );

  const goToMobile = useCallback(
    (direction: 1 | -1) => {
      if (mobileSlideCount <= 1 || isExiting || isEntering) return;
      const next = (mobileSlide + direction + mobileSlideCount) % mobileSlideCount;
      setNextSlideIndex(next);
      setIsMobileNav(true);
      setIsExiting(true);
    },
    [mobileSlide, mobileSlideCount, isExiting, isEntering]
  );

  const handleExitEnd = useCallback(() => {
    if (!isExiting || nextSlideIndex === null) return;
    if (isMobileNav) setMobileSlide(nextSlideIndex);
    else setCurrentSlide(nextSlideIndex);
    setNextSlideIndex(null);
    setIsExiting(false);
    setIsEntering(true);
  }, [isExiting, nextSlideIndex, isMobileNav]);

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

  const currentMobileEvents = mobileSlides[mobileSlide] ?? [];
  const currentDesktopEvents = desktopSlides[currentSlide] ?? [];
  const animationClass = isExiting ? 'featured-exit' : isEntering ? 'featured-enter' : '';
  const gridCols = eventsPerSlide === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

  if (list.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <div className="flex items-center gap-4">
          <Link to={viewAllHref} className="text-teal-600 font-semibold hover:underline">
            View all
          </Link>
          {slideCount > 1 && (
          <div className="hidden sm:flex items-center gap-2">
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
                    className={`font-medium tabular-nums ${i === currentSlide ? 'text-teal-600' : 'text-slate-400'}`}
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
      </div>

      {/* Mobile: compact block carousel */}
      <div
        className={`sm:hidden min-h-[200px] ${animationClass} ${isExiting || isEntering ? 'pointer-events-none' : ''}`}
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

      {/* Desktop: grid carousel */}
      <div
        className={`hidden sm:grid gap-6 ${gridCols} min-h-[280px] ${animationClass} ${
          isExiting || isEntering ? 'pointer-events-none' : ''
        }`}
        onAnimationEnd={() => {
          if (isExiting) handleExitEnd();
          if (isEntering) handleEnterEnd();
        }}
      >
        {currentDesktopEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
