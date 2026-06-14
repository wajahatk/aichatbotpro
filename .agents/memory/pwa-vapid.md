---
name: PWA VAPID setup
description: How VAPID keys are generated and stored; web-push schema; how to push schema in this repo
---

## VAPID key generation
Run `node scripts/generateVapidKeys.cjs` (root) — outputs VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL.
Store as shared env vars (not secrets) via `setEnvVars()` in code_execution.

## Schema push (correct method)
`cd packages/prisma && bunx prisma db push --accept-data-loss --config prisma.config.ts --schema postgresql/schema.prisma`

**Why:** `bun run db:push` uses a tsx script that calls `exec("prisma ...")` expecting `prisma` in PATH — it's not. `bunx prisma` resolves correctly.

## Prisma client regeneration
`cd packages/prisma && bunx prisma generate --config prisma.config.ts --schema postgresql/schema.prisma`

## Web-push integration
- DeviceToken.pushSubscription (Json?) stores the full PushSubscription JSON
- DeviceToken.token = subscription.endpoint (the unique key for web-push)
- platform = "web-push" distinguishes from FCM/APNs
- In publishLeadEvent.ts, web-push sends first, then FCM; stale endpoints (410/404) are deleted
