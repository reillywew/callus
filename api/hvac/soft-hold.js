import { createHold, getHold, releaseHold, confirmHold } from "./holds-store.js";

export default async function handler(req, res) {
  try {
    const { action } = req.body || {};
    if (action === "create") {
      const { phone, slot, metadata, ttl_minutes } = req.body || {};
      if (!phone || !slot?.start || !slot?.end) return res.status(400).json({ ok: false, error: "missing_fields" });
      const hold = createHold({ phone, slot: { start: slot.start, end: slot.end }, metadata: metadata || {}, ttlMinutes: ttl_minutes || 15 });
      return res.json({ ok: true, hold });
    }
    if (action === "release") {
      const { hold_id } = req.body || {};
      const hold = releaseHold(hold_id);
      return res.json({ ok: !!hold, hold });
    }
    if (action === "confirm") {
      const { hold_id } = req.body || {};
      const hold = confirmHold(hold_id);
      return res.json({ ok: !!hold, hold });
    }
    if (action === "get") {
      const { hold_id } = req.body || {};
      const hold = getHold(hold_id);
      return res.json({ ok: !!hold, hold });
    }
    return res.status(400).json({ ok: false, error: "invalid_action" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}




