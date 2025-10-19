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

function getCityFromZip(zip) {
  const zipToCity = {
    // Mountain View
    "94040": { city: "Mountain View", state: "CA" },
    "94041": { city: "Mountain View", state: "CA" },
    "94043": { city: "Mountain View", state: "CA" },
    
    // Almaden (San Jose)
    "95120": { city: "San Jose", state: "CA" },
    
    // Atherton
    "94027": { city: "Atherton", state: "CA" },
    
    // Alviso (San Jose)
    "95002": { city: "San Jose", state: "CA" },
    
    // Campbell
    "95008": { city: "Campbell", state: "CA" },
    "95009": { city: "Campbell", state: "CA" },
    "95011": { city: "Campbell", state: "CA" },
    
    // Cupertino
    "95014": { city: "Cupertino", state: "CA" },
    "95015": { city: "Cupertino", state: "CA" },
    
    // Fremont
    "94536": { city: "Fremont", state: "CA" },
    "94537": { city: "Fremont", state: "CA" },
    "94538": { city: "Fremont", state: "CA" },
    "94539": { city: "Fremont", state: "CA" },
    "94555": { city: "Fremont", state: "CA" },
    
    // Gilroy
    "95020": { city: "Gilroy", state: "CA" },
    "95021": { city: "Gilroy", state: "CA" },
    
    // Los Altos
    "94022": { city: "Los Altos", state: "CA" },
    "94023": { city: "Los Altos", state: "CA" },
    "94024": { city: "Los Altos", state: "CA" },
    
    // Los Altos Hills
    "94022": { city: "Los Altos Hills", state: "CA" },
    
    // Los Gatos
    "95030": { city: "Los Gatos", state: "CA" },
    "95031": { city: "Los Gatos", state: "CA" },
    "95032": { city: "Los Gatos", state: "CA" },
    
    // Menlo Park
    "94025": { city: "Menlo Park", state: "CA" },
    "94026": { city: "Menlo Park", state: "CA" },
    "94028": { city: "Menlo Park", state: "CA" },
    
    // Milpitas
    "95035": { city: "Milpitas", state: "CA" },
    "95036": { city: "Milpitas", state: "CA" },
    
    // Monte Sereno
    "95030": { city: "Monte Sereno", state: "CA" },
    
    // Morgan Hill
    "95037": { city: "Morgan Hill", state: "CA" },
    "95038": { city: "Morgan Hill", state: "CA" },
    
    // Palo Alto
    "94301": { city: "Palo Alto", state: "CA" },
    "94302": { city: "Palo Alto", state: "CA" },
    "94303": { city: "Palo Alto", state: "CA" },
    "94304": { city: "Palo Alto", state: "CA" },
    "94305": { city: "Palo Alto", state: "CA" },
    "94306": { city: "Palo Alto", state: "CA" },
    "94309": { city: "Palo Alto", state: "CA" },
    
    // Redwood City
    "94061": { city: "Redwood City", state: "CA" },
    "94062": { city: "Redwood City", state: "CA" },
    "94063": { city: "Redwood City", state: "CA" },
    "94065": { city: "Redwood City", state: "CA" },
    
    // San Jose (multiple ZIP codes)
    "95110": { city: "San Jose", state: "CA" },
    "95111": { city: "San Jose", state: "CA" },
    "95112": { city: "San Jose", state: "CA" },
    "95113": { city: "San Jose", state: "CA" },
    "95116": { city: "San Jose", state: "CA" },
    "95117": { city: "San Jose", state: "CA" },
    "95118": { city: "San Jose", state: "CA" },
    "95119": { city: "San Jose", state: "CA" },
    "95120": { city: "San Jose", state: "CA" },
    "95121": { city: "San Jose", state: "CA" },
    "95122": { city: "San Jose", state: "CA" },
    "95123": { city: "San Jose", state: "CA" },
    "95124": { city: "San Jose", state: "CA" },
    "95125": { city: "San Jose", state: "CA" },
    "95126": { city: "San Jose", state: "CA" },
    "95127": { city: "San Jose", state: "CA" },
    "95128": { city: "San Jose", state: "CA" },
    "95129": { city: "San Jose", state: "CA" },
    "95130": { city: "San Jose", state: "CA" },
    "95131": { city: "San Jose", state: "CA" },
    "95132": { city: "San Jose", state: "CA" },
    "95133": { city: "San Jose", state: "CA" },
    "95134": { city: "San Jose", state: "CA" },
    "95135": { city: "San Jose", state: "CA" },
    "95136": { city: "San Jose", state: "CA" },
    "95138": { city: "San Jose", state: "CA" },
    "95139": { city: "San Jose", state: "CA" },
    "95148": { city: "San Jose", state: "CA" },
    
    // Santa Clara
    "95050": { city: "Santa Clara", state: "CA" },
    "95051": { city: "Santa Clara", state: "CA" },
    "95052": { city: "Santa Clara", state: "CA" },
    "95053": { city: "Santa Clara", state: "CA" },
    "95054": { city: "Santa Clara", state: "CA" },
    "95055": { city: "Santa Clara", state: "CA" },
    "95056": { city: "Santa Clara", state: "CA" },
    
    // Saratoga
    "95070": { city: "Saratoga", state: "CA" },
    "95071": { city: "Saratoga", state: "CA" },
    
    // Silvercreek (San Jose)
    "95138": { city: "San Jose", state: "CA" },
    
    // Stanford
    "94305": { city: "Stanford", state: "CA" },
    
    // Sunnyvale
    "94085": { city: "Sunnyvale", state: "CA" },
    "94086": { city: "Sunnyvale", state: "CA" },
    "94087": { city: "Sunnyvale", state: "CA" },
    "94088": { city: "Sunnyvale", state: "CA" },
    "94089": { city: "Sunnyvale", state: "CA" },
    
    // Willow Glen (San Jose)
    "95125": { city: "San Jose", state: "CA" },
    
    // Woodside
    "94062": { city: "Woodside", state: "CA" },
    
    // Original service area
    "94002": { city: "Belmont", state: "CA" },
    "94010": { city: "Burlingame", state: "CA" },
    "94070": { city: "San Carlos", state: "CA" },
    "94401": { city: "San Mateo", state: "CA" },
    "94402": { city: "San Mateo", state: "CA" },
    "94403": { city: "San Mateo", state: "CA" },
    "94404": { city: "San Mateo", state: "CA" }
  };
  return zipToCity[zip] || { city: "Unknown", state: "CA" };
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
    if (zc) {
      const cityInfo = getCityFromZip(normalized);
      res.json({ 
        ok: true, 
        ...zc, 
        city: cityInfo.city, 
        state: cityInfo.state,
        zip: normalized
      });
    } else {
      res.json({ ok: false, reason: "out_of_area" });
    }
  } catch (e) {
    res.status(400).json({ error: (e && e.message) || "unknown error" });
  }
}
