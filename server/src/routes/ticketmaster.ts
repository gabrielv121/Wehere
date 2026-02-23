import { Router } from 'express';

const TICKETMASTER_BASE = 'https://app.ticketmaster.com/discovery/v2';

/** Map Ticketmaster segment to our category */
function tmCategoryToOurs(segment?: string): string {
  const s = (segment || '').toLowerCase();
  if (s.includes('music') || s.includes('concert')) return 'concert';
  if (s.includes('sport')) return 'sports';
  if (s.includes('theatre') || s.includes('theater') || s.includes('arts')) return 'theater';
  if (s.includes('comedy')) return 'comedy';
  if (s.includes('family')) return 'family';
  return 'concert';
}

/** Transform TM event to our Event shape (id = ticketmasterId for picker) */
function tmEventToOur(e: {
  id: string;
  name: string;
  _embedded?: { venues?: Array<{ id: string; name: string; city?: { name: string }; state?: { stateCode: string }; address?: { line1?: string } }> };
  dates?: { start?: { localDate?: string; localTime?: string; dateTime?: string } };
  images?: Array<{ url: string; width?: number }>;
  classifications?: Array<{ segment?: { name?: string } }>;
  url?: string;
}) {
  const venue = e._embedded?.venues?.[0];
  const city = venue?.city?.name ?? '';
  const state = venue?.state?.stateCode ?? '';
  const start = e.dates?.start;
  const date = start?.dateTime ?? (start?.localDate ? (start.localTime ? `${start.localDate}T${start.localTime}` : `${start.localDate}T12:00:00`) : new Date().toISOString());
  const img = e.images?.[0]?.url ?? (e.images?.[1]?.url) ?? '';
  const cat = tmCategoryToOurs(e.classifications?.[0]?.segment?.name);
  return {
    id: e.id,
    ticketmasterId: e.id,
    title: e.name ?? 'Event',
    category: cat,
    venue: { id: venue?.id ?? '', name: venue?.name ?? 'TBA', city, state },
    date,
    image: img,
    minPrice: 0,
    maxPrice: undefined as number | undefined,
    externalUrl: e.url,
  };
}

export const ticketmasterRouter = Router();

/** GET /api/ticketmaster/events — search Ticketmaster events (keyword, page) */
ticketmasterRouter.get('/events', async (req, res) => {
  const apiKey = (process.env.TICKETMASTER_API_KEY as string)?.trim();
  if (!apiKey) {
    res.status(503).json({ error: 'Ticketmaster API not configured. Set TICKETMASTER_API_KEY in server .env.' });
    return;
  }
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const page = Math.max(0, parseInt(String(req.query.page || 0), 10) || 0);
    const size = Math.min(50, Math.max(10, parseInt(String(req.query.size || 20), 10) || 20));

    const sp = new URLSearchParams({
      apikey: apiKey,
      countryCode: 'US',
      sort: 'date,asc',
      startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      size: String(size),
      page: String(page),
    });
    if (keyword) sp.set('keyword', keyword);

    const url = `${TICKETMASTER_BASE}/events.json?${sp.toString()}`;
    const r = await fetch(url);
    const text = await r.text();
    let json: { _embedded?: { events?: unknown[] }; page?: { totalElements?: number }; fault?: { faultstring?: string } };
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      console.error('Ticketmaster API non-JSON response:', r.status, text.slice(0, 500));
      res.status(r.status >= 500 ? 502 : 502).json({ error: 'Failed to search events.' });
      return;
    }
    if (!r.ok) {
      console.error('Ticketmaster API error:', r.status, json.fault?.faultstring ?? text.slice(0, 300));
      res.status(r.status >= 500 ? 502 : r.status === 401 ? 401 : 502).json({
        error: r.status === 401 ? 'Invalid Ticketmaster API key. Check TICKETMASTER_API_KEY in .env.' : 'Failed to search events.',
      });
      return;
    }
    if (json.fault?.faultstring) {
      console.error('Ticketmaster fault:', json.fault.faultstring);
      res.status(401).json({ error: 'Invalid Ticketmaster API key. Check TICKETMASTER_API_KEY in .env.' });
      return;
    }
    const rawEvents = Array.isArray(json._embedded?.events) ? json._embedded.events : [];
    const events: ReturnType<typeof tmEventToOur>[] = [];
    for (const e of rawEvents) {
      if (e == null || typeof e !== 'object' || typeof (e as { id?: unknown }).id !== 'string') continue;
      try {
        events.push(tmEventToOur(e as Parameters<typeof tmEventToOur>[0]));
      } catch (err) {
        console.warn('Ticketmaster event transform skip:', (e as { id?: string }).id, err);
      }
    }
    const total = typeof (json.page as { totalElements?: number })?.totalElements === 'number' ? (json.page as { totalElements: number }).totalElements : events.length;
    // Sort by date ascending (soonest first) in case API order varies
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json({ events, total });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Ticketmaster search error:', e);
    res.status(500).json({ error: 'Failed to search events.', detail: process.env.NODE_ENV !== 'production' ? msg : undefined });
  }
});
