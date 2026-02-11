import type { VenueSection } from '../types';
import { VENUE_LAYOUT_CONFIG, ALL_DECORATION_KEYS } from './venueLayoutConfig';
import type { VenueLayoutConfig } from './venueLayoutConfig';

/** Default SVG viewBox when venue has no schematic. */
export const VIEWBOX_DEFAULT = { width: 1728, height: 800 };

/** ViewBox for MSG (venue-map-msg.svg). */
export const MSG_SVG_VIEWBOX = { width: 2000, height: 2000 };

/** ViewBox for Crypto.com Arena (crypto-arena.svg) – basketball. Full SVG is 2000×2000; content fits in this region. */
export const CRYPTO_ARENA_VIEWBOX = {
  minX: 313,
  minY: 575,
  width: 1369,
  height: 1162,
};

/** Legacy export; use getViewBox(venueId) for venue-specific dimensions. */
export const VIEWBOX = VIEWBOX_DEFAULT;

/** ViewBox per venue. v1 = MSG 2000×2000; v2 + sports = Crypto (content-fit); else default. minX/minY optional for content-fit. */
export function getViewBox(
  venueId: string | undefined,
  opts?: { eventCategory?: string }
): { width: number; height: number; minX?: number; minY?: number } {
  if (venueId === 'v1') return MSG_SVG_VIEWBOX;
  if (venueId === 'v2' && opts?.eventCategory === 'sports') return CRYPTO_ARENA_VIEWBOX;
  return VIEWBOX_DEFAULT;
}

/** Polar/elliptical wedge params for placing seats along the actual section curve (not a rectangle). */
export interface SectionPolar {
  cx: number;
  cy: number;
  a0: number;
  a1: number;
  rxInner: number;
  ryInner: number;
  rxOuter: number;
  ryOuter: number;
}

/** Polygon path (points string or path d) and bounding box for seat grid placement */
export interface SectionShape {
  /** SVG path d for the section polygon */
  path: string;
  /** Bounding box for laying out seats: x, y, width, height */
  bounds: { x: number; y: number; w: number; h: number };
  /** Section label position (center of section for text) */
  label: { x: number; y: number };
  /** When set, seats are placed along the curved wedge (angle + radius) instead of a rectangular grid */
  polar?: SectionPolar;
  /** Optional hole paths (walkway cutouts). Use with fillRule="evenodd"; each path d is drawn opposite winding to form a hole. */
  cutouts?: string[];
  /** Explicit fill rule for path (e.g. "evenodd" for ring shapes with hole in same path d). */
  fillRule?: 'evenodd';
  /** Optional path d for the section entrance (inner arc). When zoomed, only this is shown as the section boundary. */
  entrancePath?: string;
}

/** Venue layout: section id -> shape. Used to draw SVG and place seats. */
export type VenueLayout = Record<string, SectionShape>;

/** Elliptical arc for oval stadium bowl */
function polarToCartesianEllipse(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy - ry * Math.sin(rad) };
}

