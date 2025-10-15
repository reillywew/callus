import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { addMinutes, areIntervalsOverlapping, formatISO, parseISO } from 'date-fns';

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

export type CancelEventParams = { eventId: string; calendarId: string };

export type ListEventsParams = { maxResults: number; calendarId: string };

export type CalendarProvider = {
  listAvailability(params: AvailabilityParams): Promise<{ startIso: string; endIso: string }[]>;
  bookEvent(params: BookEventParams): Promise<{ id: string; htmlLink?: string }>;
  cancelEvent(params: CancelEventParams): Promise<void>;
  listEvents(params: ListEventsParams): Promise<{ id: string; startIso?: string; endIso?: string; summary?: string }[]>;
};

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN');
  }
  const client = new OAuth2Client({ clientId, clientSecret });
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export async function createGoogleCalendarProvider(): Promise<CalendarProvider> {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

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

    async cancelEvent({ eventId, calendarId }) {
      await calendar.events.delete({ calendarId, eventId });
    },

    async listEvents({ maxResults, calendarId }) {
      const resp = await calendar.events.list({ calendarId, maxResults, singleEvents: true, orderBy: 'startTime', timeMin: new Date().toISOString() });
      return (resp.data.items ?? []).map((e) => ({
        id: e.id!,
        startIso: e.start?.dateTime ?? undefined,
        endIso: e.end?.dateTime ?? undefined,
        summary: e.summary ?? undefined
      }));
    }
  };
}


