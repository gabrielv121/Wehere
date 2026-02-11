/**
 * Venue map SVGs: MSG (venue-map-msg.svg), Crypto.com Arena (crypto-arena.svg).
 * Fetches the SVG and builds layout from section elements for each venue.
 */

import type { VenueLayout } from './venueLayouts';
import type { VenueSection } from '../types';

const VENUE_MAP_SVG_URL = '/venue map/venue-map-msg.svg';
const CRYPTO_ARENA_SVG_URL = '/venue map/crypto%20arena.svg';

/** Map image URL by venue: v1 = MSG, v2 + sports = Crypto Arena. */
export function getVenueMapImageUrl(venueId: string | undefined, eventCategory?: string): string | null {
  if (venueId === 'v1') return VENUE_MAP_SVG_URL;
  if (venueId === 'v2' && eventCategory === 'sports') return CRYPTO_ARENA_SVG_URL;
  return null;
}

const SECTION_IDS = [
  'section-101', 'section-102', 'section-103', 'section-104', 'section-105', 'section-106',
  'section-201', 'section-202', 'section-203', 'section-204', 'section-205', 'section-206',
  'section-301', 'section-302', 'section-303', 'section-304', 'section-305', 'section-306',
  'msg-floor',
  'msg-stage',
];

/** Fetches venue-map-msg.svg and returns layout for all MSG sections (101–306, floor, stage). */
export async function fetchVenueMapLayout(sections: VenueSection[]): Promise<VenueLayout> {
  const res = await fetch(VENUE_MAP_SVG_URL);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const layout: VenueLayout = {};
  const floorId = sections.find((s) => s.tier === 'floor')?.id ?? 'Floor';

  for (const id of SECTION_IDS) {
    const el = doc.getElementById(id);
    if (!el) continue;
    const pathD = getPathD(el);
    if (!pathD) continue;

    const key = id === 'msg-stage' ? 'stage' : id === 'msg-floor' ? floorId : id.replace('section-', '');
    const { bounds, label } = getBoundsAndLabel(pathD);
    layout[key] = {
      path: pathD,
      bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h },
      label: { x: label.x, y: label.y },
    };
  }

  return layout;
}

function polygonPointsToPath(points: string | null): string | null {
  if (!points || !points.trim()) return null;
  const coords = points.trim().split(/\s+/).map(Number);
  if (coords.length < 6) return null;
  let d = `M ${coords[0]} ${coords[1]}`;
  for (let i = 2; i < coords.length; i += 2) {
    d += ` L ${coords[i]} ${coords[i + 1]}`;
  }
  return d + ' Z';
}

/** Get path d from element (path or polygon). */
function getPathD(el: Element): string | null {
  if (el.getAttribute('d')) return el.getAttribute('d');
  if (el.tagName.toLowerCase() === 'polygon') {
    return polygonPointsToPath(el.getAttribute('points'));
  }
  return null;
}

/** Compute bounds and label from path d using SVG getBBox (run in browser). */
function getBoundsAndLabel(pathD: string): { bounds: { x: number; y: number; w: number; h: number }; label: { x: number; y: number } } {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 2000 2000');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const bbox = path.getBBox();
  document.body.removeChild(svg);
  return {
    bounds: { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height },
    label: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 },
  };
}

/** Section ids in crypto-arena.svg (same pattern as MSG: one path per section). Layout key = section number or "floor". */
const CRYPTO_SECTION_IDS = [
  'crypto-floor',
  'section-101', 'section-102', 'section-103', 'section-104', 'section-105', 'section-106',
  'section-201', 'section-202', 'section-203', 'section-204', 'section-205', 'section-206',
];

/**
 * Fetches crypto-arena.svg and returns layout for Court (floor) + numbered sections (101–106, 201–206).
 * Same approach as MSG: one path/polygon per section in the SVG with these ids; bounds/label from getBBox.
 */
export async function fetchVenueMapLayoutForCrypto(sections: VenueSection[]): Promise<VenueLayout> {
  const res = await fetch(CRYPTO_ARENA_SVG_URL);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const layout: VenueLayout = {};
  const floorId = sections.find((s) => s.tier === 'floor')?.id ?? 'floor';

  for (const id of CRYPTO_SECTION_IDS) {
    const el = doc.getElementById(id);
    if (!el) continue;
    const pathD = getPathD(el);
    if (!pathD) continue;

    const key = id === 'crypto-floor' ? floorId : id.replace('section-', '');
    const { bounds, label } = getBoundsAndLabel(pathD);
    // Paths with multiple subpaths (e.g. outer + inner cutout) need evenodd so inner acts as hole
    const hasMultipleSubpaths = / Z\s*M/i.test(pathD);
    layout[key] = {
      path: pathD,
      bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h },
      label: { x: label.x, y: label.y },
      ...(hasMultipleSubpaths && { fillRule: 'evenodd' as const }),
    };
  }

  return layout;
}
