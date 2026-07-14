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

---

## 1. Project Overview

ADVA Leads CRM is a full-stack real estate lead management application. It is designed for wholesalers and investors to track distressed property leads (probate, foreclosure, auction), manage follow-ups, coordinate buyer networks, and maintain a roster of financing partners (money partners).

The app has two distinct modules:

| Module | Path | Purpose |
|---|---|---|
| CRM | `/leads`, `/followup`, `/events`, etc. | Property leads, partners, buyers, letters |
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
| External integrations | Zapier webhooks, Google Sheets CSV |

---

## 3. Repository Structure

```
adva-crm/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — server fetches all data on every request
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
│   │   ├── settings/page.tsx
│   │   ├── money-partners/
│   │   │   ├── page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   └── deals/page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── properties/
│   │       │   ├── route.ts        # GET, POST
│   │       │   └── [id]/route.ts   # PATCH, DELETE
│   │       ├── partners/
│   │       │   ├── route.ts        # GET, POST
│   │       │   └── [id]/route.ts   # DELETE
│   │       ├── buyers/
│   │       │   ├── route.ts        # GET, POST
│   │       │   └── [id]/route.ts   # PATCH, DELETE
│   │       ├── money-partners/
│   │       │   ├── route.ts        # GET, POST
│   │       │   └── [id]/route.ts   # PATCH, DELETE
│   │       ├── stats/route.ts      # GET — aggregated counts
│   │       ├── webhook/route.ts    # POST — external webhook entry point
│   │       └── cron/
│   │           └── keep-alive/route.ts  # GET — daily Supabase ping
│   ├── components/
│   │   ├── AppShell.tsx            # Root client wrapper; mounts both context providers
│   │   ├── crm/
│   │   │   ├── CRMChrome.tsx       # Navigation shell, stats bar, sync indicator
│   │   │   ├── LeadsView.tsx       # Lead list with search, filter, sort
│   │   │   ├── PropertyCard.tsx    # Single lead card
│   │   │   ├── PropertyPanel.tsx   # Lead detail side panel
│   │   │   ├── AddPropertyModal.tsx
│   │   │   ├── SkipTraceModal.tsx
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
│   │   ├── CRMContext.tsx          # CRM state + all mutations
│   │   └── MPContext.tsx           # Money partner state + mutations
│   ├── lib/
│   │   ├── supabase.ts             # Browser-side Supabase client (anon key)
│   │   ├── supabase-server.ts      # Server-side Supabase client (service role key)
│   │   ├── api-auth.ts             # API key guard middleware
│   │   ├── utils.ts                # Date, money, CSV, address utilities
│   │   └── letters.ts              # Letter template engine
│   └── types/
│       └── index.ts                # All TypeScript interfaces
├── supabase/
│   └── schema.sql                  # Full database schema — run once in Supabase SQL editor
├── vercel.json                     # Vercel cron job config
├── next.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Environment Variables

Set these in Vercel → Project Settings → Environment Variables (and in `.env.local` for local dev).

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only, never exposed to browser) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Yes | Google Maps JavaScript API key |
| `API_SECRET_KEY` | Recommended | Secret sent as `x-api-key` header to authenticate external API calls (Zapier etc.) |
| `CRON_SECRET` | Recommended | Secret Vercel passes as `Authorization: Bearer <secret>` on cron requests |
| `WEBHOOK_SECRET` | Optional | Validates incoming webhook payloads |
| `ZAP_INBOUND_URL` | Optional | Zapier webhook URL for outbound triggers |

---

## 5. Database Schema

All tables live in the `public` schema on Supabase (PostgreSQL). Real-time subscriptions are enabled on all four tables.

### `partners`

Created first because `properties` references it.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `created_at` | timestamptz | Auto-set to now() |
| `name` | text | Required |
| `phone` | text | |
| `email` | text | |
| `role` | text | Free-form role label |

### `properties`

Core lead table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | |
| `address` | text | Required |
| `owner_name` | text | |
| `phone` | text | |
| `email` | text | |
| `notes` | text | |
| `status` | text | Enum: `lead`, `active`, `probate`, `foreclosure`, `auction` |
| `probate_date` | date | |
| `foreclosure_date` | date | |
| `auction_date` | date | |
| `next_followup` | date | |
| `partner_id` | uuid | FK → `partners.id`, SET NULL on delete |
| `followups` | jsonb | Array of `{ date, note }` |
| `docs` | jsonb | Array of `{ name, size, date }` |
| `mailing_address` | text | From skip trace |
| `skip_relatives` | text | From skip trace |

### `buyers`

Cash buyers and investor contacts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | |
| `name` | text | Required |
| `phone` | text | |
| `email` | text | |
| `company` | text | |
| `areas` | text | Geographic areas of interest |
| `notes` | text | |
| `max_price` | numeric | |
| `min_price` | numeric | |
| `buyer_type` | text | Enum: `cash`, `flipper`, `landlord`, `realtor`, `wholesaler`, `lender` |
| `prop_types` | jsonb | Array of property type strings |

### `money_partners`

Financing partners with deal history and communication logs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | |
| `name` | text | Required |
| `company` | text | |
| `phone` / `phone2` | text | Primary and secondary phone |
| `phone2_label` | text | Label for secondary phone |
| `email` / `email2` | text | |
| `address`, `city`, `state`, `zip` | text | Physical address |
| `mailing_address` | text | |
| `website` | text | |
| `partner_type` | text | Primary type label |
| `partner_types` | jsonb | Array of type strings |
| `availability` | text | Enum: `active`, `paused`, `deployed` |
| `capital_available` | numeric | Current available capital |
| `total_capital` | numeric | Total capital under management |
| `min_deal_size` / `max_deal_size` | numeric | |
| `interest_rate` | numeric | |
| `points` | numeric | Origination points |
| `term_length` | text | Loan term description |
| `invest_type` | text | Investment type |
| `asset_types` | jsonb | Array of asset type strings |
| `asset_type_custom` | text | Custom asset type override |
| `locations` | text | Geographic focus areas |
| `notes` | text | |
| `deals` | jsonb | Array of `{ date, amount, property, return_to_partner, notes }` |
| `comm_log` | jsonb | Array of `{ date, note, next_followup }` |

---

## 6. API Reference

All routes are under `/api`. CORS is enabled for all origins via `src/middleware.ts`.

### Authentication

Routes check the `x-api-key` request header against `API_SECRET_KEY`. If `API_SECRET_KEY` is not set, all requests are allowed (useful for local development). Unauthorized requests receive a `401` response.

```
x-api-key: <API_SECRET_KEY value>
```

### `GET /api/health`

Returns Supabase connection status and environment variable presence. No API key required.

**Response:**
```json
{
  "supabase_url": "https://xxx.supabase.co",
  "has_anon_key": true,
  "has_service_key": true,
  "has_api_secret": true,
  "db_connection": "OK"
}
```

---

### Properties

#### `GET /api/properties`
Returns all properties ordered by `created_at` descending.

#### `POST /api/properties`
Creates a new property (lead).

**Required body fields:**
```json
{ "address": "123 Main St, Atlanta GA" }
```

**Optional fields:** `owner_name`, `phone`, `email`, `notes`, `status`, `probate_date`, `foreclosure_date`, `auction_date`, `next_followup`, `partner_id`, `mailing_address`, `skip_relatives`

**Response:** `201` with the created record.

#### `PATCH /api/properties/[id]`
Partial update. Send only the fields to change.

#### `DELETE /api/properties/[id]`
Deletes the property.

---

### Partners

#### `GET /api/partners`
Returns all partners ordered by name.

#### `POST /api/partners`
Creates a partner. Required: `name`.

#### `DELETE /api/partners/[id]`
Deletes partner. The `partner_id` column on any linked properties is automatically set to `NULL` via the database foreign key constraint (`ON DELETE SET NULL`).

---

### Buyers

#### `GET /api/buyers`
Returns all buyers.

#### `POST /api/buyers`
Creates a buyer. Required: `name`.

#### `PATCH /api/buyers/[id]`
Partial update.

#### `DELETE /api/buyers/[id]`
Deletes buyer.

---

### Money Partners

#### `GET /api/money-partners`
Returns all money partners.

#### `POST /api/money-partners`
Creates a money partner. Required: `name`.

#### `PATCH /api/money-partners/[id]`
Partial update. Used to append deals and comm log entries as well as update profile fields.

#### `DELETE /api/money-partners/[id]`
Deletes money partner.

---

### Stats

#### `GET /api/stats`
Returns aggregated lead counts. No filtering — counts across all properties.

**Response:**
```json
{
  "total": 42,
  "active": 10,
  "probate": 8,
  "foreclosure": 5,
  "auction": 3,
  "overdue": 2
}
```

---

### Webhook

#### `POST /api/webhook`
External webhook endpoint for inbound data (e.g. from Realeflow via Zapier). Accepts a property payload and creates or updates a lead.

---

### Cron

#### `GET /api/cron/keep-alive`
Runs a lightweight `SELECT id FROM properties LIMIT 1` to keep the Supabase project active on the free tier. Called automatically by Vercel Cron once per day.

**Auth:** `Authorization: Bearer <CRON_SECRET>` (if `CRON_SECRET` is set).

**Response:**
```json
{ "ok": true, "pinged_at": "2026-07-14T12:00:00.000Z" }
```

---

## 7. Application Architecture

### Data Flow

```
Browser Request
      │
      ▼
