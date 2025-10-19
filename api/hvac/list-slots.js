import { createGoogleCalendarProvider, isGoogleCalendarConfigured } from "../../belmonthvac/dist/integrations/googleCalendar.js";

export default async function handler(req, res) {
  try {
    const { date_text, start_local = "09:00", end_local = "17:00", duration_min = 60 } = req.body || {};
    if (!date_text) return res.status(400).json({ ok: false, error: "missing_date_text" });

    // Enhanced parser: today/tomorrow, day names, or explicit ISO date
    const base = new Date();
    const lc = String(date_text).toLowerCase();
    let day = null;
    
    if (lc.includes("today")) {
      day = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    } else if (lc.includes("tomorrow")) {
      day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    } else {
      // Try to parse day names
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = dayNames.findIndex(d => lc.includes(d));
      
      if (dayIndex !== -1) {
        const today = base.getDay(); // 0 = Sunday, 1 = Monday, etc.
        let daysUntilTarget = dayIndex - today;
        if (daysUntilTarget <= 0) daysUntilTarget += 7; // Next week if today or past
        day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + daysUntilTarget);
      } else {
        // Try explicit ISO date
        const p = new Date(date_text);
        if (!isNaN(p.getTime())) day = new Date(p.getFullYear(), p.getMonth(), p.getDate());
      }
    }
    if (!day) return res.status(400).json({ ok: false, error: "invalid_date_text" });

    const [sh, sm] = String(start_local).split(":").map(Number);
    const [eh, em] = String(end_local).split(":").map(Number);
    
    // Create times in Pacific Time (UTC-8 or UTC-7 depending on DST)
    const pacificOffset = -8 * 60; // Pacific Standard Time offset in minutes
    const startIso = new Date(day.getTime() + (sh*60+sm)*60*1000 + pacificOffset*60*1000).toISOString();
    const endIso = new Date(day.getTime() + (eh*60+em)*60*1000 + pacificOffset*60*1000).toISOString();

    if (isGoogleCalendarConfigured()) {
      const provider = await createGoogleCalendarProvider();
      const slots = await provider.listAvailability({ startIso, endIso, durationMinutes: duration_min, calendarId: "primary" });
      return res.json({ ok: true, slots });
    }
    // Fallback mock
    const mk = (hour) => {
      const s = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour).toISOString();
      const e = new Date(new Date(s).getTime() + duration_min*60*1000).toISOString();
      return { startIso: s, endIso: e };
    };
    res.json({ ok: true, slots: [mk(10), mk(13), mk(15)] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}




