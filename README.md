# Cove

A quiet place for your money and your training. Finance tracking plus strength, running, and protein tracking.

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md) for architecture, data model, and the phased plan.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · TypeScript · Tailwind CSS v4 · Supabase Postgres · Drizzle ORM · Better Auth · Zod

## Setup

Requires Node.js 22.18+ (the scripts in `scripts/` use Node's built-in TypeScript support).

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in (Supabase URLs, `BETTER_AUTH_SECRET`, your email in `ADMIN_EMAILS`).
3. `npm run db:check` to confirm both database URLs connect.
4. `npm run db:migrate` to create the tables.
5. `npm run dev` and open http://localhost:3000/register.

> On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # route types + tsc
npm run db:generate  # create a migration from schema changes
npm run db:migrate   # apply migrations
npm run db:studio    # browse the database
npm run db:check     # test DATABASE_URL and DIRECT_URL
npm run admin:grant -- you@example.com   # promote an existing account to admin
```

## Structure

```
src/
  app/
    (marketing)/   landing page
    (auth)/        login, register
    (app)/         signed-in shell: dashboard, finance, fitness, settings
    api/auth/      Better Auth handler
  components/      ui primitives, layout, brand
  config/nav.ts    navigation
  db/              Drizzle client and schema
  features/        auth, settings (forms, actions, queries)
  lib/             auth, auth-client, session helpers
  proxy.ts         optimistic auth redirect
drizzle/           SQL migrations
scripts/           db-check, grant-admin
```

Design tokens live in `src/app/globals.css` (`@theme`).
