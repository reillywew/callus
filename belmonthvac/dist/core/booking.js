import { ulid } from "ulid";
export function bookAppointment(_) {
    const booking_id = "BK-" + ulid();
    return { booking_id, ics_url: `https://ics.belmonthvac.com/${booking_id}.ics`, status: "confirmed" };
}
