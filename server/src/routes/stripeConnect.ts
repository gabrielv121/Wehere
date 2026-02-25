import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe =
  stripeSecretKey != null && stripeSecretKey.trim() !== ''
    ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    : null;

export const stripeConnectRouter = Router();

/** POST /api/stripe/connect/account — ensure current user has a Stripe Connect account, return account id */
stripeConnectRouter.post('/account', requireAuth, async (req: AuthRequest, res) => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe is not configured on the server.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, name: true, stripeAccountId: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let accountId = user.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        business_type: 'individual',
        individual: {
          email: user.email,
          first_name: user.name.split(' ')[0] ?? undefined,
          last_name: user.name.split(' ').slice(1).join(' ') || undefined,
        },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { stripeAccountId: accountId },
      });
    }

    res.json({ stripeAccountId: accountId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Stripe Connect account error:', e);
    res.status(500).json({ error: 'Failed to create Stripe Connect account.', detail: process.env.NODE_ENV !== 'production' ? msg : undefined });
  }
});

/** POST /api/stripe/connect/onboard-link — create an onboarding link for current seller */
stripeConnectRouter.post('/onboard-link', requireAuth, async (req: AuthRequest, res) => {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe is not configured on the server.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { stripeAccountId: true },
    });
    if (!user || !user.stripeAccountId) {
      res.status(400).json({ error: 'Stripe Connect account not found for user.' });
      return;
    }

    const frontendUrl = (process.env.FRONTEND_URL as string)?.replace(/\/$/, '') || 'http://localhost:5173';

    const link = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${frontendUrl}/account/payouts`,
      return_url: `${frontendUrl}/account/payouts`,
      type: 'account_onboarding',
    });

    res.json({ url: link.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Stripe Connect onboard link error:', e);
    res.status(500).json({ error: 'Failed to create Stripe Connect onboarding link.', detail: process.env.NODE_ENV !== 'production' ? msg : undefined });
  }
});

