import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyTOTP } from "@/features/superadmin/lib/totp";
import { buildSaSessionCookie } from "@/features/superadmin/lib/saSession";

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

const attempts: Map<string, { count: number; resetAt: number }> = new Map();

function isRateLimited(id: string): boolean {
  const now = Date.now();
  const entry = attempts.get(id);
  if (!entry || entry.resetAt < now) {
    attempts.set(id, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const userId = await getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (isRateLimited(userId)) {
    return res.status(429).json({ error: "Too many attempts. Wait 1 minute." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, totpSecret: true },
  });
  if (!user || user.role !== "SUPERADMIN") return res.status(403).json({ error: "Forbidden" });
  if (!user.totpSecret) return res.status(400).json({ error: "2FA not set up" });

  const { code } = req.body as { code: string };
  if (!verifyTOTP(user.totpSecret, code)) {
    return res.status(400).json({ error: "Invalid code" });
  }

  res.setHeader("Set-Cookie", buildSaSessionCookie(userId));
  return res.status(200).json({ ok: true });
}
