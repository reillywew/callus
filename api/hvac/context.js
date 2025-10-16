import { DateTime } from "luxon";

export default async function handler(req, res) {
  const now = DateTime.now();
  res.json({
    nowIso: now.toUTC().toISO(),
    localDate: now.toFormat('yyyy-LL-dd'),
    localTime: now.toFormat('HH:mm'),
    timezone: now.zoneName
  });
}

