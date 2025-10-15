import { createGoogleCalendarProvider, isGoogleCalendarConfigured } from "../../dist/integrations/googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, notes, calendarId = "primary" } = req.body ?? {};
    if (isGoogleCalendarConfigured() && eventId && notes) {
      const provider = await createGoogleCalendarProvider();
      await provider.appendNotes({ eventId, notes, calendarId });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e && e.message ? e.message : String(e) });
  }
}
