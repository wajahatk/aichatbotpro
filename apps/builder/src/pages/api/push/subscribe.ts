import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { checkInMemoryRateLimit, getIp } from "@/lib/rateLimiter";

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

  const ip = getIp(req);
  const { allowed } = checkInMemoryRateLimit(`push-subscribe:${ip}`, 10, 60_000);
  if (!allowed) return res.status(429).json({ error: "Too many requests" });

  const userId = await getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { workspaceId, subscription } = req.body as {
    workspaceId?: string;
    subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
  };

  if (!workspaceId || !subscription?.endpoint) {
    return res.status(400).json({ error: "workspaceId and subscription.endpoint are required" });
  }

  const membership = await prisma.memberInWorkspace.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  const tokenKey = subscription.endpoint;

  const record = await prisma.deviceToken.upsert({
    where: { token: tokenKey },
    update: {
      workspaceId,
      userId,
      platform: "web-push",
      pushSubscription: subscription as any,
      updatedAt: new Date(),
    },
    create: {
      workspaceId,
      userId,
      token: tokenKey,
      platform: "web-push",
      pushSubscription: subscription as any,
    },
  });

  return res.status(200).json({ id: record.id });
}
