// Self-contained to avoid TS imports in Vercel
function parseZones() {
  const fallback = {
    "ZONE-A": { name: "Core", zips: ["94002","94061","94062","94063","94065","94070","94301","94306","94402","94403"], visit_fee: 89, after_hours_fee: 49, sla_hours: 24 },
    "ZONE-B": { name: "Extended", zips: ["94010","94025","94028","94304","94401","94404"], visit_fee: 99, after_hours_fee: 69, sla_hours: 48 }
  };
  try {
    const fromEnv = process.env.ZONE_MAP_JSON ? JSON.parse(process.env.ZONE_MAP_JSON) : null;
    return fromEnv || fallback;
  } catch {
    return fallback;
  }
}

function normalizeZip(input) {
  if (input === undefined || input === null) return "";
  let str = String(input).trim();
  // Convert common spoken digit words to numeric digits
  const wordToDigit = {
    zero: "0", oh: "0",
    one: "1",
    two: "2", to: "2", too: "2",
    three: "3",
    four: "4", for: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8", ate: "8",
    nine: "9"
  };
  str = str.toLowerCase().replace(/\b([a-z]+)\b/g, (m) => (wordToDigit[m] ?? m));
  const digits = str.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function findZone(zip) {
  const zones = parseZones();
  const z = normalizeZip(zip);
  for (const zoneId of Object.keys(zones)) {
    const cfg = zones[zoneId];
    if (cfg.zips.includes(z)) return { zone_id: zoneId, ...cfg };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || await new Promise((resolve, reject) => {
      try {
        let raw = "";
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
          try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
        });
        req.on('error', reject);
      } catch (e) { reject(e); }
    });
    const zipInput = (body && (body.zip ?? body.args?.zip ?? body.postal ?? body.postal_code ?? body.zip_code)) ?? "";
    const normalized = normalizeZip(zipInput);
    if (!normalized) {
      return res.json({ ok: false, reason: "invalid_zip" });
    }
    const zc = findZone(normalized);
    res.json(zc ? { ok: true, ...zc } : { ok: false, reason: "out_of_area" });
  } catch (e) {
    res.status(400).json({ error: (e && e.message) || "unknown error" });
  }
}
