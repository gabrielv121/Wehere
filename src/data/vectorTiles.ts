/**
 * Vector tile / GeoJSON generator for venue maps.
 * Exports section polygons and optional seat-level features for use in map libraries or tiled rendering.
 */

import type { VenueSection } from '../types';
import type { VenueLayout, SectionShape } from './venueLayouts';
import { getVenueLayout } from './venueLayouts';
import { getSeatCellBounds } from './venueLayouts';
import { ALL_DECORATION_KEYS, MSG_DECORATION_KEYS } from './venueLayoutConfig';

/** GeoJSON Feature (section or seat). */
export interface GeoJSONFeature {
  type: 'Feature';
  id?: string;
  geometry: { type: 'Polygon'; coordinates: number[][][] } | { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

/** GeoJSON FeatureCollection. */
export interface VenueGeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/** Convert SVG path d to GeoJSON Polygon coordinates (simplified: only M/L/Z). */
function pathDToCoordinates(pathD: string, viewBoxHeight: number): number[][][] {
  // Flip Y for GeoJSON (origin bottom-left); SVG is top-left. So y_geo = viewBoxHeight - y_svg.
  const flipY = (y: number) => viewBoxHeight - y;
  const coords: [number, number][] = [];
  const parts = pathD.replace(/^\s*/, '').split(/\s*(?=[MLZ])/);
  let x = 0;
  let y = 0;
  for (const p of parts) {
    const cmd = p[0];
    const rest = p.slice(1).trim().split(/[\s,]+/).map(Number);
    if (cmd === 'M' && rest.length >= 2) {
      x = rest[0];
      y = rest[1];
      coords.push([x, flipY(y)]);
    } else if (cmd === 'L' && rest.length >= 2) {
      x = rest[0];
      y = rest[1];
      coords.push([x, flipY(y)]);
    } else if (cmd === 'Z') {
      if (coords.length > 1) coords.push([coords[0][0], coords[0][1]]);
    }
  }
  if (coords.length < 3) return [];
  return [coords];
}

/** Convert section shape to Polygon (main path only; cutouts can be added as inner rings if needed). */
function shapeToPolygon(shape: SectionShape, viewBoxHeight: number): number[][][] {
  return pathDToCoordinates(shape.path, viewBoxHeight);
}

/**
 * Build GeoJSON FeatureCollection for the venue: one polygon feature per section (and stage),
 * optionally one point or polygon per seat for seat-level subdivision.
 */
export function getVenueGeoJSON(
  venueId: string | undefined,
  eventId: string,
  sections: VenueSection[],
  options: {
    viewBoxHeight?: number;
    includeSeats?: boolean;
    seats?: { id: string; section: string; row: string; number: string }[];
  } = {}
): VenueGeoJSON {
  const viewBoxHeight = options.viewBoxHeight ?? 800;
  const layout = getVenueLayout(venueId, eventId, sections);
  const features: GeoJSONFeature[] = [];

  for (const [key, shape] of Object.entries(layout)) {
    if (MSG_DECORATION_KEYS.has(key)) continue;
    const coords = shapeToPolygon(shape, viewBoxHeight);
    if (coords[0].length < 3) continue;
    const section = sections.find((s) => s.id === key);
    features.push({
      type: 'Feature',
      id: key,
      geometry: { type: 'Polygon', coordinates: coords },
      properties: {
        sectionId: key,
        name: section?.name ?? key,
        tier: section?.tier ?? null,
      },
    });
  }

  if (options.includeSeats && options.seats && options.seats.length > 0) {
    const cellBounds = getSeatCellBounds(options.seats, layout, sections);
    cellBounds.forEach((bounds, seatId) => {
      const [x, y, w, h] = [bounds.x, bounds.y, bounds.w, bounds.h];
      const yFlip = viewBoxHeight - y;
      const poly: number[][] = [
        [x, yFlip],
        [x + w, yFlip],
        [x + w, yFlip - h],
        [x, yFlip - h],
        [x, yFlip],
      ];
      features.push({
        type: 'Feature',
        id: seatId,
        geometry: { type: 'Polygon', coordinates: [poly] },
        properties: { seatId, type: 'seat' },
      });
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Return GeoJSON for section polygons only (no seats). Useful for vector tile sources.
 */
export function getSectionGeoJSON(
  layout: VenueLayout,
  sections: VenueSection[],
  viewBoxHeight: number = 800
): VenueGeoJSON {
  const features: GeoJSONFeature[] = [];
  for (const [key, shape] of Object.entries(layout)) {
    if (key === 'stage' || ALL_DECORATION_KEYS.has(key)) continue;
    const coords = shapeToPolygon(shape, viewBoxHeight);
    if (coords.length === 0 || coords[0].length < 3) continue;
    const section = sections.find((s) => s.id === key);
    features.push({
      type: 'Feature',
      id: key,
      geometry: { type: 'Polygon', coordinates: coords },
      properties: { sectionId: key, name: section?.name ?? key, tier: section?.tier ?? null },
    });
  }
  return { type: 'FeatureCollection', features };
}
