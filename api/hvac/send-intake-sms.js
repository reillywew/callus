import dotenv from "dotenv";
import { saveIntake } from "./sms-intake-store.js";
dotenv.config();

let twilioClient = null;
try {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) {
    // Lazy require to avoid hard dependency when not configured
    // eslint-disable-next-line global-require
    const twilio = (await import("twilio")).default;
    twilioClient = twilio(sid, token);
  }
} catch {}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { to, link, name, email, address, window, job, location } = req.body || {};
    if (!to) return res.status(400).json({ error: "missing_to" });
    // Store partial intake for follow-up booking
    saveIntake(to, { name, email, address, window, job, location });

    const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID || null;
    if (!twilioClient || !from) {
      // No Twilio configured; simulate success so the agent flow can proceed
      return res.json({ ok: true, simulated: true });
    }

    const parts = [
      name ? `Hi ${name},` : "Hi,",
      "please reply to confirm your details to complete your booking:",
      email ? `Email: ${email}` : null,
      address ? `Address: ${address}` : null,
      link ? `Confirm here: ${link}` : null
    ].filter(Boolean);

    const body = parts.join("\n");
    const msg = await twilioClient.messages.create({ to, from, body });
    res.json({ ok: true, sid: msg.sid });
  } catch (e) {
    res.status(400).json({ error: String(e && e.message ? e.message : e) });
  }
}


