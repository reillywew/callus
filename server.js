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


