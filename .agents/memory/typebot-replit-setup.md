---
name: Typebot on Replit
description: Non-obvious traps when running the as-is Typebot (Nx + bun, ~72 pkgs, Next.js 16) monorepo on Replit. Operational commands live in replit.md.
---

# Running Typebot (Nx + bun monorepo) on Replit — gotchas

The project root is the full original Typebot monorepo, run **as-is** (real Next.js + Postgres), not rewritten. Day-to-day commands are in `replit.md`; this file is for the non-obvious lessons.

## Bypass Nx — its daemon hangs
**Why:** With ~72 packages the Nx daemon stalls at "Calculating project graph… taking longer than expected" and never serves, so `nx dev builder` as a workflow fails.
**How to apply:** Run the builder via `next dev` directly (see `replit.md`). If an Nx command is unavoidable, prefix `NX_DAEMON=false`.

## Only the Solid embeds need a prebuild
**Why:** Workspace `@typebot.io/*` libs export `./src/*.ts`, so Next compiles them through symlinks with no prebuild. The exception is `packages/embeds/js` and `packages/embeds/react` — **Solid.js**, export `./dist` — so the builder can't resolve them until built. The `js` embed needs the Solid esbuild plugin (via its own `esbuild.config.cjs`); the `react` embed just wraps the already-built `js` dist (react/react-dom external).
**How to apply:** Run the embed build script before first boot or after embed source changes.

## Auth works without SMTP via a dev-only console fallback
**Why:** Typebot's signin refuses to work unless a NextAuth provider is configured, and email normally needs SMTP. To make it usable on Replit without secrets, the email provider is enabled (just set `NEXT_PUBLIC_SMTP_FROM` — all SMTP fields are optional in the env schema) and `sendVerificationRequest.ts` prints the login code to the server console when `SMTP_HOST` is unset.
**Guard:** the console fallback is **dev-only** — it throws in `NODE_ENV=production` (fail closed) so login tokens never leak to prod logs. Set real `SMTP_HOST`/SMTP_* for production email.

## Two environment quirks that wasted time
- The bash tool caps at 120s; bundling the `js` embed pulls a large tree and exceeds it — run such builds as a managed workflow, not in the bash tool.
- `console.*` output is buffered into the workflow log file; grepping the raw log immediately after a request misses it. Call `refresh_all_logs` to flush before reading.
