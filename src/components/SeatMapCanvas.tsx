/**
 * Canvas renderer for the seat map. Alternative to SVG SeatMap for performance with many elements.
 * Draws sections, walkway rings, stage, and optional seat-level subdivision.
 */

import { useRef, useEffect, useMemo } from 'react';
import type { Seat, VenueSection } from '../types';
import { getVenueLayout, getSeatPositions, getViewBox } from '../data/venueLayouts';
import { ALL_DECORATION_KEYS, MSG_DECORATION_KEYS } from '../data/venueLayoutConfig';

interface SeatMapCanvasProps {
  venueId: string | undefined;
  eventId: string;
  seats: Seat[];
  sections: VenueSection[];
  /** When true, draw seat dots; otherwise sections only. */
  showSeats?: boolean;
  /** Section fill when no listings (grey). */
  listingCountBySectionId?: Record<string, number>;
  /** Selected section id for highlight. */
  selectedSectionId?: string | null;
  className?: string;
  /** Height in px; width is responsive to viewBox aspect. */
  height?: number;
}

const STAGE_FILL = '#334155';
const SECTION_STROKE = 'rgba(0,0,0,0.15)';
const DECORATION_STROKE = '#475569';
const WALKWAY_STROKE = '#94a3b8';
const NO_LISTING_FILL = '#cbd5e1';
const SECTION_FILL_DEFAULT = '#e2e8f0';

function pathDToPath2D(pathD: string, cutouts?: string[]): Path2D {
  const full = cutouts?.length ? [pathD, ...cutouts].join(' ') : pathD;
  return new Path2D(full);
}

export function SeatMapCanvas({
  venueId,
  eventId,
  seats,
  sections,
  showSeats = false,
  listingCountBySectionId,
  selectedSectionId = null,
  className = '',
  height = 420,
}: SeatMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const layout = useMemo(
    () => getVenueLayout(venueId, eventId, sections),
    [venueId, eventId, sections]
  );
  const seatPositions = useMemo(
    () => getSeatPositions(seats, layout, sections),
    [seats, layout, sections]
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || Object.keys(layout).length === 0) return;

    const viewBox = getViewBox(venueId);
    const vw = viewBox.width;
    const vh = viewBox.height;
    const aspect = vw / vh;
    const width = height * aspect;
    canvas.width = width;
    canvas.height = height;
    const scale = width / vw;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Section shapes (fill + stroke)
    for (const [key, shape] of Object.entries(layout)) {
      if (key === 'stage' || MSG_DECORATION_KEYS.has(key)) continue;
      const hasListings = listingCountBySectionId == null || (listingCountBySectionId[key] ?? 0) > 0;
      const fill = hasListings ? SECTION_FILL_DEFAULT : NO_LISTING_FILL;
      const path = pathDToPath2D(shape.path, shape.cutouts);
      ctx.fillStyle = fill;
      ctx.fill(path, shape.cutouts?.length ? 'evenodd' : 'nonzero');
      ctx.strokeStyle = selectedSectionId === key ? '#0d9488' : SECTION_STROKE;
      ctx.lineWidth = selectedSectionId === key ? 3 / scale : 1.2 / scale;
      ctx.stroke(path);
    }

    // Arena / walkway decoration (stroke only)
    for (const decKey of Array.from(ALL_DECORATION_KEYS) as string[]) {
      if (decKey === 'chaseBridgeLabel') continue;
      const shape = layout[decKey];
      if (!shape) continue;
      const path = new Path2D(shape.path);
      ctx.strokeStyle = decKey.startsWith('walkway') ? WALKWAY_STROKE : DECORATION_STROKE;
      ctx.lineWidth = decKey.startsWith('walkway') ? 1 / scale : 2 / scale;
      if (decKey.startsWith('walkway')) ctx.setLineDash([6, 4]);
      ctx.stroke(path);
      ctx.setLineDash([]);
    }

    // Stage
    if (layout.stage) {
      ctx.fillStyle = STAGE_FILL;
      ctx.fill(new Path2D(layout.stage.path));
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1 / scale;
      ctx.stroke(new Path2D(layout.stage.path));
    }

    // Section labels (section name)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [key, shape] of Object.entries(layout)) {
      if (key === 'stage' || MSG_DECORATION_KEYS.has(key)) continue;
      const sec = sections.find((s) => s.id === key);
      const name = sec?.name ?? key;
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(name, shape.label.x, shape.label.y);
    }

    // Seats (dots)
    if (showSeats) {
      const r = 4;
      seatPositions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#14b8a6';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
      });
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [venueId, layout, seats, sections, seatPositions, showSeats, listingCountBySectionId, selectedSectionId, height]);

  const viewBox = getViewBox(venueId);
  const vw = viewBox.width;
  const vh = viewBox.height;
  const aspect = vw / vh;
  const width = height * aspect;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      style={{ width: '100%', height, maxWidth: width }}
      aria-label="Venue seat map"
    />
  );
}
