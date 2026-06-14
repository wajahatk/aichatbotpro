---
name: Superadmin Panel Architecture
description: How the /superadmin panel is secured and structured; key design choices for extending it.
---

## Auth flow
1. User must have `role === "SUPERADMIN"` in the DB (`User.role` field).
2. They must have a `totpSecret` set (TOTP 2FA enrollment via `/superadmin/2fa-setup`).
3. After each login they visit `/superadmin/verify-2fa` — submitting a valid TOTP code sets the `__sa_v` HMAC-signed cookie (12h TTL, rate-limited 5/min/user via in-process Map).
4. Every page uses `withSuperAdmin` (getServerSideProps HOC); every API uses `withSuperAdminApi` (middleware). Both check: NextAuth session → role → totpSecret → cookie.

## Seed the first admin
```
SUPERADMIN_EMAIL=me@example.com npx tsx scripts/seedSuperAdmin.ts
```
User must exist (signed in at least once). Then visit /superadmin/2fa-setup with an authenticator app.

## 9 sections
index (analytics), branding, plans, gateways, clients, content, emails, audit, app-text.
All at `apps/builder/src/pages/superadmin/` and `apps/builder/src/pages/api/superadmin/`.

## Encryption
Gateway credentials use `@typebot.io/credentials/encrypt` + `decrypt` (AES-GCM, key from ENCRYPTION_SECRET).
Masked values (showing •••• prefix) are skipped on update so the encrypted value is preserved.

## Branding cache
`packages/config/src/brandingDb.ts` → `getServerBranding()` loads PlatformSettings slug="global" with 5-min in-process cache. Call `invalidateBrandingCache()` after saving branding (already wired in `/api/superadmin/branding`).

**Why:** TOTP+HMAC cookie avoids DB-backed sessions for the 2FA check; keeps superadmin auth stateless and fast. The 12h cookie TTL matches a workday so admins aren't re-challenged constantly.
