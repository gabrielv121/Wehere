import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const eventsRouter = Router();

/** GET /api/events — list events (optional: category, city, visible-only for public) */
eventsRouter.get('/', async (req, res) => {
  try {
    const { category, city, visible } = req.query;
    const where: { category?: string; visible?: boolean } = {};
    if (typeof category === 'string' && category) where.category = category;
    if (typeof visible === 'string' && visible !== 'false') where.visible = true;
    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    const parsed = events.map((e) => ({
      ...e,
      venue: JSON.parse(e.venue) as { id: string; name: string; city: string; state: string },
    }));
    if (typeof city === 'string' && city.trim()) {
      const filtered = parsed.filter((ev) =>
        ev.venue.city.toLowerCase().includes(city.trim().toLowerCase())
      );
      res.json(filtered);
      return;
    }
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

/** GET /api/events/:id — get one event */
eventsRouter.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({
      ...event,
      venue: JSON.parse(event.venue) as { id: string; name: string; city: string; state: string },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load event' });
  }
});

/** POST /api/events — create event (admin) */
eventsRouter.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      title: string;
      category: string;
      venue: { id?: string; name: string; city: string; state: string };
      date: string;
      image: string;
      minPrice: number;
      maxPrice?: number;
      featured?: boolean;
      visible?: boolean;
      externalUrl?: string;
    };
    if (!body.title || !body.category || !body.venue || !body.date || !body.image || body.minPrice == null) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const venue = {
      id: body.venue.id ?? `v-${Date.now()}`,
      name: body.venue.name,
      city: body.venue.city,
      state: body.venue.state,
    };
    const event = await prisma.event.create({
      data: {
        title: body.title,
        category: body.category,
        venue: JSON.stringify(venue),
        date: body.date,
        image: body.image,
        minPrice: Math.round(body.minPrice),
        maxPrice: body.maxPrice != null ? Math.round(body.maxPrice) : null,
        featured: body.featured === true,
        visible: body.visible !== false,
        externalUrl: body.externalUrl ?? null,
      },
    });
    res.status(201).json({ ...event, venue });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/** PATCH /api/events/:id — update event (admin) */
eventsRouter.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    const body = req.body as Partial<{
      title: string;
      category: string;
      venue: { id: string; name: string; city: string; state: string };
      date: string;
      image: string;
      minPrice: number;
      maxPrice: number;
      featured: boolean;
      visible: boolean;
      externalUrl: string;
    }>;
    const data: Record<string, unknown> = {};
    if (body.title != null) data.title = body.title;
    if (body.category != null) data.category = body.category;
    if (body.venue != null) data.venue = JSON.stringify(body.venue);
    if (body.date != null) data.date = body.date;
    if (body.image != null) data.image = body.image;
    if (body.minPrice != null) data.minPrice = Math.round(body.minPrice);
    if (body.maxPrice != null) data.maxPrice = Math.round(body.maxPrice);
    if (body.featured != null) data.featured = body.featured;
    if (body.visible != null) data.visible = body.visible;
    if (body.externalUrl !== undefined) data.externalUrl = body.externalUrl;
    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ ...updated, venue: JSON.parse(updated.venue) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/** DELETE /api/events/:id — delete event (admin) */
eventsRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});