Next.js App Router
      │
      ├─ layout.tsx (server component)
      │       │  fetches all data via serverSupabase() (service role)
      │       │  passes as props to AppShell
      │       ▼
      │   AppShell (client component)
      │       │  mounts CRMProvider + MPProvider with initial data
      │       │  sets up Supabase Realtime subscriptions
      │       ▼
      │   Page Components → Context consumers
      │
      └─ /api/* routes
              │  authenticate via checkApiKey()
              │  use serverSupabase() (service role)
              └─ respond with JSON
```

### Rendering Strategy

`layout.tsx` exports `export const dynamic = 'force-dynamic'`, which disables Next.js static caching for the root layout. This ensures every page load fetches fresh data from Supabase rather than serving a cached snapshot.

### Supabase Client Split

| File | Key Used | Used In |
|---|---|---|
| `lib/supabase.ts` | Anon key | Browser context (contexts, components) |
| `lib/supabase-server.ts` | Service role key | Server components, API routes |

The service role key bypasses Supabase Row Level Security (RLS). It is only used server-side and is never exposed to the browser.

---

## 8. Pages & Routes

### CRM Module

All pages under the CRM module are wrapped by `CRMChrome`, which renders the top navigation bar, stats bar, and sync status indicator.

| Route | Component | Description |
|---|---|---|
| `/leads` | `LeadsView` | Main lead list. Search, filter by status/partner/date, sort. Opens `PropertyPanel` on click. |
| `/followup` | `FollowupView` | Shows leads with upcoming or overdue follow-up dates. |
| `/events` | `EventsView` | Calendar view of probate, foreclosure, and auction dates. |
| `/map` | `MapView` | Google Maps view plotting all lead addresses. |
| `/geo` | `GeoView` | Geographic clustering view. |
| `/partners` | `PartnersView` | Manage sales partners and assign them to leads. |
| `/letters` | `LettersView` | Mail merge letter generation with template editor. |
| `/buyers` | `BuyersView` | Buyer/investor directory with type and price range filters. |
| `/settings` | `SettingsView` | App settings including Google Sheets sync URL. |

### Money Partners Module

All pages under this module are wrapped by `MPChrome`.

| Route | Component | Description |
|---|---|---|
| `/money-partners` | `MPAllView` | Financing partner list. Opens `MPPanel` on click. |
| `/money-partners/pipeline` | Pipeline view | Deal pipeline across all money partners. |
| `/money-partners/deals` | Deals view | All logged deals in one view. |

---

## 9. State Management

### CRMContext (`src/contexts/CRMContext.tsx`)

Holds all CRM state and exposes mutations to the component tree.

**State:**
- `properties: Property[]`
- `partners: Partner[]`
- `buyers: Buyer[]`
- `syncStatus: 'connected' | 'syncing' | 'error'`
- `syncLabel: string`
- `sender: SenderInfo` (persisted to localStorage)
- `gsUrl: string` (Google Sheets CSV URL, persisted to localStorage)

**Mutations:**

| Method | Description |
|---|---|
| `saveProperty(data, id?)` | Create or update a property |
| `deleteProperty(id)` | Delete a property |
| `logFollowup(id, date, note, next?)` | Append a follow-up entry to a property |
| `deleteFU(id, idx)` | Remove a follow-up by index |
| `uploadDocs(id, files)` | Attach documents to a property (metadata only) |
| `deleteDoc(id, idx)` | Remove a document by index |
| `saveSkipTrace(id, ...)` | Save skip trace results (phone, email, mailing, relatives) |
| `savePartner(name, phone, email, role)` | Create a partner |
| `deletePartner(id)` | Delete a partner |
| `saveBuyer(data, id?)` | Create or update a buyer |
| `deleteBuyer(id)` | Delete a buyer |
| `importRows(headers, rows)` | Bulk import leads from CSV rows |
| `syncSheet()` | Fetch and import leads from the configured Google Sheets CSV URL |
| `generateLetter(type, propId, contact)` | Render a letter template with property data |
| `printLetterFn(content)` | Trigger browser print for a letter |

**Realtime:** On mount, subscribes to Postgres changes on `properties`, `partners`, and `buyers` tables via `supabase.channel()`. Any INSERT, UPDATE, or DELETE triggers a full `loadAll()` refresh.

---

### MPContext (`src/contexts/MPContext.tsx`)

Manages money partner state.

**State:**
- `partners: MoneyPartner[]`
- `syncStatus` / `syncLabel`

**Mutations:**

| Method | Description |
|---|---|
| `savePartner(data, id?)` | Create or update a money partner |
| `deletePartner(id)` | Delete a money partner |
| `logDeal(id, deal)` | Append a deal entry |
| `deleteDeal(id, idx)` | Remove a deal by index |
| `logComm(id, entry)` | Append a communication log entry |
| `deleteComm(id, idx)` | Remove a comm entry by index |

---

## 10. Key Components

### `AppShell.tsx`
Root client component. Receives initial data from the server-rendered layout and mounts `CRMProvider` and `MPProvider`. All child components have access to both contexts.

### `CRMChrome.tsx`
Navigation shell for the CRM module. Renders:
- App title and module switcher
- Tab bar linking to all CRM pages
- Real-time sync status badge
- Statistics bar (Total, Active, Probate, Foreclosure, Auction, Overdue counts derived from context state)

### `LeadsView.tsx`
Most complex component. Manages:
- Text search across address, owner name, phone, email, notes
- Status filter (All / Active / Probate / Foreclosure / Auction)
- Partner filter
- Date range filter (from / to)
- Sort order (Newest, Oldest, Next Follow-up, Owner A–Z)
- Selected property state → renders `PropertyPanel`
- `AddPropertyModal` for new lead creation

### `PropertyPanel.tsx`
Side panel showing full lead detail. Features:
- View and edit all property fields
- Follow-up log (add, view, delete entries)
- Document list (upload, delete)
- Skip trace data entry (`SkipTraceModal`)
- Partner assignment dropdown
- Status change buttons
- Delete lead

### `LettersView.tsx`
Mail merge system. Features:
- Sender info form (name, company, address) persisted to localStorage
- Template editor for 6 letter types: `probate_owner`, `probate_lawfirm`, `foreclosure_owner`, `foreclosure_lawfirm`, `cashoffer`, `followup`
- Property selector and contact type selector
- Live letter preview with property data interpolated
- Print button

### `MPPanel.tsx`
Money partner detail panel. Features:
- Full profile editing (contact info, financial terms, asset types)
- Deal log with amounts, property, and return terms
- Communication log with follow-up scheduling
- Availability status toggle (Active / Paused / Deployed)

---

## 11. External Integrations

### Zapier

Zapier can push new leads into the CRM by calling the `/api/properties` endpoint.

**Zapier Action config:**
- Method: `POST`
- URL: `https://adva-crm-two.vercel.app/api/properties`
- Header: `x-api-key: <API_SECRET_KEY>`
- Header: `Content-Type: application/json`
- Body: JSON with `address`, `owner_name`, `phone`, `status`, etc.

Test with curl:
```bash
curl -X POST https://adva-crm-two.vercel.app/api/properties \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_SECRET_KEY>" \
  -d '{"address": "123 Main St", "owner_name": "John Doe", "status": "lead"}'
```

### Google Sheets CSV Import

The CRM can pull leads from a published Google Sheets CSV. Configure the sheet URL in `/settings`. The `syncSheet()` function in `CRMContext` fetches the CSV, auto-detects column headers, and runs `importRows()` to upsert leads (matched by address).

The sheet must be published as CSV: **File → Share → Publish to web → CSV**.

### Google Maps

`MapView` and `GeoView` use the Google Maps JavaScript API to plot lead addresses. Requires `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to be set.

---

## 12. Deployment

The app is deployed on Vercel. Pushes to `main` trigger automatic deployments.

**Production URL:** `https://adva-crm-two.vercel.app`

**Vercel project settings needed:**
- All environment variables from Section 4
- No special build configuration — Vercel auto-detects Next.js

**Build command:** `next build` (Vercel default)
**Output:** `.next/` (Vercel default)

---

## 13. Infrastructure & Maintenance

### Supabase Keep-Alive (Free Tier)

Supabase pauses projects after 7 days of inactivity on the free plan. A Vercel Cron Job prevents this by pinging the database daily.

**Config in `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/keep-alive",
      "schedule": "0 12 * * *"
    }
  ]
}
```

The cron runs every day at **12:00 UTC**. It performs a `SELECT id FROM properties LIMIT 1` query — enough to count as activity for Supabase. The endpoint is secured with `CRON_SECRET` (Vercel passes it automatically as `Authorization: Bearer <secret>`).

To verify it is working, check **Vercel Dashboard → Project → Cron Jobs**.

### Health Check

```bash
curl https://adva-crm-two.vercel.app/api/health
```

Expected response when everything is healthy:
```json
{
  "supabase_url": "https://gqqavajgrzwouduiptlr.supabase.co",
  "has_anon_key": true,
  "has_service_key": true,
  "has_api_secret": true,
  "db_connection": "OK"
}
```

### Adding a New Table

1. Write the `CREATE TABLE` SQL in `supabase/schema.sql`
2. Run it in **Supabase → SQL Editor**
3. Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.<table_name>;`
4. Add the TypeScript interface to `src/types/index.ts`
5. Add API routes under `src/app/api/<resource>/`
6. Add fetch logic to the relevant context (`CRMContext` or `MPContext`)
7. Update `layout.tsx` to fetch the new table's initial data server-side

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in Supabase URL, keys, and Google Maps key

# Run dev server
npm run dev
```

App runs at `http://localhost:3000`.

To set up the database locally, run `supabase/schema.sql` against your Supabase project in the SQL Editor.
