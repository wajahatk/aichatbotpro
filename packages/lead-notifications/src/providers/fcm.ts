import type { PushNotificationPayload, PushProviderClient } from "./interface";

let _app: import("firebase-admin/app").App | undefined;

function getApp() {
  if (_app) return _app;

  const admin = require("firebase-admin");

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!projectId && !serviceAccountJson) {
    throw new Error(
      "FCM not configured. Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
  }

  const credential = serviceAccountJson
    ? admin.credential.cert(JSON.parse(serviceAccountJson))
    : admin.credential.cert({ projectId, clientEmail, privateKey });

  if (admin.apps.length === 0) {
    _app = admin.initializeApp({ credential });
  } else {
    _app = admin.apps[0];
  }
  return _app;
}

export class FcmProvider implements PushProviderClient {
  async send(tokens: string[], payload: PushNotificationPayload): Promise<void> {
    if (tokens.length === 0) return;

    const admin = require("firebase-admin");
    getApp();
    const messaging = admin.messaging();

    const BATCH_SIZE = 500;
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const message = {
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        tokens: batch,
      };
      try {
        const response = await messaging.sendEachForMulticast(message);
        if (response.failureCount > 0) {
          const failed = response.responses
            .map((r: any, idx: number) => (!r.success ? batch[idx] : null))
            .filter(Boolean);
          console.warn(`[FCM] ${response.failureCount} push(es) failed:`, failed);
        }
      } catch (err) {
        console.error("[FCM] sendEachForMulticast error:", err);
      }
    }
  }
}