/** Build oval arena: stage at bottom, then floor, then lower/upper sections in elliptical bowl. */
function buildArenaSemicircle(sections: VenueSection[]): VenueLayout {
  const cx = 864;
  const cy = 420;
  const layout: VenueLayout = {};

  const floor = sections.find((s) => s.tier === 'floor');
  const lower = sections.filter((s) => s.tier === 'lower').sort((a, b) => a.order - b.order);
  const upper = sections.filter((s) => s.tier === 'upper').sort((a, b) => a.order - b.order);

  const stageY = 720;
  const stageH = 80;
  const stageW = 600;
  layout['stage'] = {
    path: `M ${cx - stageW / 2} ${stageY} L ${cx + stageW / 2} ${stageY} L ${cx + stageW / 2} ${stageY + stageH} L ${cx - stageW / 2} ${stageY + stageH} Z`,
    bounds: { x: cx - stageW / 2, y: stageY, w: stageW, h: stageH },
    label: { x: cx, y: stageY + stageH / 2 },
  };

  if (floor) {
    const fw = 360;
    layout[floor.id] = {
      path: `M ${cx - fw / 2} 580 L ${cx + fw / 2} 580 L ${cx + fw / 2} 650 L ${cx - fw / 2} 650 Z`,
      bounds: { x: cx - fw / 2, y: 580, w: fw, h: 70 },
      label: { x: cx, y: 615 },
    };
  }

  // Lower bowl: full semicircle arc (5°–175°) so both sides of the venue are visible
  const lowerCount = Math.max(1, lower.length);
  const lowerStartAngle = 5;
  const lowerEndAngle = 175;
  const lowerAngleStep = (lowerEndAngle - lowerStartAngle) / lowerCount;
  const rInner = 220;
  const rOuter = 380;
  const ovalX = 1.35;
  const rxInner = rInner * ovalX;
  const ryInner = rInner;
  const rxOuter = rOuter * ovalX;
  const ryOuter = rOuter;

  lower.forEach((sec, i) => {
    const a0 = lowerStartAngle + i * lowerAngleStep;
    const a1 = lowerStartAngle + (i + 1) * lowerAngleStep;
    const p1 = polarToCartesianEllipse(cx, cy, rxInner, ryInner, a0);
    const p2 = polarToCartesianEllipse(cx, cy, rxInner, ryInner, a1);
    const p3 = polarToCartesianEllipse(cx, cy, rxOuter, ryOuter, a1);
    const p4 = polarToCartesianEllipse(cx, cy, rxOuter, ryOuter, a0);
    const path = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
    const labelPt = polarToCartesianEllipse(cx, cy, (rxInner + rxOuter) / 2, (ryInner + ryOuter) / 2, (a0 + a1) / 2);
    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
    layout[sec.id] = {
      path,
      bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      label: { x: labelPt.x, y: labelPt.y },
    };
  });

  // Upper bowl (oval)
  const upperCount = Math.max(1, upper.length);
  const upperAngleStep = (lowerEndAngle - lowerStartAngle) / upperCount;
  const uInner = 380;
  const uOuter = 520;
  const uxInner = uInner * ovalX;
  const uyInner = uInner;
  const uxOuter = uOuter * ovalX;
  const uyOuter = uOuter;

  upper.forEach((sec, i) => {
    const a0 = lowerStartAngle + i * upperAngleStep;
    const a1 = lowerStartAngle + (i + 1) * upperAngleStep;
    const p1 = polarToCartesianEllipse(cx, cy, uxInner, uyInner, a0);
    const p2 = polarToCartesianEllipse(cx, cy, uxInner, uyInner, a1);
    const p3 = polarToCartesianEllipse(cx, cy, uxOuter, uyOuter, a1);
    const p4 = polarToCartesianEllipse(cx, cy, uxOuter, uyOuter, a0);
    const path = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
    const labelPt = polarToCartesianEllipse(cx, cy, (uxInner + uxOuter) / 2, (uyInner + uyOuter) / 2, (a0 + a1) / 2);
    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);
    layout[sec.id] = {
      path,
      bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      label: { x: labelPt.x, y: labelPt.y },
    };
  });

  return layout;
}

/** Simple 3-block layout: one floor, one lower, one upper (e.g. event 2). */
function buildSimpleArena(sections: VenueSection[]): VenueLayout {
  const layout: VenueLayout = {};
  layout['stage'] = {
    path: 'M 250 700 L 750 700 L 750 780 L 250 780 Z',
    bounds: { x: 250, y: 700, w: 500, h: 80 },
    label: { x: 500, y: 740 },
  };

  const floor = sections.find((s) => s.tier === 'floor');
  const lower = sections.find((s) => s.tier === 'lower');
  const upper = sections.find((s) => s.tier === 'upper');

  if (floor) {
    layout[floor.id] = {
      path: 'M 350 560 L 650 560 L 650 640 L 350 640 Z',
      bounds: { x: 350, y: 560, w: 300, h: 80 },
      label: { x: 500, y: 600 },
    };
  }
  if (lower) {
    layout[lower.id] = {
      path: 'M 200 320 L 800 320 L 800 520 L 200 520 Z',
      bounds: { x: 200, y: 320, w: 600, h: 200 },
      label: { x: 500, y: 420 },
    };
  }
  if (upper) {
    layout[upper.id] = {
      path: 'M 120 80 L 880 80 L 880 280 L 120 280 Z',
      bounds: { x: 120, y: 80, w: 760, h: 200 },
      label: { x: 500, y: 180 },
    };
  }

  return layout;
}

