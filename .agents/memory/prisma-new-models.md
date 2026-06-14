---
name: Prisma new models for white-label SaaS
description: Models added to schema.prisma for the AI Chat Bot Pro superadmin/SaaS layer.
---

## UserRole enum
`USER | ORG_ADMIN | SUPERADMIN` — added to `User` model as `role` (default USER) and `totpSecret String?`.

## New models
- `PlatformSettings` — global branding overrides (slug "global"), loaded by getServerBranding()
- `AppText` — mobile app copy keyed by slug (served by /api/public/app-text with 5-min cache)
- `PaymentGatewaySettings` — encrypted gateway credentials (slug: "stripe" | "paypal" | ...), uses encryptedData + iv fields
- `AuditLog` — immutable audit trail; written via `logAudit()` in `apps/builder/src/features/superadmin/lib/auditLog.ts`
- `EmailTemplate` — email templates for platform transactional emails, keyed by slug
- `PageContent` — CMS-style page content (terms, privacy, etc.) keyed by slug

## SubscriptionPlan additions
See superadmin-fieldnames.md for the full field list.

**Why:** All added additively — zero impact on existing Typebot tables or relations.
