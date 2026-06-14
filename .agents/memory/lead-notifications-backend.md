---
name: Lead notification backend
description: Architecture and key decisions for the real-time lead notification system (Phase 6).
---

## Tables
- `LeadEvent` — pub/sub row inserted after each completed bot conversation; indexed on (workspaceId, seen, createdAt DESC) for fast SSE polling.
- `DeviceToken` — unique on `token`; upserted on register (safe for repeated calls from mobile).
- `NotificationPreference` — unique on `workspaceId`; defaults assumed (all bots, no quiet hours, real-time) when row absent.

## Where the trigger fires
`packages/bot-engine/src/saveStateToDatabase.ts` — after `prisma.$transaction()`, fire-and-forget `publishLeadEvent()` when `isCompleted && answers.length > 0`. Reads `state.workspaceId` (in session state v3) — no extra DB query on hot path.

**Why fire-and-forget:** push notification latency must not block the bot response. Failures are logged but not surfaced to the user.

## Provider pattern
`packages/lead-notifications/src/providers/factory.ts` reads `PUSH_PROVIDER` env ("fcm" default, "onesignal", "none").
- FCM: `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`, or `FIREBASE_SERVICE_ACCOUNT_JSON`.
- OneSignal: `ONESIGNAL_APP_ID` + `ONESIGNAL_API_KEY`.

## API routes (builder app)
- `GET  /api/orgs/[orgId]/leads` — paginated leads, filter by bot/date/search
- `GET  /api/orgs/[orgId]/leads/stream` — SSE polling LeadEvent every 2.5s, marks seen
- `POST /api/devices/register` — upsert DeviceToken
- `GET|PUT /api/orgs/[orgId]/notification-preferences` — quiet hours, bot filter, daily digest

Auth HOC: `features/leads/hoc/withOrgApi.ts` — checks JWT + MemberInWorkspace.

## orgId = workspaceId
The mobile app will use "orgId" terminology but it maps directly to `workspaceId` in the Typebot schema.