/** Return only stage + sections that exist on this event (by section id), plus MSG decoration keys (walkways, arena rings, Chase Bridge label). */
function filterLayoutForSections(layout: VenueLayout, sections: VenueSection[]): VenueLayout {
  const out: VenueLayout = {};
  if (layout.stage) out.stage = layout.stage;
  sections.forEach((sec) => {
    const shape = layout[sec.id];
    if (shape) out[sec.id] = shape;
  });
  ALL_DECORATION_KEYS.forEach((key) => {
    if (layout[key]) out[key] = layout[key];
  });
  return out;
}

/**
 * Get SVG venue layout for an event. Uses venue layout config (exact shapes) when available,
 * otherwise falls back to procedural layout by event/sections.
 */
export function getVenueLayout(
  venueId: string | undefined,
  eventId: string,
  sections: VenueSection[]
): VenueLayout {
  if (sections.length === 0) return {};

  const config: VenueLayoutConfig | undefined = venueId ? VENUE_LAYOUT_CONFIG[venueId] : undefined;
  if (config) {
    const layout = typeof config === 'function' ? config(sections) : config;
    return filterLayoutForSections(layout, sections);
  }

  // Procedural fallback when no config for this venue
  if (eventId === '1' && sections.some((s) => s.tier === 'lower' && s.name.length <= 4)) {
    return buildArenaSemicircle(sections);
  }
  return buildSimpleArena(sections);
}

/** Seat position in SVG coordinates (for rendering) */
export interface SeatPosition {
  x: number;
  y: number;
}

/** Resolve section name (from seat) to layout key (section id). */
function sectionToLayoutKey(sectionName: string, sections: VenueSection[]): string {
  const byName = sections.find((s) => s.name === sectionName);
  return byName ? byName.id : sectionName.toLowerCase();
}

/**
 * Compute (x, y) for each seat from venue layout. Seats are placed in a grid within each section's bounds.
 */
export function getSeatPositions(
  seats: { id: string; section: string; row: string; number: string }[],
  layout: VenueLayout,
  sections: VenueSection[]
): Map<string, SeatPosition> {
  const out = new Map<string, SeatPosition>();
  const bySection = new Map<string, { row: string; number: string; id: string }[]>();
  for (const s of seats) {
    const key = sectionToLayoutKey(s.section, sections);
    const list = bySection.get(key) ?? [];
    list.push({ row: s.row, number: s.number, id: s.id });
    bySection.set(key, list);
  }

  const rowOrder = (a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  bySection.forEach((list, sectionId) => {
    const shape = layout[sectionId];
    if (!shape) return;
    const byRow = new Map<string, typeof list>();
    list.forEach((s) => {
      const r = byRow.get(s.row) ?? [];
      r.push(s);
      byRow.set(s.row, r);
    });
    const rows = Array.from(byRow.keys()).sort(rowOrder);
    rows.forEach((row) => byRow.get(row)!.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10)));
    const rowCount = rows.length;
    const colCount = Math.max(1, ...rows.map((row) => byRow.get(row)!.length));

    if (shape.polar) {
      const { cx, cy, a0, a1, rxInner, ryInner, rxOuter, ryOuter } = shape.polar;
      const angleSpan = a1 - a0;
      rows.forEach((row, ri) => {
        const seatsInRow = byRow.get(row)!;
        const tRow = (ri + 0.5) / rowCount;
        const rx = rxInner + tRow * (rxOuter - rxInner);
        const ry = ryInner + tRow * (ryOuter - ryInner);
        seatsInRow.forEach((seat, ci) => {
          const angle = a0 + (ci + 0.5) * (angleSpan / colCount);
          const pt = polarToCartesianEllipse(cx, cy, rx, ry, angle);
          out.set(seat.id, { x: pt.x, y: pt.y });
        });
      });
    } else {
      const { x, y, w, h } = shape.bounds;
      const cellW = w / colCount;
      const cellH = h / rowCount;
      rows.forEach((row, ri) => {
        const seatsInRow = byRow.get(row)!;
        seatsInRow.forEach((seat, ci) => {
          const sx = x + (ci + 0.5) * cellW;
          const sy = y + (ri + 0.5) * cellH;
          out.set(seat.id, { x: sx, y: sy });
        });
      });
    }
  });

  return out;
}

/** Bounding box for one seat (seat-level subdivision for vector tiles / canvas). */
export interface SeatCellBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute per-seat cell bounds (subdivision) for vector tiles or canvas renderer.
 * Returns a rectangle per seat; for polar sections uses approximate cell size from radius step.
 */
