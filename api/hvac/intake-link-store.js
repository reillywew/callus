// Simple in-memory token store for intake links
const tokenToIntake = new Map();

export function saveByToken(token, data) {
  if (!token) return;
  tokenToIntake.set(token, { ...data, createdAt: Date.now() });
}

export function getByToken(token) {
  if (!token) return null;
  return tokenToIntake.get(token) || null;
}

export function clearByToken(token) {
  if (!token) return;
  tokenToIntake.delete(token);
}


