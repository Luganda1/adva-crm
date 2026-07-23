# ADVA CRM — Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Application Architecture](#7-application-architecture)
8. [Pages & Routes](#8-pages--routes)
9. [State Management](#9-state-management)
10. [Key Components](#10-key-components)
11. [External Integrations](#11-external-integrations)
12. [Deployment](#12-deployment)
13. [Infrastructure & Maintenance](#13-infrastructure--maintenance)
14. [TODO — Planned Features](#14-todo--planned-features)

---

## 1. Project Overview

ADVA Leads CRM is a full-stack real estate lead management application. It is designed for wholesalers and investors to track distressed property leads (probate, foreclosure, auction), manage follow-ups, coordinate buyer networks, and maintain a roster of financing partners (money partners).

The app has two distinct modules:

| Module | Path | Purpose |
|---|---|---|
| CRM | `/leads`, `/followup`, `/events`, etc. | Property leads, partners, buyers, letters, CSV import |
| Money Partners | `/money-partners/*` | Financing partners, deal tracking, comms |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3 (App Router) |
| UI | React 19, Tailwind CSS 3.4 |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL) with Realtime |
| Deployment | Vercel |
| Maps | Google Maps API |
| External integrations | Realeflow via Zapier webhooks, Google Sheets CSV |

---

## 3. Repository Structure

```
adva-crm/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — force-dynamic, server fetches all data
│   │   ├── page.tsx                # Redirects / → /leads
│   │   ├── middleware.ts           # CORS headers for all /api/* routes
│   │   ├── leads/page.tsx
│   │   ├── followup/page.tsx
│   │   ├── events/page.tsx
│   │   ├── map/page.tsx
│   │   ├── geo/page.tsx
│   │   ├── partners/page.tsx
│   │   ├── letters/page.tsx
│   │   ├── buyers/page.tsx
│   │   ├── import/page.tsx         # CSV import page (new)
│   │   ├── settings/page.tsx
│   │   ├── money-partners/
│   │   │   ├── page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   └── deals/page.tsx
│   │   └── api/
│   │       ├── health/route.ts           # GET — connection health check
│   │       ├── properties/
│   │       │   ├── route.ts              # GET, POST (with Realeflow field mapping)
│   │       │   └── [id]/route.ts         # PATCH, DELETE
│   │       ├── leads/route.ts            # GET, POST — dedicated lead intake endpoint
│   │       ├── partners/
│   │       │   ├── route.ts              # GET, POST
│   │       │   └── [id]/route.ts         # DELETE
│   │       ├── buyers/
│   │       │   ├── route.ts              # GET, POST
│   │       │   └── [id]/route.ts         # PATCH, DELETE
│   │       ├── money-partners/
│   │       │   ├── route.ts              # GET, POST
│   │       │   └── [id]/route.ts         # PATCH, DELETE
│   │       ├── enrich/route.ts           # GET — property enrichment (RentCast/API Ninjas)
│   │       ├── notify-zap/route.ts       # POST — fires Zapier outbound notification
│   │       ├── stats/route.ts            # GET — aggregated lead counts
│   │       ├── debug-webhook/route.ts    # POST/GET — raw payload inspector (dev tool)
│   │       └── cron/
│   │           └── keep-alive/route.ts   # GET — daily Supabase ping
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── crm/
│   │   │   ├── CRMChrome.tsx        # Navigation shell with Import tab
│   │   │   ├── LeadsView.tsx
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyPanel.tsx    # Now includes ✦ Enrich button
│   │   │   ├── AddPropertyModal.tsx
│   │   │   ├── SkipTraceModal.tsx
│   │   │   ├── ImportView.tsx       # CSV import UI (new)
│   │   │   ├── FollowupView.tsx
│   │   │   ├── EventsView.tsx
│   │   │   ├── MapView.tsx
│   │   │   ├── GeoView.tsx
│   │   │   ├── PartnersView.tsx
│   │   │   ├── LettersView.tsx
│   │   │   ├── BuyersView.tsx
│   │   │   └── SettingsView.tsx
│   │   ├── money-partners/
│   │   │   ├── MPChrome.tsx
│   │   │   ├── MPAllView.tsx
│   │   │   ├── MPPanel.tsx
│   │   │   └── AddMPModal.tsx
│   │   └── ui/
│   │       └── EmptyState.tsx
│   ├── contexts/
│   │   ├── CRMContext.tsx           # importRows now uses assembleAddress()
│   │   └── MPContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── supabase-server.ts
│   │   ├── api-auth.ts
│   │   ├── notify-zap.ts            # Shared Zapier notification utility (new)
│   │   ├── utils.ts                 # detectDelimiter, assembleAddress added
│   │   └── letters.ts
│   └── types/
│       └── index.ts
├── supabase/
│   └── schema.sql
├── vercel.json                      # Cron job config
├── TECHNICAL.md                     # This file
└── package.json
```

---

## 4. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Yes | Google Maps JavaScript API key |
| `API_SECRET_KEY` | Recommended | Validates `x-api-key` header on all API routes |
| `CRON_SECRET` | Recommended | Secures the `/api/cron/keep-alive` endpoint |
| `RENTCAST_API_KEY` | Optional | RentCast property enrichment (50 calls/month free — requires CC) |
| `WEBHOOK_SECRET` | Optional | Validates incoming webhook payloads |
| `ZAP_INBOUND_URL` | Optional | Zapier catch hook URL for outbound CRM notifications |

> **Note on enrichment API:** `RENTCAST_API_KEY` requires a credit card even on the free tier. A replacement using API Ninjas (no CC required, 10K calls/month free) is planned — see [TODO](#14-todo--planned-features).

---

## 5. Database Schema

All tables live in the `public` schema on Supabase (PostgreSQL). Real-time subscriptions are enabled on all four tables.

### `partners`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `created_at` | timestamptz | Auto-set |
| `name` | text | Required |
| `phone` | text | |
| `email` | text | |
| `role` | text | |

### `properties`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | |
| `address` | text | Required — full assembled address |
| `owner_name` | text | |
| `phone` | text | |
| `email` | text | |
| `notes` | text | Also stores enrichment data block |
| `status` | text | Enum: `lead`, `active`, `probate`, `foreclosure`, `auction` |
| `probate_date` | date | |
| `foreclosure_date` | date | |
| `auction_date` | date | |
| `next_followup` | date | |
| `partner_id` | uuid | FK → `partners.id`, SET NULL on delete |
| `followups` | jsonb | Array of `{ date, note }` |
| `docs` | jsonb | Array of `{ name, size, date }` |
| `mailing_address` | text | From skip trace or CSV import |
| `skip_relatives` | text | From skip trace |

### `buyers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | |
| `name` | text | Required |
| `phone` / `email` / `company` | text | |
| `areas` | text | Geographic areas of interest |
| `notes` | text | |
| `max_price` / `min_price` | numeric | |
| `buyer_type` | text | Enum: `cash`, `flipper`, `landlord`, `realtor`, `wholesaler`, `lender` |
| `prop_types` | jsonb | Array of property type strings |

### `money_partners`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Required |
| `company`, `phone`, `email`, `address`, `city`, `state`, `zip` | text | |
| `mailing_address`, `phone2`, `phone2_label`, `email2`, `website` | text | |
| `partner_type` | text | Primary type |
| `partner_types` | jsonb | Array |
| `availability` | text | Enum: `active`, `paused`, `deployed` |
| `capital_available` / `total_capital` / `min_deal_size` / `max_deal_size` | numeric | |
| `interest_rate` / `points` | numeric | |
| `term_length` / `invest_type` | text | |
| `asset_types` | jsonb | Array |
| `asset_type_custom` / `locations` / `notes` | text | |
| `deals` | jsonb | Array of `{ date, amount, property, return_to_partner, notes }` |
| `comm_log` | jsonb | Array of `{ date, note, next_followup }` |

---

## 6. API Reference

All routes are under `/api`. CORS is open for all origins via `src/middleware.ts`.

### Authentication

Routes check `x-api-key` header against `API_SECRET_KEY`. If unset, all requests are allowed (dev mode).

```
x-api-key: adva-zap-2024-xK9mP
```

---

### Health

#### `GET /api/health`
Returns Supabase connection status and which env vars are present. No auth required.

---

### Properties

#### `GET /api/properties`
All properties, newest first.

#### `POST /api/properties`
Creates a new property. Handles Realeflow field format — assembles `address` from separate `street`, `city`, `state`, `zipCode` fields. Strips unknown columns before inserting. Fires Zapier notification unless `x-source: zapier` header is present.

**Required:** at least one address field (`address`, `street`, `city`, etc.)

#### `PATCH /api/properties/[id]`
Partial update.

#### `DELETE /api/properties/[id]`
Deletes property.

---

### Leads (Dedicated Intake Endpoint)

#### `GET /api/leads`
Lists all leads. Supports `?status=probate` and `?limit=50` query params.

#### `POST /api/leads`
Dedicated endpoint for new lead intake from Zapier/Realeflow. Same field handling as `POST /api/properties` but returns `{ lead: data }` wrapper. **Use this URL in Zapier.**

```
URL:     https://adva-crm-two.vercel.app/api/leads
Headers: x-api-key: adva-zap-2024-xK9mP
         x-source: zapier
         Content-Type: application/json
```

**Realeflow field mapping:**

| Realeflow field | CRM field |
|---|---|
| `address` (street) | assembled into full `address` |
| `city` | assembled into full `address` |
| `state` | assembled into full `address` |
| `zipCode` | assembled into full `address` |
| `source` | prepended to `notes` as `[Source: ...]` |
| `owner_name` / `owner` | `owner_name` |
| `phone` / `phone_number` | `phone` |
| `email` | `email` |
| `notes` / `description` | `notes` |

---

### Enrichment

#### `GET /api/enrich?address=<address>`
Fetches property details from RentCast (or planned API Ninjas replacement). Returns owner name, beds, baths, sqft, year built, estimated value, equity, last sale, estimated rent.

Returns `503` if no enrichment API key is configured.

> **Current status:** RentCast key is configured locally but not active (requires CC). Pending swap to API Ninjas — see [TODO](#14-todo--planned-features).

---

### Zapier Notification

#### `POST /api/notify-zap`
Browser-callable endpoint that fires a POST to `ZAP_INBOUND_URL`. Called by `CRMContext.saveProperty` when a new lead is created from the UI.

---

### Stats

#### `GET /api/stats`
Aggregated lead counts: total, active, probate, foreclosure, auction, overdue.

---

### Debug

#### `POST /api/debug-webhook`
#### `GET /api/debug-webhook`
Dev tool — echoes back raw request body, content-type, and parsed JSON. Used to inspect exactly what Zapier/Realeflow sends. Safe to leave in place.

---

### Cron

#### `GET /api/cron/keep-alive`
Daily Supabase ping. Auth: `Authorization: Bearer <CRON_SECRET>`.

---

## 7. Application Architecture

### Data Flow

```
Browser Request
      │
      ▼
Next.js App Router
      │
      ├─ layout.tsx (server, force-dynamic)
      │       │  fetches all data via serverSupabase()
      │       ▼
      │   AppShell → CRMProvider + MPProvider
      │       │  real-time Supabase subscriptions
      │       ▼
      │   Page Components → Context consumers
      │
      └─ /api/* routes
              │  checkApiKey() → serverSupabase()
              └─ JSON responses

External lead flow:
  Realeflow (Deal Surge)
      → Zapier trigger (New Property)
      → POST /api/leads
      → Supabase insert
      → Real-time push to all open browsers
```

### Rendering

`layout.tsx` exports `export const dynamic = 'force-dynamic'` — disables Next.js static caching so every page load fetches fresh data from Supabase.

### Supabase Client Split

| File | Key | Used in |
|---|---|---|
| `lib/supabase.ts` | Anon key | Browser (contexts, components) |
| `lib/supabase-server.ts` | Service role key | API routes, server components |

---

## 8. Pages & Routes

### CRM Module

| Route | Component | Description |
|---|---|---|
| `/leads` | `LeadsView` | Lead list — search, filter by status/partner/date, sort |
| `/followup` | `FollowupView` | Leads with upcoming or overdue follow-ups |
| `/events` | `EventsView` | Calendar of probate, foreclosure, auction dates |
| `/map` | `MapView` | Google Maps view of all leads |
| `/geo` | `GeoView` | Geographic clustering view |
| `/partners` | `PartnersView` | Sales partners management |
| `/letters` | `LettersView` | Mail merge letter generation |
| `/buyers` | `BuyersView` | Buyer/investor directory |
| `/import` | `ImportView` | Bulletproof CSV import with preview + column mapping |
| `/settings` | `SettingsView` | Sender info, Google Sheets sync, letter templates |

### Money Partners Module

| Route | Description |
|---|---|
| `/money-partners` | Financing partner list + detail panel |
| `/money-partners/pipeline` | Deal pipeline view |
| `/money-partners/deals` | All logged deals |

---

## 9. State Management

### CRMContext (`src/contexts/CRMContext.tsx`)

**State:** `properties`, `partners`, `buyers`, `syncStatus`, `syncLabel`, `sender`, `gsUrl`

**Key mutations:**

| Method | Description |
|---|---|
| `saveProperty(data, id?)` | Create or update — new leads fire `/api/notify-zap` |
| `deleteProperty(id)` | Delete |
| `logFollowup(id, date, note, next?)` | Append follow-up entry |
| `deleteFU(id, idx)` | Remove follow-up |
| `uploadDocs(id, files)` | Attach document metadata |
| `deleteDoc(id, idx)` | Remove document |
| `saveSkipTrace(id, ...)` | Save skip trace results |
| `savePartner / deletePartner` | Partner CRUD |
| `saveBuyer / deleteBuyer` | Buyer CRUD |
| `importRows(headers, rows)` | Bulk CSV import using `assembleAddress()` |
| `syncSheet()` | Fetch Google Sheets CSV and import |
| `generateLetter / printLetterFn` | Letter generation and print |

**Realtime:** Subscribes to Postgres changes on `properties`, `partners`, `buyers`.

### MPContext (`src/contexts/MPContext.tsx`)

**State:** `partners` (MoneyPartner[]), sync status

**Key mutations:** `savePartner`, `deletePartner`, `logDeal`, `deleteDeal`, `logComm`, `deleteComm`

---

## 10. Key Components

### `ImportView.tsx` (new)

Three-stage CSV import flow:
1. **Upload** — drag & drop, accepts `.csv`, `.tsv`, `.txt`
2. **Preview** — shows first 5 rows, editable column mapping dropdowns, assembled address preview
3. **Done** — added / updated / skipped counts, link to leads

Supports county export formats: comma, tab, semicolon, pipe delimited. Recognizes county-specific headers: `situs`, `grantor`, `taxpayer`, `lis pendens`, `trustee sale`, `case filed`.

### `PropertyPanel.tsx` (updated)

Added **✦ Enrich** button:
- Calls `GET /api/enrich?address=<address>`
- Shows blue card: owner name, estimated value, equity, beds/baths/sqft, year built, last sale, estimated rent
- **Save to property** fills `owner_name` (if empty) and appends `[Property Data]` block to notes
- Gracefully shows error if enrichment API key not configured

### `CRMChrome.tsx` (updated)

Added `⬆️ Import` tab to navigation bar.

### `LeadsView.tsx`

Search, filter (status/partner/date range), sort. Opens `PropertyPanel` on selection.

### `LettersView.tsx`

Mail merge for 6 letter types: probate owner/lawfirm, foreclosure owner/lawfirm, cash offer, follow-up.

---

## 11. External Integrations

### Realeflow → Zapier → ADVA CRM

**Flow:** New property saved in Deal Surge → Zapier "New Property" trigger → `POST /api/leads`

**Zapier action config:**
```
Method:        POST
URL:           https://adva-crm-two.vercel.app/api/leads
Payload Type:  JSON
Unflatten:     No  ← IMPORTANT: must be disabled

Headers:
  x-api-key   →  adva-zap-2024-xK9mP
  x-source    →  zapier

Data:
  address     →  Realeflow: Property Address (street)
  city        →  Realeflow: City
  state       →  Realeflow: State
  zipCode     →  Realeflow: Zip Code
  owner_name  →  Realeflow: Owner Name
  phone       →  Realeflow: Phone
  email       →  Realeflow: Email
  status      →  lead  (hardcoded)
```

**Loop prevention:** The `x-source: zapier` header tells the CRM to skip the outbound Zapier notification, preventing infinite loops.

**Known Realeflow payload format:**
```json
{
  "address": "9428 S 69 E Ave",
  "city": "Tulsa",
  "state": "OK",
  "zipCode": "74133",
  "source": "Leadflow Mobile App Followed Property",
  "created": "2026-03-18T03:28:15Z",
  "id": "adab9e4d-...",
  "propertyId": "122573833"
}
```

### Google Maps

`MapView` and `GeoView` use the Google Maps JavaScript API. Key: `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.

### Google Sheets CSV Sync

Configure a published Google Sheets CSV URL in `/settings`. The CRM fetches it and runs the same import logic as the CSV upload. Sheet must be published as: **File → Share → Publish to web → CSV**.

### Property Enrichment (RentCast — pending replacement)

`GET /api/enrich?address=` calls RentCast's `/properties` and `/avm/value` endpoints in parallel. Requires `RENTCAST_API_KEY`. Currently inactive — planned replacement with API Ninjas (see TODO).

---

## 12. Deployment

**Platform:** Vercel  
**Production URL:** `https://adva-crm-two.vercel.app`  
**Trigger:** Every push to `main` auto-deploys

**Required Vercel environment variables:** See Section 4.

**Local development:**
```bash
npm install
# copy .env.local and fill in values
npm run dev
# runs at http://localhost:3000
```

**Database setup:** Run `supabase/schema.sql` once in Supabase → SQL Editor.

---

## 13. Infrastructure & Maintenance

### Supabase Keep-Alive

Free tier pauses after 7 days of inactivity. Vercel cron job prevents this:

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/keep-alive", "schedule": "0 12 * * *" }]
}
```

Runs daily at 12:00 UTC. Secured with `CRON_SECRET`. Monitor at: **Vercel Dashboard → Project → Cron Jobs**.

### Health Check

```bash
curl https://adva-crm-two.vercel.app/api/health
```

### Adding a New Table

1. Write `CREATE TABLE` SQL in `supabase/schema.sql`
2. Run in Supabase → SQL Editor
3. Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.<name>;`
4. Add TypeScript interface to `src/types/index.ts`
5. Add API routes under `src/app/api/<resource>/`
6. Add fetch logic to relevant context
7. Update `layout.tsx` to fetch initial data server-side

### Branch Workflow

All changes go through feature branches — never commit directly to `main`:
```
git checkout -b feature/<name>
# make changes, commit
git checkout main
git merge feature/<name>
git push origin main
```

---

## 14. TODO — Planned Features

Features discussed and planned but not yet built, in priority order:

---

### TODO 1 — Swap Enrichment API to API Ninjas (Next up)

**Why:** RentCast requires a credit card even on the free tier. API Ninjas has 10,000 free calls/month with no credit card required.

**What to do:**
1. Sign up at `api-ninjas.com` → get free API key
2. Add `API_NINJAS_KEY` to Vercel env vars
3. Replace `src/app/api/enrich/route.ts` to call `https://api.api-ninjas.com/v1/realestate`
4. Auth header: `X-Api-Key: <key>`
5. Update `PropertyPanel.tsx` if response fields differ
6. Remove `RENTCAST_API_KEY` from env

**API Ninjas returns:** address, beds, baths, sqft, year built, property type, list price  
**Does NOT return:** owner name, equity (those are paywalled everywhere)

---

### TODO 2 — Mobile Quick-Add (Driving for Dollars)

**Why:** When you're driving neighborhoods, you need to add a lead from your phone in under 10 seconds.

**What to build:**
- New route `/quick-add` — stripped-down single-page form
- Fields: address (with autocomplete via Google Maps), owner name, phone, notes, status
- Large tap targets, no sidebar/navigation clutter
- Auto-detect current location to pre-fill city/state
- Save goes directly to Supabase, shows confirmation, resets form
- Works offline-first with a retry queue (localStorage fallback)

---

### TODO 3 — Lead Scoring / Hot Lead Flagging

**Why:** Not all leads are equal. A vacant + tax delinquent + probate property is far more motivated than a regular listing.

**What to build:**
- Score each property 0–100 based on signals:
  - Has probate date: +30
  - Has foreclosure date: +30
  - Has auction date: +25
  - Status is active: +15
  - No contact info (harder to reach): -10
  - Follow-up overdue: +20
  - Notes contain keywords (vacant, distressed, motivated): +15
- Show score badge on `PropertyCard`
- Add "Hot Leads" filter to `LeadsView` (score > 60)
- Sort by score option

---

### TODO 4 — County Record Scraper

**Why:** Instead of manually downloading CSVs, auto-import new county filings weekly.

**What to build:**
- Vercel cron job running weekly (`0 9 * * 1` — Monday 9am)
- Start with one county: configure target county's public assessor/court URL
- Scraper fetches the public page, extracts new filings, runs them through `importRows()`
- Notify via email when new leads are imported
- Make it configurable (Settings page → add county scraper URL)

**Complexity:** Medium-high — each county has a different portal format.

---

### TODO 5 — Email Follow-up Reminders (Resend)

**Why:** When a follow-up date is missed, nothing happens. Automated email reminders fix this.

**What to build:**
- Daily cron job checks for properties where `next_followup <= today`
- Sends email via **Resend** (free tier: 3,000 emails/month, no credit card)
- Email shows: property address, owner name, days overdue, link to CRM
- Configure recipient email in Settings
- Sign up at `resend.com`, get API key, add `RESEND_API_KEY` to Vercel env vars

---

### TODO 6 — SMS Notifications via Twilio

**Why:** Email is easy to miss. SMS for hot follow-ups gets attention immediately.

**What to build:**
- When a lead is marked as high-priority or follow-up is overdue > 3 days, send SMS
- Use **Twilio** (free trial credit, then pay-per-message ~$0.0079/SMS)
- Configure phone number in Settings
- Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` to Vercel env vars

---

### TODO 7 — Zapier Debugging / Reliability

**Why:** The Zapier → ADVA CRM connection has had issues (unflatten setting, field mapping).

**Remaining items:**
- Confirm `Unflatten: No` is set in Zapier webhook action
- Test full end-to-end: add property in Deal Surge → appears in CRM within 2 minutes
- Consider adding a Zapier test trigger button in `/settings` that sends a test lead
- Add webhook delivery log to the CRM so you can see incoming Zapier requests

---

### TODO 8 — Free Lead Sources (No Paid API)

**Why:** Instead of relying only on Realeflow, pull leads from public free sources.

**Sources to integrate:**
- **HUD REO listings** — `hudgov` API, completely free
- **Fannie Mae HomePath** — public listings, scrapeable
- **Tax delinquent lists** — county-by-county, most publish CSV downloads
- **Driving for Dollars** — covered by TODO 2 (mobile quick-add)

---

*Last updated: 2026-07-23*
