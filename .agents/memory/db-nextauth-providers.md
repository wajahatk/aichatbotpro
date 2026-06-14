---
name: DB-driven NextAuth providers
description: How runtime DB OAuth provider loading works in this codebase
---

## Rule
`nextAuth.ts` uses `NextAuth((req) => config)` factory (per-request). Merge env-var providers with DB providers via `getCachedDbProviders()` (sync, 5-min TTL). Await `ensureDbProvidersLoaded()` in the route handler before the first auth request.

**Why:** NextAuth v5 factory is sync, but cache pre-warms async in the route handler. This avoids creating a new NextAuth instance per request while still supporting runtime-updated credentials.

**How to apply:**
- `packages/auth/src/lib/dbProviders.ts` — the cache module
- `packages/auth/src/lib/nextAuth.ts` — merges on every request (cheap: sync array lookup)
- `apps/builder/src/app/api/auth/[...nextauth]/route.ts` — awaits warm-up before GET/POST
- After superadmin saves: call `invalidateDbProvidersCache()` so next request rebuilds
- Env-var providers always win: filter DB providers by `!envProviderIds.has(p.id)`