export function getSeatCellBounds(
  seats: { id: string; section: string; row: string; number: string }[],
  layout: VenueLayout,
  sections: VenueSection[]
): Map<string, SeatCellBounds> {
  const out = new Map<string, SeatCellBounds>();
  const bySection = new Map<string, { row: string; number: string; id: string }[]>();
  for (const s of seats) {
    const key = sectionToLayoutKey(s.section, sections);
    const list = bySection.get(key) ?? [];
    list.push({ row: s.row, number: s.number, id: s.id });
    bySection.set(key, list);
  }

  const rowOrder = (a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  bySection.forEach((list, sectionId) => {
    const shape = layout[sectionId];
    if (!shape) return;
    const byRow = new Map<string, typeof list>();
    list.forEach((s) => {
      const r = byRow.get(s.row) ?? [];
      r.push(s);
      byRow.set(s.row, r);
    });
    const rows = Array.from(byRow.keys()).sort(rowOrder);
    rows.forEach((row) => byRow.get(row)!.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10)));
    const rowCount = rows.length;
    const colCount = Math.max(1, ...rows.map((row) => byRow.get(row)!.length));

    if (shape.polar) {
      const { cx, cy, a0, a1, rxInner, ryInner, rxOuter, ryOuter } = shape.polar;
      const angleSpan = a1 - a0;
      const da = angleSpan / colCount;
      const rxMid = (rxInner + rxOuter) / 2;
      const cellW = Math.max(8, (da * Math.PI) / 180 * rxMid);
      const cellH = Math.max(8, (ryOuter - ryInner) / rowCount);
      rows.forEach((row, ri) => {
        const seatsInRow = byRow.get(row)!;
        const rx = rxInner + (ri + 0.5) / rowCount * (rxOuter - rxInner);
        const ry = ryInner + (ri + 0.5) / rowCount * (ryOuter - ryInner);
        seatsInRow.forEach((seat, ci) => {
          const angle = a0 + (ci + 0.5) * da;
          const pt = polarToCartesianEllipse(cx, cy, rx, ry, angle);
          out.set(seat.id, { x: pt.x - cellW / 2, y: pt.y - cellH / 2, w: cellW, h: cellH });
        });
      });
    } else {
      const { x, y, w, h } = shape.bounds;
      const cellW = w / colCount;
      const cellH = h / rowCount;
      rows.forEach((row, ri) => {
        const seatsInRow = byRow.get(row)!;
        seatsInRow.forEach((seat, ci) => {
          out.set(seat.id, {
            x: x + ci * cellW,
            y: y + ri * cellH,
            w: cellW,
            h: cellH,
          });
        });
      });
    }
  });

  return out;
}

/** Per-section row grid for drawing row divider lines when zoomed. */
export interface SectionRowGrid {
  sectionId: string;
  bounds: { x: number; y: number; w: number; h: number };
  /** Y positions for horizontal lines between rows (excludes top/bottom of section). */
  rowBoundaryYs: number[];
}

/**
 * Compute row boundaries per section for drawing row divider lines (zoomed view).
 */
