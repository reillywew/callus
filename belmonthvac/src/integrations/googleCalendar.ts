import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { addMinutes, areIntervalsOverlapping, formatISO, parseISO } from "date-fns";

export type AvailabilityParams = {
  startIso: string;
  endIso: string;
  durationMinutes: number;
  calendarId: string;
};

export type BookEventParams = {
  startIso: string;
  endIso: string;
  summary: string;
  description?: string;
  attendeeEmail?: string;
  calendarId: string;
};

export type UpdateNotesParams = { eventId: string; notes: string; calendarId: string };

export type CalendarProvider = {
  listAvailability(params: AvailabilityParams): Promise<{ startIso: string; endIso: string }[]>;
  listBusyWindows(params: { startIso: string; endIso: string; calendarId: string }): Promise<{ start: string; end: string }[]>;
  bookEvent(params: BookEventParams): Promise<{ id: string; htmlLink?: string }>;
  appendNotes(params: UpdateNotesParams): Promise<void>;
};

function getOAuthClient(): OAuth2Client | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const client = new OAuth2Client({ clientId, clientSecret });
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

export async function createGoogleCalendarProvider(): Promise<CalendarProvider> {
  const auth = getOAuthClient();
  if (!auth) throw new Error("Google Calendar is not configured");
  const calendar = google.calendar({ version: "v3", auth });

  async function listBusyWindows(params: { startIso: string; endIso: string; calendarId: string }): Promise<{ start: string; end: string }[]> {
    const resp = await calendar.freebusy.query({
      requestBody: {
        timeMin: params.startIso,
        timeMax: params.endIso,
        items: [{ id: params.calendarId }]
      }
    });
    const busy = resp.data.calendars?.[params.calendarId]?.busy ?? [];
    return busy.map((b) => ({ start: b.start!, end: b.end! }));
  }

  return {
    async listAvailability({ startIso, endIso, durationMinutes, calendarId }) {
      const busy = await listBusyWindows({ startIso, endIso, calendarId });
      const start = parseISO(startIso);
      const end = parseISO(endIso);
      const slots: { startIso: string; endIso: string }[] = [];
      let cursor = start;
      while (addMinutes(cursor, durationMinutes) <= end) {
        const slotEnd = addMinutes(cursor, durationMinutes);
        const conflicts = busy.some((b) =>
          areIntervalsOverlapping(
            { start: cursor, end: slotEnd },
            { start: parseISO(b.start), end: parseISO(b.end) },
            { inclusive: false }
          )
        );
        if (!conflicts) {
          slots.push({ startIso: formatISO(cursor), endIso: formatISO(slotEnd) });
        }
        cursor = addMinutes(cursor, durationMinutes);
      }
      return slots;
    },

    async listBusyWindows({ startIso, endIso, calendarId }) {
      return listBusyWindows({ startIso, endIso, calendarId });
    },

    async bookEvent({ startIso, endIso, summary, description, attendeeEmail, calendarId }) {
      const resp = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary,
          description,
          start: { dateTime: startIso },
          end: { dateTime: endIso },
          attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined
        }
      });
      return { id: resp.data.id!, htmlLink: resp.data.htmlLink ?? undefined };
    },

    async appendNotes({ eventId, notes, calendarId }) {
      const existing = await calendar.events.get({ calendarId, eventId });
      const currentDesc = existing.data.description ?? "";
      const nextDesc = currentDesc ? `${currentDesc}\n\n${notes}` : notes;
      await calendar.events.patch({ calendarId, eventId, requestBody: { description: nextDesc } });
    }
  };
}


