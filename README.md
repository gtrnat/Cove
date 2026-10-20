# Cove

A quiet place for your money and your training. Finance tracking plus strength, running, and protein tracking.

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md) for architecture, data model, and the phased plan.

## Stack

Next.js 16 (App Router, Cache Components, Turbopack) · TypeScript · Tailwind CSS v4 · lucide-react

## Development

Requires Node.js 20.9+.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # route types + tsc
```

> On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

## Structure

```
src/
  app/
    (marketing)/   landing page
    (auth)/        login, register
    (app)/         signed-in shell: dashboard, finance, fitness, settings
  components/
    ui/            primitives (button, card, input, stat-card, progress-ring, ...)
    layout/        sidebar, mobile nav, page header with tabs
    brand/         logo
  config/nav.ts    navigation
  lib/utils.ts     cn() helper
```

Design tokens live in `src/app/globals.css` (`@theme`).
