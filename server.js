import express from "express";
import dotenv from "dotenv";

// Load environment variables if present
dotenv.config();

// Import handlers from belmonthvac
import checkServiceArea from "./belmonthvac/api/hvac/check-service-area.js";
import getAvailability from "./belmonthvac/api/hvac/get-availability.js";
import bookAppointment from "./belmonthvac/api/hvac/book-appointment.js";
import createLead from "./belmonthvac/api/hvac/create-lead.js";
import estimatePrice from "./belmonthvac/api/hvac/estimate-price.js";
import planJob from "./belmonthvac/api/hvac/plan-job.js";
import { DateTime } from "luxon";
import sendIntakeSms from "./api/hvac/send-intake-sms.js";
import finalizeIntakeBooking from "./api/hvac/finalize-intake-booking.js";
import createIntakeLink from "./api/hvac/create-intake-link.js";
import getIntakeData from "./api/hvac/get-intake-data.js";
import submitIntakeForm from "./api/hvac/submit-intake-form.js";
import listSlots from "./api/hvac/list-slots.js";
import softHold from "./api/hvac/soft-hold.js";
import triage from "./api/hvac/emergency-triage.js";

const app = express();
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "belmonthvac" });
});

// Mount HVAC endpoints
app.post("/api/hvac/check-service-area", (req, res) => checkServiceArea(req, res));
app.post("/api/hvac/get-availability", (req, res) => getAvailability(req, res));
app.post("/api/hvac/book-appointment", (req, res) => bookAppointment(req, res));
app.post("/api/hvac/create-lead", (req, res) => createLead(req, res));
app.post("/api/hvac/estimate-price", (req, res) => estimatePrice(req, res));
app.post("/api/hvac/plan-job", (req, res) => planJob(req, res));
app.post("/api/hvac/list-slots", (req, res) => listSlots(req, res));
app.post("/api/hvac/soft-hold", (req, res) => softHold(req, res));
app.post("/api/hvac/triage", (req, res) => triage(req, res));

// Context endpoint for agent date/time awareness
app.get("/api/hvac/context", (req, res) => {
  const tz = process.env.BUSINESS_TZ || "America/Los_Angeles";
  const nowLocal = DateTime.now().setZone(tz);
  res.json({
    nowIso: nowLocal.toUTC().toISO(),
    localDate: nowLocal.toFormat('yyyy-LL-dd'),
    localTime: nowLocal.toFormat('HH:mm'),
    timezone: tz
  });
});

// SMS intake confirmation
app.post("/api/hvac/send-intake-sms", (req, res) => sendIntakeSms(req, res));
app.post("/api/hvac/finalize-intake-booking", (req, res) => finalizeIntakeBooking(req, res));
app.post("/api/hvac/create-intake-link", (req, res) => createIntakeLink(req, res));
app.get("/api/hvac/intake/:token", (req, res) => getIntakeData(req, res));
app.post("/api/hvac/submit-intake", (req, res) => submitIntakeForm(req, res));

// Call webhook to capture caller information
app.post("/api/hvac/call-webhook", (req, res) => {
  try {
    const { call_id, caller_phone, caller_name, timestamp } = req.body || {};
    
    // Store caller info for this call session
    // In production, you'd store this in Redis or a database
    console.log(`[webhook] Call ${call_id} from ${caller_phone} (${caller_name}) at ${timestamp}`);
    
    // You can store this in memory for now
    // In production, use Redis: redis.set(`call:${call_id}`, JSON.stringify({caller_phone, caller_name}))
    
    res.json({ 
      ok: true, 
      message: "Caller info captured",
      call_id,
      caller_phone 
    });
  } catch (e) {
    console.error("[webhook] Error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
app.post("/api/hvac/context", (req, res) => {
  const tz = process.env.BUSINESS_TZ || "America/Los_Angeles";
  const nowLocal = DateTime.now().setZone(tz);
  res.json({
    nowIso: nowLocal.toUTC().toISO(),
    localDate: nowLocal.toFormat('yyyy-LL-dd'),
    localTime: nowLocal.toFormat('HH:mm'),
    timezone: tz
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});


