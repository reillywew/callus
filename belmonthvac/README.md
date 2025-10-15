# HVAC Receptionist Bot - BelmontHVAC

AI voice agent for HVAC appointment booking with Google Calendar integration.

## Features

- ✅ **Service Area Validation** - Check ZIP codes against service zones
- ✅ **Real-time Availability** - Google Calendar FreeBusy integration  
- ✅ **Double-booking Protection** - Prevents scheduling conflicts
- ✅ **Appointment Booking** - Creates real Google Calendar events
- ✅ **Tech Notes Integration** - Adds call summaries to calendar events
- ✅ **Pricing Estimation** - Zone-based fee calculation
- ✅ **Lead Capture** - Creates lead records

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

### 2. Local Development

```bash
npm install
npm run build
```

### 3. Test Endpoints (After Deployment)

```bash
# Check service area
curl -s https://your-app.vercel.app/api/hvac/check-service-area \
  -H 'content-type: application/json' \
  -d '{"zip":"94002"}'

# Get availability  
curl -s https://your-app.vercel.app/api/hvac/get-availability \
  -H 'content-type: application/json' \
  -d '{"startIso":"2024-12-20T08:00:00-08:00","endIso":"2024-12-20T17:00:00-08:00","duration_min":60}'

# Book appointment
curl -s https://your-app.vercel.app/api/hvac/book-appointment \
  -H 'content-type: application/json' \
  -d '{"window":{"start":"2024-12-20T10:00:00-08:00","end":"2024-12-20T11:00:00-08:00"},"customer":{"full_name":"Test","phone":"555-1234"},"job":{"issue_summary":"No heat","symptom":"no_heat"}}'
```

## Vercel Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd belmonthvac
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: belmonthvac
# - Directory: ./
# - Override settings? No
```

### 2. Set Environment Variables

In Vercel dashboard, add these environment variables:

```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret  
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

### 3. Get Production URL

After deployment, you'll get a URL like:
`https://belmonthvac.vercel.app`

## Retell Integration

### Custom Functions Setup

Configure these endpoints in Retell Custom Functions:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `checkServiceArea` | `POST /api/hvac/check-service-area` | Validate ZIP code |
| `planJob` | `POST /api/hvac/plan-job` | Plan job duration/priority |
| `getAvailability` | `POST /api/hvac/get-availability` | Get available time slots |
| `bookAppointment` | `POST /api/hvac/book-appointment` | Book calendar appointment |
| `estimatePrice` | `POST /api/hvac/estimate-price` | Get pricing estimate |
| `createLead` | `POST /api/hvac/create-lead` | Create lead record |
| `callSummary` | `POST /api/hvac/call-summary` | Add tech notes to event |

### Request Body Templates

**CheckServiceArea:**
```json
{
  "zip": "{{zip}}"
}
```

**GetAvailability:**
```json
{
  "startIso": "{{startIso}}",
  "endIso": "{{endIso}}",
  "duration_min": {{duration_min}}
}
```

**BookAppointment:**
```json
{
  "window": {
    "start": "{{chosen_start}}",
    "end": "{{chosen_end}}"
  },
  "customer": {
    "full_name": "{{name}}",
    "phone": "{{phone}}",
    "email": "{{email}}"
  },
  "job": {
    "issue_summary": "{{issue_summary}}",
    "system_type": "{{system_type}}",
    "symptom": "{{symptom}}"
  },
  "location": {
    "address_line1": "{{address_line1}}",
    "city": "{{city}}",
    "zip": "{{zip}}"
  }
}
```

**CallSummary:**
```json
{
  "eventId": "{{event_id}}",
  "notes": "{{call_summary}}"
}
```

## Google Calendar Setup

### 1. Enable Google Calendar API
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Enable Google Calendar API
- Create OAuth 2.0 credentials

### 2. Get Refresh Token
```bash
npm run oauth:google
```

### 3. Configure Redirect URI
- Add `http://localhost:53682/callback` to OAuth credentials
- Add your Vercel domain callback URL

## Service Areas

Configure service zones in `.env`:

```json
{
  "ZONE-A": {
    "name": "Core",
    "zips": ["94002", "94061", "94062", "94063", "94065", "94070", "94301", "94306", "94402", "94403"],
    "visit_fee": 89,
    "after_hours_fee": 49,
    "sla_hours": 24
  },
  "ZONE-B": {
    "name": "Extended", 
    "zips": ["94010", "94025", "94028", "94304", "94401", "94404"],
    "visit_fee": 99,
    "after_hours_fee": 69,
    "sla_hours": 48
  }
}
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Retell Bot    │───▶│  Vercel API      │───▶│  Core Modules   │
│                 │    │  /api/hvac/*     │    │  (zones, etc.)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Google Calendar  │
                       │ (FreeBusy API)   │
                       └──────────────────┘
```

## Development

```bash
# Build
npm run build

# Deploy to Vercel
vercel
```
