import type { Event, TicketListing, Seat, VenueSection } from '../types';

/** Default events used to seed the store (with visible: true) */
export const DEFAULT_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Taylor Swift | The Eras Tour',
    category: 'concert',
    venue: { id: 'v1', name: 'Madison Square Garden', city: 'New York', state: 'NY' },
    date: '2025-03-15T19:00:00',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    minPrice: 189,
    maxPrice: 1200,
    featured: true,
    visible: true,
  },
  {
    id: '2',
    title: 'Lakers vs Celtics',
    category: 'sports',
    venue: { id: 'v2', name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA' },
    date: '2025-02-20T19:30:00',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    minPrice: 85,
    maxPrice: 450,
    featured: true,
    visible: true,
  },
  {
    id: '3',
    title: 'Hamilton',
    category: 'theater',
    venue: { id: 'v3', name: 'Richard Rodgers Theatre', city: 'New York', state: 'NY' },
    date: '2025-04-02T20:00:00',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    minPrice: 129,
    maxPrice: 399,
    featured: true,
  },
  {
    id: '4',
    title: 'Dave Chappelle Live',
    category: 'comedy',
    venue: { id: 'v4', name: 'Comedy Cellar', city: 'New York', state: 'NY' },
    date: '2025-03-08T21:00:00',
    image: 'https://images.unsplash.com/photo-1585699324551-fbdc0db4bc8e?w=800',
    minPrice: 75,
    maxPrice: 250,
    visible: true,
  },
  {
    id: '5',
    title: 'Beyoncé Renaissance Tour',
    category: 'concert',
    venue: { id: 'v5', name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ' },
    date: '2025-05-22T20:00:00',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    minPrice: 145,
    maxPrice: 890,
    featured: true,
  },
  {
    id: '6',
    title: 'Disney on Ice',
    category: 'family',
    venue: { id: 'v6', name: 'United Center', city: 'Chicago', state: 'IL' },
    date: '2025-02-14T15:00:00',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    minPrice: 35,
    maxPrice: 120,
    visible: true,
  },
  {
    id: '7',
    title: 'Coldplay – Music of the Spheres',
    category: 'concert',
    venue: { id: 'v7', name: 'Soldier Field', city: 'Chicago', state: 'IL' },
    date: '2025-06-10T19:30:00',
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
    minPrice: 99,
    maxPrice: 350,
  },
  {
    id: '8',
    title: 'NFL Championship Game',
    category: 'sports',
    venue: { id: 'v8', name: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA' },
    date: '2026-02-08T18:30:00',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
    minPrice: 450,
    maxPrice: 2500,
    visible: true,
  },
  {
    id: '9',
    title: 'Knicks vs. Celtics',
    category: 'sports',
    venue: { id: 'v1', name: 'Madison Square Garden', city: 'New York', state: 'NY' },
    date: '2025-02-28T19:30:00',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    minPrice: 65,
    maxPrice: 650,
    featured: true,
    visible: true,
  },
];

export const ticketListingsByEvent: Record<string, TicketListing[]> = {
  '1': [
    { id: 't1', eventId: '1', section: 'Floor', row: 'A', quantity: 2, pricePerTicket: 450, totalPrice: 900, seller: 'Verified Resale' },
    { id: 't2', eventId: '1', section: '100', row: '5', quantity: 4, pricePerTicket: 289, totalPrice: 1156, seller: 'Official' },
    { id: 't3', eventId: '1', section: '200', row: '12', quantity: 2, pricePerTicket: 189, totalPrice: 378, seller: 'Verified Resale' },
    { id: 't4', eventId: '1', section: '100', row: '8', quantity: 2, pricePerTicket: 320, totalPrice: 640, seller: 'Official' },
    { id: 't1a', eventId: '1', section: '200', row: '8', quantity: 1, pricePerTicket: 175, totalPrice: 175, seller: 'Verified Resale' },
    { id: 't1b', eventId: '1', section: '100', row: '12', quantity: 3, pricePerTicket: 265, totalPrice: 795, seller: 'Official' },
    { id: 't1c', eventId: '1', section: '200', row: '5', quantity: 6, pricePerTicket: 195, totalPrice: 1170, seller: 'Verified Resale' },
  ],
  '2': [
    { id: 't2a', eventId: '2', section: 'Court', row: '1', quantity: 2, pricePerTicket: 395, totalPrice: 790, seller: 'Official' },
    { id: 't2b', eventId: '2', section: 'Court', row: '2', quantity: 4, pricePerTicket: 425, totalPrice: 1700, seller: 'Verified Resale' },
    { id: 't5', eventId: '2', section: 'Lower', row: '10', quantity: 2, pricePerTicket: 285, totalPrice: 570, seller: 'Official' },
    { id: 't5a', eventId: '2', section: 'Lower Bowl', row: '3', quantity: 2, pricePerTicket: 245, totalPrice: 490, seller: 'Verified Resale' },
    { id: 't6', eventId: '2', section: 'Upper', row: '5', quantity: 4, pricePerTicket: 85, totalPrice: 340, seller: 'Verified Resale' },
    { id: 't6a', eventId: '2', section: 'Upper', row: '12', quantity: 1, pricePerTicket: 85, totalPrice: 85, seller: 'Official' },
    { id: 't6b', eventId: '2', section: 'Lower', row: '5', quantity: 5, pricePerTicket: 220, totalPrice: 1100, seller: 'Verified Resale' },
    { id: 't6c', eventId: '2', section: 'Upper Bowl', row: '8', quantity: 3, pricePerTicket: 95, totalPrice: 285, seller: 'Official' },
  ],
  '3': [
    { id: 't7', eventId: '3', section: 'Orchestra', row: 'C', quantity: 2, pricePerTicket: 299, totalPrice: 598, seller: 'Official' },
    { id: 't8', eventId: '3', section: 'Mezzanine', row: 'B', quantity: 2, pricePerTicket: 159, totalPrice: 318, seller: 'Verified Resale' },
  ],
  '4': [
    { id: 't9', eventId: '4', section: 'General', quantity: 2, pricePerTicket: 120, totalPrice: 240, seller: 'Official' },
  ],
  '5': [
    { id: 't10', eventId: '5', section: 'Floor', row: '12', quantity: 2, pricePerTicket: 425, totalPrice: 850, seller: 'Verified Resale' },
    { id: 't11', eventId: '5', section: '100', row: '20', quantity: 4, pricePerTicket: 195, totalPrice: 780, seller: 'Official' },
  ],
  '6': [
    { id: 't12', eventId: '6', section: '100', row: '8', quantity: 4, pricePerTicket: 55, totalPrice: 220, seller: 'Official' },
  ],
  '7': [
    { id: 't13', eventId: '7', section: 'Field', quantity: 2, pricePerTicket: 199, totalPrice: 398, seller: 'Official' },
    { id: 't14', eventId: '7', section: '200', row: '15', quantity: 2, pricePerTicket: 99, totalPrice: 198, seller: 'Verified Resale', ada: true },
  ],
  '8': [
    { id: 't15', eventId: '8', section: 'Club', row: '5', quantity: 2, pricePerTicket: 1200, totalPrice: 2400, seller: 'Official' },
    { id: 't8a', eventId: '8', section: 'Field', row: '1', quantity: 4, pricePerTicket: 2200, totalPrice: 8800, seller: 'Official' },
    { id: 't8b', eventId: '8', section: '103', row: '8', quantity: 2, pricePerTicket: 720, totalPrice: 1440, seller: 'Verified Resale' },
    { id: 't8c', eventId: '8', section: '205', row: '12', quantity: 2, pricePerTicket: 520, totalPrice: 1040, seller: 'Official' },
  ],
  '9': [
    { id: 't16', eventId: '9', section: 'Court', row: '3', quantity: 2, pricePerTicket: 425, totalPrice: 850, seller: 'Official' },
    { id: 't17', eventId: '9', section: '101', row: '5', quantity: 4, pricePerTicket: 185, totalPrice: 740, seller: 'Verified Resale' },
    { id: 't18', eventId: '9', section: '104', row: '8', quantity: 2, pricePerTicket: 145, totalPrice: 290, seller: 'Official' },
    { id: 't19', eventId: '9', section: '201', row: '12', quantity: 2, pricePerTicket: 95, totalPrice: 190, seller: 'Verified Resale' },
    { id: 't20', eventId: '9', section: '205', row: '6', quantity: 3, pricePerTicket: 110, totalPrice: 330, seller: 'Official' },
    { id: 't21', eventId: '9', section: '302', row: '4', quantity: 2, pricePerTicket: 65, totalPrice: 130, seller: 'Verified Resale' },
  ],
};

// Venue map: section blocks for arena layout (section name + price range)
export const venueMapByEvent: Record<string, VenueSection[]> = {
  '1': [
    { id: 'floor', name: 'Floor', tier: 'floor', priceMin: 350, priceMax: 500, order: 0 },
    { id: '101', name: '101', tier: 'lower', priceMin: 280, priceMax: 320, order: 1 },
    { id: '102', name: '102', tier: 'lower', priceMin: 260, priceMax: 300, order: 2 },
    { id: '103', name: '103', tier: 'lower', priceMin: 240, priceMax: 280, order: 3 },
    { id: '104', name: '104', tier: 'lower', priceMin: 240, priceMax: 280, order: 4 },
    { id: '105', name: '105', tier: 'lower', priceMin: 260, priceMax: 300, order: 5 },
    { id: '106', name: '106', tier: 'lower', priceMin: 280, priceMax: 320, order: 6 },
    { id: '201', name: '201', tier: 'upper', priceMin: 180, priceMax: 220, order: 7 },
    { id: '202', name: '202', tier: 'upper', priceMin: 165, priceMax: 200, order: 8 },
    { id: '203', name: '203', tier: 'upper', priceMin: 150, priceMax: 189, order: 9 },
    { id: '204', name: '204', tier: 'upper', priceMin: 150, priceMax: 189, order: 10 },
    { id: '205', name: '205', tier: 'upper', priceMin: 165, priceMax: 200, order: 11 },
    { id: '206', name: '206', tier: 'upper', priceMin: 180, priceMax: 220, order: 12 },
    { id: '301', name: '301', tier: 'top', priceMin: 120, priceMax: 160, order: 13 },
    { id: '302', name: '302', tier: 'top', priceMin: 110, priceMax: 150, order: 14 },
    { id: '303', name: '303', tier: 'top', priceMin: 100, priceMax: 140, order: 15 },
    { id: '304', name: '304', tier: 'top', priceMin: 100, priceMax: 140, order: 16 },
    { id: '305', name: '305', tier: 'top', priceMin: 110, priceMax: 150, order: 17 },
    { id: '306', name: '306', tier: 'top', priceMin: 120, priceMax: 160, order: 18 },
  ],
  '2': [
    { id: 'floor', name: 'Court', tier: 'floor', priceMin: 350, priceMax: 450, order: 0 },
    { id: '101', name: '101', tier: 'lower', priceMin: 220, priceMax: 285, order: 1 },
    { id: '102', name: '102', tier: 'lower', priceMin: 200, priceMax: 260, order: 2 },
    { id: '103', name: '103', tier: 'lower', priceMin: 180, priceMax: 240, order: 3 },
    { id: '104', name: '104', tier: 'lower', priceMin: 180, priceMax: 240, order: 4 },
    { id: '105', name: '105', tier: 'lower', priceMin: 200, priceMax: 260, order: 5 },
    { id: '106', name: '106', tier: 'lower', priceMin: 220, priceMax: 285, order: 6 },
    { id: '201', name: '201', tier: 'upper', priceMin: 95, priceMax: 120, order: 7 },
    { id: '202', name: '202', tier: 'upper', priceMin: 90, priceMax: 110, order: 8 },
    { id: '203', name: '203', tier: 'upper', priceMin: 85, priceMax: 105, order: 9 },
    { id: '204', name: '204', tier: 'upper', priceMin: 85, priceMax: 105, order: 10 },
    { id: '205', name: '205', tier: 'upper', priceMin: 90, priceMax: 110, order: 11 },
    { id: '206', name: '206', tier: 'upper', priceMin: 95, priceMax: 120, order: 12 },
  ],
  // Event 9: MSG basketball – same venue (v1), same bowl layout but floor labeled "Court"; map builds from this section set
  '9': [
    { id: 'floor', name: 'Court', tier: 'floor', priceMin: 350, priceMax: 500, order: 0 },
    { id: '101', name: '101', tier: 'lower', priceMin: 180, priceMax: 220, order: 1 },
    { id: '102', name: '102', tier: 'lower', priceMin: 165, priceMax: 200, order: 2 },
    { id: '103', name: '103', tier: 'lower', priceMin: 150, priceMax: 185, order: 3 },
    { id: '104', name: '104', tier: 'lower', priceMin: 140, priceMax: 175, order: 4 },
    { id: '105', name: '105', tier: 'lower', priceMin: 150, priceMax: 185, order: 5 },
    { id: '106', name: '106', tier: 'lower', priceMin: 165, priceMax: 200, order: 6 },
    { id: '201', name: '201', tier: 'upper', priceMin: 100, priceMax: 130, order: 7 },
    { id: '202', name: '202', tier: 'upper', priceMin: 95, priceMax: 120, order: 8 },
    { id: '203', name: '203', tier: 'upper', priceMin: 88, priceMax: 115, order: 9 },
    { id: '204', name: '204', tier: 'upper', priceMin: 88, priceMax: 115, order: 10 },
    { id: '205', name: '205', tier: 'upper', priceMin: 95, priceMax: 120, order: 11 },
    { id: '206', name: '206', tier: 'upper', priceMin: 100, priceMax: 130, order: 12 },
    { id: '301', name: '301', tier: 'top', priceMin: 72, priceMax: 95, order: 13 },
    { id: '302', name: '302', tier: 'top', priceMin: 65, priceMax: 88, order: 14 },
    { id: '303', name: '303', tier: 'top', priceMin: 60, priceMax: 82, order: 15 },
    { id: '304', name: '304', tier: 'top', priceMin: 60, priceMax: 82, order: 16 },
    { id: '305', name: '305', tier: 'top', priceMin: 65, priceMax: 88, order: 17 },
    { id: '306', name: '306', tier: 'top', priceMin: 72, priceMax: 95, order: 18 },
  ],
  // Event 8: NFL Championship at Mercedes-Benz Stadium (v8) – Field + Club + 100s/200s/300s
  '8': [
    { id: 'floor', name: 'Field', tier: 'floor', priceMin: 1200, priceMax: 2500, order: 0 },
    { id: 'club', name: 'Club', tier: 'lower', priceMin: 900, priceMax: 1400, order: 1 },
    { id: '101', name: '101', tier: 'lower', priceMin: 650, priceMax: 900, order: 2 },
    { id: '102', name: '102', tier: 'lower', priceMin: 600, priceMax: 850, order: 3 },
    { id: '103', name: '103', tier: 'lower', priceMin: 550, priceMax: 800, order: 4 },
    { id: '104', name: '104', tier: 'lower', priceMin: 550, priceMax: 800, order: 5 },
    { id: '105', name: '105', tier: 'lower', priceMin: 600, priceMax: 850, order: 6 },
    { id: '106', name: '106', tier: 'lower', priceMin: 650, priceMax: 900, order: 7 },
    { id: '201', name: '201', tier: 'upper', priceMin: 450, priceMax: 650, order: 8 },
    { id: '202', name: '202', tier: 'upper', priceMin: 420, priceMax: 600, order: 9 },
    { id: '203', name: '203', tier: 'upper', priceMin: 400, priceMax: 580, order: 10 },
    { id: '204', name: '204', tier: 'upper', priceMin: 400, priceMax: 580, order: 11 },
    { id: '205', name: '205', tier: 'upper', priceMin: 420, priceMax: 600, order: 12 },
    { id: '206', name: '206', tier: 'upper', priceMin: 450, priceMax: 650, order: 13 },
    { id: '301', name: '301', tier: 'top', priceMin: 380, priceMax: 520, order: 14 },
    { id: '302', name: '302', tier: 'top', priceMin: 350, priceMax: 480, order: 15 },
    { id: '303', name: '303', tier: 'top', priceMin: 320, priceMax: 450, order: 16 },
    { id: '304', name: '304', tier: 'top', priceMin: 320, priceMax: 450, order: 17 },
    { id: '305', name: '305', tier: 'top', priceMin: 350, priceMax: 480, order: 18 },
    { id: '306', name: '306', tier: 'top', priceMin: 380, priceMax: 520, order: 19 },
  ],
};

/** Venue id → default section map (for API events that don't have event id in venueMapByEvent). */
const VENUE_MAP_BY_VENUE_ID: Record<string, VenueSection[]> = {
  v1: venueMapByEvent['1'],
  v2: venueMapByEvent['2'],
  v8: venueMapByEvent['8'],
};

/** Get section map by venue id so API events (e.g. cuid) still show the seat map when venue is v1, v2, v8. */
export function getVenueMapByVenueId(venueId: string): VenueSection[] {
  return VENUE_MAP_BY_VENUE_ID[venueId] ?? [];
}

// Simple hash for deterministic "sold" state from seat id
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateSeats(
  eventId: string,
  section: string,
  rows: string[],
  seatsPerRow: number,
  priceBase: number,
  priceRowDelta: number,
  soldRatio: number
): Seat[] {
  const out: Seat[] = [];
  rows.forEach((row, ri) => {
    const price = priceBase + ri * priceRowDelta;
    for (let s = 1; s <= seatsPerRow; s++) {
      const id = `${eventId}-${section}-${row}-${s}`;
      out.push({
        id,
        section,
        row,
        number: String(s),
        price: Math.round(price),
        available: (hash(id) % 100) / 100 > soldRatio,
      });
    }
  });
  return out;
}

// Full seat map data for event 1 (arena-style)
function buildEvent1Seats(): Seat[] {
  const floorRows = ['A', 'B', 'C', 'D'];
  const floor = generateSeats('1', 'Floor', floorRows, 8, 450, -25, 0.4);
  const lowerSections = ['101', '102', '103', '104', '105', '106'];
  const lowerRows = Array.from({ length: 10 }, (_, i) => String(i + 1));
  const lower = lowerSections.flatMap((sec, si) =>
    generateSeats('1', sec, lowerRows, 6, 320 - si * 15, -8, 0.35)
  );
  const upperSections = ['201', '202', '203', '204', '205', '206'];
  const upperRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const upper = upperSections.flatMap((sec, si) =>
    generateSeats('1', sec, upperRows, 6, 220 - si * 10, -5, 0.3)
  );
  const topSections = ['301', '302', '303', '304', '305', '306'];
  const topRows = Array.from({ length: 10 }, (_, i) => String(i + 1));
  const top = topSections.flatMap((sec, si) =>
    generateSeats('1', sec, topRows, 5, 160 - si * 8, -4, 0.25)
  );
  return [...floor, ...lower, ...upper, ...top];
}

function buildEvent2Seats(): Seat[] {
  const lowerRows = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const upperRows = Array.from({ length: 20 }, (_, i) => String(i + 1));
  const court = generateSeats('2', 'Court', ['1', '2', '3'], 10, 400, -20, 0.5);
  const lower = generateSeats('2', 'Lower Bowl', lowerRows, 8, 285, -10, 0.4);
  const upper = generateSeats('2', 'Upper Bowl', upperRows, 8, 120, -2, 0.25);
  return [...court, ...lower, ...upper];
}

// Event 8: NFL at Mercedes-Benz Stadium – Field, Club, 101–306 (matches venueMapByEvent['8'])
function buildEvent8Seats(): Seat[] {
  const fieldRows = ['1', '2', '3', '4'];
  const field = generateSeats('8', 'Field', fieldRows, 12, 2200, -80, 0.4);
  const clubRows = Array.from({ length: 8 }, (_, i) => String(i + 1));
  const club = generateSeats('8', 'Club', clubRows, 8, 1200, -25, 0.35);
  const lowerSections = ['101', '102', '103', '104', '105', '106'];
  const lowerRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const lower = lowerSections.flatMap((sec, si) =>
    generateSeats('8', sec, lowerRows, 6, 800 - si * 35, -12, 0.3)
  );
  const upperSections = ['201', '202', '203', '204', '205', '206'];
  const upperRows = Array.from({ length: 14 }, (_, i) => String(i + 1));
  const upper = upperSections.flatMap((sec, si) =>
    generateSeats('8', sec, upperRows, 6, 580 - si * 20, -6, 0.25)
  );
  const topSections = ['301', '302', '303', '304', '305', '306'];
  const topRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const top = topSections.flatMap((sec, si) =>
    generateSeats('8', sec, topRows, 5, 480 - si * 18, -4, 0.2)
  );
  return [...field, ...club, ...lower, ...upper, ...top];
}

// Event 9: MSG basketball – same bowl as event 1, section names match venueMapByEvent['9'] (Court, 101–306)
function buildEvent9Seats(): Seat[] {
  const courtRows = ['1', '2', '3', '4', '5'];
  const court = generateSeats('9', 'Court', courtRows, 10, 450, -25, 0.35);
  const lowerSections = ['101', '102', '103', '104', '105', '106'];
  const lowerRows = Array.from({ length: 10 }, (_, i) => String(i + 1));
  const lower = lowerSections.flatMap((sec, si) =>
    generateSeats('9', sec, lowerRows, 6, 200 - si * 12, -6, 0.3)
  );
  const upperSections = ['201', '202', '203', '204', '205', '206'];
  const upperRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const upper = upperSections.flatMap((sec, si) =>
    generateSeats('9', sec, upperRows, 6, 120 - si * 6, -3, 0.25)
  );
  const topSections = ['301', '302', '303', '304', '305', '306'];
  const topRows = Array.from({ length: 10 }, (_, i) => String(i + 1));
  const top = topSections.flatMap((sec, si) =>
    generateSeats('9', sec, topRows, 5, 85 - si * 4, -2, 0.2)
  );
  return [...court, ...lower, ...upper, ...top];
}

const event1Seats = buildEvent1Seats();
const event2Seats = buildEvent2Seats();
const event8Seats = buildEvent8Seats();
const event9Seats = buildEvent9Seats();

export const seatsByEvent: Record<string, Seat[]> = {
  '1': event1Seats,
  '2': event2Seats,
  '8': event8Seats,
  '9': event9Seats,
};

export function getTicketsForEvent(eventId: string): TicketListing[] {
  return ticketListingsByEvent[eventId] ?? [];
}

export function getSeatsForEvent(eventId: string): Seat[] {
  return seatsByEvent[eventId] ?? [];
}

/** Generate seats for an event at a known venue (for API events so the map can show seat dots when zoomed). */
export function getSeatsForVenue(eventId: string, venueId: string): Seat[] {
  const sections = VENUE_MAP_BY_VENUE_ID[venueId];
  if (!sections || sections.length === 0) return [];
  if (venueId === 'v1') {
    const floorRows = ['A', 'B', 'C', 'D'];
    const floor = generateSeats(eventId, 'Floor', floorRows, 8, 450, -25, 0.4);
    const lowerSections = ['101', '102', '103', '104', '105', '106'];
    const lowerRows = Array.from({ length: 10 }, (_, i) => String(i + 1));
    const lower = lowerSections.flatMap((sec, si) =>
      generateSeats(eventId, sec, lowerRows, 6, 320 - si * 15, -8, 0.35)
    );
    const upperSections = ['201', '202', '203', '204', '205', '206'];
    const upperRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const upper = upperSections.flatMap((sec, si) =>
      generateSeats(eventId, sec, upperRows, 6, 220 - si * 10, -5, 0.3)
    );
    const topSections = ['301', '302', '303', '304', '305', '306'];
    const topRows = Array.from({ length: 10 }, (_, i) => String(i + 1));
    const top = topSections.flatMap((sec, si) =>
      generateSeats(eventId, sec, topRows, 5, 160 - si * 8, -4, 0.25)
    );
    return [...floor, ...lower, ...upper, ...top];
  }
  if (venueId === 'v8') {
    const fieldRows = ['1', '2', '3', '4'];
    const field = generateSeats(eventId, 'Field', fieldRows, 12, 2200, -80, 0.4);
    const clubRows = Array.from({ length: 8 }, (_, i) => String(i + 1));
    const club = generateSeats(eventId, 'Club', clubRows, 8, 1200, -25, 0.35);
    const lowerSections = ['101', '102', '103', '104', '105', '106'];
    const lowerRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const lower = lowerSections.flatMap((sec, si) =>
      generateSeats(eventId, sec, lowerRows, 6, 800 - si * 35, -12, 0.3)
    );
    const upperSections = ['201', '202', '203', '204', '205', '206'];
    const upperRows = Array.from({ length: 14 }, (_, i) => String(i + 1));
    const upper = upperSections.flatMap((sec, si) =>
      generateSeats(eventId, sec, upperRows, 6, 580 - si * 20, -6, 0.25)
    );
    const topSections = ['301', '302', '303', '304', '305', '306'];
    const topRows = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const top = topSections.flatMap((sec, si) =>
      generateSeats(eventId, sec, topRows, 5, 480 - si * 18, -4, 0.2)
    );
    return [...field, ...club, ...lower, ...upper, ...top];
  }
  if (venueId === 'v2') {
    const lowerRows = Array.from({ length: 15 }, (_, i) => String(i + 1));
    const upperRows = Array.from({ length: 20 }, (_, i) => String(i + 1));
    const court = generateSeats(eventId, 'Court', ['1', '2', '3'], 10, 400, -20, 0.5);
    const lower = generateSeats(eventId, 'Lower Bowl', lowerRows, 8, 285, -10, 0.4);
    const upper = generateSeats(eventId, 'Upper Bowl', upperRows, 8, 120, -2, 0.25);
    return [...court, ...lower, ...upper];
  }
  return [];
}

export function getVenueMapForEvent(eventId: string): VenueSection[] {
  return venueMapByEvent[eventId] ?? [];
}

