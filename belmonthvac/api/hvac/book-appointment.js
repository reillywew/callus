import { createGoogleCalendarProvider, isGoogleCalendarConfigured } from "../../dist/integrations/googleCalendar.js";
import { ulid } from "ulid";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const { window, customer } = payload ?? {};
    
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
      const description = [
        `Phone: ${customer?.phone ?? ""}`,
        `Email: ${customer?.email ?? ""}`,
        `Address: ${payload?.location?.address_line1 ?? ""}, ${payload?.location?.city ?? ""} ${payload?.location?.zip ?? ""}`,
        `Notes: ${payload?.job?.issue_summary ?? ""}`
      ].filter(Boolean).join("\n");
      
      const event = await provider.bookEvent({ 
        startIso: window.start, 
        endIso: window.end, 
        summary, 
        description, 
        attendeeEmail: customer?.email, 
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
