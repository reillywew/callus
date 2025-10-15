## Retell Calendar MCP Server

MCP server and optional HTTP bridge to connect a Retell AI voice agent to Google Calendar for availability lookup, booking, cancellation, and listing upcoming events.

### Features
- MCP tools: `calendar_list_availability`, `calendar_book`, `calendar_cancel`, `calendar_list`
- HTTP endpoints for simple webhooks: `/availability`, `/book`, `/cancel`, `/events`
- Google OAuth helper to obtain a refresh token

### Prerequisites
- Node.js 18+
- A Google Cloud project with the Calendar API enabled
- An OAuth 2.0 Client ID (Web application)

### Setup
1. Install dependencies:
```bash
npm install
```

2. Create a `.env` with Google credentials:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
RETELL_MCP_PORT=3020
PORT=8080
```

3. If you need a refresh token, run the helper and follow the URL:
```bash
npm run oauth:google -- --client-id YOUR_ID --client-secret YOUR_SECRET
```
Copy `Refresh token` into `.env`.

4. Build:
```bash
npm run build
```

### Run MCP Server
```bash
npm run dev:mcp
# or
npm run start:mcp
```
MCP WebSocket: `ws://localhost:${RETELL_MCP_PORT}`

### Run HTTP Bridge
```bash
npm run dev:http
# or
npm run start:http
```
HTTP server: `http://localhost:${PORT}`

Endpoints:
- POST `/availability` { startIso, endIso, durationMinutes, calendarId? }
- POST `/book` { startIso, endIso, summary, description?, attendeeEmail?, calendarId? }
- POST `/cancel` { eventId, calendarId? }
- POST `/events` { maxResults?, calendarId? }

### Retell Integration
You can call the HTTP endpoints directly from your Retell agent's webhook logic, or connect via MCP if your runtime supports MCP tools:

- HTTP: Have your agent compute desired time windows and call `/availability`, then `/book` when the caller confirms a slot.
- MCP: Tools exposed with names listed above; pass ISO 8601 strings.

Recommended flow for voice agent:
1. Gather meeting intent, duration, and date preferences.
2. Call availability across a reasonable window.
3. Offer top N slots; on confirmation, call `calendar_book`.
4. Read back confirmation and optionally send invite via attendee email.

### Notes
- Default `calendarId` is `primary`.
- Times must be ISO 8601 in the calendar timezone. If you need timezone conversion, do it in the agent or extend the provider.


