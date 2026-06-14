---
name: Multi-tenant SaaS schema
description: Architecture decisions for the multi-tenant SaaS layer added on top of Typebot's existing Workspace model.
---

## Rule
The existing `Workspace` model IS the tenant/organization container. Do NOT create a parallel `Organization` model — extend `Workspace` instead.

**Why:** All ~50+ existing queries, API handlers, and the entire access-control system already use `workspaceId`. Renaming or wrapping would require touching hundreds of files.

**How to apply:** When adding org-level features, add columns/relations to `Workspace` and new linked models (e.g. `OrgSubscription`). Use the `Org` prefix for new models to distinguish them from existing Typebot models.

## Old Plan enum
Kept intact. The old `plan: Plan` enum on Workspace still drives the Stripe billing flow.
The new `planId` FK (→ `SubscriptionPlan`) is the additive source of truth for feature limits — do not remove `plan` without updating all Stripe billing code.

## Trial on signup
New workspaces auto-get `status=TRIAL`, `trialEndsAt=+14d`, and an `OrgSubscription` row linked to the free-trial plan. Trial expiry enforcement beyond the bot-count check is not yet wired.

## Seed plans
Run `bun run src/seedPlans.ts` from `packages/prisma/` to upsert the 4 default plans (free-trial / starter / pro / enterprise). Idempotent.
