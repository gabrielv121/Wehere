import { useState, useCallback, useMemo } from 'react';
import { EventCard } from './EventCard';
import { EventBlockRow } from './EventBlockRow';
import type { Event } from '../types';

const EVENTS_PER_SLIDE_DESKTOP = 3;
const EVENTS_PER_SLIDE_MOBILE = 3;
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
  const mobileSlides = useMemo(
    () => chunk(events, EVENTS_PER_SLIDE_MOBILE).slice(0, MAX_SLIDES),
    [events]
  );
  const desktopSlides = useMemo(
    () => chunk(events, EVENTS_PER_SLIDE_DESKTOP).slice(0, MAX_SLIDES),
    [events]
  );
  const mobileSlideCount = mobileSlides.length;
  const desktopSlideCount = desktopSlides.length;

  const [mobileSlide, setMobileSlide] = useState(0);
  const [desktopSlide, setDesktopSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [nextSlideIndex, setNextSlideIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goToMobile = useCallback(
    (direction: 1 | -1) => {
      if (mobileSlideCount <= 1 || isExiting || isEntering) return;
      const next = (mobileSlide + direction + mobileSlideCount) % mobileSlideCount;
      setNextSlideIndex(next);
      setIsMobile(true);
      setIsExiting(true);
    },
    [mobileSlide, mobileSlideCount, isExiting, isEntering]
  );

  const goToDesktop = useCallback(
    (direction: 1 | -1) => {
      if (desktopSlideCount <= 1 || isExiting || isEntering) return;
      const next = (desktopSlide + direction + desktopSlideCount) % desktopSlideCount;
      setNextSlideIndex(next);
      setIsMobile(false);
      setIsExiting(true);
    },
    [desktopSlide, desktopSlideCount, isExiting, isEntering]
  );

  const handleExitEnd = useCallback(() => {
    if (!isExiting || nextSlideIndex === null) return;
    if (isMobile) setMobileSlide(nextSlideIndex);
    else setDesktopSlide(nextSlideIndex);
    setNextSlideIndex(null);
    setIsExiting(false);
    setIsEntering(true);
  }, [isExiting, nextSlideIndex, isMobile]);

  const handleEnterEnd = useCallback(() => setIsEntering(false), []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEndMobile = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    setTouchStart(null);
    if (Math.abs(dx) < 50) return;
    if (dx > 0) goToMobile(-1);
    else goToMobile(1);
  };
  const handleTouchEndDesktop = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    setTouchStart(null);
    if (Math.abs(dx) < 50) return;
    if (dx > 0) goToDesktop(-1);
    else goToDesktop(1);
  };

  if (events.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured events</h2>
        <p className="text-slate-500">No featured events right now.</p>
      </section>
    );
  }

  const currentMobileEvents = mobileSlides[mobileSlide] ?? [];
  const currentDesktopEvents = desktopSlides[desktopSlide] ?? [];
  const animationClass = isExiting ? 'featured-exit' : isEntering ? 'featured-enter' : '';
  const pointerNone = isExiting || isEntering ? 'pointer-events-none' : '';

  const slideIndicators = (count: number, current: number, goPrev: () => void, goNext: () => void) =>
    count > 1 ? (
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={isExiting || isEntering}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-slate-500 text-sm font-medium tabular-nums min-w-[2rem] text-center">
          {current + 1} / {count}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={isExiting || isEntering}
          className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          aria-label="Next slide"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    ) : null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured events</h2>

      {/* Mobile: compact block carousel (swipe between slides) */}
      <div
        className={`sm:hidden min-h-[200px] ${animationClass} ${pointerNone}`}
        onAnimationEnd={() => {
          if (isExiting) handleExitEnd();
          if (isEntering) handleEnterEnd();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEndMobile}
      >
        <div className="space-y-3">
          {currentMobileEvents.map((event) => (
            <EventBlockRow key={event.id} event={event} />
          ))}
        </div>
        {slideIndicators(mobileSlideCount, mobileSlide, () => goToMobile(-1), () => goToMobile(1))}
      </div>

      {/* sm and up: carousel with cards */}
      <div className="hidden sm:block">
        {slideIndicators(desktopSlideCount, desktopSlide, () => goToDesktop(-1), () => goToDesktop(1))}
        <div
          className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[280px] mt-6 ${animationClass} ${pointerNone}`}
          onAnimationEnd={() => {
            if (isExiting) handleExitEnd();
            if (isEntering) handleEnterEnd();
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEndDesktop}
        >
          {currentDesktopEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
