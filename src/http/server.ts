import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import { createGoogleCalendarProvider } from '../providers/googleCalendar.js';

const app = express();
app.use(express.json());

const providerPromise = createGoogleCalendarProvider();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/availability', async (req, res) => {
  try {
    const body = z
      .object({ startIso: z.string(), endIso: z.string(), durationMinutes: z.number(), calendarId: z.string().nullish() })
      .parse(req.body);
    const provider = await providerPromise;
    const slots = await provider.listAvailability({
      startIso: body.startIso,
      endIso: body.endIso,
      durationMinutes: body.durationMinutes,
      calendarId: body.calendarId ?? 'primary'
    });
    res.json(slots);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.post('/book', async (req, res) => {
  try {
    const body = z
      .object({ startIso: z.string(), endIso: z.string(), summary: z.string(), description: z.string().nullish(), attendeeEmail: z.string().email().nullish(), calendarId: z.string().nullish() })
      .parse(req.body);
    const provider = await providerPromise;
    const event = await provider.bookEvent({
      startIso: body.startIso,
      endIso: body.endIso,
      summary: body.summary,
      description: body.description ?? undefined,
      attendeeEmail: body.attendeeEmail ?? undefined,
      calendarId: body.calendarId ?? 'primary'
    });
    res.json(event);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.post('/cancel', async (req, res) => {
  try {
    const body = z.object({ eventId: z.string(), calendarId: z.string().nullish() }).parse(req.body);
    const provider = await providerPromise;
    await provider.cancelEvent({ eventId: body.eventId, calendarId: body.calendarId ?? 'primary' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.post('/events', async (req, res) => {
  try {
    const body = z.object({ maxResults: z.number().nullish(), calendarId: z.string().nullish() }).parse(req.body ?? {});
    const provider = await providerPromise;
    const events = await provider.listEvents({ maxResults: body.maxResults ?? 10, calendarId: body.calendarId ?? 'primary' });
    res.json(events);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, () => {
  console.log(`[http] listening on http://localhost:${PORT}`);
});


