function estimatePrice() {
  return { range_low: 140, range_high: 420, note: "Parts not included" };
}

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

function findZone(zip) {
  const zones = parseZones();
  for (const zoneId of Object.keys(zones)) {
    const cfg = zones[zoneId];
    if (cfg.zips.includes(zip)) return { zone_id: zoneId, ...cfg };
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
    const { system_type, symptom, zip } = body || {};
    const base = estimatePrice(system_type, symptom);
    const zone = zip ? findZone(zip) : null;
    res.json({ 
      ...base, 
      visit_fee: zone?.visit_fee ?? 89, 
      after_hours_fee: zone?.after_hours_fee ?? 49 
    });
  } catch (e) {
    res.status(400).json({ error: e && e.message ? e.message : "unknown error" });
  }
}
