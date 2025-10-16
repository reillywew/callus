import { DateTime } from "luxon";

export default async function handler(req, res) {
  const tz = process.env.BUSINESS_TZ || "America/Los_Angeles";
  const nowLocal = DateTime.now().setZone(tz);
  res.json({
    nowIso: nowLocal.toUTC().toISO(),
    localDate: nowLocal.toFormat('yyyy-LL-dd'),
    localTime: nowLocal.toFormat('HH:mm'),
    timezone: tz
  });
}

