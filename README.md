# ADVA Leads CRM

> ⏸ **Paused 2026-11-02** — this project is on hold while the team transitions to a new project. Production (`adva-crm.vercel.app`) is currently **down** (500 on every page — missing Vercel environment variables). Before doing anything else, read **[TECHNICAL.md § Project Status](./TECHNICAL.md#-project-status-paused-2026-11-02--read-this-first-if-resuming)** — it has the full pickup checklist, the production fix, and an important note about this project living in two GitHub repos (`Luganda1/adva-crm` and `nancyonrei/adva-crm`) that need to stay in sync.

A full-stack real estate lead management app for wholesalers and investors — track distressed property leads (probate, foreclosure, auction), manage follow-ups, coordinate buyer networks, and maintain a roster of financing partners.

Two modules live behind one shell:

| Module | Routes | Purpose |
|---|---|---|
| CRM | `/leads`, `/followup`, `/events`, `/map`, `/geo`, `/partners`, `/letters`, `/buyers`, `/import`, `/settings` | Property leads, partners, buyers, letters, CSV import |
| Money Partners | `/money-partners/*` | Financing partners, deal pipeline, communication log |

A public marketing site (`/`, `/about`, `/services`) sits in front of the CRM; everything above requires signing in (`/login`, Supabase Auth, email/password).

For the full architecture, database schema, API reference, and planned features, see **[TECHNICAL.md](./TECHNICAL.md)**.

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router) + [React 19](https://react.dev) + TypeScript (strict)
- [Tailwind CSS 3](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres + Auth, email/password sessions via `@supabase/ssr`)
- Google Maps JavaScript API (map view, address autocomplete, property lookup)
- [Groq](https://groq.com) (free tier) — AI HUD lead triage + chat assistant
- [Repliers](https://repliers.io) — property search / MLS data
- Deployed on [Vercel](https://vercel.com)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
API_SECRET_KEY=
CRON_SECRET=
RENTCAST_API_KEY=
GROQ_API_KEY=
REPLIERS_API_KEY=
WEBHOOK_SECRET=
ZAP_INBOUND_URL=
```

Only the Supabase and Google Maps keys are required to run the app at all. `GROQ_API_KEY` and `REPLIERS_API_KEY` are required for the AI features and Property Search respectively, but their absence doesn't break anything else. See [TECHNICAL.md § Environment Variables](./TECHNICAL.md#4-environment-variables) for what each one does.

### 3. Set up the database

Run `supabase/schema.sql` once in your Supabase project's SQL editor. It creates the `partners`, `properties`, `buyers`, and `money_partners` tables and enables Realtime on all four.

### 4. Create a user to sign in with

The CRM requires a Supabase Auth session (no self-serve signup). Add one from your Supabase project's dashboard (Authentication → Users → Add user), or via `supabase.auth.admin.createUser()` with the service-role key.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it shows the public landing page. Sign in at `/login` with the user from step 4 to reach the CRM.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── (app)/     # Authenticated CRM + Money Partners pages — one shared, auth-gated layout
│   ├── page.tsx   # Public landing page
│   ├── about/, services/, login/   # Other public pages
│   └── api/       # Route handlers (service-role Supabase access, checkApiKey())
├── components/    # crm/, money-partners/, marketing/, ui/ — all view logic lives here
├── contexts/      # CRMContext, MPContext — reads/writes via fetch() to /api/*
├── lib/           # Supabase clients (service-role for data, anon/cookie-based for auth only), utilities
└── types/         # Shared TypeScript interfaces
supabase/
└── schema.sql     # Database schema — run once in Supabase SQL editor
```

## Deployment

Pushes to `main` auto-deploy to Vercel. **This project lives in two GitHub repos that need to stay in sync** — see [TECHNICAL.md § Project Status](./TECHNICAL.md#-project-status-paused-2026-11-02--read-this-first-if-resuming) before pushing anything. See [TECHNICAL.md § Deployment](./TECHNICAL.md#12-deployment) and [§ Infrastructure & Maintenance](./TECHNICAL.md#13-infrastructure--maintenance) for the production URL, required Vercel env vars, and the Supabase keep-alive cron job.
