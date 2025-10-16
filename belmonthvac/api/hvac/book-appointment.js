import { createGoogleCalendarProvider, isGoogleCalendarConfigured } from "../../dist/integrations/googleCalendar.js";
import { ulid } from "ulid";

function normalizeEmail(raw) {
  if (!raw) return "";
  let s = String(raw).trim().toLowerCase();
  // Collapse spaces and common spoken tokens
  s = s.replace(/\s+at\s+/g, "@");
  s = s.replace(/\s*\bat\b\s*/g, "@");
  s = s.replace(/\s*dot\s*/g, ".");
  s = s.replace(/g\s*mail/g, "gmail");
  s = s.replace(/out\s*look/g, "outlook");
  s = s.replace(/i\s*cloud/g, "icloud");
  s = s.replace(/hot\s*mail/g, "hotmail");
  s = s.replace(/y\s*ahoo/g, "yahoo");
  s = s.replace(/\s+/g, "");
  s = s.replace(/\.+$/g, ""); // drop trailing dots
  // Basic validity; if missing '@' we can't safely fix
  const simple = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return simple.test(s) ? s : raw;
}

function summarizeDiagnosis(diagnosis) {
  if (!diagnosis || typeof diagnosis !== 'object') return null;
  const parts = [];
  const equipCat = diagnosis.equipment_category || (diagnosis.system_type ? (diagnosis.system_type.includes('heat') ? 'heat' : 'ac') : undefined);
  const equipType = diagnosis.equipment_type || diagnosis.system_type;
  if (equipCat === 'ac') {
    parts.push(equipType ? `${equipType === 'central' || /central/i.test(equipType) ? 'Central AC' : equipType}` : 'AC');
  } else if (equipCat === 'heat') {
    parts.push(equipType ? equipType : 'Heating');
  }
  if (diagnosis.blowing_air === true) parts.push('air blows from vents');
  if (diagnosis.blowing_air === false) parts.push('no air from vents');
  if (diagnosis.smells) parts.push(`smells: ${diagnosis.smells}`); else parts.push('no unusual smells');
  if (diagnosis.noises) parts.push(`noises: ${diagnosis.noises}`); else parts.push('no unusual noises');
  return parts.filter(Boolean).join('; ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const { window, customer } = payload ?? {};

    // Guardrail: require booking window within next 45 days and end > start
    const maxAheadMs = 45 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const startMs = Date.parse(window?.start || "");
    const endMs = Date.parse(window?.end || "");
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return res.status(400).json({ error: 'invalid_window', message: 'Provide a valid ISO window {start,end} where end > start (UTC with Z).'});
    }
    if (startMs < now - 24*60*60*1000 || endMs - now > maxAheadMs) {
      return res.status(400).json({ error: 'date_out_of_range', message: 'Book within the next 45 days.' });
    }
    
    if (isGoogleCalendarConfigured() && window?.start && window?.end) {
      const provider = await createGoogleCalendarProvider();
      
      // Check if slot is available before booking
      const busyWindows = await provider.listBusyWindows({ 
        startIso: window.start, 
        endIso: window.end, 
        calendarId: "primary" 
      });
      
      if (busyWindows.length > 0) {
        return res.status(409).json({ 
          error: "Slot not available", 
          message: "The requested time slot is no longer available. Please choose a different time.",
          conflict: busyWindows[0]
        });
      }
      
      const summary = `HVAC ${payload?.job?.symptom ?? "Service"} - ${customer?.full_name ?? "Customer"}`;
      const diagnosis = payload?.job?.diagnosis ?? {};
      const normalizedEmail = normalizeEmail(customer?.email);
      const diagSummary = summarizeDiagnosis(diagnosis);
      const originalIssue = payload?.job?.issue_summary || payload?.job?.symptom || "";
      const descLines = [
        `Phone: ${customer?.phone ?? ""}`,
        `Email: ${normalizedEmail || customer?.email || ""}`,
        `Address: ${payload?.location?.address_line1 ?? ""}, ${payload?.location?.city ?? ""} ${payload?.location?.zip ?? ""}`,
        originalIssue ? `Original issue: ${originalIssue}` : null,
        diagnosis?.system_type ? `System: ${diagnosis.system_type}` : null,
        diagnosis?.blowing_air != null ? `Blowing air: ${diagnosis.blowing_air ? "yes" : "no"}` : null,
        diagnosis?.thermostat_ok != null ? `Thermostat OK: ${diagnosis.thermostat_ok ? "yes" : "no"}` : null,
        diagnosis?.smells ? `Smells: ${diagnosis.smells}` : null,
        diagnosis?.noises ? `Noises: ${diagnosis.noises}` : null,
        diagnosis?.last_service ? `Last service: ${diagnosis.last_service}` : null
      ].filter(Boolean);
      if (diagSummary) descLines.push(`Diagnosis: ${diagSummary}`);
      const description = descLines.join("\n");
      
      const event = await provider.bookEvent({ 
        startIso: window.start, 
        endIso: window.end, 
        summary, 
        description, 
        attendeeEmail: normalizedEmail || customer?.email, 
        calendarId: "primary" 
      });
      
      return res.json({ 
        booking_id: event.id, 
        ics_url: event.htmlLink, 
        status: "confirmed" 
      });
    }
    
    // Fallback to mock booking
    const booking_id = "BK-" + ulid();
    return res.json({ 
      booking_id, 
      ics_url: `https://ics.belmonthvac.com/${booking_id}.ics`, 
      status: "confirmed" 
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
