# Chitty – rotating monthly pool

Next.js (App Router) + Prisma + SQLite implementation for the Chitty spec.

## Requirements
- Node 20+
- npm

## Setup
1) Install deps  
`npm install`

2) Configure env  
Copy `env.example` to `.env.local` and set `JWT_SECRET` if needed. `DATABASE_URL` defaults to SQLite at `prisma/dev.db`.

3) Generate Prisma client & run migrations  
`npm run prisma:migrate -- --name init`

4) Seed data  
`npm run prisma:seed`

5) Start dev server  
`npm run dev`

Visit http://localhost:3000. Login with `vishnu@example.com` / `password123` (admin).

## Docker
Build and run:
```
docker compose up --build
```
The SQLite file is persisted via the `sqlite-data` volume.

## Tests
`npm test` (vitest) — includes API route coverage for payments and month workflow.

## Features
- Auth via credential login with JWT cookie sessions; roles: ADMIN and MEMBER.
- Members list (admin), month listing + detail, payment entry with partials, payout entry, settings.
- Dashboard with current month totals, pending members, per-member summary, payouts.
- Reports endpoint `/api/reports/monthly?format=csv|json`.
- Seeded months Sep 2025–Jul 2026, monthly target ₹50,000, default monthly amount ₹5,000.

## API (key routes)
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET/POST /api/members` (admin)
- `GET /api/months` , `GET /api/months/:id`
- `POST /api/months/:id/payments`
- `POST /api/months/:id/assign-payout`
- `GET /api/payments` (admin)
- `GET/POST /api/payouts` (admin)
- `GET /api/reports/monthly`
- `POST /api/settings` (admin)

## Chitty parameters
- Monthly amount: `Setting.monthlyAmount` (default 5000)
- Months count: `Setting.monthsCount` (default 11)
- Start month: 2025-09-01, due day 10
- Target per month: ₹50,000 (10×₹5,000)

## Notes
- Partial payments allowed; refund/correct flags stored on payments.
- Over-collection blocked unless `allowOverCollection` is enabled in settings or admin overrides (marked `corrected`).
- Audit logs recorded for payments and payouts.

