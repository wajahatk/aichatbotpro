---
name: Superadmin SubscriptionPlan field names
description: Actual Prisma field names for SubscriptionPlan — easy to get wrong when extending the plans UI or API.
---

## Existing fields (use these exact names)
- `whiteLabelAllowed` — NOT whiteLabelEnabled
- `apiAccess` — NOT apiAccessEnabled
- `mobileAppAccess` — NOT mobileAppEnabled
- `maxLeadsPerMonth` — NOT maxMonthlyConversations
- `teamSeats` — NOT maxSeats
- `brandingRemoval` — unchanged
- `isActive` — product-level activation flag
- `maxBots` — max number of bots per workspace

## Fields added in superadmin phase
- `isVisible` — show/hide on public pricing page
- `currency` — e.g. "usd", "eur" (string, default "usd")
- `features` — Json (stored as string array, e.g. ["Unlimited bots", "API access"])
- `customDomainEnabled` — Boolean

**Why:** The original Typebot schema uses snake-free camelCase but with non-obvious abbreviations. Getting these wrong causes Prisma unknown-field errors at runtime.
