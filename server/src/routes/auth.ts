import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, signToken, type AuthRequest } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../lib/email.js';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const prisma = new PrismaClient();

function isPrismaSetupError(e: unknown): boolean {
  const code = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : '';
  return typeof code === 'string' && (code.startsWith('P1') || code === 'P2021');
}
export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email?.trim() || !password || !name?.trim()) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        name: name.trim(),
        role: 'user',
      },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country ?? undefined,
        phone: user.phone ?? undefined,
        paymentMethodOnFile: user.paymentMethodOnFile ?? undefined,
        cardLast4: user.cardLast4 ?? undefined,
        cardBrand: user.cardBrand ?? undefined,
      },
    });
  } catch (e) {
    console.error(e);
    const msg = isPrismaSetupError(e)
      ? 'Database not set up. In the server folder run: npx prisma generate && npx prisma db push'
      : 'Registration failed';
    res.status(isPrismaSetupError(e) ? 503 : 500).json({ error: msg });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country ?? undefined,
        phone: user.phone ?? undefined,
        paymentMethodOnFile: user.paymentMethodOnFile ?? undefined,
        cardLast4: user.cardLast4 ?? undefined,
        cardBrand: user.cardBrand ?? undefined,
      },
    });
  } catch (e) {
    console.error(e);
    const msg = isPrismaSetupError(e)
      ? 'Database schema out of date. In the server folder run: npx prisma generate && npx prisma db push'
      : process.env.NODE_ENV === 'production' ? 'Login failed' : (e instanceof Error ? e.message : 'Login failed');
    res.status(isPrismaSetupError(e) ? 503 : 500).json({ error: msg });
  }
});

const frontendUrl = (process.env.FRONTEND_URL as string)?.replace(/\/$/, '') || 'http://localhost:5173';
const backendUrl = (process.env.BACKEND_URL as string)?.replace(/\/$/, '') || 'http://localhost:3001';

/** Find or create user from OAuth profile; returns user and our JWT. Uses a random password for OAuth-only users. */
async function findOrCreateOAuthUser(provider: 'google' | 'apple', providerId: string, email: string, name: string) {
  const emailNorm = email.trim().toLowerCase();
  let user = await prisma.user.findFirst({
    where: { provider, providerId },
  });
  if (user) return user;
  user = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { provider, providerId },
    });
    return { ...user, provider, providerId };
  }
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  return prisma.user.create({
    data: {
      email: emailNorm,
      passwordHash,
      name: name.trim() || emailNorm.split('@')[0],
      role: 'user',
      provider,
      providerId,
    },
  });
}

/** GET /api/auth/google — redirect to Google OAuth. Query: redirect= path to send user after login. Requires GOOGLE_CLIENT_ID. */
authRouter.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: 'Google sign-in is not configured' });
    return;
  }
  const redirectUri = `${backendUrl}/api/auth/google/callback`;
  const redirectPath = (req.query.redirect as string)?.trim() || '/';
  const state = encodeURIComponent(redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`);
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  res.redirect(url);
});

/** GET /api/auth/google/callback — exchange code for user, issue JWT, redirect to frontend. */
authRouter.get('/google/callback', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.redirect(`${frontendUrl}/login?error=Google+sign-in+not+configured`);
    return;
  }
  const code = req.query.code as string;
  if (!code) {
    res.redirect(`${frontendUrl}/login?error=Missing+authorization+code`);
    return;
  }
  try {
    const redirectUri = `${backendUrl}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[auth] Google token error:', tokenRes.status, err);
      res.redirect(`${frontendUrl}/login?error=Google+sign-in+failed`);
      return;
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokens.access_token;
    if (!accessToken) {
      res.redirect(`${frontendUrl}/login?error=Google+sign-in+failed`);
      return;
    }
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) {
      res.redirect(`${frontendUrl}/login?error=Google+sign-in+failed`);
      return;
    }
    const profile = (await userInfoRes.json()) as { id?: string; email?: string; name?: string; given_name?: string; family_name?: string };
    const providerId = profile.id;
    const email = profile.email;
    const name = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || '';
    if (!providerId || !email) {
      res.redirect(`${frontendUrl}/login?error=Google+did+not+return+email`);
      return;
    }
    const user = await findOrCreateOAuthUser('google', providerId, email, name);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    let redirectTo = '/';
    try {
      if (req.query.state && typeof req.query.state === 'string') redirectTo = decodeURIComponent(req.query.state);
    } catch {
      // ignore
    }
    if (!redirectTo.startsWith('/')) redirectTo = '/';
    res.redirect(`${frontendUrl}/login?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectTo)}`);
  } catch (e) {
    console.error(e);
    res.redirect(`${frontendUrl}/login?error=Sign-in+failed`);
  }
});

