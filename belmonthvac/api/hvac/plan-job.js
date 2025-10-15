function planJob(symptom) {
  const long = new Set(["leak","frozen","no_power"]);
  return { duration_min: long.has(symptom) ? 90 : 60, priority: "SOON", route_tags: ["hvac","diag"] };
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
    const { system_type, symptom, issue_summary } = body || {};
    res.json(planJob(symptom));
  } catch (e) {
    res.status(400).json({ error: e && e.message ? e.message : "unknown error" });
  }
}
