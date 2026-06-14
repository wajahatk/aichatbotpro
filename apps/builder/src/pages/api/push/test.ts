import type { NextApiRequest, NextApiResponse } from "next";
import { sendWebPush } from "@/features/pwa/lib/webPush";
import prisma from "@typebot.io/prisma";

async function getUserIdFromSession(req: NextApiRequest): Promise<string | null> {
  const token =
    req.cookies["authjs.session-token"] ??
    req.cookies["__Secure-authjs.session-token"];
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    select: { userId: true, expires: true },
  });
  if (!session || session.expires < new Date()) return null;
  return session.userId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const userId = await getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { workspaceId } = req.body as { workspaceId?: string };
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  const membership = await prisma.memberInWorkspace.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  const deviceTokens = await prisma.deviceToken.findMany({
    where: { workspaceId, userId, NOT: { pushSubscription: null } },
  });

  if (deviceTokens.length === 0) {
    return res.status(200).json({ sent: 0, message: "No push subscriptions registered for this user" });
  }

  let sent = 0;
  let failed = 0;
  for (const dt of deviceTokens) {
    try {
      await sendWebPush(dt.pushSubscription as any, {
        title: "Test Notification 🎉",
        body: "Push notifications are working correctly!",
        data: { url: "/app/leads" },
      });
      sent++;
    } catch (err) {
      console.error("[push/test] send failed:", err);
      failed++;
    }
  }

  return res.status(200).json({ sent, failed });
}
