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
14. [Changelog](#14-changelog)
15. [TODO — Planned Features](#15-todo--planned-features)

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
| Database | Supabase (PostgreSQL). RLS is enabled — see [§7 Application Architecture](#7-application-architecture) for why the browser no longer talks to it directly |
| Deployment | Vercel |
| Maps | Google Maps API |
| External integrations | Realeflow via Zapier webhooks, Google Sheets CSV, Repliers (property search), Zillow (research link) |

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
│   │   ├── import/page.tsx
│   │   ├── property-search/page.tsx # Address lookup via Repliers → Add to CRM
│   │   ├── settings/page.tsx
│   │   ├── money-partners/
│   │   │   ├── page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   └── deals/page.tsx
│   │   └── api/
│   │       ├── health/route.ts           # GET — connection health check
│   │       ├── properties/
│   │       │   ├── route.ts              # GET, POST (Realeflow field mapping; also what the UI calls now)
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
│   │       ├── property-search/route.ts  # GET — Repliers address search (see §11)
│   │       ├── enrich/route.ts           # GET — property enrichment (RentCast/API Ninjas)
│   │       ├── notify-zap/route.ts       # POST — fires Zapier notification; UNUSED by the app now
│   │       │                             #   (POST /api/properties and /api/leads call notifyZapier()
│   │       │                             #   server-side directly — kept in case something external
│   │       │                             #   still hits it, but nothing in this codebase calls it)
│   │       ├── stats/route.ts            # GET — aggregated lead counts
│   │       ├── debug-webhook/route.ts    # POST/GET — raw payload inspector (dev tool)
│   │       └── cron/
│   │           └── keep-alive/route.ts   # GET — daily Supabase ping
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── crm/
│   │   │   ├── CRMChrome.tsx        # Nav shell — Import + 🔍 Search tabs
│   │   │   ├── LeadsView.tsx
│   │   │   ├── PropertyCard.tsx     # Photo/price/bd·ba·sqft block when present; owner name removed
│   │   │   ├── PropertyPanel.tsx    # Same listing block + floating Zillow badge; ✦ Enrich button
│   │   │   ├── AddPropertyModal.tsx # Includes manual listing-detail fields (photo/price/beds/baths/sqft)
│   │   │   ├── SkipTraceModal.tsx
│   │   │   ├── ImportView.tsx       # CSV import UI
│   │   │   ├── PropertySearchView.tsx # Address search (Repliers) → Add to CRM
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
│   │   ├── CRMContext.tsx           # All reads/writes via fetch() to /api/* — see §7/§9
│   │   └── MPContext.tsx            # Same pattern for money_partners
│   ├── lib/
│   │   ├── supabase-server.ts       # Service-role client — the ONLY Supabase client in the app now
│   │   ├── api-auth.ts
│   │   ├── notify-zap.ts            # Shared Zapier notification utility
│   │   ├── utils.ts                 # fmt helpers, CSV import helpers, zillowUrl()
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
| `REPLIERS_API_KEY` | Optional | Repliers property search (`/property-search`, `/api/property-search`) — see [§11](#11-external-integrations) |
| `GROQ_API_KEY` | Planned, not yet in use | Free-tier Groq API key for AI HUD lead triage — see [TODO 9](#15-todo--planned-features). Server-only — never give this the `NEXT_PUBLIC_` prefix; in Vercel it's a **Secret**, not Config (unlike the Maps key — it's never used client-side) |
| `WEBHOOK_SECRET` | Optional | Validates incoming webhook payloads |
| `ZAP_INBOUND_URL` | Optional | Zapier catch hook URL for outbound CRM notifications |

> **Note on enrichment API:** `RENTCAST_API_KEY` requires a credit card even on the free tier. A replacement using API Ninjas (no CC required, 10K calls/month free) is planned — see [TODO](#15-todo--planned-features).

> **Note on `API_SECRET_KEY`:** the browser UI now calls these same `/api/*` routes directly (see [§7](#7-application-architecture)) and does **not** send `x-api-key`. If this is set in Vercel, the UI will start getting `401`s from every route except `/api/enrich` and `/api/property-search` (neither checks the key). **Unset locally; production value unconfirmed as of this writing** — check before ever setting it in Vercel.

---

## 5. Database Schema

All tables live in the `public` schema on Supabase (PostgreSQL). Row Level Security is enabled on all four tables — the anon key cannot read or write them; the app never uses the anon key for *data* access (see [§7](#7-application-architecture)). The anon key **is** now used in the browser for one narrow purpose — Supabase Auth session management (`lib/supabase-browser.ts`) — which is unrelated to RLS on these four tables; auth has its own internal schema. All four CRM tables are also added to the `supabase_realtime` publication at the DB level, but nothing in the app currently subscribes to it — the browser polls instead (same reason: RLS blocks Realtime broadcast to the anon role).

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
| `image_url` | text | Listing photo — set by Property Search (Repliers) or manual entry |
| `beds` | integer | |
| `baths` | numeric | Supports halves (e.g. `2.5`) |
| `sqft` | integer | |
| `list_price` | numeric | Drives the bold price line on the card/panel |

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

These routes serve two audiences now, not just Zapier: the browser app itself calls them directly for every read and write (`CRMContext`/`MPContext` — see [§7](#7-application-architecture)), since talking to Supabase straight from the browser no longer works under RLS.

### Authentication

Routes check `x-api-key` header against `API_SECRET_KEY`. If unset, all requests are allowed (dev mode) — **this is the mode the browser UI currently depends on**, since it doesn't send the header (see the note in [§4](#4-environment-variables)). A few routes never check the key at all, key set or not: `GET /api/enrich`, `GET /api/property-search`, `POST /api/notify-zap`, `GET /api/stats`, and `DELETE /api/partners/[id]` (that last one looks like an oversight, not a deliberate choice — every other `partners` route does check).

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
All properties, newest first. Called directly by `CRMContext.loadAll()` — this is how the browser gets its data now.

#### `POST /api/properties`
Creates a new property. Handles Realeflow field format — assembles `address` from separate `street`, `city`, `state`, `zipCode` fields. Strips unknown columns before inserting (whitelist includes `image_url`, `beds`, `baths`, `sqft`, `list_price` as of the Property Search feature). Fires Zapier notification unless `x-source: zapier` header is present. `followups`/`docs` default to `[]` but respect caller-supplied arrays (needed by `saveNoteAsNew`, which seeds a followup on creation — external/Zapier payloads never send these, so their behavior is unchanged).

**Required:** at least one address field (`address`, `street`, `city`, etc.)

Also called directly by the UI now (`CRMContext.saveProperty` with no `id`) — the server-side Zapier notification above covers UI-created leads too; the context does not separately ping `/api/notify-zap`.

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

> **Current status:** RentCast key is configured locally but not active (requires CC). Pending swap to API Ninjas — see [TODO](#15-todo--planned-features).

---

### Property Search (Repliers)

#### `GET /api/property-search?q=<address>`
Free-text address search against Repliers' live listings API, normalized to a flat shape (address, beds, baths, sqft, year built, list price, estimated value, photo). Powers `/property-search`'s search bar and its "Add to CRM" button, which maps the result straight into `image_url`/`beds`/`baths`/`sqft`/`list_price` on create.

Returns `503` if `REPLIERS_API_KEY` is not configured, `422` if `q` is missing/blank.

> **Sample data notice:** as of this writing, the configured Repliers key is a trial/demo key — results include `**** SAMPLE DATA ****` in the listing description. It's a real, working integration; it just isn't pulling live MLS data until the Repliers account is upgraded. No code changes needed when that happens.

Repliers quirk worth knowing if you touch this route: their API returns `sqft`/`yearBuilt` as numeric *strings* while `numBedrooms`/`numBathrooms` are real numbers — the route coerces both with a `toNum()` helper rather than a `typeof === 'number'` check, which would silently drop the string fields.

---

### Zapier Notification

#### `POST /api/notify-zap`
Fires a POST to `ZAP_INBOUND_URL`. **Not called by anything in this codebase anymore** — `POST /api/properties` and `POST /api/leads` both call the shared `notifyZapier()` function server-side directly instead of hitting this route over HTTP. Left in place in case an external caller still depends on it; safe to remove if not.

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

### ⚠️ History: the browser used to talk to Supabase directly — don't bring that back

Earlier versions of this app had `CRMContext`/`MPContext` call Supabase's **anon-key** client directly from the browser for every read, write, and Realtime subscription (`lib/supabase.ts`, now deleted). At some point Row Level Security was enabled on all four tables with no policies granting the anon role access. The result: anon `SELECT` silently returned empty arrays (not an error — RLS just filters rows out), anon `INSERT`/`UPDATE`/`DELETE` returned `401`s that the code never checked (`supabase.insert(...)` result was destructured without looking at `.error`), and an anon-subscribed Realtime channel received **zero** `postgres_changes` events. The only thing that ever showed real data was `layout.tsx`'s initial server-render, which uses the service-role key. Every save/delete/follow-up/deal-log button in the app was a silent no-op until this was found and fixed.

**Current architecture avoids this entirely: the browser has no Supabase client at all.** `src/lib/supabase.ts` was deleted. `CRMContext` and `MPContext` do every read and write through `/api/*` routes (service role, server-side, bypasses RLS by design), and poll every 20s instead of subscribing to Realtime (which would hit the same RLS wall). **If you ever find yourself importing `@supabase/supabase-js` directly into a client component, stop — route it through an API route instead.**

### Data Flow

```
Browser Request
      │
      ▼
middleware.ts — refreshes the Supabase session cookie on every request;
                redirects to /login if no session and the path isn't public
      │
      ▼
Next.js App Router
      │
      ├─ (app)/layout.tsx (server, force-dynamic)
      │       │  redirect('/login') if no user (createAuthServerClient)
      │       │  fetches all CRM data via serverSupabase()
      │       ▼
      │   AppShell → CRMProvider + MPProvider
      │       │  fetch() to /api/* for every read/write; 20s poll (no Realtime — see above)
      │       ▼
      │   Page Components → Context consumers
      │
      ├─ / (landing page, public) and /login (public) — outside the (app) group,
      │       no data fetch, minimal root layout.tsx
      │
      └─ /api/* routes
              │  checkApiKey() → serverSupabase()
              └─ JSON responses
              (called by BOTH external integrations below AND the browser UI itself —
               NOT session-gated, see "Known gap" below)

External lead flow:
  Realeflow (Deal Surge)
      → Zapier trigger (New Property)
      → POST /api/leads
      → Supabase insert (service role)
      → next poll cycle picks it up in any open browser (≤20s)
```

### Authentication (Supabase Auth)

Email/password auth via Supabase Auth, cookie-based sessions (not localStorage), so the server and browser see the same session. Built for a small team sharing one CRM dataset — there's no per-row ownership or multi-tenant split; anyone with an account sees everything, same as before auth existed.

- **`src/middleware.ts`** — refreshes the session cookie on every request (`supabase.auth.getUser()` inside the `setAll` cookie callback) and redirects unauthenticated requests for any non-public page to `/?redirectTo=<path>` — the landing page, not `/login` directly (see [§8](#8-pages--routes) for the full flow). Public paths: `/`, `/login`, `/about`, `/services`. Already-authenticated visits to `/login` bounce to `/leads`. This same middleware still applies CORS headers to `/api/*` exactly as before — that logic is unchanged, just living alongside the new auth check in one file.
- **`src/app/(app)/layout.tsx`** — the actual data-access gate. Calls `createAuthServerClient().auth.getUser()` and `redirect('/login')` server-side if there's no user, *before* fetching any CRM data. Middleware's redirect is a routing nicety; this is the check that actually matters, since it runs right before the Supabase queries.
- **Sign in**: `src/app/login/page.tsx`, a client component using `supabase.auth.signInWithPassword()`. Uses a full `window.location.href` navigation on success (not `router.push`) so middleware re-runs with the fresh cookie and the server-rendered `(app)/layout.tsx` sees the session on the very next request — a client-side route change raced ahead of the cookie write in testing.
- **Sign out**: `src/components/SignOutButton.tsx`, shared by both `CRMChrome` and `MPChrome` headers. Calls `supabase.auth.signOut()` then a full navigation to `/login`.
- **Creating team members**: there's no self-serve signup — add users from the Supabase dashboard (Authentication → Users → Add user) or via `supabase.auth.admin.createUser()` with the service-role key. This matches the "me + a small team" scope; nothing here assumes self-serve signup.

#### ⚠️ Known gap: `/api/*` routes are not session-gated

Only page routes (`/leads`, `/map`, etc.) are protected by the auth check above. The `/api/*` routes still rely solely on the pre-existing `checkApiKey()` (`x-api-key` header vs. `API_SECRET_KEY`), which is a no-op if `API_SECRET_KEY` is unset — currently the case locally. This was a deliberate scope decision, not an oversight: Zapier's calls to `/api/leads` and the browser UI's own calls to `/api/properties` etc. have no user session at all (Zapier never logs in; the UI's fetches don't carry one either), so blanket-gating `/api/*` behind `auth.getUser()` would break both. If API-level access control is needed later, it should be a deliberate follow-up (e.g. set `API_SECRET_KEY` in production, or add a session check only to the routes the browser UI calls while leaving the Zapier-facing ones keyed) — not something to bolt on casually.

### Rendering

`(app)/layout.tsx` exports `export const dynamic = 'force-dynamic'` — disables Next.js static caching so every authenticated page load fetches fresh data from Supabase. The root `layout.tsx` and the landing page (`/`) are plain static/server-rendered — no data fetch, nothing to invalidate.

### Supabase Client Split

| File | Key | Used in |
|---|---|---|
| `lib/supabase-server.ts` | Service role key | API routes, `(app)/layout.tsx` (server component) — all actual CRM data access |
| `lib/supabase-browser.ts` | Anon key, cookie-based | Client components — auth only (`signInWithPassword`, `signOut`) |
| `lib/supabase-auth-server.ts` | Anon key, cookie-based | Server components / route handlers — auth only (`auth.getUser()`), used by `middleware.ts` and `(app)/layout.tsx` |

The anon-key clients exist **only** to answer "who is logged in" — never for querying properties/buyers/partners/etc. That data access stays entirely behind `/api/*` routes using the service-role client, same as before auth was added. Routing CRM data queries through the anon-key client would hit the same RLS wall described above.

---

## 8. Pages & Routes

### Public

| Route | Component | Description |
|---|---|---|
| `/` | `app/page.tsx` | Public marketing landing page — hero, product preview, features, "Sign in" CTA. Where every unauthenticated visitor lands (see below) and where sign-out returns to |
| `/about` | `app/about/page.tsx` | About Us |
| `/services` | `app/services/page.tsx` | Full services/features list — same `FEATURES` data as the landing page, via `lib/marketing-content.ts` |
| `/login` | `app/login/page.tsx` | Email/password sign-in form |

**Unauthenticated-visitor flow**: middleware redirects a logged-out visit to any protected page to `/?redirectTo=<path>` — the *landing page*, not straight to `/login`. The landing page's own "Sign in" links (nav + both CTAs) forward that `redirectTo` into `/login?redirectTo=<path>`, so the user still ends up back where they meant to go after signing in. `SignOutButton` also returns to `/` rather than `/login`. `MarketingNav`/`MarketingFooter` (`src/components/marketing/`) are shared across `/`, `/about`, and `/services`.

### CRM Module

All routes below live under the `(app)` route group (`src/app/(app)/...` — the parens don't add a URL segment) and require a signed-in session; `(app)/layout.tsx` redirects to `/login` otherwise.

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
| `/property-search` | `PropertySearchView` | Search an address via Repliers, Add to CRM |
| `/settings` | `SettingsView` | Sender info, Google Sheets sync, letter templates |

### Money Partners Module

| Route | Description |
|---|---|
| `/money-partners` | Financing partner list + detail panel |
| `/money-partners/pipeline` | Deal pipeline view |
| `/money-partners/deals` | All logged deals |

---

## 9. State Management

Both contexts follow the same pattern: every mutation calls the matching `/api/*` route via `fetch()`, then calls `loadAll()` to refresh state from the server — there's no local optimistic-update logic. A shared `jsonOrThrow()` helper in each context throws with the server's actual error message when a request fails, instead of the old behavior of silently resolving as if nothing happened (that silence is exactly what let the RLS breakage in [§7](#7-application-architecture) go unnoticed for a while — don't reintroduce it).

### CRMContext (`src/contexts/CRMContext.tsx`)

**State:** `properties`, `partners`, `buyers`, `syncStatus`, `syncLabel`, `sender`, `gsUrl`

**Key mutations:**

| Method | Description |
|---|---|
| `saveProperty(data, id?)` | `POST`/`PATCH /api/properties` — create or update. Server-side Zapier notification happens inside that route on create; the context does not separately call `/api/notify-zap`. Throws on failure. |
| `deleteProperty(id)` | `DELETE /api/properties/[id]` |
| `logFollowup(id, date, note, next?)` | Reads current `followups` from local state, appends, `PATCH`es the full array |
| `deleteFU(id, idx)` | Same read-modify-write pattern, splices instead of appends |
| `uploadDocs(id, files)` | Metadata only (`name`/`size`/`date`) — no actual file upload/storage |
| `deleteDoc(id, idx)` | |
| `saveSkipTrace(id, ...)` | |
| `savePartner / deletePartner` | Partner CRUD via `/api/partners[/id]` |
| `saveBuyer / deleteBuyer` | Buyer CRUD via `/api/buyers[/id]` |
| `importRows(headers, rows)` | Bulk CSV import using `assembleAddress()` — one `/api/properties` request per row (not batched) |
| `syncSheet()` | Fetch Google Sheets CSV and import |
| `generateLetter / printLetterFn` | Letter generation and print |

**Sync:** polls `GET /api/properties` + `/api/partners` + `/api/buyers` every 20s (`POLL_MS` in the file), plus immediately after every mutation. No Realtime — see [§7](#7-application-architecture) for why.

### MPContext (`src/contexts/MPContext.tsx`)

**State:** `partners` (MoneyPartner[]), sync status

**Key mutations:** `savePartner`, `deletePartner`, `logDeal`, `deleteDeal`, `logComm`, `deleteComm` — all via `/api/money-partners[/id]`, same read-modify-write-then-PATCH pattern for the `deals`/`comm_log` jsonb arrays. Same 20s polling, no Realtime.

---

## 10. Key Components

### `PropertySearchView.tsx`

`/property-search`'s page component — search bar, result cards, "Add to CRM" per result.
1. `GET /api/property-search?q=<address>` (debounced only by the Search button / Enter key, not live-as-you-type)
2. Results render as cards: photo, propertyType/status badges, bd/ba/sqft, list price, estimated value
3. **Add to CRM** → `saveProperty()` with `address`, `notes` (`MLS# ... | beds, baths, sqft, built, list, est. value`), `status: 'lead'`, and the structured `image_url`/`list_price`/`beds`/`baths`/`sqft` fields
4. Treats a falsy/missing id back from `saveProperty` as a failed save (not a success) and shows an inline error — this is the defensive check that exists specifically because of the RLS incident in [§7](#7-application-architecture)

### `PropertyCard.tsx` / `PropertyPanel.tsx` — listing details block

Both components compute `hasListingData = !!(image_url || list_price != null || beds/baths/sqft present)`. When true: photo (or a neutral placeholder if no `image_url`) → bold price → `4 bd · 3 ba · 2,000 sqft` stats line, above the address. When false (most leads that didn't come through Property Search or manual entry): renders exactly as it did before this existed — no empty placeholder photos cluttering a card that's just a phone-and-notes lead.

Owner name was removed from the compact card (`PropertyCard`) — phone moved into the small icon meta row at the bottom instead. `PropertyPanel`'s existing "Owner Contact" section is unchanged.

**Zillow badge** (`PropertyPanel` only): oval pill, Zillow's brand blue (`#006AFF`, `.zillow-badge` / `.zillow-badge-float` in `globals.css`), floats over the bottom-right corner of the photo when one exists, otherwise sits inline in its own row. Links via `zillowUrl(address)` from `lib/utils.ts` — `zillow.com/homes/<address>_rb/`, a long-standing but *unofficial* Zillow search URL pattern (no public Zillow API exists for this). Unusual address formatting (unit numbers, abbreviations) can land on a results list instead of the exact property.

### `ImportView.tsx`

Three-stage CSV import flow:
1. **Upload** — drag & drop, accepts `.csv`, `.tsv`, `.txt`
2. **Preview** — shows first 5 rows, editable column mapping dropdowns, assembled address preview
3. **Done** — added / updated / skipped counts, link to leads

Supports county export formats: comma, tab, semicolon, pipe delimited. Recognizes county-specific headers: `situs`, `grantor`, `taxpayer`, `lis pendens`, `trustee sale`, `case filed`. Column matching (`detectColMap` in `lib/utils.ts`) uses word-boundary regex, not raw substring `.includes()` — a bare `.includes()` check against the short `'st'` synonym for the `state` field used to match inside `street` or `last name` and steal the column before the real `State` header was ever checked.

### `PropertyPanel.tsx` — ✦ Enrich button

- Calls `GET /api/enrich?address=<address>`
- Shows blue card: owner name, estimated value, equity, beds/baths/sqft, year built, last sale, estimated rent
- **Save to property** fills `owner_name` (if empty) and appends `[Property Data]` block to notes — note this is a *different* data path from the Property Search listing-details block above (this one only ever writes to `notes`, never to the structured `beds`/`baths`/`sqft`/`list_price` columns)
- Gracefully shows error if enrichment API key not configured

### `CRMChrome.tsx`

Nav tabs: All Leads, Follow-up, Events, Map, Geo, Partners, Letters, Buyers, Import, **🔍 Search**, Settings.

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

### Property Search (Repliers)

`GET /api/property-search?address=` calls `GET https://api.repliers.io/listings?search=<q>&fields=...` with a `REPLIERS-API-KEY` header. Base URL and auth header aren't documented anywhere obvious on their docs site (confirmed by hitting the API directly) — `https://api.repliers.io`, header name `REPLIERS-API-KEY`. No sandbox/demo key exists; your own key is provisioned when the account is created. See [§6](#6-api-reference) for the sample-data caveat and the string-vs-number field quirk. Listing photos are served from `https://cdn.repliers.io/<path>` — the `images[]` array in their response gives relative paths, prefix with that CDN host.

### Zillow (research link)

No public API. `zillowUrl()` in `lib/utils.ts` builds `https://www.zillow.com/homes/<encoded address>_rb/` — Zillow's own site-search URL pattern, used unofficially (not guaranteed stable, no SLA). Curl-testing this pattern returns a `403` due to Zillow's bot detection blocking non-browser requests — that's expected and doesn't indicate the link is broken for a real person clicking it in an actual browser. Redfin and Realtor.com were considered and rejected for the same treatment: neither has an address-to-listing URL pattern that doesn't require hitting a non-public internal API first.

### Groq (AI, planned — see TODO 9)

**Not built yet** — this section documents the provider choice so the build in [TODO 9](#15-todo--planned-features) needs no re-research.

Chosen specifically because this project has **no budget for paid AI APIs**. Checked three options before picking this one (checked live, not from memory — see the conversation that led to this entry):

| Provider | Credit card? | Free limits | Verdict |
|---|---|---|---|
| **Groq** | Never required for the free tier (optional, only to raise limits) | `llama-3.3-70b-versatile`: 30 req/min, **1,000 req/day** · `llama-3.1-8b-instant`: 30 req/min, 14,400 req/day | **Chosen** |
| Google Gemini | Not required | Varies by model, as low as ~20 req/day on some current Flash tiers — got much stingier than its reputation suggests | Too thin to build on |
| Anthropic (Claude API) | Not required for the trial, but phone verification is | One-time ~$5 credit, **expires ~14 days after claiming** | Not an ongoing free tier — a trial |

- Base URL: `https://api.groq.com/openai/v1/chat/completions` — OpenAI-compatible request/response shape.
- Auth: `Authorization: Bearer $GROQ_API_KEY` header.
- No official Anthropic/Groq SDK needed — a plain `fetch()` wrapper is enough (same lightweight-integration pattern already used for Repliers/HUD/RentCast in this codebase). Confirm the exact current model ID at build time (`llama-3.3-70b-versatile` as of this writing) — Groq's catalog changes.
- Known limits to design around: free-tier rate limits apply per organization, not per key — creating more keys doesn't raise the ceiling. Daily quota resets at midnight UTC. No SLA — treat every Tier-3 AI feature as optional/best-effort in the UI (clear loading/error states, never block a core CRM action on it), not something the app depends on to function.
- Quality tradeoff, stated plainly: Llama 3.3 70B is noticeably behind Claude on nuanced reasoning. Fine for classification/ranking tasks (TODO 9). **Do not** use it for anything with real financial-estimation stakes (e.g. an ARV/repair-cost/MAO assistant) without the user explicitly accepting that tradeoff first — a wrong number there has real consequences.

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

**Database setup:** Run `supabase/schema.sql` once in Supabase → SQL Editor. The whole file is safe to re-run on an existing database (every statement is idempotent) — see [§13](#13-infrastructure--maintenance) for the gotcha that made this not true until recently.

**PR preview deployments:** Vercel auto-builds a preview for every PR/branch pushed to GitHub, but on this Vercel team they're behind Vercel's SSO/authentication protection — a tool or CI process without a logged-in Vercel session gets redirected to `vercel.com/sso-api` rather than the app (`302`, not a real response). Only verifiable by someone logged into the Vercel account opening the Preview link directly.

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

### Adding a New Column

1. Add it to the relevant `CREATE TABLE` in `supabase/schema.sql` (for fresh installs) **and** as an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` in the migration block further down (for existing deployments — `CREATE TABLE IF NOT EXISTS` does nothing to a table that already exists)
2. Run just that `ALTER TABLE` statement in Supabase → SQL Editor (or the whole file — see the idempotency note below)
3. Add it to the TypeScript interface in `src/types/index.ts`
4. If it should be insertable via `POST /api/<resource>`, add it to that route's whitelist (`/api/leads` and `/api/properties` both build an explicit `row = {...}` object — unlisted fields are silently dropped, not errored)
5. `PATCH /api/<resource>/[id]` is generic (`.update(await req.json())`) on every resource — no whitelist to update there

> **Idempotency gotcha (bit us once):** Supabase's SQL editor runs a multi-statement paste as one transaction. `ALTER PUBLICATION ... ADD TABLE` has no `IF NOT EXISTS` in Postgres, so re-running `schema.sql` on a DB that already has its tables publicized (i.e. every time after first setup) throws `42710 duplicate_object` on those lines — and rolls back everything earlier in the same paste, including new column additions that would otherwise have succeeded. Fixed by wrapping each `ALTER PUBLICATION` in a `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` block. Keep that pattern for anything else in this file that isn't naturally idempotent.

### Adding a New Table

1. Write `CREATE TABLE` SQL in `supabase/schema.sql`
2. Run in Supabase → SQL Editor
3. Enable realtime at the DB level: `ALTER PUBLICATION supabase_realtime ADD TABLE public.<name>;` (wrapped in the `DO`/`EXCEPTION` pattern above) — note the app doesn't currently consume Realtime (see [§7](#7-application-architecture)), so this is optional unless/until that changes
4. Add TypeScript interface to `src/types/index.ts`
5. Add API routes under `src/app/api/<resource>/` (`GET`/`POST` in `route.ts`, `PATCH`/`DELETE` in `[id]/route.ts`, `checkApiKey()` first in each — see [§6](#6-api-reference))
6. Add fetch-based read/write methods to the relevant context (`CRMContext`/`MPContext`) calling those routes — **not** a direct Supabase client call (see [§7](#7-application-architecture) for why)
7. Update `layout.tsx` to fetch initial data server-side via `serverSupabase()`

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

## 14. Changelog

Notable shipped work, newest first. Not every commit — just things worth a future reader knowing happened.

### 2026-10-28 — Dark animated hero on the landing page

Replaced the landing page's hero section (badge/headline/CTAs only — everything below it, and `/about`/`/services`, are unchanged and stay the existing light/orange theme) with a dark, animated-gradient hero: `src/components/marketing/Hero.tsx`.

- Near-black background (`#090D10`) with layered teal/coral radial glows and a faint grid, all in a `pointer-events-none` decorative layer behind the nav and content.
- Oversized "PIPELINE" headline (Montserrat 900, `clamp()`-sized) with a continuously moving white→teal gradient via `background-clip: text` + a CSS `@keyframes` animation — letters never move, only the color band traveling through them. Respects `prefers-reduced-motion` (animation stops, shows a static mid-gradient frame) and has a plain-color fallback under `@supports not (background-clip: text)`.
- `MarketingNav` gained a `variant="dark"` prop (used only here) so `/about`/`/services` keep the original light nav — one component, not a forked copy.
- All CSS tokens (colors, grid size, animation duration) live under a scoped `.hero-dark { --hero-*: ... }` block in `globals.css`, not global `:root`, so they can't leak into the rest of the site's styling.
- No promotional sticky-note annotation — there's no real current promo to show, so it was left out rather than inventing one (there's a comment in `Hero.tsx` showing how to add one later if that changes).
- Verified at 375/768/1024/1440px (no horizontal overflow at any width), reduced-motion, keyboard focus visibility, single-`h1` check, zero console errors, and the full login/redirectTo/sign-out flow still working through the new hero's CTAs — all via Playwright.

### 2026-10-28 — Logged-out visitors land on the marketing page; About/Services pages; redesigned nav

Follow-up to the auth work below, same day. Three changes:
- Unauthenticated visits to any protected page now redirect to `/?redirectTo=<path>` (the landing page) instead of straight to `/login` — the landing page's own "Sign in" links forward `redirectTo` into `/login`. `SignOutButton` returns to `/` instead of `/login` too.
- New `/about` and `/services` pages; `MarketingNav`/`MarketingFooter` (`src/components/marketing/`) shared across all three public pages. Nav order: About Us, Services, Sign in.
- Shared feature copy pulled into `src/lib/marketing-content.ts` so the landing page's feature grid and `/services`'s full list can't drift apart.

### 2026-10-28 — Supabase Auth (email/password) + public landing page

- **Auth**: Supabase Auth, email/password, cookie-based sessions via `@supabase/ssr`. No self-serve signup — team members are added from the Supabase dashboard or via the admin API. See [§7 → Authentication](#7-application-architecture) for the full architecture and the known `/api/*` gating gap.
- **Route restructuring**: all ~15 CRM/Money-Partners pages moved into a new `(app)` route group so they share one auth-gated layout; URLs are unchanged (route groups don't add a path segment). `layout.tsx` at the root is now a bare html/body shell — the data-fetch + `AppShell` logic that used to live there moved to `(app)/layout.tsx`, with a `redirect('/login')` added ahead of the Supabase queries.
- **Landing page** (`/`) and **login page** (`/login`): new public routes outside the `(app)` group. Landing page is static marketing copy describing the features actually built (lead pipeline, map/property lookup, HUD REO leads, money partners, AI triage, AI assistant) with a sign-in CTA.
- **`src/middleware.ts`**: extended from CORS-only (`/api/*`) to also refresh the Supabase session cookie and redirect unauthenticated page requests to `/login`. CORS behavior for `/api/*` (used by Zapier) is unchanged — verified with `curl` after the change.
- Verified end-to-end with Playwright against a real Supabase test user (created/deleted via the admin API): logged-out redirect, bad-password error, real sign-in, authenticated `/login` bounce to `/leads`, sign-out, and post-sign-out re-redirect all confirmed working. `/api/leads` OPTIONS/GET and its CORS headers confirmed unaffected.

### 2026-10-27 — AI HUD triage planned (not built) — Groq chosen over paid providers

Planning only, no code: this project has no budget for a paid AI API. Checked Groq, Google Gemini, and the Anthropic API's trial credit live (current numbers, not assumed) before picking Groq's free tier — see [TODO 9](#15-todo--planned-features) for the full spec and [§11](#11-external-integrations) for the provider comparison. Fully specified so building it is mechanical once a `GROQ_API_KEY` exists: exact files, request shape, batching math against the free-tier daily limit, prompt design, and what's explicitly out of scope (no ARV/underwriting assistant on a free model, no call transcription — different task entirely).

### 2026-10-25 — Property Search (Repliers), MLS listing details, Zillow badge, critical RLS fix

- **Property Search** (`/property-search`, `GET /api/property-search`): address search via Repliers → "Add to CRM". Chose a direct REST integration over MCP — MCP is for an LLM deciding which tool to call mid-conversation, not the right layer for a deterministic search-bar feature.
- **MLS listing details on card/panel**: new `image_url`/`beds`/`baths`/`sqft`/`list_price` columns, populated by Property Search or manual entry. Card/panel degrade gracefully when absent (most existing leads).
- **Zillow research badge**: floating oval badge on `PropertyPanel`, Zillow's brand blue, links to `zillow.com/homes/<address>_rb/`.
- **Critical fix — RLS silently broke all CRM reads/writes/Realtime**: see [§7](#7-application-architecture) for the full writeup. Found while verifying the Property Search "Add to CRM" button; turned out to affect the entire app, not just the new feature. Fixed by moving `CRMContext`/`MPContext` off the anon Supabase client entirely, onto the existing `/api/*` routes (service role), with 20s polling replacing the dead Realtime subscription.
- **`schema.sql` idempotency fix**: see [§13](#13-infrastructure--maintenance) — the file wasn't safely re-runnable; it is now.
- **CSV import column-mapping fix**: `detectColMap`'s `'st'` synonym for `state` was substring-matching inside `street`/`last name` via raw `.includes()`, stealing the column before the real `State` header was checked. Switched to word-boundary regex matching.

---

## 15. TODO — Planned Features

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
- **HUD REO listings** — done, see `/hud-leads` and [§11](#11-external-integrations). Note: this TODO item's original text claimed a "`hudgov` API" — that was wrong/vague; the real thing is HUD's own ArcGIS FeatureServer (`src/lib/hud-reo.ts`), confirmed and documented when this was built.
- **Fannie Mae HomePath** — still open. The listing site is live, but no official API exists for it — would mean scraping their commercial site, more fragile and more ToS risk than HUD's `.gov` open-data portal. Deprioritized; not started.
- **Tax delinquent lists** — still open, genuinely no single source — county-by-county, most publish their own CSV. `/import` already handles this with zero new code: download a county's roll, upload it there.
- **Driving for Dollars** — covered by TODO 2 (mobile quick-add), not started.

---

### TODO 9 — AI HUD Lead Triage via Groq (free tier)

**Status: fully specified, zero code written.** Decided and researched in-session (budget constraint ruled out a paid AI provider — see the Groq writeup in [§11](#11-external-integrations) for why Groq specifically, with real current free-tier numbers for all three providers considered). This entry has everything needed to build it in one sitting with no re-research — follow it in order.

**Why:** `/hud-leads` (built, see [§10](#10-key-components)) shows all ~600+ current HUD REO listings nationwide as a flat browsable table with manual "Add to CRM" per row — no ranking, no filtering against what the user actually buys. This adds a "🤖 Rank by Buyer Fit" button that scores every visible listing against the user's actual buyer criteria (the `buyers` table — price range, areas, property types already in the schema) and sorts the table by fit, so the user isn't manually scanning 600 rows.

**Step 0 — prerequisite (do this first, before any code):**
1. Sign up at [console.groq.com](https://console.groq.com) — free, no credit card.
2. Create an API key, add `GROQ_API_KEY` to `.env.local`.
3. Confirm the current model ID — this doc assumes `llama-3.3-70b-versatile` as of 2026-10-27, but Groq's catalog changes; check [console.groq.com](https://console.groq.com) for the current best free-tier model before writing the request code, and update this doc if it's changed.
4. Later, add `GROQ_API_KEY` to Vercel as a **Secret** (not Config — it's server-only, never sent to the browser; see [§4](#4-environment-variables)).

**Files to create:**

| File | Responsibility |
|---|---|
| `src/lib/groq.ts` | Thin `fetch()` wrapper around Groq's chat completions endpoint. No SDK dependency — same lightweight pattern as `lib/hud-reo.ts`. One exported function, e.g. `rankHudListings(listings, buyerCriteria): Promise<{caseNum: string, score: number, reason: string}[]>`. |
| `src/app/api/hud-triage/route.ts` | `POST` handler. Server-side only (needs `GROQ_API_KEY`, never exposed to the browser). Fetches current buyers via `serverSupabase()`, receives the listings to score in the request body (the client already has them loaded from `GET /api/hud-listings` — don't re-fetch HUD server-side, just pass through what the browser already has), calls `rankHudListings()`, returns the scored array. Gate with `checkApiKey()` like the other UI-facing routes. |
| `src/components/crm/HudLeadsView.tsx` (edit, not new) | Add the "🤖 Rank by Buyer Fit" button, a `scores: Record<caseNum, {score, reason}>` state, a new sortable "Match" column, and a loading/error state for the triage call. |

**Request shape (Groq, OpenAI-compatible):**
```
POST https://api.groq.com/openai/v1/chat/completions
Authorization: Bearer $GROQ_API_KEY
Content-Type: application/json

{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    { "role": "system", "content": "<prompt — see below>" },
    { "role": "user", "content": "<JSON array of listings + buyer criteria>" }
  ],
  "response_format": { "type": "json_object" }
}
```
Confirm `response_format: {type: "json_object"}` (OpenAI's JSON-mode convention) is actually honored by Groq's endpoint at build time — it's an OpenAI-compatible API, but compatibility coverage varies by provider; if unsupported, fall back to instructing strict JSON in the system prompt and parsing defensively (the way `src/lib/hud-reo.ts` already parses an external API's response shape).

**Prompt design:** system prompt should state the buyer criteria (price range, target areas/states, property types from the `buyers` table — if there are multiple buyers, pass all of them and ask for a best-fit score against any) and ask for a JSON object mapping each listing's `caseNum` to `{score: 0-100, reason: "<one short sentence>"}`. Give the model the address/city/state/zip/case number for each listing — no price/beds/baths available (HUD's data doesn't have those, see [§6](#6-api-reference)), so scoring is necessarily based on location match + whatever's in the case metadata, not property specifics. Say this limitation plainly in the system prompt so the model doesn't fabricate property details it wasn't given.

**Batching — stay well inside the free tier:**
- ~600 listings ÷ ~40 per request ≈ 15 requests per full triage run. The 70B model's free tier allows 1,000 requests/day — a user could run a full triage ~65 times a day before hitting the ceiling. No special rate-limit handling needed beyond a clear error message on a 429 (Groq returns standard HTTP 429 on rate-limit); don't build a retry/queue system for this — it's unnecessary complexity for headroom this large.
- Send the whole batch's listings as a single JSON user-message, not 40 separate messages — keeps it to one request per batch of ~40, not one request per listing (which would be 600 requests, still under the daily cap but pointlessly chatty and slower for the user).

**UI integration — `HudLeadsView.tsx`:**
- Button triggers `POST /api/hud-triage` with the currently-filtered `listings` array (respect the existing state/search filters already in that component — don't re-score everything if the user has already narrowed it down).
- On response, store scores keyed by `caseNum`, add a "Match" column showing the score + a tooltip/expandable reason, default-sort the table by score descending once triage has run.
- Loading state while the batched requests run (this will take several seconds for ~15 sequential/parallel requests — show progress if straightforward, but a simple spinner is fine for a first version).
- Error state: show Groq's error message plainly (e.g. rate limit, auth failure) — don't silently fail. This is a Tier-3/optional feature; the existing "Add to CRM" flow must keep working even if triage errors out entirely.

**Explicitly out of scope for this TODO** (don't scope-creep into these while building it):
- No ARV/repair-cost/MAO assistant — flagged in [§11](#11-external-integrations) as a bad fit for a free/smaller model given the financial stakes; a separate decision if ever built.
- No call transcription — that's a speech-to-text task (Whisper-class models), not a Groq chat-completion task; different tooling entirely, not covered by this TODO even though Groq also happens to host Whisper.
- No persistence of scores — this is a live, on-demand triage each time the button is clicked, consistent with `/hud-leads` already being read-only/non-cached by design (see [§10](#10-key-components)). Don't add a database table for this without being asked.

**Verification plan for whoever builds this** (same discipline as everything else in this doc — see [§7](#7-application-architecture) and the Changelog): once `GROQ_API_KEY` is set, test the real Groq endpoint directly with `curl` first to confirm the request/response shape before wiring up the route (same approach used to verify Repliers/HUD in this codebase). Then drive the actual button click in a real browser — a `curl`-only check of the API route would miss whether the UI's loading/error/sort states actually work.

---

*Last updated: 2026-10-27*
