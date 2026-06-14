---
name: Firebase Admin setup
description: firebase-admin is already installed at root; how to configure FCM credentials.
---

## Installation
`firebase-admin` v12.7.0 is already in root `node_modules/` — it was pre-installed in the Replit environment.
The `packages/lead-notifications/package.json` lists it as a dependency and the workspace resolves it from root.

## Configuration (env vars)
Option A (individual vars — easier for Replit secrets):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (newlines as `\n` literal — the code does `.replace(/\\n/g, "\n")`)

Option B:
- `FIREBASE_SERVICE_ACCOUNT_JSON` — full JSON string of the service account key file

## To switch push provider
Set `PUSH_PROVIDER=onesignal` (+ `ONESIGNAL_APP_ID` and `ONESIGNAL_API_KEY`), or `PUSH_PROVIDER=none` to disable push.

**Why:** The factory pattern in `providers/factory.ts` uses `require()` for lazy loading — only the chosen provider's code runs.
