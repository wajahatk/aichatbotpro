---
name: Dual-provider billing
description: Architecture for Stripe + PayPal parallel billing — how webhooks, DB updates, and the UI fit together.
---

## Rule
Both Stripe and PayPal write to the same `OrgSubscription` and `OrgInvoice` tables. Never split billing data into provider-specific tables.

**Why:** The billing UI page reads from `OrgSubscription`/`OrgInvoice` for both providers, giving a single invoice history regardless of how the org pays.

**How to apply:** All new payment event handlers must upsert into `OrgInvoice` (keyed on `providerInvoiceId` unique constraint) and update `OrgSubscription.status`.

## Raw body requirement
Both webhook endpoints need raw body pass-through for signature verification.
- Stripe: `/stripe/webhook`
- PayPal: `/paypal/webhook`
Both are listed in the `needsRawBody` check in `apps/builder/src/app/api/[[...rest]]/route.ts`.

## OrgInvoice field name
The provider field on `OrgInvoice` is named **`provider`** (not `paymentProvider`).
`OrgSubscription` uses **`paymentProvider`**.

## PayPal subscription lookup
PayPal `PAYMENT.SALE.COMPLETED` events identify the subscription via `resource.billing_agreement_id`, not `resource.id`. Look up workspace by `paypalSubscriptionId` using `billing_agreement_id`.

## PayPal plan IDs
`SubscriptionPlan.paypalPlanId` must be set to the PayPal Plan ID (created in PayPal dashboard or via API) for PayPal checkout to work. If null, checkout throws `BAD_REQUEST`.

## Trial reminders
`/api/trial-reminders` (Next.js Pages API route) is a POST endpoint callable by external cron. Protected by `CRON_SECRET` env var (optional in dev). Uses 12-hour time windows around target days (7, 2, 0) — idempotent if run once/day.

## Env vars needed for billing
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — existing
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` — new
- `PAYPAL_BASE_URL` — defaults to sandbox; set to `https://api-m.paypal.com` for production
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — if client-side PayPal SDK is ever added
