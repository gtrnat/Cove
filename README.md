# Cove

A quiet place for your money and your training. Spending imported from myBCA receipt emails, manual income and expenses, budgets, strength training, running, and daily protein.

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md) for architecture, data model, and decisions.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · TypeScript · Tailwind CSS v4 · Supabase Postgres · Drizzle ORM · Better Auth · Zod · Vercel

## Setup

Requires Node.js 22.18+ (scripts in `scripts/` use Node's built-in TypeScript support).

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in (Supabase URLs, `BETTER_AUTH_SECRET`, your email in `ADMIN_EMAILS`).
3. `npm run db:check` to confirm both database URLs connect.
4. `npm run db:migrate` to create the tables (includes the built-in exercise and food data).
5. `npm run dev` and open http://localhost:3000/register.

> On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # route types + tsc
npm test             # unit tests (BCA parser, running and nutrition math)
npm run test:e2e     # end-to-end smoke test against the production build (run `npm run build` first)
npm run db:generate  # create a migration from schema changes
npm run db:migrate   # apply migrations
npm run db:studio    # browse the database
npm run db:check     # test DATABASE_URL and DIRECT_URL
npm run admin:grant -- you@example.com   # promote an existing account to admin
```

`test:e2e` uses the database in `.env.local`. It creates throwaway `e2e-*@cove.test` users and deletes them afterwards.

## Deploying (Vercel)

Environment variables: `DATABASE_URL` (pooler, port 6543), `BETTER_AUTH_SECRET` (a different one from local), `BETTER_AUTH_URL` (the production URL), `ADMIN_EMAILS`, and optionally `ALLOW_REGISTRATION=false`. Set the function region to Singapore (`sin1`) to sit next to the database.

Migrations are run from your machine (`npm run db:migrate`) before merging a PR that adds one.

Preview deployments sign in against their own URL automatically. They share the production database, so treat them as production.

## Registration

Open by default. Set `ALLOW_REGISTRATION=false` and redeploy to make Cove invite-only; emails in `ADMIN_EMAILS` can still register.

## Structure

```
src/
  app/
    (marketing)/   landing page
    (auth)/        login, register
    (app)/         signed-in app: dashboard, finance, fitness, settings, admin
    api/           auth handler, Gmail ingest endpoint
  components/      ui primitives, charts, layout (sidebar, command menu)
  db/schema/       Drizzle tables
  features/        auth, finance, ingest, strength, running, nutrition, settings
  lib/             auth, sessions, API keys, rate limiting, dates, formatting
  proxy.ts         optimistic auth redirect
drizzle/           SQL migrations (incl. seed data)
scripts/           db-check, grant-admin, e2e
tests/             unit tests (node:test)
```

Design tokens live in `src/app/globals.css` (`@theme`).
