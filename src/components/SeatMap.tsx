/**
 * SeatMap – full React component for venue seating.
 *
 * • Full React component – state, memo, refs, zoom state, tooltips.
 * • MSG-style oval geometry – elliptical bowl from venueLayoutConfig (lower / upper / top rings).
 * • Real section numbers – 100s (101–106), 200s (201–206), 300s (301–306) from sections[].name.
 * • Price bubbles – tier-colored pills (From $X) on every section; grey when no listings.
 * • Clickable sections – onSectionSelect; keyboard + click; selected highlight.
 * • Zoom-ready – react-zoom-pan-pinch; floating + / − / reset controls.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import type { Seat, VenueSection } from '../types';
import { getVenueLayout, getSeatPositions, getRowLabelPositions, getRowEntrancePaths, getSectionRowGrids, getViewBox } from '../data/venueLayouts';
import { ALL_DECORATION_KEYS } from '../data/venueLayoutConfig';
import { fetchVenueMapLayout, fetchVenueMapLayoutForCrypto, getVenueMapImageUrl } from '../data/msgSvgPaths';
import type { VenueLayout } from '../data/venueLayouts';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/** Price tier for seat color (low / mid / high) */
function getPriceTier(price: number, min: number, max: number): 'low' | 'mid' | 'high' {
  const range = max - min;
  if (range <= 0) return 'mid';
  const p = (price - min) / range;
  if (p < 0.33) return 'low';
  if (p > 0.66) return 'high';
  return 'mid';
}

/** Section fill and text color by price tier (TickPick-style) */
function getSectionStyle(tier: 'low' | 'mid' | 'high') {
  switch (tier) {
    case 'low':
      return { fill: '#facc15', stroke: '#eab308', textFill: '#422006' };
    case 'mid':
      return { fill: '#38bdf8', stroke: '#0ea5e9', textFill: '#0c4a6e' };
    case 'high':
      return { fill: '#a78bfa', stroke: '#7c3aed', textFill: '#1e1b4b' };
  }
}

/** Price pill background by tier (TickPick full map: pink = budget, blue = mid, yellow = premium) */
function getPricePillStyle(tier: 'low' | 'mid' | 'high') {
  switch (tier) {
    case 'low':
      return { fill: '#fda4af', stroke: '#f43f5e', textFill: '#881337' };
    case 'mid':
      return { fill: '#93c5fd', stroke: '#3b82f6', textFill: '#1e3a8a' };
    case 'high':
      return { fill: '#fde047', stroke: '#eab308', textFill: '#422006' };
  }
}

interface SeatMapProps {
  venueId: string | undefined;
  eventId: string;
  seats: Seat[];
  sections: VenueSection[];
  /** Optional: event title for map header */
  eventTitle?: string;
  /** Optional: event date string for map header */
  eventDate?: string;
  /** Optional: event category – 'sports' shows green field, else stage */
  eventCategory?: string;
  /** Optional: from price for floating badge */
  fromPrice?: number;
  /** When true, map area fills available height (e.g. right column on event page) */
  fullHeight?: boolean;
  /** Section id when user has selected a section (highlight + link to list) */
  selectedSectionId?: string | null;
  /** Called when user clicks a section (pass section id, or null to clear) */
  onSectionSelect?: (sectionId: string | null) => void;
  /** Optional: listing count per section id (shows "N listings" in section tooltip) */
  listingCountBySectionId?: Record<string, number>;
  /** When false, show only the full section map (TickPick-style); no seat dots, row lines, or row labels. Default false. */
  showSeats?: boolean;
}

const SEAT_R = 4;
const STAGE_FILL = '#334155';
const FIELD_FILL = '#166534';
const FIELD_STROKE = '#14532d';
const SECTION_STROKE = 'rgba(0,0,0,0.15)';

