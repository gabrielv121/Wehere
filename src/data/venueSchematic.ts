/**
 * Venue schematic format: defines stage, floor, rings (bowl + walkways), and Chase Bridge from JSON data.
 * Used to drive the MSG map geometry.
 */

export interface SchematicCenter {
  x: number;
  y: number;
}

export interface SchematicRect {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  sections?: string[];
  zIndex?: number;
}

export interface SchematicRadius {
  x: number;
  y: number;
}

export interface SchematicRing {
  id: string;
  type?: 'walkway';
  level?: string;
  innerRadius?: SchematicRadius;
  outerRadius?: SchematicRadius;
  sectionCount?: number;
  sectionStart?: number;
  interactive?: boolean;
}

export interface VenueSchematic {
  venue: string;
  version: string;
  viewBox: string;
  center: SchematicCenter;
  stage: SchematicRect;
  floor?: SchematicRect;
  rings: SchematicRing[];
  chaseBridge?: SchematicRect;
}

/** Madison Square Garden schematic (schematic_v1). Coordinates in 1000×1000 viewBox, center (500,500). */
export const MSG_SCHEMATIC: VenueSchematic = {
  venue: 'Madison Square Garden',
  version: 'schematic_v1',
  viewBox: '0 0 1000 1000',
  center: { x: 500, y: 500 },

  stage: {
    type: 'rect',
    x: 350,
    y: 370,
    width: 300,
    height: 160,
    label: 'STAGE',
  },

  floor: {
    type: 'rect',
    x: 380,
    y: 550,
    width: 240,
    height: 130,
    sections: ['F1', 'F2', 'F3', 'F4'],
  },

  rings: [
    {
      id: 'lower_bowl_100',
      level: '100',
      innerRadius: { x: 210, y: 170 },
      outerRadius: { x: 290, y: 235 },
      sectionCount: 18,
      sectionStart: 101,
      interactive: true,
    },
    {
      id: 'walkway_1',
      type: 'walkway',
      innerRadius: { x: 295, y: 240 },
      outerRadius: { x: 320, y: 260 },
      interactive: false,
    },
    {
      id: 'upper_bowl_200',
      level: '200',
      innerRadius: { x: 325, y: 265 },
      outerRadius: { x: 385, y: 315 },
      sectionCount: 20,
      sectionStart: 201,
      interactive: true,
    },
    {
      id: 'walkway_2',
      type: 'walkway',
      innerRadius: { x: 390, y: 320 },
      outerRadius: { x: 410, y: 340 },
      interactive: false,
    },
    {
      id: 'upper_bridge_300',
      level: '300',
      innerRadius: { x: 415, y: 345 },
      outerRadius: { x: 470, y: 390 },
      sectionCount: 24,
      sectionStart: 301,
      interactive: true,
    },
  ],

  chaseBridge: {
    type: 'rect',
    x: 230,
    y: 285,
    width: 540,
    height: 55,
    label: 'CHASE BRIDGE',
    zIndex: 5,
  },
};

/** Parse viewBox string "0 0 W H" to { width, height }. */
export function parseViewBox(viewBox: string): { width: number; height: number } {
  const parts = viewBox.trim().split(/\s+/);
  const width = parts.length >= 3 ? Number(parts[2]) : 1000;
  const height = parts.length >= 4 ? Number(parts[3]) : 1000;
  return { width: Number.isFinite(width) ? width : 1000, height: Number.isFinite(height) ? height : 1000 };
}