/** GET /api/auth/apple — redirect to Apple OAuth. Requires APPLE_CLIENT_ID (Service ID), APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY. */
authRouter.get('/apple', (_req, res) => {
  const clientId = process.env.APPLE_CLIENT_ID; // Service ID
  if (!clientId) {
    res.status(503).json({ error: 'Apple sign-in is not configured' });
    return;
  }
  const redirectUri = `${backendUrl}/api/auth/apple/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  const url = `https://appleid.apple.com/auth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code%20id_token&response_mode=form_post&scope=name%20email&state=${state}`;
  res.redirect(url);
});

/** POST /api/auth/apple/callback — Apple POSTs here. Exchange code / verify id_token, find or create user, redirect to frontend. */
authRouter.post('/apple/callback', async (req, res) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    res.redirect(`${frontendUrl}/login?error=Apple+sign-in+not+configured`);
    return;
  }
  const form = req.body as { code?: string; id_token?: string; user?: string; state?: string };
  const idToken = form.id_token;
  const userJson = form.user; // only on first auth: { name: { firstName, lastName }, email }
  let email = '';
  let name = '';
  if (userJson) {
    try {
      const parsed = JSON.parse(userJson) as { name?: { firstName?: string; lastName?: string }; email?: string };
      email = parsed.email?.trim() || '';
      const first = parsed.name?.firstName?.trim() || '';
      const last = parsed.name?.lastName?.trim() || '';
      name = [first, last].filter(Boolean).join(' ');
    } catch {
      // ignore
    }
  }
  if (!idToken) {
    res.redirect(`${frontendUrl}/login?error=Apple+sign-in+failed`);
    return;
  }
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      res.redirect(`${frontendUrl}/login?error=Apple+sign-in+failed`);
      return;
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as { sub?: string; email?: string };
    const providerId = payload.sub;
    if (!providerId) {
      res.redirect(`${frontendUrl}/login?error=Apple+sign-in+failed`);
      return;
    }
    if (payload.email) email = payload.email.trim();
    if (!email) {
      res.redirect(`${frontendUrl}/login?error=Apple+did+not+share+email`);
      return;
    }
    const user = await findOrCreateOAuthUser('apple', providerId, email, name);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const redirectTo = form.state || '/';
    res.redirect(`${frontendUrl}/login?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectTo)}`);
  } catch (e) {
    console.error(e);
    res.redirect(`${frontendUrl}/login?error=Sign-in+failed`);
  }
});

/** POST /api/auth/forgot-password — create reset token, optionally send email. In dev without email config, returns resetLink. */
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      res.status(200).json({ message: 'If that email is registered, we sent a reset link.' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });
    const baseUrl = (process.env.FRONTEND_URL as string)?.replace(/\/$/, '') || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    sendPasswordResetEmail(user.email, resetLink).catch((e) => console.error('[auth] reset email failed:', e));
    if (process.env.NODE_ENV !== 'production') {
      console.log('[dev] Password reset link:', resetLink);
    }
    res.status(200).json({
      message: 'If that email is registered, we sent a reset link.',
      resetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Request failed' });
  }
});

/** POST /api/auth/reset-password — set new password using token. */
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token?.trim() || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: token.trim() },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    res.status(200).json({ message: 'Password updated. You can log in now.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Reset failed' });
  }
});

