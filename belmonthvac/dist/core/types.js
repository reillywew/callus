import { z } from "zod";
export const Zip = z.string().regex(/^\d{5}(-\d{4})?$/);
export const SystemType = z.enum(["furnace", "AC", "heat_pump", "mini_split"]);
export const Symptom = z.enum(["no_heat", "no_cool", "weak_air", "no_power", "noise", "leak", "frozen", "odor", "other"]);
export const Urgency = z.enum(["EMERGENCY", "SOON", "SCHEDULED"]);
