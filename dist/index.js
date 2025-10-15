import 'dotenv/config';
import { z } from 'zod';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createGoogleCalendarProvider } from './providers/googleCalendar.js';
const provider = await createGoogleCalendarProvider();
const tools = [
    {
        name: 'calendar_list_availability',
        description: 'List available time slots for a calendar over a date range',
        inputSchema: {
            type: 'object',
            properties: {
                startIso: { type: 'string', description: 'Range start in ISO 8601' },
                endIso: { type: 'string', description: 'Range end in ISO 8601' },
                durationMinutes: { type: 'number', description: 'Slot length in minutes' },
                calendarId: { type: 'string', description: 'Google Calendar ID; default primary', nullable: true }
            },
            required: ['startIso', 'endIso', 'durationMinutes']
        }
    },
    {
        name: 'calendar_book',
        description: 'Book a meeting on the calendar',
        inputSchema: {
            type: 'object',
            properties: {
                startIso: { type: 'string' },
                endIso: { type: 'string' },
                summary: { type: 'string' },
                description: { type: 'string', nullable: true },
                attendeeEmail: { type: 'string', description: 'Email of attendee', nullable: true },
                calendarId: { type: 'string', nullable: true }
            },
            required: ['startIso', 'endIso', 'summary']
        }
    },
    {
        name: 'calendar_cancel',
        description: 'Cancel a calendar event by ID',
        inputSchema: {
            type: 'object',
            properties: {
                eventId: { type: 'string' },
                calendarId: { type: 'string', nullable: true }
            },
            required: ['eventId']
        }
    },
    {
        name: 'calendar_list',
        description: 'List upcoming events',
        inputSchema: {
            type: 'object',
            properties: {
                maxResults: { type: 'number', nullable: true },
                calendarId: { type: 'string', nullable: true }
            },
            required: []
        }
    }
];
const server = new Server({ name: 'retell-calendar-mcp', version: '0.1.0' }, {
    capabilities: {
        tools: {},
        logging: {}
    }
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
        switch (name) {
            case 'calendar_list_availability': {
                const parsed = z
                    .object({ startIso: z.string(), endIso: z.string(), durationMinutes: z.number(), calendarId: z.string().nullish() })
                    .parse(args);
                const slots = await provider.listAvailability({
                    startIso: parsed.startIso,
                    endIso: parsed.endIso,
                    durationMinutes: parsed.durationMinutes,
                    calendarId: parsed.calendarId ?? 'primary'
                });
                return { content: [{ type: 'text', text: JSON.stringify(slots) }] };
            }
            case 'calendar_book': {
                const parsed = z
                    .object({ startIso: z.string(), endIso: z.string(), summary: z.string(), description: z.string().nullish(), attendeeEmail: z.string().email().nullish(), calendarId: z.string().nullish() })
                    .parse(args);
                const event = await provider.bookEvent({
                    startIso: parsed.startIso,
                    endIso: parsed.endIso,
                    summary: parsed.summary,
                    description: parsed.description ?? undefined,
                    attendeeEmail: parsed.attendeeEmail ?? undefined,
                    calendarId: parsed.calendarId ?? 'primary'
                });
                return { content: [{ type: 'text', text: JSON.stringify(event) }] };
            }
            case 'calendar_cancel': {
                const parsed = z.object({ eventId: z.string(), calendarId: z.string().nullish() }).parse(args);
                await provider.cancelEvent({ eventId: parsed.eventId, calendarId: parsed.calendarId ?? 'primary' });
                return { content: [{ type: 'text', text: 'ok' }] };
            }
            case 'calendar_list': {
                const parsed = z.object({ maxResults: z.number().nullish(), calendarId: z.string().nullish() }).parse(args ?? {});
                const events = await provider.listEvents({ maxResults: parsed.maxResults ?? 10, calendarId: parsed.calendarId ?? 'primary' });
                return { content: [{ type: 'text', text: JSON.stringify(events) }] };
            }
            default:
                return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
        }
    }
    catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.log(`[mcp] listening on stdio`);
