import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env first (when server is run from root), then server/.env (takes precedence)
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { ticketmasterRouter } from './routes/ticketmaster.js';
import { listingsRouter } from './routes/listings.js';
import { ordersRouter, stripeWebhookHandler } from './routes/orders.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const prisma = new PrismaClient();

// CORS: allow GitHub Pages + local dev. Required for frontend at gabrielv121.github.io calling this API.
const ALLOWED_ORIGIN = 'https://gabrielv121.github.io';
const isAllowedOrigin = (origin: string | undefined) =>
  !origin ||
  origin === ALLOWED_ORIGIN ||
  /^http:\/\/localhost(:\d+)?$/.test(origin) ||
  /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || ALLOWED_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});
app.post('/api/orders/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/ticketmaster', ticketmasterRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/orders', ordersRouter);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$connect();
    res.json({ ok: true, message: 'WeHere API' });
  } catch (e) {
    console.error('Health check failed:', e);
    res.status(503).json({
      ok: false,
      error: 'Database not set up. In the server folder run: npx prisma generate && npx prisma db push',
    });
  }
});

app.listen(PORT, () => {
  console.log(`WeHere API running at http://localhost:${PORT}`);
});
