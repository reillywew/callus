// Simple in-memory intake store keyed by phone (digits only)
const phoneToIntake = new Map();

export function digitsOnlyPhone(input) {
  if (!input) return "";
  const d = String(input).replace(/\D/g, "");
  // use last 10 or 11 if leading country code present
  return d.length > 11 ? d.slice(-11) : d.length > 10 ? d.slice(-10) : d;
}

export function saveIntake(phone, intake) {
  const key = digitsOnlyPhone(phone);
  if (!key) return;
  phoneToIntake.set(key, { ...intake, createdAt: Date.now() });
}

export function getIntake(phone) {
  const key = digitsOnlyPhone(phone);
  if (!key) return null;
  return phoneToIntake.get(key) || null;
}

export function clearIntake(phone) {
  const key = digitsOnlyPhone(phone);
  if (!key) return;
  phoneToIntake.delete(key);
}


