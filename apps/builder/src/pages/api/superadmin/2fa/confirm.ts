import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyTOTP } from "@/features/superadmin/lib/totp";

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, totpSecret: true },
  });
  if (!user || user.role !== "SUPERADMIN") return res.status(403).json({ error: "Forbidden" });
  if (user.totpSecret) return res.status(400).json({ error: "2FA already set up" });

  const { secret: totpSecret, code } = req.body as { secret: string; code: string };
  if (!totpSecret || !code) return res.status(400).json({ error: "Missing fields" });
  if (!verifyTOTP(totpSecret, code)) return res.status(400).json({ error: "Invalid code" });

  await prisma.user.update({ where: { id: userId }, data: { totpSecret } });
  return res.status(200).json({ ok: true });
}
