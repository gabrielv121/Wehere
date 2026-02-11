/**
 * Mapbox/SeatGeek-style vector tiles for the venue map.
 * Geometry is pre-cut into tiles; each tile is valid for a zoom range.
 *
 * Zoom 0 → venue outline only
 * Zoom 1 → sections (polygons + section metadata)
 * Zoom 2 → sections + rows (polygons + row entrance lines + metadata)
 * Zoom 3 → sections + rows + seats (polygons + lines + points + full metadata)
 *
 * Each tile contains: polygons, lines, points, and metadata (section id, row, seat).
 */

import type { VenueSection } from '../types';
import {
  getVenueLayout,
  getSeatPositions,
  getRowEntrancePaths,
  getViewBox,
} from './venueLayouts';
import { MSG_DECORATION_KEYS } from './venueLayoutConfig';

export type VenueTileZoom = 0 | 1 | 2 | 3;

/** A polygon (section or venue outline) with optional metadata index. */
export interface TilePolygon {
  path: string;
  cutouts?: string[];
  /** Index into tile.metadata */
  metaIndex?: number;
}

/** A line (row entrance, walkway) with optional metadata index. */
export interface TileLine {
  path: string;
  metaIndex?: number;
}

/** A point (seat) with optional metadata index. */
export interface TilePoint {
  x: number;
  y: number;
  metaIndex?: number;
}

/** Metadata entry for section, row, or seat. */
export interface TileMetadata {
  type: 'section' | 'row' | 'seat';
  sectionId?: string;
  sectionName?: string;
  tier?: string;
  row?: string;
  seatId?: string;
  seatNumber?: string;
}

export interface VenueTile {
  zoom: VenueTileZoom;
  /** Bounds in SVG coords (viewBox space) for this tile's content */
  bounds: { x: number; y: number; w: number; h: number };
  polygons: TilePolygon[];
  lines: TileLine[];
  points: TilePoint[];
  metadata: TileMetadata[];
}

export interface VenueTilesInput {
  venueId: string | undefined;
  eventId: string;
  sections: VenueSection[];
  seats: { id: string; section: string; row: string; number: string }[];
}

/**
 * Build zoom-level tiles for the venue (Mapbox/SeatGeek style).
 * Each tile is valid for a zoom range; the client chooses which tile to render from current zoom.
 */
export function getVenueTiles(input: VenueTilesInput): Record<VenueTileZoom, VenueTile> {
  const { venueId, eventId, sections, seats } = input;
  const viewBox = getViewBox(venueId);
  const layout = getVenueLayout(venueId, eventId, sections);
  const seatPositions = getSeatPositions(seats, layout, sections);
  const rowEntrances = getRowEntrancePaths(seats, layout, sections);

  const sectionById = new Map(sections.map((s) => [s.id, s]));

  const boundsFromLayout = (): { x: number; y: number; w: number; h: number } => {
    let minX = viewBox.width;
    let minY = viewBox.height;
    let maxX = 0;
    let maxY = 0;
    for (const shape of Object.values(layout)) {
      const b = shape.bounds;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }
    return {
      x: minX,
      y: minY,
      w: Math.max(0, maxX - minX),
      h: Math.max(0, maxY - minY),
    };
  };

  const bounds = boundsFromLayout();

  // —— Zoom 0: venue outline only ——
  const outlinePolygons: TilePolygon[] = [];
  if (layout.arenaOuter) outlinePolygons.push({ path: layout.arenaOuter.path });
  if (layout.arenaInner) outlinePolygons.push({ path: layout.arenaInner.path });
  const tile0: VenueTile = {
    zoom: 0,
    bounds,
    polygons: outlinePolygons,
    lines: [],
    points: [],
    metadata: [],
  };

  // —— Zoom 1: sections ——
  const polygons1: TilePolygon[] = [];
  const metadata1: TileMetadata[] = [];
  for (const [key, shape] of Object.entries(layout)) {
    if (key === 'stage' || MSG_DECORATION_KEYS.has(key)) continue;
    const section = sectionById.get(key);
    const metaIndex = metadata1.length;
    metadata1.push({
      type: 'section',
      sectionId: key,
      sectionName: section?.name ?? key,
      tier: section?.tier,
    });
    polygons1.push({
      path: shape.path,
      cutouts: shape.cutouts,
      metaIndex,
    });
  }
  const tile1: VenueTile = {
    zoom: 1,
    bounds,
    polygons: polygons1,
    lines: [],
    points: [],
    metadata: metadata1,
  };

  // —— Zoom 2: sections + row entrance lines ——
  const lines2: TileLine[] = [];
  const metadata2: TileMetadata[] = [...metadata1];
  for (const ent of rowEntrances) {
    const metaIndex = metadata2.length;
    metadata2.push({
      type: 'row',
      sectionId: ent.sectionId,
      row: ent.row,
    });
    lines2.push({ path: ent.path, metaIndex });
  }
  const tile2: VenueTile = {
    zoom: 2,
    bounds,
    polygons: polygons1,
    lines: lines2,
    points: [],
    metadata: metadata2,
  };

  // —— Zoom 3: sections + rows + seats ——
  const points3: TilePoint[] = [];
  const metadata3: TileMetadata[] = [...metadata2];
  seatPositions.forEach((pos, seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    const metaIndex = metadata3.length;
    metadata3.push({
      type: 'seat',
      sectionId: seat?.section,
      row: seat?.row,
      seatId,
      seatNumber: seat?.number,
    });
    points3.push({ x: pos.x, y: pos.y, metaIndex });
  });
  const tile3: VenueTile = {
    zoom: 3,
    bounds,
    polygons: polygons1,
    lines: lines2,
    points: points3,
    metadata: metadata3,
  };

  return { 0: tile0, 1: tile1, 2: tile2, 3: tile3 };
}

/** Get the tile zoom level from a continuous scale (e.g. from react-zoom-pan-pinch). */
export function getTileZoomFromScale(scale: number): VenueTileZoom {
  if (scale < 0.5) return 0;
  if (scale < 1) return 1;
  if (scale < 2) return 2;
  return 3;
}
