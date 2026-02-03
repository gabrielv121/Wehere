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
    { id: 't5', eventId: '2', section: 'Lower', row: '10', quantity: 2, pricePerTicket: 285, totalPrice: 570, seller: 'Official' },
    { id: 't6', eventId: '2', section: 'Upper', row: '5', quantity: 4, pricePerTicket: 85, totalPrice: 340, seller: 'Verified Resale' },
    { id: 't6a', eventId: '2', section: 'Upper', row: '12', quantity: 1, pricePerTicket: 85, totalPrice: 85, seller: 'Official' },
    { id: 't6b', eventId: '2', section: 'Lower', row: '5', quantity: 5, pricePerTicket: 220, totalPrice: 1100, seller: 'Verified Resale' },
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
    { id: 't14', eventId: '7', section: '200', row: '15', quantity: 2, pricePerTicket: 99, totalPrice: 198, seller: 'Verified Resale' },
  ],
  '8': [
    { id: 't15', eventId: '8', section: 'Club', row: '5', quantity: 2, pricePerTicket: 1200, totalPrice: 2400, seller: 'Official' },
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
  ],
  '2': [
    { id: 'floor', name: 'Court', tier: 'floor', priceMin: 350, priceMax: 450, order: 0 },
    { id: 'lower', name: 'Lower Bowl', tier: 'lower', priceMin: 150, priceMax: 285, order: 1 },
    { id: 'upper', name: 'Upper Bowl', tier: 'upper', priceMin: 85, priceMax: 120, order: 2 },
  ],
};

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
  return [...floor, ...lower, ...upper];
}

function buildEvent2Seats(): Seat[] {
  const lowerRows = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const upperRows = Array.from({ length: 20 }, (_, i) => String(i + 1));
  const court = generateSeats('2', 'Court', ['1', '2', '3'], 10, 400, -20, 0.5);
  const lower = generateSeats('2', 'Lower Bowl', lowerRows, 8, 285, -10, 0.4);
  const upper = generateSeats('2', 'Upper Bowl', upperRows, 8, 120, -2, 0.25);
  return [...court, ...lower, ...upper];
}

const event1Seats = buildEvent1Seats();
const event2Seats = buildEvent2Seats();

export const seatsByEvent: Record<string, Seat[]> = {
  '1': event1Seats,
  '2': event2Seats,
};

export function getTicketsForEvent(eventId: string): TicketListing[] {
  return ticketListingsByEvent[eventId] ?? [];
}

export function getSeatsForEvent(eventId: string): Seat[] {
  return seatsByEvent[eventId] ?? [];
}

export function getVenueMapForEvent(eventId: string): VenueSection[] {
  return venueMapByEvent[eventId] ?? [];
}