export function getSectionRowGrids(
  seats: { section: string; row: string }[],
  layout: VenueLayout,
  sections: VenueSection[]
): SectionRowGrid[] {
  const out: SectionRowGrid[] = [];
  const bySection = new Map<string, { row: string }[]>();
  for (const s of seats) {
    const key = sectionToLayoutKey(s.section, sections);
    const list = bySection.get(key) ?? [];
    list.push({ row: s.row });
    bySection.set(key, list);
  }

  const rowOrderSort = (a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  bySection.forEach((list, sectionId) => {
    const shape = layout[sectionId];
    if (!shape) return;
    const { x, y, w, h } = shape.bounds;
    const byRow = new Map<string, number>();
    list.forEach((s) => {
      byRow.set(s.row, (byRow.get(s.row) ?? 0) + 1);
    });
    const rows = Array.from(byRow.keys()).sort(rowOrderSort);
    const rowCount = rows.length;
    if (rowCount < 2) return;
    const cellH = h / rowCount;
    const rowBoundaryYs: number[] = [];
    for (let i = 1; i < rowCount; i++) {
      rowBoundaryYs.push(y + i * cellH);
    }
    out.push({ sectionId, bounds: { x, y, w, h }, rowBoundaryYs });
  });

  return out;
}

/** Path for the entrance of a row (front of row – where you step in). Shown when zoomed. */
export interface RowEntrancePath {
  sectionId: string;
  row: string;
  path: string;
}

/**
 * Compute the entrance path for each row: inner arc (polar) or front line (rect).
 * Used when zoomed to show where each row starts.
 */
export function getRowEntrancePaths(
  seats: { section: string; row: string }[],
  layout: VenueLayout,
  sections: VenueSection[]
): RowEntrancePath[] {
  const out: RowEntrancePath[] = [];
  const bySection = new Map<string, { row: string }[]>();
  for (const s of seats) {
    const key = sectionToLayoutKey(s.section, sections);
    const list = bySection.get(key) ?? [];
    list.push({ row: s.row });
    bySection.set(key, list);
  }

  const rowOrderSort = (a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  bySection.forEach((list, sectionId) => {
    const shape = layout[sectionId];
    if (!shape) return;
    const byRow = new Map<string, number>();
    list.forEach((s) => {
      byRow.set(s.row, (byRow.get(s.row) ?? 0) + 1);
    });
    const rows = Array.from(byRow.keys()).sort(rowOrderSort);
    const rowCount = rows.length;

    if (shape.polar) {
      const { cx, cy, a0, a1, rxInner, ryInner, rxOuter, ryOuter } = shape.polar;
      rows.forEach((row, ri) => {
        const t = ri / rowCount;
        const rx = rxInner + t * (rxOuter - rxInner);
        const ry = ryInner + t * (ryOuter - ryInner);
        const p0 = polarToCartesianEllipse(cx, cy, rx, ry, a0);
        const p1 = polarToCartesianEllipse(cx, cy, rx, ry, a1);
        out.push({
          sectionId,
          row,
          path: `M ${p0.x} ${p0.y} A ${rx} ${ry} 0 0 1 ${p1.x} ${p1.y}`,
        });
      });
    } else {
      const { x, y, w, h } = shape.bounds;
      const cellH = h / rowCount;
      rows.forEach((row, ri) => {
        const yFront = y + ri * cellH;
        out.push({
          sectionId,
          row,
          path: `M ${x} ${yFront} L ${x + w} ${yFront}`,
        });
      });
    }
  });

  return out;
}

/** Position for a row label (shown when zoomed): section id, row name, and (x,y) at left of row. */
export interface RowLabelPosition {
  sectionId: string;
  row: string;
  x: number;
  y: number;
}

/**
 * Compute (x, y) for each row label within sections. Same grid logic as seats; label at left of each row.
 */
export function getRowLabelPositions(
  seats: { section: string; row: string }[],
  layout: VenueLayout,
  sections: VenueSection[]
): RowLabelPosition[] {
  const out: RowLabelPosition[] = [];
  const bySection = new Map<string, { row: string }[]>();
  for (const s of seats) {
    const key = sectionToLayoutKey(s.section, sections);
    const list = bySection.get(key) ?? [];
    list.push({ row: s.row });
    bySection.set(key, list);
  }

  const rowOrderSort = (a: string, b: string) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  };

  bySection.forEach((list, sectionId) => {
    const shape = layout[sectionId];
    if (!shape) return;
    const byRow = new Map<string, number>();
    list.forEach((s) => {
      byRow.set(s.row, (byRow.get(s.row) ?? 0) + 1);
    });
    const rows = Array.from(byRow.keys()).sort(rowOrderSort);
    const rowCount = rows.length;

    if (shape.polar) {
      const { cx, cy, a0, rxInner, ryInner, rxOuter, ryOuter } = shape.polar;
      const labelAngle = a0 + 3;
      rows.forEach((row, ri) => {
        const t = (ri + 0.5) / rowCount;
        const rx = rxInner + t * (rxOuter - rxInner);
        const ry = ryInner + t * (ryOuter - ryInner);
        const pt = polarToCartesianEllipse(cx, cy, rx, ry, labelAngle);
        out.push({ sectionId, row, x: pt.x, y: pt.y });
      });
    } else {
      const { x, y, h } = shape.bounds;
      const cellH = h / rowCount;
      const labelX = x + 8;
      rows.forEach((row, ri) => {
        out.push({
          sectionId,
          row,
          x: labelX,
          y: y + (ri + 0.5) * cellH,
        });
      });
    }
  });

  return out;
}
