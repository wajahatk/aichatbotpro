import type { PushSubscription } from "web-push";

let _webPush: typeof import("web-push") | null = null;

function getWebPush() {
  if (_webPush) return _webPush;
  const wp = require("web-push") as typeof import("web-push");
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@aichatbotpro.com";
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Run scripts/generateVapidKeys.cjs and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
    );
  }
  wp.setVapidDetails(email, publicKey, privateKey);
  _webPush = wp;
  return wp;
}

export type WebPushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export async function sendWebPush(
  subscription: PushSubscription,
  payload: WebPushPayload,
): Promise<void> {
  const wp = getWebPush();
  await wp.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 86400,
  });
}

export async function sendWebPushBatch(
  subscriptions: { pushSubscription: unknown }[],
  payload: WebPushPayload,
): Promise<{ sent: number; failed: number }> {
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };
  let sent = 0;
  let failed = 0;
  await Promise.all(
    subscriptions.map(async (dt) => {
      try {
        await sendWebPush(dt.pushSubscription as PushSubscription, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          failed++;
        } else {
          console.error("[webPush] send error:", err?.message ?? err);
          failed++;
        }
      }
    }),
  );
  return { sent, failed };
}
