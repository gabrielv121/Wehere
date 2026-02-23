import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env first (when server is run from root), then server/.env (takes precedence)
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { ticketmasterRouter } from './routes/ticketmaster.js';
import { listingsRouter } from './routes/listings.js';
import { ordersRouter, stripeWebhookHandler } from './routes/orders.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const prisma = new PrismaClient();

// CORS: allow GitHub Pages + local dev. Must run before any route so preflight OPTIONS gets headers.
const allowedOrigins = [
  'https://gabrielv121.github.io',
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) => (typeof o === 'string' ? o === origin : o.test(origin)));
      cb(null, ok ? origin : false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);
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
