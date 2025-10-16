import { createGoogleCalendarProvider, isGoogleCalendarConfigured } from "../../dist/integrations/googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startIso, endIso, duration_min = 60 } = req.body;
    // Basic date sanity guardrail: require a window within the next 45 days
    const now = Date.now();
    const maxAheadMs = 45 * 24 * 60 * 60 * 1000;
    const startMs = Date.parse(startIso || "");
    const endMs = Date.parse(endIso || "");
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return res.status(400).json({ error: 'invalid_datetime', message: 'Provide ISO strings for startIso and endIso (UTC with Z).'});
    }
    if (startMs < now - 24*60*60*1000 || endMs - now > maxAheadMs || endMs <= startMs) {
      return res.status(400).json({ error: 'date_out_of_range', message: 'Pick a time window within the next 45 days and ensure end > start.' });
    }
    
    if (isGoogleCalendarConfigured() && startIso && endIso) {
      const provider = await createGoogleCalendarProvider();
      const slots = await provider.listAvailability({
        startIso,
        endIso,
        durationMinutes: duration_min,
        calendarId: "primary"
      });
      
      const windows = slots.map(slot => ({
        start: slot.startIso,
        end: slot.endIso,
        tech_id: "AUTO",
        tech_name: "Dispatch"
      }));
      
      return res.json({ windows });
    }
    
    // Fallback to mock data
    const now = Date.now();
    const mk = (msFromNow, tech, name) => {
      const start = new Date(now + msFromNow).toISOString();
      const end = new Date(new Date(start).getTime() + duration_min*60*1000).toISOString();
      return { start, end, tech_id: tech, tech_name: name };
    };
    
    res.json({
      windows: [
        mk(2*60*60*1000, "TECH-07", "Alex"),
        mk(24*60*60*1000 + 8*60*60*1000, "TECH-12", "Sam"),
      ]
    });
  } catch (e) {
    res.status(400).json({ error: e && e.message ? e.message : String(e) });
  }
}
