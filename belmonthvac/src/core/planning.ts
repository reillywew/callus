import { Symptom } from "./types.js";
export function planJob(symptom: typeof Symptom._type) {
  const long = new Set(["leak","frozen","no_power"]);
  return { duration_min: long.has(symptom) ? 90 : 60, priority: "SOON" as const, route_tags: ["hvac","diag"] };
}