/** GET /api/auth/verify-email?token= — verify email and allow login */
authRouter.get('/verify-email', async (req, res) => {
  try {
    const token = (req.query.token as string)?.trim();
    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired verification link. Request a new one from the signup flow.' });
      return;
    }
    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    res.status(200).json({ message: 'Email verified. You can log in now.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/** POST /api/auth/resend-verification — send a new verification email */
authRouter.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      res.status(200).json({ message: 'If that email is registered and unverified, we sent a new link.' });
      return;
    }
    if (user.emailVerifiedAt) {
      res.status(200).json({ message: 'That email is already verified. You can log in.' });
      return;
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token: verifyToken, expiresAt: verifyExpiresAt },
    });
    const baseUrl = (process.env.FRONTEND_URL as string)?.replace(/\/$/, '') || 'http://localhost:5173';
    const verifyLink = `${baseUrl}/verify-email?token=${verifyToken}`;
    sendVerificationEmail(user.email, verifyLink).catch((e) => console.error('[auth] resend verification email failed:', e));
    if (process.env.NODE_ENV !== 'production') {
      console.log('[dev] Verification link:', verifyLink);
    }
    res.status(200).json({
      message: 'If that email is registered, we sent a new verification link.',
      verifyLink: process.env.NODE_ENV !== 'production' ? verifyLink : undefined,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Request failed' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        phone: true,
        paymentMethodOnFile: true,
        cardLast4: true,
        cardBrand: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      country: user.country ?? undefined,
      phone: user.phone ?? undefined,
      paymentMethodOnFile: user.paymentMethodOnFile ?? undefined,
      cardLast4: user.cardLast4 ?? undefined,
      cardBrand: user.cardBrand ?? undefined,
    });
  } catch (e) {
    console.error(e);
    const msg = isPrismaSetupError(e)
      ? 'Database schema out of date. In the server folder run: npx prisma generate && npx prisma db push'
      : process.env.NODE_ENV === 'production' ? 'Failed to load user' : (e instanceof Error ? e.message : 'Failed to load user');
    res.status(isPrismaSetupError(e) ? 503 : 500).json({ error: msg });
  }
});

authRouter.patch('/profile', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim(), email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, role: true, country: true, phone: true, paymentMethodOnFile: true, cardLast4: true, cardBrand: true },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
  }
});

authRouter.patch('/seller-info', requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).user;
  const { country, phone, paymentMethodOnFile, cardLast4, cardBrand } = req.body as {
    country?: string;
    phone?: string;
    paymentMethodOnFile?: boolean;
    cardLast4?: string;
    cardBrand?: string;
  };
  if (country !== 'US') {
    res.status(400).json({ error: 'Only US is supported for sellers' });
    return;
  }
  if (!phone?.trim()) {
    res.status(400).json({ error: 'Phone is required' });
    return;
  }
  if (paymentMethodOnFile && (!cardLast4 || cardLast4.replace(/\D/g, '').length !== 4)) {
    res.status(400).json({ error: 'Last 4 digits of card are required' });
    return;
  }
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        country: country ?? null,
        phone: phone.trim(),
        paymentMethodOnFile: paymentMethodOnFile ?? false,
        cardLast4: paymentMethodOnFile ? cardLast4?.replace(/\D/g, '').slice(-4) : null,
        cardBrand: (cardBrand?.trim() || 'Visa') ?? null,
      },
      select: { id: true, email: true, name: true, role: true, country: true, phone: true, paymentMethodOnFile: true, cardLast4: true, cardBrand: true },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
  }
});

/** GET /api/auth/users — list all users (admin only). */
authRouter.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        phone: true,
        paymentMethodOnFile: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/** GET /api/auth/users/:id — one user with listings, purchases, sales (admin only). */
authRouter.get('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        emailVerifiedAt: true,
        country: true,
        phone: true,
        paymentMethodOnFile: true,
        cardLast4: true,
        cardBrand: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const [listings, purchases, sales] = await Promise.all([
      prisma.listing.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { event: { select: { id: true, title: true, date: true } } },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.order.findMany({
        where: { sellerId: userId },
        orderBy: { orderDate: 'desc' },
      }),
    ]);
    res.json({
      user: {
        ...user,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      },
      listings: listings.map((l) => ({
        id: l.id,
        eventId: l.eventId,
        event: l.event,
        section: l.section,
        row: l.row,
        quantity: l.quantity,
        pricePerTicket: l.pricePerTicket,
        totalPrice: l.totalPrice,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
      purchases: purchases.map((o) => ({
        id: o.id,
        eventId: o.eventId,
        eventName: o.eventName,
        eventDate: o.eventDate,
        totalPrice: o.totalPrice,
        status: o.status,
        orderDate: o.orderDate,
        sellerSentAt: o.sellerSentAt,
        ticketVerifiedAt: o.ticketVerifiedAt,
        sellerPayoutReleasedAt: o.sellerPayoutReleasedAt,
      })),
      sales: sales.map((o) => ({
        id: o.id,
        eventId: o.eventId,
        eventName: o.eventName,
        eventDate: o.eventDate,
        totalPrice: o.totalPrice,
        status: o.status,
        orderDate: o.orderDate,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        sellerSentAt: o.sellerSentAt,
        sellerPayoutReleasedAt: o.sellerPayoutReleasedAt,
        sellerPayout: o.sellerPayout,
        stripeSessionId: o.stripeSessionId,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load user' });
  }
});
