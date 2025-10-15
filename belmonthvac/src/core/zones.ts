import { ZoneMap } from "./types.js";
import "dotenv/config";

const fallback: ZoneMap = {
  "ZONE-A": { name:"Core", zips:["94002","94061","94062","94063","94065","94070","94301","94306","94402","94403"], visit_fee:89, after_hours_fee:49, sla_hours:24 },
  "ZONE-B": { name:"Extended", zips:["94010","94025","94028","94304","94401","94404"], visit_fee:99, after_hours_fee:69, sla_hours:48 }
};

export const ZONES: ZoneMap = (() => {
  try { return JSON.parse(process.env.ZONE_MAP_JSON ?? "null") ?? fallback; }
  catch { return fallback; }
})();

export function findZone(zip: string) {
  for (const [zone_id, cfg] of Object.entries(ZONES)) {
    if (cfg.zips.includes(zip)) return { zone_id, ...cfg } as const;
  }
  return null;
}


