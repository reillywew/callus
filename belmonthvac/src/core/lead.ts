import { ulid } from "ulid";
export function createLead(payload: any, reason: string) {
  return { lead_id: "L-" + ulid(), status: "queued", reason, payload };
}


