import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

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

  const { workspaceId, deviceToken, platform } = req.body as {
    workspaceId?: string;
    deviceToken?: string;
    platform?: string;
  };

  if (!workspaceId || !platform) {
    return res.status(400).json({ error: "workspaceId and platform are required" });
  }

  const validPlatforms = ["ios", "android", "web", "web-push"];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: `platform must be one of: ${validPlatforms.join(", ")}` });
  }

  const membership = await prisma.memberInWorkspace.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  const { pushSubscription } = req.body as { pushSubscription?: { endpoint: string; keys: { p256dh: string; auth: string } } };
  if (platform === "web-push" && pushSubscription?.endpoint) {
    const tokenKey = pushSubscription.endpoint;
    const record = await prisma.deviceToken.upsert({
      where: { token: tokenKey },
      update: { workspaceId, userId, platform: "web-push", pushSubscription: pushSubscription as any, updatedAt: new Date() },
      create: { workspaceId, userId, token: tokenKey, platform: "web-push", pushSubscription: pushSubscription as any },
    });
    return res.status(200).json({ id: record.id, platform: record.platform });
  }

  if (!deviceToken) {
    return res.status(400).json({ error: "deviceToken is required for platform: " + platform });
  }

  const record = await prisma.deviceToken.upsert({
    where: { token: deviceToken },
    update: { workspaceId, userId, platform, updatedAt: new Date() },
    create: { workspaceId, userId, token: deviceToken, platform },
  });

  return res.status(200).json({ id: record.id, platform: record.platform });
}
