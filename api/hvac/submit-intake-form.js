import { getByToken, clearByToken } from "./intake-link-store.js";
import book from "../../belmonthvac/api/hvac/book-appointment.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { token, name, email, address_line1, city, zip } = req.body || {};
    if (!token) return res.status(400).json({ error: "missing_token" });
    const stored = getByToken(token);
    if (!stored) return res.status(404).json({ error: "intake_not_found" });

    const payload = {
      window: stored.window,
      customer: { full_name: name, email },
      location: { address_line1, city, zip },
      job: stored.job
    };
    req.body = payload;
    await book(req, res);
    clearByToken(token);
  } catch (e) {
    res.status(400).json({ error: String(e && e.message ? e.message : e) });
  }
}


