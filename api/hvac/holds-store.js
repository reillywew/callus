// Simple in-memory soft-hold store for booking slots.
// NOTE: In production, back this with Redis or a database so holds survive restarts.

const holdIdToHold = new Map();
const phoneToHoldId = new Map();

function nowMs() { return Date.now(); }

function generateId() {
  // URL-safe 16-byte id
  return Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("base64url");
}

import crypto from "crypto";

export function createHold({ phone, slot, metadata = {}, ttlMinutes = 15 }) {
  const holdId = crypto.randomBytes(9).toString("base64url");
  const expiresAt = new Date(nowMs() + ttlMinutes * 60 * 1000).toISOString();
  const hold = {
    hold_id: holdId,
    phone,
    slot, // { start, end }
    metadata, // { hvac_mode, hvac_unit_type, job, service_class, notes }
    status: "held",
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    _timer: null
  };
  holdIdToHold.set(holdId, hold);
  phoneToHoldId.set(phone, holdId);
  // Auto-release timer
  const ms = ttlMinutes * 60 * 1000;
  hold._timer = setTimeout(() => {
    const h = holdIdToHold.get(holdId);
    if (h && h.status === "held") {
      h.status = "expired";
      phoneToHoldId.delete(h.phone);
      holdIdToHold.set(holdId, h);
    }
  }, ms).unref?.();
  return hold;
}

export function getHold(holdId) {
  return holdIdToHold.get(holdId) || null;
}

export function getHoldByPhone(phone) {
  const id = phoneToHoldId.get(phone);
  return id ? getHold(id) : null;
}

export function releaseHold(holdId) {
  const hold = holdIdToHold.get(holdId);
  if (!hold) return null;
  hold.status = "released";
  if (hold._timer) { try { clearTimeout(hold._timer); } catch {} }
  phoneToHoldId.delete(hold.phone);
  holdIdToHold.set(holdId, hold);
  return hold;
}

export function confirmHold(holdId) {
  const hold = holdIdToHold.get(holdId);
  if (!hold) return null;
  hold.status = "confirmed";
  if (hold._timer) { try { clearTimeout(hold._timer); } catch {} }
  phoneToHoldId.delete(hold.phone);
  holdIdToHold.set(holdId, hold);
  return hold;
}

export function listActiveHolds() {
  const out = [];
  for (const h of holdIdToHold.values()) {
    if (h.status === "held") out.push(h);
  }
  return out;
}




