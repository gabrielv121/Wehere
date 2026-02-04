import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const listingsRouter = Router();

/** GET /api/listings/event/:eventId — listings for an event (available + pending, sorted by price) */
listingsRouter.get('/event/:eventId', async (req, res) => {
  try {
    const list = await prisma.listing.findMany({
      where: {
        eventId: req.params.eventId,
        status: { in: ['available', 'pending'] },
      },
      orderBy: { pricePerTicket: 'asc' },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list listings' });
  }
});

/** GET /api/listings/seller/:sellerId — listings by seller (auth: self or admin) */
listingsRouter.get('/seller/:sellerId', requireAuth, async (req, res) => {
  const { userId, role } = (req as AuthRequest).user;
  if (userId !== req.params.sellerId && role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const list = await prisma.listing.findMany({
      where: { sellerId: req.params.sellerId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list listings' });
  }
});

/** GET /api/listings/:id — one listing */
listingsRouter.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    res.json(listing);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load listing' });
  }
});

/** POST /api/listings — create listing (auth) */
listingsRouter.post('/', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const body = req.body as {
      eventId: string;
      section: string;
      row?: string;
      quantity: number;
      pricePerTicket: number;
      dynamicPricing?: boolean;
    };
    if (!body.eventId || !body.section || body.quantity == null || body.pricePerTicket == null) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const quantity = Math.max(1, Math.min(20, Number(body.quantity)));
    const pricePerTicket = Number(body.pricePerTicket);
    const totalPrice = quantity * pricePerTicket;
    const listing = await prisma.listing.create({
      data: {
        eventId: body.eventId,
        sellerId: userId,
        sellerName: user.name,
        section: body.section.trim(),
        row: body.row?.trim() || null,
        quantity,
        pricePerTicket,
        totalPrice,
        status: 'available',
        dynamicPricing: body.dynamicPricing === true,
      },
    });
    res.status(201).json(listing);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

/** PATCH /api/listings/:id/status — update status (e.g. to sold; auth: seller or admin) */
listingsRouter.patch('/:id/status', requireAuth, async (req, res) => {
  const { userId, role } = (req as AuthRequest).user;
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    if (listing.sellerId !== userId && role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const { status } = req.body as { status: string };
    if (!['available', 'pending', 'sold'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});
