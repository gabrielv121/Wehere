import type { Purchase, OrderStatus, AdminOrder } from '../types';
import { updateListingStatus } from './listings';

const STORAGE_PREFIX = 'wehere_purchases_';
const ALL_ORDERS_KEY = 'wehere_all_orders';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadAllOrders(): AdminOrder[] {
  try {
    const raw = localStorage.getItem(ALL_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminOrder[];
  } catch {
    return [];
  }
}

function saveAllOrders(orders: AdminOrder[]) {
  localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(orders));
}

/** One-time migration: build global orders from all wehere_purchases_* (no buyer info for old data) */
function migrateToAllOrders(): AdminOrder[] {
  const orders: AdminOrder[] = [];
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
  for (const key of keys) {
    const userId = key.slice(STORAGE_PREFIX.length);
    const list = loadPurchases(userId);
    for (const p of list) {
      orders.push({
        ...p,
        buyerName: 'User',
        buyerEmail: userId.slice(0, 8) + '…',
      });
    }
  }
  orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  saveAllOrders(orders);
  return orders;
}

function loadPurchases(userId: string): Purchase[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const list = JSON.parse(raw) as Purchase[];
    return list.map(normalizePurchase);
  } catch {
    return [];
  }
}

function normalizePurchase(p: Purchase): Purchase {
  return {
    ...p,
    status: p.status ?? 'confirmed',
    venue: p.venue ?? { name: '', city: '', state: '' },
    eventName: p.eventName ?? '',
    eventDate: p.eventDate ?? p.orderDate,
  };
}

function savePurchases(userId: string, purchases: Purchase[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(purchases));
}

/** Get all purchases for a user (newest first) */
export function getPurchases(userId: string): Purchase[] {
  const list = loadPurchases(userId);
  return list.slice().sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

/** Move purchases from one user id to another (e.g. when migrating to stable id). Clears old key after copy. */
export function migratePurchasesToUser(fromUserId: string, toUserId: string): void {
  if (fromUserId === toUserId) return;
  const list = loadPurchases(fromUserId);
  if (list.length === 0) {
    try {
      localStorage.removeItem(storageKey(fromUserId));
    } catch {
      // ignore
    }
    return;
  }
  const existing = loadPurchases(toUserId);
  const merged = [...existing, ...list].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  savePurchases(toUserId, merged);
  try {
    localStorage.removeItem(storageKey(fromUserId));
  } catch {
    // ignore
  }
}

/** Get upcoming purchases (event date >= today; includes pending, confirmed, delivered so all purchased tickets show) */
export function getUpcomingPurchases(userId: string): Purchase[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getPurchases(userId).filter((p) => {
    if (p.status === 'cancelled') return false;
    const eventDate = new Date(p.eventDate);
    return eventDate >= today;
  });
}

export interface AddPurchaseInput {
  userId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventImage?: string;
  venue: { name: string; city: string; state: string };
  section: string;
  row?: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  status?: OrderStatus;
  /** For admin orders list */
  buyerName?: string;
  buyerEmail?: string;
  /** Marketplace: listing id (mark as sold after purchase) */
  listingId?: string;
  /** Marketplace: seller user id */
  sellerId?: string;
  /** Marketplace: fee % charged to seller */
  sellerFeePercent?: number;
  /** Marketplace: amount paid to seller after delivery */
  sellerPayout?: number;
}

/** Add a purchase (e.g. after checkout). Status defaults to 'confirmed' if omitted. */
export function addPurchase(input: AddPurchaseInput): Purchase {
  const status = input.status ?? 'confirmed';
  const full: Purchase = {
    ...input,
    id: crypto.randomUUID(),
    orderDate: new Date().toISOString(),
    status,
    listingId: input.listingId,
    sellerId: input.sellerId,
    sellerFeePercent: input.sellerFeePercent,
    sellerPayout: input.sellerPayout,
  };
  if (input.listingId) {
    updateListingStatus(input.listingId, 'sold');
  }
  const list = loadPurchases(input.userId);
  list.unshift(full);
  savePurchases(input.userId, list);
  if (input.buyerName != null && input.buyerEmail != null) {
    const all = loadAllOrders();
    all.unshift({
      ...full,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
    });
    saveAllOrders(all);
  }
  return full;
}

/** Get all orders for admin (newest first). Migrates from per-user storage if global list empty. */
export function getAdminOrders(): AdminOrder[] {
  let orders = loadAllOrders();
  if (orders.length === 0) {
    orders = migrateToAllOrders();
  }
  return orders.slice().sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

/** Get all sales for a seller (orders where sellerId matches). */
export function getSalesBySeller(sellerId: string): Purchase[] {
  const all = loadAllOrders();
  return all
    .filter((o) => o.sellerId === sellerId)
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
}

/** Update order status (user list + global admin list). */
export function updateOrderStatus(userId: string, orderId: string, status: OrderStatus): boolean {
  const list = loadPurchases(userId);
  const idx = list.findIndex((p) => p.id === orderId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], status };
  savePurchases(userId, list);
  const all = loadAllOrders();
  const adminIdx = all.findIndex((o) => o.id === orderId);
  if (adminIdx !== -1) {
    all[adminIdx] = { ...all[adminIdx], status };
    saveAllOrders(all);
  }
  return true;
}

/** Admin: mark ticket as verified (legit). Updates user list + global list. */
export function setOrderTicketVerified(userId: string, orderId: string): boolean {
  const now = new Date().toISOString();
  const list = loadPurchases(userId);
  const idx = list.findIndex((p) => p.id === orderId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ticketVerifiedAt: now };
  savePurchases(userId, list);
  const all = loadAllOrders();
  const adminIdx = all.findIndex((o) => o.id === orderId);
  if (adminIdx !== -1) {
    all[adminIdx] = { ...all[adminIdx], ticketVerifiedAt: now };
    saveAllOrders(all);
  }
  return true;
}

/** Admin: mark seller payout as released (funds transferred to seller). Updates user list + global list. */
export function setOrderPayoutReleased(userId: string, orderId: string): boolean {
  const now = new Date().toISOString();
  const list = loadPurchases(userId);
  const idx = list.findIndex((p) => p.id === orderId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], sellerPayoutReleasedAt: now };
  savePurchases(userId, list);
  const all = loadAllOrders();
  const adminIdx = all.findIndex((o) => o.id === orderId);
  if (adminIdx !== -1) {
    all[adminIdx] = { ...all[adminIdx], sellerPayoutReleasedAt: now };
    saveAllOrders(all);
  }
  return true;
}

