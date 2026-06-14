---
name: Branding config pattern
description: How brand identity is managed in this white-label fork; where to add DB overrides in Phase 4
---

## Rule
All user-facing brand strings must be sourced from `packages/config/src/branding.ts` via `getBranding()`. Never hardcode "AI Chat Bot Pro" or colors directly in components.

**Why:** The Super Admin Panel (Phase 4) will call `getBranding(dbOverrides)` to swap brand at runtime without redeploy. The config file values are fallback defaults only.

**How to apply:** Import `import { branding } from "@typebot.io/config/src/branding"` in server components. For Phase 4, load overrides from DB and pass to `getBranding(overrides)`.

## What was left intentionally unchanged
- `@typebot.io/*` npm package names — workspace symlink resolution depends on exact names
- TypeScript type identifiers: `Typebot`, `TypebotProvider`, `useTypebot`, `typebotId`, etc.
- `Typebot.initStandard()` / `initBubble()` / `initPopup()` — public JS embed API (from `@typebot.io/js`)
- Internal API error strings: "Typebot not found" (developer-facing, not end-user)
- `apps/landing-page/` — separate Next app, not yet deployed
- `apps/docs/` — original OSS documentation

## Brand assets location
- Favicon: `apps/builder/public/favicon.svg`, `apps/viewer/public/favicon.svg`
- Logo SVG: `apps/builder/public/images/acb-pro-logo.svg`
- Logo component (inline SVG): `apps/builder/src/components/TypebotLogo.tsx`, `apps/viewer/src/components/TypebotLogo.tsx`
- Email logo: points to `${NEXTAUTH_URL}/images/acb-pro-logo.svg`

## Gallery template IDs
The theme gallery template IDs (e.g. `"typebot-light"`) were kept intact to avoid breaking existing DB records. Only display names were changed to "ACB Pro Light/Dark".
