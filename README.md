# AI Chat Bot Pro

White-label SaaS chatbot builder — forked from Typebot Community Edition. Runs on Replit with PostgreSQL, Next.js 16, and a PWA mobile dashboard.

---

## Quick Start on Replit

1. **Clone / fork** this Repl.
2. Open the **Secrets** tab and set the required environment variables (see below).
3. Push the database schema: in the Shell run:
   ```bash
   cd packages/prisma && bunx prisma db push --accept-data-loss --config prisma.config.ts --schema postgresql/schema.prisma
   ```
4. Build the embed packages (required before first boot):
   ```bash
   node scripts/build-embeds.cjs
   ```
5. Hit **Run** — the builder starts at port 3000.

---

## Environment Variables

All variables live in the Replit `.replit` file (`[userenv.shared]`) **except secrets**, which go in **Replit Secrets** (Tools → Secrets).

### Required

| Variable | Where | Description |
|---|---|---|
| `ENCRYPTION_SECRET` | `.replit` env | Exactly 32 characters. Used to sign JWTs and sessions. |
| `DATABASE_URL` | Runtime-managed | Provisioned automatically by Replit Postgres. Do not edit. |
| `NEXTAUTH_URL` | `.replit` env | Full URL of your Replit dev domain, e.g. `https://xxxx.janeway.replit.dev` |
| `NEXT_PUBLIC_VIEWER_URL` | `.replit` env | Same as `NEXTAUTH_URL` (viewer is co-located in dev). |
| `NODE_OPTIONS` | `.replit` env | Must be `--no-node-snapshot` (required by isolated-vm). |

### Authentication (at least one required)

| Variable | Secret? | Description |
|---|---|---|
| `SMTP_HOST` | No | SMTP server hostname. Without this, sign-in codes print to the server console (dev fallback). |
| `SMTP_PORT` | No | SMTP port (default: `587`). |
| `SMTP_USERNAME` | **Secret** | SMTP auth username. |
| `SMTP_PASSWORD` | **Secret** | SMTP auth password. |
| `SMTP_SECURE` | No | `true` for SSL (port 465), `false` otherwise. |
| `GOOGLE_CLIENT_ID` | **Secret** | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | **Secret** | Google OAuth client secret. |
| `GITHUB_CLIENT_ID` | **Secret** | GitHub OAuth app client ID. |
| `GITHUB_CLIENT_SECRET` | **Secret** | GitHub OAuth app client secret. |

### Payments

