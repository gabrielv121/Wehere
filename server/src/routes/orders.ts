import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const SELLER_FEE_PERCENT = 10;

export const ordersRouter = Router();

/** POST /api/orders — create order (checkout); auth */
ordersRouter.post('/', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const body = req.body as {
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
      listingId: string;
      sellerId: string;
    };
    if (
      !body.eventId ||
      !body.eventName ||
      !body.eventDate ||
      !body.venue ||
      !body.section ||
      body.quantity == null ||
      body.pricePerTicket == null ||
      body.totalPrice == null ||
      !body.listingId ||
      !body.sellerId
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const buyer = await prisma.user.findUnique({ where: { id: userId } });
    if (!buyer) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const fee = (body.totalPrice * SELLER_FEE_PERCENT) / 100;
    const sellerPayout = body.totalPrice - fee;
    const order = await prisma.order.create({
      data: {
        userId,
        eventId: body.eventId,
        eventName: body.eventName,
        eventDate: body.eventDate,
        eventImage: body.eventImage ?? null,
        venue: JSON.stringify(body.venue),
        orderDate: new Date().toISOString(),
        section: body.section,
        row: body.row ?? null,
        quantity: body.quantity,
        pricePerTicket: body.pricePerTicket,
        totalPrice: body.totalPrice,
        status: 'confirmed',
        listingId: body.listingId,
        sellerId: body.sellerId,
        sellerFeePercent: SELLER_FEE_PERCENT,
        sellerPayout,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
      },
    });
    await prisma.listing.update({
      where: { id: body.listingId },
      data: { status: 'sold' },
    });
    const out = { ...order, venue: JSON.parse(order.venue) as { name: string; city: string; state: string } };
    res.status(201).json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/** GET /api/orders/me — my purchases; auth */
ordersRouter.get('/me', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { orderDate: 'desc' },
    });
    const parsed = orders.map((o) => ({
      ...o,
      venue: JSON.parse(o.venue) as { name: string; city: string; state: string },
    }));
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

/** GET /api/orders/sales — my sales (seller); auth */
ordersRouter.get('/sales', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const orders = await prisma.order.findMany({
      where: { sellerId: userId },
      orderBy: { orderDate: 'desc' },
    });
    const parsed = orders.map((o) => ({
      ...o,
      venue: JSON.parse(o.venue) as { name: string; city: string; state: string },
    }));
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list sales' });
  }
});

/** GET /api/orders/admin — all orders (admin) */
ordersRouter.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
    });
    const parsed = orders.map((o) => ({
      ...o,
      venue: JSON.parse(o.venue) as { name: string; city: string; state: string },
    }));
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

/** PATCH /api/orders/:id/status — update order status (admin or buyer for cancel) */
ordersRouter.patch('/:id/status', requireAuth, async (req, res) => {
  const { userId, role } = (req as AuthRequest).user;
  const { status } = req.body as { status: string };
  if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.userId !== userId && role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ ...updated, venue: JSON.parse(updated.venue) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/** PATCH /api/orders/:id/verify — mark ticket verified (admin) */
ordersRouter.patch('/:id/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { ticketVerifiedAt: new Date().toISOString() },
    });
    res.json({ ...updated, venue: JSON.parse(updated.venue) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/** PATCH /api/orders/:id/release-payout — mark payout released (admin) */
ordersRouter.patch('/:id/release-payout', requireAuth, requireAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { sellerPayoutReleasedAt: new Date().toISOString() },
    });
    res.json({ ...updated, venue: JSON.parse(updated.venue) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order' });
  }
});
