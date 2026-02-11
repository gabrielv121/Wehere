import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { sendOrderConfirmation, sendSellerSaleNotification, sendBuyerTicketSentNotification } from '../lib/email.js';

const prisma = new PrismaClient();
const SELLER_FEE_PERCENT = 10;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const frontendUrl = (process.env.FRONTEND_URL as string)?.replace(/\/$/, '') || 'http://localhost:5173';
const transferLink =
  (process.env.TICKETMASTER_TRANSFER_URL as string)?.trim() || `${frontendUrl}/my-sales`;

export const ordersRouter = Router();

/** GET /api/orders/config — whether Stripe checkout is enabled */
ordersRouter.get('/config', (_req, res) => {
  res.json({ useStripe: Boolean(stripeSecretKey) });
});

type OrderBodySchema = {
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

function validateOrderBody(body: unknown): body is OrderBodySchema {
  const b = body as Record<string, unknown>;
  return (
    typeof b?.eventId === 'string' &&
    typeof b?.eventName === 'string' &&
    typeof b?.eventDate === 'string' &&
    b?.venue != null &&
    typeof (b.venue as { name?: string }).name === 'string' &&
    typeof b?.section === 'string' &&
    typeof b?.quantity === 'number' &&
    typeof b?.pricePerTicket === 'number' &&
    typeof b?.totalPrice === 'number' &&
    typeof b?.listingId === 'string' &&
    typeof b?.sellerId === 'string'
  );
}

/** Send seller sale notification (24h deadline, transfer link). Call after order created. */
async function notifySellerOfSale(params: {
  sellerId: string;
  eventName: string;
  eventDate: string;
  section: string;
  row?: string | null;
  quantity: number;
  totalPrice: number;
  sellerPayout: number;
  orderId: string;
}): Promise<void> {
  const seller = await prisma.user.findUnique({ where: { id: params.sellerId }, select: { email: true } });
  if (!seller?.email) return;
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  sendSellerSaleNotification(seller.email, {
    eventName: params.eventName,
    eventDate: params.eventDate,
    section: params.section,
    row: params.row ?? null,
    quantity: params.quantity,
    totalPrice: params.totalPrice,
    sellerPayout: params.sellerPayout,
    orderId: params.orderId,
    transferLink,
    deadlineAt: deadline.toISOString(),
  }).catch((e) => console.error('[order] seller sale notification failed:', e));
}

/** POST /api/orders — create order (checkout); auth. When Stripe is enabled, use create-checkout-session instead. */
ordersRouter.post('/', requireAuth, async (req, res) => {
  if (stripeSecretKey) {
    res.status(400).json({ error: 'Payments are via Stripe. Use the checkout button to pay.' });
    return;
  }
  const { userId } = (req as AuthRequest).user;
  try {
    if (!validateOrderBody(req.body)) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const body = req.body as OrderBodySchema;
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
    sendOrderConfirmation(buyer.email, {
      eventName: body.eventName,
      eventDate: body.eventDate,
      section: body.section,
      row: body.row ?? null,
      quantity: body.quantity,
      totalPrice: body.totalPrice,
      orderId: order.id,
    }).catch((e) => console.error('[order] confirmation email failed:', e));
    await notifySellerOfSale({
      sellerId: body.sellerId,
      eventName: body.eventName,
      eventDate: body.eventDate,
      section: body.section,
      row: body.row ?? null,
      quantity: body.quantity,
      totalPrice: body.totalPrice,
      sellerPayout: order.sellerPayout ?? 0,
      orderId: order.id,
    });
    const out = { ...order, venue: JSON.parse(order.venue) as { name: string; city: string; state: string } };
    res.status(201).json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/** POST /api/orders/create-checkout-session — create Stripe Checkout Session; auth. Returns { url }. */
ordersRouter.post('/create-checkout-session', requireAuth, async (req, res) => {
  if (!stripeSecretKey) {
    res.status(503).json({ error: 'Stripe is not configured' });
    return;
  }
  const { userId } = (req as AuthRequest).user;
  if (!validateOrderBody(req.body)) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const body = req.body as OrderBodySchema & { buyerName?: string; buyerEmail?: string };
  try {
    const buyer = await prisma.user.findUnique({ where: { id: userId } });
    if (!buyer) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
      select: { status: true, sellerId: true },
    });
    if (!listing || listing.status !== 'available' || listing.sellerId !== body.sellerId) {
      res.status(400).json({ error: 'Listing no longer available' });
      return;
    }
    const totalCents = Math.round(body.totalPrice * 100);
    if (totalCents < 50) {
      res.status(400).json({ error: 'Amount too small for Stripe' });
      return;
    }
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalCents,
            product_data: {
              name: body.eventName,
              description: `${body.section}${body.row ? ` · Row ${body.row}` : ''} · ${body.quantity} ticket(s)`,
              images: body.eventImage ? [body.eventImage] : undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout`,
      customer_email: body.buyerEmail ?? buyer.email,
      client_reference_id: userId,
      metadata: {
        userId,
        eventId: body.eventId,
        eventName: body.eventName,
        eventDate: body.eventDate,
        eventImage: body.eventImage ?? '',
        venue: JSON.stringify(body.venue),
        section: body.section,
        row: body.row ?? '',
        quantity: String(body.quantity),
        pricePerTicket: String(body.pricePerTicket),
        totalPrice: String(body.totalPrice),
        listingId: body.listingId,
        sellerId: body.sellerId,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
      },
    });
    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/** GET /api/orders/by-session/:sessionId — get order by Stripe session id (for success page); auth */
ordersRouter.get('/by-session/:sessionId', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const sessionId = req.params.sessionId;
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }
  try {
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId, userId },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const out = { ...order, venue: JSON.parse(order.venue) as { name: string; city: string; state: string } };
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load order' });
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

/** PATCH /api/orders/:id/seller-sent — seller marks "I sent the ticket"; auth, seller only */
ordersRouter.patch('/:id/seller-sent', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.sellerId !== userId) {
      res.status(403).json({ error: 'Only the seller can mark this order as sent' });
      return;
    }
    if (order.status !== 'confirmed') {
      res.status(400).json({ error: 'Order must be confirmed to mark as sent' });
      return;
    }
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { sellerSentAt: new Date().toISOString() },
    });
    const buyerEmail = order.buyerEmail ?? (await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } }))?.email;
    if (buyerEmail) {
      sendBuyerTicketSentNotification(buyerEmail, {
        eventName: order.eventName,
        eventDate: order.eventDate,
        section: order.section,
        row: order.row ?? null,
        quantity: order.quantity,
        orderId: order.id,
        confirmLink: `${frontendUrl}/account/tickets`,
        buyerName: order.buyerName ?? null,
      }).catch((e) => console.error('[order] buyer ticket-sent notification failed:', e));
    }
    res.json({ ...updated, venue: JSON.parse(updated.venue) as { name: string; city: string; state: string } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/** PATCH /api/orders/:id/buyer-received — buyer marks "I received my ticket"; sets delivered + releases payout */
ordersRouter.patch('/:id/buyer-received', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Only the buyer can confirm receipt' });
      return;
    }
    if (!order.sellerSentAt) {
      res.status(400).json({ error: 'Seller has not marked the ticket as sent yet' });
      return;
    }
    if (order.status === 'delivered') {
      res.json({ ...order, venue: JSON.parse(order.venue) as { name: string; city: string; state: string } });
      return;
    }
    const now = new Date().toISOString();
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'delivered',
        ticketVerifiedAt: now,
        sellerPayoutReleasedAt: now,
      },
    });
    res.json({ ...updated, venue: JSON.parse(updated.venue) as { name: string; city: string; state: string } });
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

/** Stripe webhook handler. Mount with express.raw({ type: 'application/json' }) so req.body is Buffer. */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!stripeSecretKey || !stripeWebhookSecret) {
    res.status(503).json({ error: 'Stripe webhook not configured' });
    return;
  }
  const rawBody = req.body;
  if (!(rawBody instanceof Buffer)) {
    res.status(400).json({ error: 'Raw body required' });
    return;
  }
  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature' });
    return;
  }
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey);
    event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error('[stripe] webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }
  if (event.type !== 'checkout.session.completed') {
    res.json({ received: true });
    return;
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata;
  if (!metadata?.userId || !metadata?.listingId || !metadata?.eventId) {
    console.error('[stripe] missing metadata on session', session.id);
    res.status(400).json({ error: 'Missing metadata' });
    return;
  }
  try {
    const fee = (Number(metadata.totalPrice) * SELLER_FEE_PERCENT) / 100;
    const sellerPayout = Number(metadata.totalPrice) - fee;
    const order = await prisma.order.create({
      data: {
        userId: metadata.userId,
        eventId: metadata.eventId,
        eventName: metadata.eventName,
        eventDate: metadata.eventDate,
        eventImage: metadata.eventImage || null,
        venue: metadata.venue,
        orderDate: new Date().toISOString(),
        section: metadata.section,
        row: metadata.row || null,
        quantity: Number(metadata.quantity),
        pricePerTicket: Number(metadata.pricePerTicket),
        totalPrice: Number(metadata.totalPrice),
        status: 'confirmed',
        listingId: metadata.listingId,
        sellerId: metadata.sellerId,
        sellerFeePercent: SELLER_FEE_PERCENT,
        sellerPayout,
        buyerName: metadata.buyerName ?? null,
        buyerEmail: metadata.buyerEmail ?? null,
        stripeSessionId: session.id,
      },
    });
    await prisma.listing.update({
      where: { id: metadata.listingId },
      data: { status: 'sold' },
    });
    const email = metadata.buyerEmail ?? session.customer_email;
    if (email) {
      sendOrderConfirmation(email, {
        eventName: metadata.eventName,
        eventDate: metadata.eventDate,
        section: metadata.section,
        row: metadata.row || null,
        quantity: Number(metadata.quantity),
        totalPrice: Number(metadata.totalPrice),
        orderId: order.id,
      }).catch((e) => console.error('[order] confirmation email failed:', e));
    }
    await notifySellerOfSale({
      sellerId: metadata.sellerId,
      eventName: metadata.eventName,
      eventDate: metadata.eventDate,
      section: metadata.section,
      row: metadata.row || null,
      quantity: Number(metadata.quantity),
      totalPrice: Number(metadata.totalPrice),
      sellerPayout: order.sellerPayout ?? 0,
      orderId: order.id,
    });
    res.json({ received: true, orderId: order.id });
  } catch (e) {
    console.error('[stripe] webhook create order failed:', e);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
