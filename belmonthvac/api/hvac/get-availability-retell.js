import { createGoogleCalendarProvider, isGoogleCalendarConfigured } from "../../dist/integrations/googleCalendar.js";

// Parse natural language date input to ISO range
function parseDateText(dateText, startLocal = "09:00", endLocal = "17:00") {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const text = (dateText || "").toLowerCase().trim();
  
  // Handle "today", "tomorrow", day names, and dates
  let targetDate;
  
  if (text.includes("today") || text === "today") {
    targetDate = new Date(today);
  } else if (text.includes("tomorrow") || text === "tomorrow") {
    targetDate = new Date(today.getTime() + 24*60*60*1000);
  } else if (text.includes("monday") || text.includes("mon")) {
    targetDate = getNextWeekday(today, 1);
  } else if (text.includes("tuesday") || text.includes("tue")) {
    targetDate = getNextWeekday(today, 2);
  } else if (text.includes("wednesday") || text.includes("wed")) {
    targetDate = getNextWeekday(today, 3);
  } else if (text.includes("thursday") || text.includes("thu")) {
    targetDate = getNextWeekday(today, 4);
  } else if (text.includes("friday") || text.includes("fri")) {
    targetDate = getNextWeekday(today, 5);
  } else if (text.includes("saturday") || text.includes("sat")) {
    targetDate = getNextWeekday(today, 6);
  } else if (text.includes("sunday") || text.includes("sun")) {
    targetDate = getNextWeekday(today, 0);
  } else {
    // Try to parse as date (Oct 17, 10/17, etc.)
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      targetDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    } else {
      return null; // Can't parse
    }
  }
  
  // Convert local time to UTC for the day
  const [startHour, startMin] = startLocal.split(":").map(Number);
  const [endHour, endMin] = endLocal.split(":").map(Number);
  
  const startIso = new Date(targetDate.getTime() + startHour*60*60*1000 + startMin*60*1000).toISOString();
  const endIso = new Date(targetDate.getTime() + endHour*60*60*1000 + endMin*60*1000).toISOString();
  
  return { startIso, endIso, targetDate };
}

function getNextWeekday(fromDate, targetDay) {
  const daysUntilTarget = (targetDay - fromDate.getDay() + 7) % 7;
  const daysToAdd = daysUntilTarget === 0 ? 7 : daysUntilTarget; // If today is target day, get next week
  return new Date(fromDate.getTime() + daysToAdd * 24*60*60*1000);
}

function formatSlotLocal(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const dayName = dayNames[start.getDay()];
  const month = monthNames[start.getMonth()];
  const day = start.getDate();
  
  const startTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  
  return `${dayName}, ${month} ${day}, ${startTime} to ${endTime}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date_text, start_local = "09:00", end_local = "17:00", duration_min = 60 } = req.body;
    
    if (!date_text) {
      return res.status(400).json({ error: 'missing_date_text' });
    }
    
    const parsed = parseDateText(date_text, start_local, end_local);
    if (!parsed) {
      return res.status(400).json({ error: 'invalid_date', message: 'Could not understand that date. Try "today", "tomorrow", or "Friday".' });
    }
    
    const { startIso, endIso } = parsed;
    
    // Basic date sanity guardrail
    const nowMs = Date.now();
    const maxAheadMs = 45 * 24 * 60 * 60 * 1000;
    const startMs = Date.parse(startIso);
    const endMs = Date.parse(endIso);
    
    if (startMs < nowMs - 24*60*60*1000 || endMs - nowMs > maxAheadMs || endMs <= startMs) {
      return res.status(400).json({ error: 'date_out_of_range', message: 'Pick a time window within the next 45 days.' });
    }
    
    if (endMs <= nowMs) {
      return res.status(400).json({ error: 'window_in_past', message: 'That time has already passed. Choose a future window.' });
    }
    
    let windows = [];
    
    if (isGoogleCalendarConfigured()) {
      const provider = await createGoogleCalendarProvider();
      const slots = await provider.listAvailability({
        startIso,
        endIso,
        durationMinutes: duration_min,
        calendarId: "primary"
      });
      
      windows = slots.map(slot => ({
        start: slot.startIso,
        end: slot.endIso,
        tech_id: "AUTO",
        tech_name: "Dispatch"
      }));
    } else {
      // Fallback to mock data - find first available slot in the requested day
      const baseMs = startMs;
      const slotDurationMs = duration_min * 60 * 1000;
      
      // Mock: assume slots every 2 hours starting at 9 AM
      const slotTimes = [9, 11, 13, 15]; // 9 AM, 11 AM, 1 PM, 3 PM
      
      for (const hour of slotTimes) {
        const slotStartMs = baseMs + hour * 60 * 60 * 1000;
        const slotEndMs = slotStartMs + slotDurationMs;
        
        // Only include slots that fit within the requested window
        if (slotStartMs >= startMs && slotEndMs <= endMs) {
          windows.push({
            start: new Date(slotStartMs).toISOString(),
            end: new Date(slotEndMs).toISOString(),
            tech_id: "TECH-07",
            tech_name: "Alex"
          });
          break; // Return first available slot
        }
      }
    }
    
    if (windows.length === 0) {
      return res.json({ 
        ok: false, 
        reason: "no_availability",
        message: "No openings that day. Another day?" 
      });
    }
    
    const firstSlot = windows[0];
    const slot_local_str = formatSlotLocal(firstSlot.start, firstSlot.end);
    
    res.json({ 
      ok: true,
      slot_start_iso: firstSlot.start,
      slot_end_iso: firstSlot.end,
      slot_local_str,
      tech_id: firstSlot.tech_id,
      tech_name: firstSlot.tech_name
    });
    
  } catch (e) {
    res.status(400).json({ error: e && e.message ? e.message : String(e) });
  }
}


