import { ulid } from "ulid";
export function createLead(payload, reason) {
    return { lead_id: "L-" + ulid(), status: "queued", reason, payload };
}
