export type Category = 'concert' | 'sports' | 'theater' | 'comedy' | 'family';

export interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  image?: string;
}

export interface Event {
  id: string;
  title: string;
  category: Category;
  venue: Venue;
  date: string; // ISO
  image: string;
  minPrice: number;
  maxPrice?: number;
  featured?: boolean;
  /** If false, event is hidden from public listing (admin-only) */
  visible?: boolean;
  /** Optional external link (e.g. for "Get tickets" off-site) */
  externalUrl?: string;
}

export interface TicketListing {
  id: string;
  eventId: string;
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  seller: string;
  /** Set when listing is from marketplace (user resale); used at checkout */
  listingId?: string;
  sellerId?: string;
  /** Wheelchair accessible / ADA seating */
  ada?: boolean;
}

/** User-created resale listing (seller lists tickets they own) */
export type MarketplaceListingStatus = 'available' | 'pending' | 'sold';

export interface MarketplaceListing {
  id: string;
  eventId: string;
  sellerId: string;
  sellerName: string;
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  status: MarketplaceListingStatus;
  createdAt: string; // ISO
  /** When true, price was set from market and can be adjusted over time */
  dynamicPricing?: boolean;
  /** Wheelchair accessible / ADA seating */
  ada?: boolean;
}

export interface Seat {
  id: string;
  section: string;
  row: string;
  number: string;
  price: number;
  available: boolean;
}

/** Section block on the venue map (for layout + price display) */
export interface VenueSection {
  id: string;
  name: string;
  tier: 'floor' | 'lower' | 'upper' | 'top';
  priceMin: number;
  priceMax: number;
  /** Display order for layout (e.g. left-to-right) */
  order: number;
}

/** Order status: pending (payment) → confirmed (paid) → delivered (tickets sent) */
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

/** User purchase / order (stored per user) – snapshot of event at time of order */
export interface Purchase {
  id: string;
  userId: string;
  eventId: string;
  /** Snapshot at order time */
  eventName: string;
  eventDate: string; // ISO – event date/time
  eventImage?: string;
  venue: { name: string; city: string; state: string };
  orderDate: string; // ISO – when order was placed
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  status: OrderStatus;
  /** Marketplace: listing that was purchased */
  listingId?: string;
  /** Marketplace: seller who sold the tickets (buyer is userId) */
  sellerId?: string;
  /** Marketplace: fee we charge the seller (percentage at time of sale) */
  sellerFeePercent?: number;
  /** Marketplace: amount released to seller after delivery (totalPrice - fee) */
  sellerPayout?: number;
  /** When seller marked "I sent the ticket" (ISO) */
  sellerSentAt?: string;
  /** Admin: when the ticket was verified as legit (ISO) */
  ticketVerifiedAt?: string;
  /** Admin: when payout was released to the seller (ISO) */
  sellerPayoutReleasedAt?: string;
}

/** Order with buyer info for admin list */
export interface AdminOrder extends Purchase {
  buyerName: string;
  buyerEmail: string;
}