/** TickPick-style vibrant palette for venue map – many distinct colors per section */
const VENUE_MAP_PALETTE: Array<{ fill: string; stroke: string; textFill: string }> = [
  { fill: 'rgba(251, 146, 60, 0.55)', stroke: 'rgba(234, 88, 12, 0.85)', textFill: '#431407' },   // coral
  { fill: 'rgba(52, 211, 153, 0.55)', stroke: 'rgba(5, 150, 105, 0.85)', textFill: '#052e16' },     // mint
  { fill: 'rgba(56, 189, 248, 0.55)', stroke: 'rgba(2, 132, 199, 0.85)', textFill: '#082f49' },   // sky
  { fill: 'rgba(167, 139, 250, 0.55)', stroke: 'rgba(124, 58, 237, 0.85)', textFill: '#2e1065' },  // lavender
  { fill: 'rgba(251, 191, 36, 0.55)', stroke: 'rgba(245, 158, 11, 0.85)', textFill: '#422006' },    // amber
  { fill: 'rgba(251, 113, 133, 0.55)', stroke: 'rgba(225, 29, 72, 0.85)', textFill: '#881337' },   // rose
  { fill: 'rgba(45, 212, 191, 0.55)', stroke: 'rgba(13, 148, 136, 0.85)', textFill: '#134e4a' },   // teal
  { fill: 'rgba(139, 92, 246, 0.55)', stroke: 'rgba(124, 58, 237, 0.85)', textFill: '#2e1065' },   // violet
  { fill: 'rgba(253, 186, 116, 0.55)', stroke: 'rgba(234, 88, 12, 0.85)', textFill: '#431407' },   // peach
  { fill: 'rgba(34, 211, 238, 0.55)', stroke: 'rgba(6, 182, 212, 0.85)', textFill: '#164e63' },     // cyan
  { fill: 'rgba(232, 121, 249, 0.55)', stroke: 'rgba(192, 132, 252, 0.85)', textFill: '#581c87' },  // fuchsia
  { fill: 'rgba(163, 230, 53, 0.55)', stroke: 'rgba(101, 163, 13, 0.85)', textFill: '#365314' },   // lime
];

/** Stable color index from section key (section-101 → 101, msg-floor → 0). Crypto floor/lower/upper get distinct colors. */
function getVenueMapColorIndex(key: string): number {
  if (key === 'floor') return 0;
  if (key === 'lower') return 1;
  if (key === 'upper') return 2;
  const match = key.match(/section-(\d+)/);
  const num = match ? parseInt(match[1], 10) : 0;
  return num > 0 ? num % VENUE_MAP_PALETTE.length : (key.length % VENUE_MAP_PALETTE.length);
}

/** Venue map: TickPick-style – one color per section from rich palette */
function getVenueMapSectionStyle(key: string, _tier: 'low' | 'mid' | 'high') {
  return VENUE_MAP_PALETTE[getVenueMapColorIndex(key)];
}

/** Crypto Arena: transparent by default; highlight only on hover/selection. */
function getCryptoArenaSectionStyle(
  key: string,
  tier: 'low' | 'mid' | 'high',
  isHovered: boolean,
  isSelected: boolean
) {
  const base = getVenueMapSectionStyle(key, tier);
  if (isSelected) {
    return { fill: 'rgba(13,148,136,0.35)', stroke: '#0d9488', textFill: base.textFill };
  }
  if (isHovered) {
    return { fill: 'rgba(56,189,248,0.25)', stroke: 'rgba(2,132,199,0.7)', textFill: base.textFill };
  }
  return { fill: 'transparent', stroke: 'transparent', textFill: base.textFill };
}

/** Floating zoom controls (must be child of TransformWrapper to use useControls). */
function MapZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20 pointer-events-auto">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 font-medium text-lg"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-md text-slate-700 hover:bg-slate-50 font-medium text-lg"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-md text-slate-600 hover:bg-slate-50"
        aria-label="Reset view"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
}

/** Row order for sorting (lower = closer to stage). */
function rowOrder(row: string): number {
  const n = parseInt(row, 10);
  if (!Number.isNaN(n)) return n;
  const c = row.toUpperCase().replace(/\s/g, '');
  if (c.length === 1) return c.charCodeAt(0) - 64; // A=1, B=2, ...
  return 999;
}