/** Seed demo purchases for a user if they have none (with new order snapshot fields) */
export function seedDemoPurchases(userId: string): void {
  const list = loadPurchases(userId);
  if (list.length > 0) return;

  const now = new Date();
  const past = new Date(now);
  past.setMonth(past.getMonth() - 2);

  const demo: Purchase[] = [
    {
      id: crypto.randomUUID(),
      userId,
      eventId: '1',
      eventName: 'Taylor Swift | The Eras Tour',
      eventDate: '2025-03-15T19:00:00',
      eventImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      venue: { name: 'Madison Square Garden', city: 'New York', state: 'NY' },
      orderDate: past.toISOString(),
      section: '200',
      row: '12',
      quantity: 2,
      pricePerTicket: 189,
      totalPrice: 378,
      status: 'delivered',
    },
    {
      id: crypto.randomUUID(),
      userId,
      eventId: '2',
      eventName: 'Lakers vs Celtics',
      eventDate: '2025-02-20T19:30:00',
      eventImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      venue: { name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA' },
      orderDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      section: 'Upper',
      row: '5',
      quantity: 2,
      pricePerTicket: 85,
      totalPrice: 170,
      status: 'confirmed',
    },
    {
      id: crypto.randomUUID(),
      userId,
      eventId: '5',
      eventName: 'Beyoncé Renaissance Tour',
      eventDate: '2025-05-22T20:00:00',
      eventImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      venue: { name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ' },
      orderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      section: '100',
      row: '20',
      quantity: 2,
      pricePerTicket: 195,
      totalPrice: 390,
      status: 'pending',
    },
  ];

  savePurchases(userId, demo);
}
