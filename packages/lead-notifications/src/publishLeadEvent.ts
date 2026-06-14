import prisma from "@typebot.io/prisma";
import { createPushProvider } from "./providers/factory";

type LeadEventPayload = {
  workspaceId: string;
  typebotId: string;
  typebotName: string;
  resultId: string;
  variables: Record<string, unknown>;
};

function buildNotificationBody(variables: Record<string, unknown>): string {
  const entries = Object.entries(variables)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .slice(0, 2);
  if (entries.length === 0) return "New response received";
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(" · ");
}

async function sendWebPushNotifications(
  workspaceId: string,
  typebotName: string,
  typebotId: string,
  resultId: string,
  variables: Record<string, unknown>,
): Promise<void> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  const deviceTokens = await prisma.deviceToken.findMany({
    where: { workspaceId, platform: "web-push", NOT: { pushSubscription: null } },
    select: { id: true, pushSubscription: true },
  });
  if (deviceTokens.length === 0) return;

  const body = buildNotificationBody(variables);

  const webPush = require("web-push") as typeof import("web-push");
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@aichatbotpro.com";
  webPush.setVapidDetails(email, publicKey, privateKey);

  const payload = JSON.stringify({
    title: `New lead from ${typebotName}`,
    body,
    tag: resultId,
    data: { workspaceId, typebotId, leadId: resultId, url: `/app/leads/${resultId}` },
  });

  const staleIds: string[] = [];
  await Promise.all(
    deviceTokens.map(async (dt) => {
      try {
        await webPush.sendNotification(dt.pushSubscription as any, payload, { TTL: 86400 });
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          staleIds.push(dt.id);
        } else {
          console.error("[LeadNotif] web-push send error:", err?.message ?? err);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await prisma.deviceToken.deleteMany({ where: { id: { in: staleIds } } }).catch(() => {});
  }
}

async function sendFcmPushNotifications(
  workspaceId: string,
  typebotName: string,
  variables: Record<string, unknown>,
  enabledBotIds: string[],
  typebotId: string,
): Promise<void> {
  if (enabledBotIds.length > 0 && !enabledBotIds.includes(typebotId)) return;

  const deviceTokens = await prisma.deviceToken.findMany({
    where: { workspaceId, NOT: [{ platform: "web-push" }] },
    select: { token: true },
  });
  if (deviceTokens.length === 0) return;

  const tokens = deviceTokens.map((dt) => dt.token);
  const body = buildNotificationBody(variables);

  const provider = createPushProvider();
  if (!provider) return;

  await provider.send(tokens, {
    title: `New lead from ${typebotName}`,
    body,
    data: { workspaceId, typebotId },
  });
}

export async function publishLeadEvent(payload: LeadEventPayload): Promise<void> {
  const { workspaceId, typebotId, typebotName, resultId, variables } = payload;

  try {
    const event = await prisma.leadEvent.create({
      data: { workspaceId, typebotId, typebotName, resultId, variables },
    });

    const prefs = await prisma.notificationPreference.findUnique({
      where: { workspaceId },
    });

    if (!prefs?.dailyDigest) {
      const enabledBotIds = Array.isArray(prefs?.enabledBotIds)
        ? (prefs.enabledBotIds as string[])
        : [];

      const isQuietHours = checkQuietHours(prefs);
      if (!isQuietHours) {
        // Web-push (VAPID)
        sendWebPushNotifications(workspaceId, typebotName, typebotId, resultId, variables)
          .catch((err) => console.error("[LeadNotif] web-push batch error:", err));

        // FCM / other providers
        sendFcmPushNotifications(workspaceId, typebotName, variables, enabledBotIds, typebotId)
          .then(() =>
            prisma.leadEvent.update({
              where: { id: event.id },
              data: { notifSent: true },
            }),
          )
          .catch((err) => console.error("[LeadNotif] fcm push error:", err));
      }
    }
  } catch (err) {
    console.error("[LeadNotif] publishLeadEvent error:", err);
  }
}

function checkQuietHours(prefs: { quietHoursStart?: number | null; quietHoursEnd?: number | null; quietHoursTz?: string | null } | null): boolean {
  if (!prefs?.quietHoursStart == null || prefs.quietHoursEnd == null) return false;
  const tz = prefs.quietHoursTz ?? "UTC";
  const now = new Date();
  const hour = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(now);
  const h = parseInt(hour, 10);
  const start = prefs.quietHoursStart!;
  const end = prefs.quietHoursEnd!;
  if (start <= end) return h >= start && h < end;
  return h >= start || h < end;
}
