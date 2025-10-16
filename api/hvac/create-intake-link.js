import { randomBytes } from "crypto";
import { saveByToken } from "./intake-link-store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { phone, window, job, location } = req.body || {};
    const token = randomBytes(12).toString("base64url");
    saveByToken(token, { phone, window, job, location });
    const base = process.env.INTAKE_BASE_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${base}/intake/${token}`;
    res.json({ ok: true, token, url });
  } catch (e) {
    res.status(400).json({ error: String(e && e.message ? e.message : e) });
  }
}


