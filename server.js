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

// Browser-friendly GET aliases (map query params to expected POST body)
app.get("/api/hvac/check-service-area", (req, res) => {
  req.method = "POST";
  req.body = { zip: req.query.zip };
  return checkServiceArea(req, res);
});

app.get("/api/hvac/get-availability", (req, res) => {
  req.method = "POST";
  const duration = req.query.duration_min ? Number(req.query.duration_min) : undefined;
  req.body = {
    startIso: req.query.startIso,
    endIso: req.query.endIso,
    ...(duration ? { duration_min: duration } : {})
  };
  return getAvailability(req, res);
});

app.get("/api/hvac/estimate-price", (req, res) => {
  req.method = "POST";
  req.body = {
    zip: req.query.zip,
    system_type: req.query.system_type,
    symptom: req.query.symptom
  };
  return estimatePrice(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});


