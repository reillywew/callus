import { getIntake, clearIntake, digitsOnlyPhone } from "./sms-intake-store.js";
import book from "../../belmonthvac/api/hvac/book-appointment.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { phone, name, email, address_line1, city, zip } = req.body || {};
    if (!phone) return res.status(400).json({ error: "missing_phone" });
    const intake = getIntake(phone);
    if (!intake) return res.status(404).json({ error: "intake_not_found" });

    const payload = {
      window: intake.window,
      customer: {
        full_name: name || intake.name,
        email: email || intake.email,
        phone: digitsOnlyPhone(phone)
      },
      location: intake.location || {
        address_line1,
        city,
        zip
      },
      job: intake.job
    };

    // Delegate to existing booking handler
    req.body = payload;
    await book(req, res);
    clearIntake(phone);
  } catch (e) {
    res.status(400).json({ error: String(e && e.message ? e.message : e) });
  }
}


