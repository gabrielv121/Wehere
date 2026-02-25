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
import { stripeConnectRouter } from './routes/stripeConnect.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const prisma = new PrismaClient();

// CORS: must run first. Allow GitHub Pages + localhost so frontend can call this API.
const CORS_ORIGIN = 'https://gabrielv121.github.io';
const CORS_ORIGINS = [
  CORS_ORIGIN,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];
function setCorsHeaders(req: express.Request, res: express.Response): void {
  const origin = req.headers.origin;
  const allow = !origin || CORS_ORIGINS.some((o) => (typeof o === 'string' ? o === origin : o.test(origin)));
  if (allow) {
    res.setHeader('Access-Control-Allow-Origin', origin || CORS_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
app.use((req, res, next) => {
  setCorsHeaders(req, res);
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
app.use('/api/stripe', stripeConnectRouter);

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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`WeHere API running on port ${PORT}`);
});
