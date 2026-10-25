# ADVA Leads CRM

A full-stack real estate lead management app for wholesalers and investors — track distressed property leads (probate, foreclosure, auction), manage follow-ups, coordinate buyer networks, and maintain a roster of financing partners.

Two modules live behind one shell:

| Module | Routes | Purpose |
|---|---|---|
| CRM | `/leads`, `/followup`, `/events`, `/map`, `/geo`, `/partners`, `/letters`, `/buyers`, `/import`, `/settings` | Property leads, partners, buyers, letters, CSV import |
| Money Partners | `/money-partners/*` | Financing partners, deal pipeline, communication log |

For the full architecture, database schema, API reference, and planned features, see **[TECHNICAL.md](./TECHNICAL.md)**.

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router) + [React 19](https://react.dev) + TypeScript (strict)
- [Tailwind CSS 3](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres + Realtime)
- Google Maps JavaScript API
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
WEBHOOK_SECRET=
ZAP_INBOUND_URL=
```

Only the Supabase and Google Maps keys are required to run the app locally — see [TECHNICAL.md § Environment Variables](./TECHNICAL.md#4-environment-variables) for what each one does and which are optional.

### 3. Set up the database

Run `supabase/schema.sql` once in your Supabase project's SQL editor. It creates the `partners`, `properties`, `buyers`, and `money_partners` tables and enables Realtime on all four.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/leads`.

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
├── app/           # Routes (App Router) and API handlers under app/api/
├── components/    # crm/, money-partners/, ui/ — all view logic lives here
├── contexts/      # CRMContext, MPContext — Supabase reads/writes + realtime
├── lib/           # Supabase clients, auth check, CSV/date/import utilities
└── types/         # Shared TypeScript interfaces
supabase/
└── schema.sql     # Database schema — run once in Supabase SQL editor
```

## Deployment

Pushes to `main` auto-deploy to Vercel. See [TECHNICAL.md § Deployment](./TECHNICAL.md#12-deployment) and [§ Infrastructure & Maintenance](./TECHNICAL.md#13-infrastructure--maintenance) for the production URL, required Vercel env vars, and the Supabase keep-alive cron job.