| Variable | Secret? | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | **Secret** | Stripe secret key (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | **Secret** | Stripe webhook signing secret (`whsec_...`). |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | No | Stripe publishable key (`pk_live_...`). |
| `STRIPE_STARTER_PRICE_ID` | No | Stripe Price ID for the Starter plan. |
| `STRIPE_PRO_PRICE_ID` | No | Stripe Price ID for the Pro plan. |
| `PAYPAL_CLIENT_ID` | **Secret** | PayPal OAuth client ID. |
| `PAYPAL_CLIENT_SECRET` | **Secret** | PayPal OAuth client secret. |
| `PAYPAL_WEBHOOK_ID` | No | PayPal webhook ID (for signature verification). |
| `PAYPAL_MODE` | No | `sandbox` or `live`. |

### Push Notifications (Web Push / VAPID)

Generate keys once with `node scripts/generateVapidKeys.cjs`, then:

| Variable | Secret? | Description |
|---|---|---|
| `VAPID_PUBLIC_KEY` | No | VAPID public key (safe to expose). |
| `VAPID_PRIVATE_KEY` | **Secret** | VAPID private key — store as Replit Secret, never in `.replit`. |
| `VAPID_EMAIL` | No | `mailto:` address used in VAPID headers. |

### Optional / Integrations

| Variable | Secret? | Description |
|---|---|---|
| `SENTRY_DSN` | **Secret** | Sentry DSN for error monitoring. Also configurable in Superadmin → Branding. |
| `SENTRY_ORG` | No | Sentry org slug (for source map upload in CI). |
| `SENTRY_PROJECT` | No | Sentry project slug. |
| `SENTRY_AUTH_TOKEN` | **Secret** | Sentry auth token for source map upload. |
| `REDIS_URL` | **Secret** | Upstash Redis URL for distributed rate limiting. Falls back to in-memory if absent. |
| `CRON_SECRET` | **Secret** | Bearer token that protects `/api/trial-reminders`. |
| `ADMIN_EMAIL` | No | Email address that gets Superadmin role on first sign-in. |
| `DEFAULT_WORKSPACE_PLAN` | No | `FREE`, `STARTER`, or `PRO` — plan assigned to new workspaces. |
| `DISABLE_SIGNUP` | No | Set to `true` to close public registration. |
| `CONTACT_EMAIL` | No | Fallback recipient for contact form emails. |

---

## How to Run Locally (Replit)

```bash
# 1. Install deps (only needed after pulling new commits)
bun install

# 2. Push schema (after any schema change)
cd packages/prisma && bunx prisma db push --accept-data-loss --config prisma.config.ts --schema postgresql/schema.prisma

# 3. Rebuild embed packages (after changing packages/embeds/*)
node scripts/build-embeds.cjs

# 4. Start the builder
cd apps/builder && PORT=3000 NEXT_TELEMETRY_DISABLED=1 ../../node_modules/.bin/next dev -p 3000
```

The builder is then available at your Replit dev URL.

---

## How to Deploy (Replit Deployments)

1. In the Replit sidebar, click **Deploy → Autoscale** (or Reserved VM for steady traffic).
2. Set all required environment variables in the **Deployment** secrets panel.
3. Use a `NEXTAUTH_URL` pointing to your `.replit.app` domain or custom domain.
4. After first deploy, push the schema to production:
   ```bash
   cd packages/prisma && bunx prisma db push --config prisma.config.ts --schema postgresql/schema.prisma
   ```
5. Stripe / PayPal webhooks must point to `https://yourdomain.com/api/webhooks/stripe` and `/api/webhooks/paypal`.

---

## Accessing the Superadmin Panel

1. Set `ADMIN_EMAIL` to your email address before first sign-in.
2. Sign in at `/signin` with that email.
3. Navigate to `/superadmin` — you will be prompted for 2FA setup on first access.
4. From Superadmin you can:
   - **Branding** — app name, logo, colors, cookie consent text, Sentry DSN
   - **Plans** — create/edit subscription plans (Stripe + PayPal price IDs)
   - **Clients** — view all workspaces, impersonate, suspend
   - **Gateways** — configure payment provider keys
   - **Emails** — edit transactional email templates
   - **Content** — edit marketing page copy (hero, features, pricing text)
   - **Audit log** — all admin actions with timestamps

---

## Configuring Stripe

1. Create products and prices in the [Stripe Dashboard](https://dashboard.stripe.com).
2. Copy the Price IDs into `STRIPE_STARTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID`.
3. Create a webhook endpoint at `https://yourdomain.com/api/webhooks/stripe`, listening for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Test with `stripe listen --forward-to localhost:3000/api/webhooks/stripe` during development.

---

## Configuring PayPal

1. Create an app in [PayPal Developer](https://developer.paypal.com).
2. Copy Client ID and Secret into `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`.
3. Set `PAYPAL_MODE=sandbox` for testing, `live` for production.
4. Create a webhook at `https://yourdomain.com/api/webhooks/paypal` for `BILLING.SUBSCRIPTION.*` events.
5. Copy the Webhook ID into `PAYPAL_WEBHOOK_ID`.

---

## Architecture Notes

- **Monorepo**: Bun + Nx (~72 packages). Use `NX_DAEMON=false` for any unavoidable Nx commands.
- **Apps**: `apps/builder` (Next.js 16, port 3000). Viewer (`apps/viewer`) is not yet wired up.
- **Database**: Replit-managed PostgreSQL. For production backups, run nightly:
  ```bash
  pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
  ```
  Then upload to S3-compatible storage (Cloudflare R2, AWS S3, Backblaze B2).
- **Auth**: NextAuth.js with email magic-link + optional OAuth. Without SMTP, login codes print to the server console.
- **Embeds**: `packages/embeds/js` and `packages/embeds/react` are Solid.js bundles. Rebuild with `node scripts/build-embeds.cjs` after changes.
- **PWA**: Service worker at `public/sw.js`. Dashboard at `/app` (6 screens). Web push via VAPID.

---

## Tenant Isolation Test

Before launch, verify cross-org data access is blocked:

```bash
ORG_A_TOKEN=xxx ORG_B_TOKEN=yyy ORG_A_ID=aaa ORG_B_ID=bbb \
  node scripts/testTenantIsolation.cjs
```

See the script for instructions on obtaining session tokens.

---

## Health Check

```
GET /healthz
```

Returns `200 { status: "ok" }` when the database is reachable. Configure this URL in UptimeRobot, Better Uptime, or Cronitor for uptime monitoring.

---

## GDPR / Data Compliance

Workspace owners can:
- **Export all data**: `GET /api/orgs/{orgId}/gdpr/export` — downloads a JSON archive of all leads, bots, answers, and preferences.
- **Delete all data**: `DELETE /api/orgs/{orgId}/gdpr/delete` with body `{ "confirm": "DELETE_MY_DATA" }` — permanently deletes the workspace and all associated data.

---

## Security Headers

All responses include:
- `Content-Security-Policy` — restricts script/style/frame sources
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — blocks camera, microphone, geolocation by default
- `Strict-Transport-Security` — enabled in production (18-month HSTS with preload)

---

## What Needs Real Credentials Before Launch

| Item | Status | Action needed |
|---|---|---|
| SMTP email | Dev fallback active | Configure real SMTP (SendGrid, Resend, Postmark) |
| Stripe | Test keys | Replace with live keys, activate account, update webhook URL |
| PayPal | Placeholder | Create PayPal app, get live credentials |
| VAPID / web push | Generated | Rotate keys before production via `node scripts/generateVapidKeys.cjs` |
| Sentry | Optional | Add `SENTRY_DSN` secret for error monitoring |
| Redis | Optional | Add `REDIS_URL` for distributed rate limiting (falls back to in-memory) |
| Custom domain | Manual | Configure in Replit Deployments → Custom Domain, update `NEXTAUTH_URL` |

---

## Manual Steps Outside Replit

1. **Domain & DNS** — Point your domain's A/CNAME to Replit's deployment IP. Replit handles SSL automatically for `.replit.app`; bring your own cert for custom domains.
2. **Stripe live mode** — Toggle off test mode in Stripe Dashboard, re-create webhooks for production URL.
3. **PayPal live mode** — Set `PAYPAL_MODE=live`, use live credentials, update webhook URL.
4. **App Store / Play Store** — The PWA at `/app` works as a mobile app:
   - Use [PWABuilder](https://pwabuilder.com) to publish to the Play Store as a TWA.
   - Use Capacitor to publish to the App Store (requires macOS + Xcode).
5. **Database backups** — Set up a cron job or Replit Scheduled Deployment to run `pg_dump` nightly.
6. **Uptime monitoring** — Point your monitor to `https://yourdomain.com/healthz`.
