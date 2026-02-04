import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { listingsRouter } from './routes/listings.js';
import { ordersRouter } from './routes/orders.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/orders', ordersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'WeHere API' });
});

app.listen(PORT, () => {
  console.log(`WeHere API running at http://localhost:${PORT}`);
});
