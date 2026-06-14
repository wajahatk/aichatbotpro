---
name: SA session cookie path requirement
description: The __sa_v superadmin session cookie must be scoped to Path=/ not Path=/superadmin
---

The SA session cookie (`__sa_v`) is built by `buildSaSessionCookie(userId)` in
`apps/builder/src/features/superadmin/lib/saSession.ts`. It MUST use `Path=/`.

**Why:** If scoped to `Path=/superadmin`, the browser sends it for page requests
(`/superadmin/*`) but NOT for API requests (`/api/superadmin/*`). This means
`withSuperAdminApi` HOC returns 403 even when the page itself loads fine.

**How to apply:** `buildSaSessionCookie` already uses `Path=/`. The `withSuperAdmin`
HOC re-issues the cookie on every successful page load so stale old cookies
(Path=/superadmin) are silently replaced when the admin visits any superadmin page.
