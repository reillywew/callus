import { getByToken } from "./intake-link-store.js";

export default async function handler(req, res) {
  const { token } = req.params || {};
  if (!token) return res.status(400).json({ error: "missing_token" });
  const data = getByToken(token);
  if (!data) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true, data: { window: data.window, job: data.job, location: data.location } });
}


