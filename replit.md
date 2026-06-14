# Typebot

The open-source Typebot monorepo (chatbot builder + viewer), running as-is on Replit. The **builder** app is the conversational-flow editor; the **viewer** publishes/serves bots to end users.

## Run & Operate

- The **Start application** workflow runs the builder: `cd apps/builder && PORT=3000 NEXT_TELEMETRY_DISABLED=1 ../../node_modules/.bin/next dev -p 3000` (Next.js dev, port 3000).
- `node scripts/build-embeds.cjs` — build the Solid.js embed packages (`@typebot.io/js`, `@typebot.io/react`) into their `dist/`. Required before the builder can resolve them. Re-run if embed source changes.
- `cd packages/prisma && bun run db:push` — push DB schema to Postgres (dev only).
- `cd packages/prisma && bun run db:generate` — regenerate the Prisma client.
- `cd packages/env && bun run compile` — compile the env package (`dist/`), imported by Next configs as `@typebot.io/env/compiled`.
- `bun install` — install dependencies (project uses **bun**, not pnpm/npm).

## Stack

- Typebot monorepo: **Nx + bun**, ~72 packages, TypeScript.
- Apps: `apps/builder` and `apps/viewer` — **Next.js 16** (Turbopack), mixed App Router + Pages Router.
- DB: **PostgreSQL + Prisma** (Replit-managed Postgres "heliumdb", `DATABASE_URL` provisioned).
- Auth: **NextAuth (Auth.js)**.
- Embeds: `packages/embeds/js` & `packages/embeds/react` are **Solid.js** bundles built with esbuild + `esbuild-plugin-solid`.

## Where things live

- `apps/builder/next.config.mjs` — builder Next config (imports `@typebot.io/env/compiled`, i18n, standalone output).
- `packages/env/src/index.ts` — env validation schema (source of truth for required env vars).
- `packages/auth/src/lib/providers.ts` — which NextAuth providers are enabled, gated by env vars.
- `packages/auth/src/helpers/sendVerificationRequest.ts` — email login; **dev fallback prints the login code to the server console when `SMTP_HOST` is unset**.
- `packages/prisma/` — Prisma schema + client.
- `scripts/build-embeds.cjs` — esbuild build for the Solid embeds (bypasses Nx).
- `.migration-backup/` — untouched copy of the original import (safety net).

## Architecture decisions

- **Run Nx-free.** The Nx daemon hangs ("Calculating project graph…") with this many packages. The builder runs via `next dev` directly, and embeds build via a standalone esbuild script. Use `NX_DAEMON=false` for any unavoidable Nx command.
- Workspace `@typebot.io/*` lib packages export `./src/*.ts`, so Next compiles them directly through symlinks — no prebuild needed. Only the Solid **embeds** export `./dist` and must be built first.
- Email auth is enabled with a console-code fallback so the app is usable on Replit without SMTP/OAuth secrets. Configure real providers (OAuth or SMTP) via env vars in `providers.ts` for production.

## Product

Typebot lets users visually build conversational forms/chatbots in the builder and publish them via the viewer. Sign in to the builder with email — without SMTP configured, the login code is printed to the server console (see Gotchas).

## User preferences

- Run the **original Typebot as-is** (real Next.js app + database) — NOT a Vite/SPA rewrite.

## Gotchas

- **Login without SMTP:** request a code on `/signin` with any email, then read the 6-digit code (and sign-in link) from the **Start application** workflow console output. This dev fallback lives in `sendVerificationRequest.ts`; setting `SMTP_HOST` (+ SMTP vars) switches to real email delivery.
- `ENCRYPTION_SECRET` must be **exactly 32 characters** or env validation fails.
- `NEXTAUTH_URL` / `NEXT_PUBLIC_VIEWER_URL` must point at the current Replit dev domain.
- `NODE_OPTIONS=--no-node-snapshot` is required (isolated-vm).
- Always build embeds (`node scripts/build-embeds.cjs`) before first boot, or the builder fails to resolve `@typebot.io/js` / `@typebot.io/react`.
- The viewer app is not yet wired up; `NEXT_PUBLIC_VIEWER_URL` currently points at the builder domain.

## Pointers

- See the `pnpm-workspace` skill for general workspace concepts (note: this repo uses **bun + Nx**, not pnpm).