/** Per-section stats from seats: row range, count, from price (for section hover tooltip). */
function getSectionStats(
  seats: Seat[],
  sectionIds: string[],
  sectionById: Map<string, VenueSection>
): Map<string, { rowMin: string; rowMax: string; count: number; fromPrice: number }> {
  const out = new Map<string, { rowMin: string; rowMax: string; count: number; fromPrice: number }>();
  for (const sectionId of sectionIds) {
    const section = sectionById.get(sectionId);
    const sectionSeats = section
      ? seats.filter((s) => s.section === section.name)
      : seats.filter((s) => s.section === sectionId);
    if (sectionSeats.length === 0) continue;
    const rows = [...new Set(sectionSeats.map((s) => s.row))].sort(
      (a, b) => rowOrder(a) - rowOrder(b)
    );
    const prices = sectionSeats.map((s) => s.price);
    out.set(sectionId, {
      rowMin: rows[0],
      rowMax: rows[rows.length - 1],
      count: sectionSeats.length,
      fromPrice: Math.min(...prices),
    });
  }
  return out;
}

export function SeatMap({
  venueId,
  eventId,
  seats,
  sections,
  eventTitle,
  eventDate,
  eventCategory,
  fromPrice,
  fullHeight = false,
  selectedSectionId = null,
  onSectionSelect,
  listingCountBySectionId,
  showSeats = false,
}: SeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomScale, setZoomScale] = useState(0.8);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ left: number; top: number; seat: Seat } | null>(null);
  const [sectionTooltip, setSectionTooltip] = useState<{
    left: number;
    top: number;
    sectionId: string;
    sectionName: string;
    rowRange: string;
    count: number;
    fromPrice: number;
    useListings: boolean;
  } | null>(null);

  const [venueMapLayout, setVenueMapLayout] = useState<VenueLayout | null>(null);
  const useCryptoArenaMap = venueId === 'v2' && eventCategory === 'sports';
  useEffect(() => {
    if (venueId === 'v1') {
      fetchVenueMapLayout(sections).then(setVenueMapLayout);
    } else if (useCryptoArenaMap) {
      fetchVenueMapLayoutForCrypto(sections).then(setVenueMapLayout);
    } else {
      setVenueMapLayout(null);
    }
  }, [venueId, sections, useCryptoArenaMap]);

  /** Single source for Crypto: crypto-arena.svg as image + section paths from same file. */
  const venueMapImageUrl = getVenueMapImageUrl(venueId, eventCategory);

  const layout = useMemo(() => {
    if (venueId === 'v1' && venueMapLayout && Object.keys(venueMapLayout).length > 0) {
      return venueMapLayout;
    }
    if (useCryptoArenaMap) {
      return (venueMapLayout && Object.keys(venueMapLayout).length > 0) ? venueMapLayout : ({} as VenueLayout);
    }
    return getVenueLayout(venueId, eventId, sections);
  }, [venueId, eventId, sections, venueMapLayout, useCryptoArenaMap]);
  const seatPositions = useMemo(
    () => getSeatPositions(seats, layout, sections),
    [seats, layout, sections]
  );

  const priceRange = useMemo(() => {
    if (seats.length === 0) return { min: 0, max: 0 };
    const prices = seats.map((s) => s.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [seats]);

  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const layoutSectionIds = useMemo(
    () => Object.keys(layout).filter((k) => k !== 'stage'),
    [layout]
  );
  const sectionStats = useMemo(
    () => getSectionStats(seats, layoutSectionIds, sectionById),
    [seats, layoutSectionIds, sectionById]
  );
  const rowLabelPositions = useMemo(
    () => getRowLabelPositions(seats, layout, sections),
    [seats, layout, sections]
  );
  const rowEntrancePaths = useMemo(
    () => getRowEntrancePaths(seats, layout, sections),
    [seats, layout, sections]
  );
  const sectionRowGrids = useMemo(
    () => getSectionRowGrids(seats, layout, sections),
    [seats, layout, sections]
  );

  const globalPriceMin = useMemo(() => {
    if (fromPrice != null) return fromPrice;
    return sections.length ? Math.min(...sections.map((s) => s.priceMin)) : 0;
  }, [fromPrice, sections]);
  const globalPriceMax = useMemo(() => {
    return sections.length ? Math.max(...sections.map((s) => s.priceMax)) : 0;
  }, [sections]);

  const isSports = eventCategory === 'sports';

  if (sections.length === 0) return null;

  const viewBox = getViewBox(venueId, { eventCategory });
  const { width, height, minX = 0, minY = 0 } = viewBox;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm ${fullHeight ? 'flex flex-col min-h-0 h-full lg:rounded-none lg:border-l' : ''}`}
    >
      {!fullHeight && ((eventTitle != null || eventDate != null) ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="min-w-0">
              {eventTitle != null && (
                <h3 className="font-semibold text-slate-900 truncate" title={eventTitle}>
                  {eventTitle}
                </h3>
              )}
              {eventDate != null && (
                <p className="text-slate-500 text-sm mt-0.5">{eventDate}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900">Venue seat map</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Zoom and pan. Hover a seat for details. Colors = price tier.
            </p>
          </div>
        ))}

      <div
        ref={containerRef}
        className={`relative bg-slate-100 ${fullHeight ? 'flex-1 min-h-0 flex flex-col' : ''}`}
        style={fullHeight ? undefined : { minHeight: 420 }}
        onMouseMove={(e) => {
          if (tooltip && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltip((t) => (t ? { ...t, left: e.clientX - rect.left, top: e.clientY - rect.top } : null));
          }
        }}
      >
        <div className={fullHeight ? 'flex-1 min-h-0 min-w-0' : undefined}>
          <TransformWrapper
            initialScale={0.8}
            minScale={0.3}
            maxScale={4}
            centerOnInit
            limitToBounds={false}
            panning={{ velocityDisabled: true }}
            doubleClick={{ mode: 'reset' }}
            onTransformed={(_, state) => setZoomScale(state.scale)}
            onInit={(ref) => setZoomScale(ref.state.scale)}
          >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: fullHeight ? '100%' : 420 }}
            contentStyle={{ width: '100%', height: fullHeight ? '100%' : 420 }}
          >
            <svg
              viewBox={`${minX} ${minY} ${width} ${height}`}
              className="w-full h-full block"
              style={fullHeight ? { minHeight: 0 } : { minHeight: 420 }}
              onMouseLeave={() => {
                setHoveredSeatId(null);
                setTooltip(null);
                setSectionTooltip(null);
              }}
            >
              {/* Venue map image: Crypto.com Arena only (crypto-arena.svg) */}
              {venueMapImageUrl && (
                <image
                  href={venueMapImageUrl}
                  x={minX}
                  y={minY}
                  width={width}
                  height={height}
                  preserveAspectRatio="xMidYMid meet"
                  className="pointer-events-none"
                />
              )}
              <defs>
                {!venueMapImageUrl && Object.entries(layout).map(
                  ([key, shape]) =>
                    key !== 'stage' &&
                    !ALL_DECORATION_KEYS.has(key) && (
                      <clipPath key={key} id={`section-clip-${key}`}>
                        <path d={shape.path} />
                      </clipPath>
                    )
                )}
              </defs>
              {/* Section shapes – Crypto: SVG section paths (Court, Lower Bowl, Upper Bowl); color by availability */}
              {Object.entries(layout).map(([key, shape]) => {
                if (key === 'stage' || ALL_DECORATION_KEYS.has(key)) return null;
                const section = sectionById.get(key);
                const listingCountByKey = listingCountBySectionId?.[key] ?? 0;
                const listingCountByName = section ? (listingCountBySectionId?.[section.name] ?? 0) : 0;
                const seatCount = sectionStats.get(key)?.count ?? 0;
                const hasAvailableSeats = listingCountByKey > 0 || listingCountByName > 0 || seatCount > 0;
                const range = globalPriceMax - globalPriceMin;
                const midPrice =
                  section != null
                    ? (section.priceMin + section.priceMax) / 2
                    : (globalPriceMin + globalPriceMax) / 2;
                const tier: 'low' | 'mid' | 'high' =
                  range <= 0
                    ? 'mid'
                    : midPrice - globalPriceMin < range * 0.33
                      ? 'low'
                      : midPrice - globalPriceMin > range * 0.66
                        ? 'high'
                        : 'mid';
                const hasListings = listingCountBySectionId == null || (listingCountBySectionId[key] ?? 0) > 0;
                const useSvgMap = venueId === 'v1' || useCryptoArenaMap;
                const isSelected = selectedSectionId === key;
                const isHovered = sectionTooltip?.sectionId === key;
                const style = useCryptoArenaMap
                  ? getCryptoArenaSectionStyle(key, tier, isHovered, isSelected)
                  : useSvgMap
                    ? getVenueMapSectionStyle(key, tier)
                    : (hasListings ? getSectionStyle(tier) : { fill: '#cbd5e1', stroke: '#94a3b8', textFill: '#475569' });
                const canSelect = Boolean(onSectionSelect) && (!useCryptoArenaMap || hasAvailableSeats);
                const stats = sectionStats.get(key);
                const listingCount = listingCountBySectionId?.[key];
                const useListings = listingCount != null && listingCount > 0;
                const rowRangeStr =
                  showSeats && stats?.rowMin != null && stats?.rowMax != null
                    ? stats.rowMin === stats.rowMax
                      ? `Row ${stats.rowMin}`
                      : `Rows ${stats.rowMin}–${stats.rowMax}`
                    : null;
                return (
                  <g
                    key={key}
                    role={canSelect ? 'button' : undefined}
                    tabIndex={canSelect ? 0 : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canSelect) onSectionSelect?.(isSelected ? null : key);
                    }}
                    onPointerDown={(e) => canSelect && e.stopPropagation()}
                    style={{
                      cursor: canSelect ? 'pointer' : 'default',
                      ...(canSelect && { pointerEvents: 'all' as const }),
                    }}
                    onMouseEnter={(e) => {
                      if (!containerRef.current) return;
                      const rect = containerRef.current.getBoundingClientRect();
                      const fromPriceVal = stats?.fromPrice ?? section?.priceMin ?? 0;
                      setSectionTooltip({
                        left: e.clientX - rect.left,
                        top: e.clientY - rect.top,
                        sectionId: key,
                        sectionName: section?.name ?? key,
                        rowRange: rowRangeStr ?? '—',
                        count: useListings ? listingCount! : stats?.count ?? 0,
                        fromPrice: fromPriceVal,
                        useListings,
                      });
                    }}
                    onMouseLeave={() => setSectionTooltip(null)}
                  >
                    <path
                      d={shape.cutouts?.length ? [shape.path, ...shape.cutouts].join(' ') : shape.path}
                      fill={style.fill}
                      fillRule={shape.fillRule ?? (shape.cutouts?.length ? 'evenodd' : undefined)}
                      stroke={isSelected ? '#0d9488' : useSvgMap ? style.stroke : SECTION_STROKE}
                      strokeWidth={isSelected ? 3 : useSvgMap ? 1.5 : 1.2}
                      style={canSelect ? { pointerEvents: 'all' } : undefined}
                      className={canSelect ? '' : 'pointer-events-none'}
                    />
                    {section && (
                      <g className="pointer-events-none select-none">
                        {useSvgMap && (
                          <text
                            x={shape.label.x}
                            y={shape.label.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ fontSize: 15, fontWeight: 800, fill: 'none', stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke fill' }}
                          >
                            {section.name}
                          </text>
                        )}
                        <text
                          x={shape.label.x}
                          y={shape.label.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: useSvgMap ? 15 : 14,
                            fontWeight: 700,
                            fill: style.textFill,
                          }}
                        >
                          {section.name}
                        </text>
                      </g>
                    )}
                    {/* Price pill – show tickets on venue map (From $X) */}
                    {hasListings && (() => {
                      const fromPriceVal = (showSeats ? stats?.fromPrice : null) ?? section?.priceMin ?? 0;
                      if (fromPriceVal <= 0) return null;
                      const pillStyle = getPricePillStyle(tier);
                      const px = shape.label.x;
                      const py = shape.label.y + (useSvgMap ? 22 : 14);
                      const ph = 18;
                      const pw = fromPriceVal >= 1000 ? 52 : 44;
                      return (
                        <g key={`pill-${key}`} className="pointer-events-none">
                          <rect x={px - pw / 2} y={py - ph / 2} width={pw} height={ph} rx={6} ry={6} fill={pillStyle.fill} stroke={pillStyle.stroke} strokeWidth={1} />
                          <text x={px} y={py} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fontWeight: 700, fill: pillStyle.textFill }}>
                            {formatPrice(fromPriceVal)}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Arena / walkway decoration – hidden when using Crypto venue map */}
              {venueId !== 'v1' &&
                Array.from(ALL_DECORATION_KEYS)
                  .filter((decKey) => decKey !== 'chaseBridgeLabel' && layout[decKey])
                  .map((decKey) => {
                    const shape = layout[decKey];
                    if (!shape) return null;
                    const isArena = decKey === 'arenaInner' || decKey === 'arenaOuter';
                    const isWalkway = decKey.startsWith('walkway');
                    return (
                      <path
                        key={decKey}
                        d={shape.path}
                        fill="none"
                        stroke={decKey === 'chaseBridge' ? '#64748b' : isArena ? '#475569' : '#94a3b8'}
                        strokeWidth={decKey === 'chaseBridge' ? 1.5 : isArena ? 2 : 1}
                        strokeDasharray={isWalkway ? '6 4' : undefined}
                        className="pointer-events-none"
                      />
                    );
                  })}
              {/* Chase Bridge label – hidden when using Crypto venue map */}
              {layout['chaseBridgeLabel'] && venueId !== 'v1' && (
                <text
                  x={layout['chaseBridgeLabel'].label.x}
                  y={layout['chaseBridgeLabel'].label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  style={{ fontSize: 12, fontWeight: 600, fill: '#64748b', letterSpacing: '0.02em' }}
                >
                  Chase Bridge
                </text>
              )}

              {/* Row divider lines – only when showSeats, for non-polar sections; hidden for Crypto map */}
              {showSeats && venueId !== 'v1' && zoomScale >= 1.0 &&
                sectionRowGrids
                  .filter((grid) => !layout[grid.sectionId]?.polar)
                  .map((grid) => (
                  <g
                    key={`grid-${grid.sectionId}`}
                    clipPath={`url(#section-clip-${grid.sectionId})`}
                    className="pointer-events-none"
                  >
                    {grid.rowBoundaryYs.map((y, i) => (
                      <line
                        key={i}
                        x1={grid.bounds.x}
                        y1={y}
                        x2={grid.bounds.x + grid.bounds.w}
                        y2={y}
                        stroke="rgba(0,0,0,0.2)"
                        strokeWidth={1}
                      />
                    ))}
                  </g>
                ))}

              {/* Row entrances – visible when zoomed; hidden for Crypto map */}
              {venueId !== 'v1' && zoomScale >= 1.0 &&
                rowEntrancePaths.map((ent) => (
                  <path
                    key={`entrance-${ent.sectionId}-${ent.row}`}
                    d={ent.path}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="pointer-events-none"
                  />
                ))}

              {/* Row labels – visible when zoomed; hidden for Crypto map */}
              {venueId !== 'v1' && zoomScale >= 1.0 &&
                rowLabelPositions.map((pos) => {
                  const fontSize = Math.round(Math.max(11, Math.min(16, 10 * zoomScale)));
                  return (
                    <g key={`${pos.sectionId}-${pos.row}`} className="pointer-events-none select-none">
                      {/* White stroke so row number reads on yellow/blue/purple sections */}
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="start"
                        dominantBaseline="middle"
                        style={{
                          fontSize,
                          fontWeight: 700,
                          fill: 'none',
                          stroke: '#fff',
                          strokeWidth: 2.5,
                          paintOrder: 'stroke fill',
                        }}
                      >
                        {pos.row}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="start"
                        dominantBaseline="middle"
                        style={{ fontSize, fontWeight: 700, fill: '#1e293b' }}
                      >
                        {pos.row}
                      </text>
                    </g>
                  );
                })}

              {/* Center: stage (path only when not using SVG map; label always when layout has stage) */}
              {layout['stage'] && venueId !== 'v1' && (
                <path
                  d={layout['stage'].path}
                  fill={isSports ? FIELD_FILL : STAGE_FILL}
                  stroke={isSports ? FIELD_STROKE : '#475569'}
                  strokeWidth={1}
                  className="pointer-events-none"
                />
              )}
              {layout['stage'] && (
                <g className="pointer-events-none">
                  {venueId === 'v1' && (
                    <text
                      x={layout['stage'].label.x}
                      y={layout['stage'].label.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 18, fontWeight: 800, fill: 'none', stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke fill' }}
                    >
                      {isSports ? 'FIELD' : 'STAGE'}
                    </text>
                  )}
                  <text
                    x={layout['stage'].label.x}
                    y={layout['stage'].label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-semibold"
                    style={{
                      fontSize: venueId === 'v1' ? 18 : 14,
                      fontWeight: venueId === 'v1' ? 800 : 600,
                      fill: isSports ? '#bbf7d0' : venueId === 'v1' ? '#1e293b' : '#fff',
                    }}
                  >
                    {isSports ? 'FIELD' : 'STAGE'}
                  </text>
                </g>
              )}

              {/* Seats – only when showSeats; hidden when using Crypto venue map */}
              {showSeats && venueId !== 'v1' && seats.map((seat) => {
                const pos = seatPositions.get(seat.id);
                if (!pos) return null;
                const tier = getPriceTier(seat.price, priceRange.min, priceRange.max);
                const fill = seat.available
                  ? tier === 'low'
                    ? '#10b981'
                    : tier === 'high'
                      ? '#f59e0b'
                      : '#14b8a6'
                  : '#94a3b8';
                const isHovered = hoveredSeatId === seat.id;
                return (
                  <g
                    key={seat.id}
                    onMouseEnter={(e) => {
                      setHoveredSeatId(seat.id);
                      if (containerRef.current) {
                        const rect = containerRef.current.getBoundingClientRect();
                        setTooltip({
                          left: e.clientX - rect.left,
                          top: e.clientY - rect.top,
                          seat,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      if (hoveredSeatId === seat.id) {
                        setHoveredSeatId(null);
                        setTooltip(null);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={SEAT_R}
                      fill={fill}
                      stroke={isHovered ? '#0f766e' : '#64748b'}
                      strokeWidth={isHovered ? 2 : 0.5}
                    />
                  </g>
                );
              })}
            </svg>
            </TransformComponent>
            <MapZoomControls />
          </TransformWrapper>
        </div>

        {/* Floating price tag – TickPick-style: oval, green outline, $ icon, white price */}
        {(fromPrice != null || globalPriceMin > 0) && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border-2 border-emerald-500 bg-black py-2 pl-3 pr-4 shadow-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span className="text-xl font-bold tabular-nums text-white">
              {formatPrice(fromPrice ?? globalPriceMin)}
            </span>
          </div>
        )}

        {/* Seat tooltip – only when showSeats */}
        {showSeats && tooltip && (
          <div
            className="absolute z-10 pointer-events-none px-3 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg border border-slate-700"
            style={{
              left: tooltip.left + 12,
              top: tooltip.top + 8,
            }}
          >
            <div className="font-semibold">
              Section {tooltip.seat.section} · Row {tooltip.seat.row} · Seat {tooltip.seat.number}
            </div>
            <div className="text-slate-300 mt-0.5">
              {formatPrice(tooltip.seat.price)}
              {!tooltip.seat.available && ' · Sold'}
            </div>
          </div>
        )}

        {/* Section hover tooltip – row range, listing count, From $X */}
        {sectionTooltip && (
          <div
            className="absolute z-10 pointer-events-none px-3 py-2 rounded-lg bg-slate-900 text-white text-sm shadow-lg border border-slate-700 max-w-[220px]"
            style={{
              left: sectionTooltip.left + 12,
              top: sectionTooltip.top + 8,
            }}
          >
            <div className="font-semibold">{sectionTooltip.sectionName}</div>
            <div className="text-slate-300 mt-0.5">{sectionTooltip.rowRange}</div>
            <div className="text-slate-300 mt-0.5">
              {sectionTooltip.count} {sectionTooltip.useListings ? 'listing' : 'seat'}{sectionTooltip.count !== 1 ? 's' : ''}
            </div>
            <div className="text-emerald-400 font-medium mt-1">
              From {formatPrice(sectionTooltip.fromPrice)}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs">
        {useCryptoArenaMap ? (
          <>
            <span className="text-slate-500">Crypto.com Arena</span>
            <span className="text-slate-400">· Basketball · Select a section from the list</span>
          </>
        ) : venueId === 'v1' ? (
          <>
            <span className="text-slate-500">Section colors (TickPick-style):</span>
            {VENUE_MAP_PALETTE.slice(0, 8).map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: c.stroke }} />
              </span>
            ))}
            <span className="text-slate-400">· Price in each section: From $X</span>
          </>
        ) : (
          <>
            <span className="text-slate-500">Section price:</span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-amber-400" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-sky-400" /> Mid
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-violet-400" /> High
            </span>
          </>
        )}
        {showSeats && (
          <>
            <span className="text-slate-400">·</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-slate-400" /> Seat sold
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Zoom in to see row numbers</span>
          </>
        )}
      </div>
    </div>
  );
}
