import { createLead } from "../../dist/core/lead.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, reason } = req.body;
    res.json(createLead(payload, reason ?? "unspecified"));
  } catch (e) {
    res.status(400).json({ error: e && e.message ? e.message : String(e) });
  }
}
