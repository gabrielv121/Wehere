import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { requireAuth, signToken, type AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
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
    res.status(500).json({ error: 'Registration failed' });
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
    res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
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
    res.status(500).json({ error: 'Failed to load user' });
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
  const { userId } = (req as Request & { user: JwtPayload }).user;
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
