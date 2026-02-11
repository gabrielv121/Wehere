import type { VenueLayout } from './venueLayouts';
import type { VenueSection } from '../types';

/** Stage and floor bounds from venue-map-msg.svg (viewBox 0 0 2000 2000). Used for labels and hit area. */
export const MSG_SVG_STAGE = { x: 799.23, y: 819.56, w: 193.22, h: 334.38 };
export const MSG_SVG_FLOOR = { x: 994.34, y: 932.21, w: 132.1, h: 114.8 };

/** Elliptical arc for oval stadium bowl (rx = horizontal radius, ry = vertical) */
function polarToCartesianEllipse(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy - ry * Math.sin(rad) };
}

/** SVG path for a full ellipse (for walkway rings and arena boundary) */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy} Z`;
}

/** Arc-band path (counter-clockwise) for walkway cutout: band between rInner and rOuter from angle a0 to a1. Use with fillRule="evenodd". */
function arcBandCutout(
  cx: number,
  cy: number,
  a0: number,
  a1: number,
  rInner: number,
  rOuter: number,
  ovalX: number
): string {
  const rxIn = rInner * ovalX;
  const ryIn = rInner;
  const rxOut = rOuter * ovalX;
  const ryOut = rOuter;
  const p1 = polarToCartesianEllipse(cx, cy, rxIn, ryIn, a0);
  const p2 = polarToCartesianEllipse(cx, cy, rxIn, ryIn, a1);
  const p3 = polarToCartesianEllipse(cx, cy, rxOut, ryOut, a1);
  const p4 = polarToCartesianEllipse(cx, cy, rxOut, ryOut, a0);
  // Counter-clockwise so it becomes a hole with fillRule="evenodd"
  return `M ${p4.x} ${p4.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y} L ${p1.x} ${p1.y} Z`;
}

/** Keys used for decoration (walkways, arena outline, Chase Bridge label) – not clickable sections */
export const MSG_DECORATION_KEYS = new Set([
  'walkwayLower',
  'walkwayUpper',
  'arenaInner',
  'arenaOuter',
  'chaseBridgeLabel',
]);

/** Decoration keys when using venue schematic (walkway rings + Chase Bridge rect/label) */
export const SCHEMATIC_DECORATION_KEYS = new Set([
  'walkway_1',
  'walkway_2',
  'chaseBridge',
  'chaseBridgeLabel',
]);

/** All decoration keys (legacy MSG + schematic) – preserved in filterLayoutForSections */
export const ALL_DECORATION_KEYS = new Set([...MSG_DECORATION_KEYS, ...SCHEMATIC_DECORATION_KEYS]);

/** Madison Square Garden–style bowl: Stage, Floor, Suites/Walkway ring, Lower (100s), Walkway, Upper (200s), Walkway, Chase Bridge (300s), arena in/out geometry. */
function buildMSGStyleBowl(sections: VenueSection[]): VenueLayout {
  const cx = 864;
  const cy = 420;
  const layout: VenueLayout = {};
  const ovalX = 1.35;

  // —— Stage block ——
  const stageY = 720;
  const stageH = 80;
  const stageW = 600;
  layout['stage'] = {
    path: `M ${cx - stageW / 2} ${stageY} L ${cx + stageW / 2} ${stageY} L ${cx + stageW / 2} ${stageY + stageH} L ${cx - stageW / 2} ${stageY + stageH} Z`,
    bounds: { x: cx - stageW / 2, y: stageY, w: stageW, h: stageH },
    label: { x: cx, y: stageY + stageH / 2 },
  };

  // —— Floor block ——
  const floor = sections.find((s) => s.tier === 'floor');
  if (floor) {
    const fw = 360;
    layout[floor.id] = {
      path: `M ${cx - fw / 2} 580 L ${cx + fw / 2} 580 L ${cx + fw / 2} 650 L ${cx - fw / 2} 650 Z`,
      bounds: { x: cx - fw / 2, y: 580, w: fw, h: 70 },
      label: { x: cx, y: 615 },
    };
  }

  const lower = sections.filter((s) => s.tier === 'lower').sort((a, b) => a.order - b.order);
  const upper = sections.filter((s) => s.tier === 'upper').sort((a, b) => a.order - b.order);
  const top = sections.filter((s) => s.tier === 'top').sort((a, b) => a.order - b.order);

  /** Asymmetric MSG: left half (e.g. 5–88°) and right half (92–175°) for better real-venue fit. */
  const leftAngleStart = 5;
  const leftAngleEnd = 88;
  const rightAngleStart = 92;
  const rightAngleEnd = 175;
  const leftSpan = leftAngleEnd - leftAngleStart;
  const rightSpan = rightAngleEnd - rightAngleStart;

  /** Lower bowl can use a slightly different oval ratio for geometry. */
  const lowerBowlOvalX = 1.38;

  type RingOpts = {
    walkwayCutout?: { r: number; bandWidth?: number };
  };

  const addRing = (
    secs: VenueSection[],
    rInner: number,
    rOuter: number,
    ovalXUsed: number,
    opts: RingOpts = {}
  ) => {
    if (secs.length === 0) return;
    const n = secs.length;
    const nLeft = Math.ceil(n / 2);
    const nRight = n - nLeft;
    const rxInner = rInner * ovalXUsed;
    const ryInner = rInner;
    const rxOuter = rOuter * ovalXUsed;
    const ryOuter = rOuter;

    secs.forEach((sec, i) => {
      const isLeft = i < nLeft;
      const sideN = isLeft ? nLeft : nRight;
      const sideI = isLeft ? i : i - nLeft;
      const a0 = isLeft
        ? leftAngleStart + (sideI * leftSpan) / sideN
        : rightAngleStart + (sideI * rightSpan) / sideN;
      const a1 = isLeft
        ? leftAngleStart + ((sideI + 1) * leftSpan) / sideN
        : rightAngleStart + ((sideI + 1) * rightSpan) / sideN;
      const p1 = polarToCartesianEllipse(cx, cy, rxInner, ryInner, a0);
      const p2 = polarToCartesianEllipse(cx, cy, rxInner, ryInner, a1);
      const p3 = polarToCartesianEllipse(cx, cy, rxOuter, ryOuter, a1);
      const p4 = polarToCartesianEllipse(cx, cy, rxOuter, ryOuter, a0);
      const cutouts: string[] = [];
      if (opts.walkwayCutout) {
        const { r, bandWidth = 10 } = opts.walkwayCutout;
        if (r > rInner && r < rOuter) {
          cutouts.push(arcBandCutout(cx, cy, a0, a1, r - bandWidth, r + bandWidth, ovalXUsed));
        }
      }
      // Entrance = inner arc (where you walk into the section) – shown when zoomed instead of full outline
      const entrancePath = `M ${p1.x} ${p1.y} A ${rxInner} ${ryInner} 0 0 1 ${p2.x} ${p2.y}`;
      layout[sec.id] = {
        path: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`,
        bounds: {
          x: Math.min(p1.x, p2.x, p3.x, p4.x),
          y: Math.min(p1.y, p2.y, p3.y, p4.y),
          w: Math.max(p1.x, p2.x, p3.x, p4.x) - Math.min(p1.x, p2.x, p3.x, p4.x),
          h: Math.max(p1.y, p2.y, p3.y, p4.y) - Math.min(p1.y, p2.y, p3.y, p4.y),
        },
        label: polarToCartesianEllipse(cx, cy, (rxInner + rxOuter) / 2, (ryInner + ryOuter) / 2, (a0 + a1) / 2),
        polar: { cx, cy, a0, a1, rxInner, ryInner, rxOuter, ryOuter },
        entrancePath,
        ...(cutouts.length ? { cutouts } : {}),
      };
    });
  };

  addRing(lower, 220, 380, lowerBowlOvalX, { walkwayCutout: { r: 380, bandWidth: 12 } });
  addRing(upper, 380, 520, ovalX, { walkwayCutout: { r: 520, bandWidth: 12 } });
  addRing(top, 520, 640, ovalX);

  // —— Arena geometry & walkway rings (decoration only) ——
  const rx = (r: number) => r * ovalX;
  const ry = (r: number) => r;

  // Inner edge of bowl (inside 100s)
  layout['arenaInner'] = {
    path: ellipsePath(cx, cy, rx(220), ry(220)),
    bounds: { x: cx - rx(220), y: cy - ry(220), w: 2 * rx(220), h: 2 * ry(220) },
    label: { x: cx, y: cy },
  };

  // Suites / walkway ring (between 100s and 200s)
  layout['walkwayLower'] = {
    path: ellipsePath(cx, cy, rx(380), ry(380)),
    bounds: { x: cx - rx(380), y: cy - ry(380), w: 2 * rx(380), h: 2 * ry(380) },
    label: { x: cx, y: cy },
  };

  // Walkway ring (between 200s and 300s)
  layout['walkwayUpper'] = {
    path: ellipsePath(cx, cy, rx(520), ry(520)),
    bounds: { x: cx - rx(520), y: cy - ry(520), w: 2 * rx(520), h: 2 * ry(520) },
    label: { x: cx, y: cy },
  };

  // Outer edge of bowl (Chase Bridge / 300s boundary)
  layout['arenaOuter'] = {
    path: ellipsePath(cx, cy, rx(640), ry(640)),
    bounds: { x: cx - rx(640), y: cy - ry(640), w: 2 * rx(640), h: 2 * ry(640) },
    label: { x: cx, y: cy },
  };

  // Chase Bridge label (top center of map, in 300s zone – viewBox-safe)
  layout['chaseBridgeLabel'] = {
    path: 'M 0 0',
    bounds: { x: cx - 50, y: 68, w: 100, h: 24 },
    label: { x: cx, y: 80 },
  };

  return layout;
}

/** Either a fixed layout or a builder that takes this event's sections and returns the layout (so map reflects how this event displays seats). */
export type VenueLayoutConfig = VenueLayout | ((sections: VenueSection[]) => VenueLayout);

/**
 * Custom venue layouts keyed by venue id.
 * Use a VenueLayout for a fixed shape, or a function (sections) => VenueLayout to build the map from each event's sections (e.g. MSG concert vs. game).
 */
export const VENUE_LAYOUT_CONFIG: Record<string, VenueLayoutConfig> = {
  // Madison Square Garden (v1) – layout comes only from venue-map-msg.svg (fetched in SeatMap). No procedural map.
  v1: () => ({}),

  // Mercedes-Benz Stadium (v8) – reuse bowl layout for stadium-style map.
  v8: (sections) => buildMSGStyleBowl(sections),

  // Crypto.com Arena (v2) – layout comes only from crypto-arena.svg (fetched in SeatMap). No procedural map.
  v2: () => ({}),
};
