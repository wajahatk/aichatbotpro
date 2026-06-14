import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { isSaSessionValid } from "../lib/saSession";

export type AdminCtx = { id: string; email: string };

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  admin: AdminCtx,
) => Promise<void>;

/** Read the authenticated user ID from the database session cookie. */
async function getUserIdFromSession(
  req: NextApiRequest,
): Promise<string | null> {
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

export function withSuperAdminApi(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userId = await getUserIdFromSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    if (!user || user.role !== "SUPERADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!isSaSessionValid(req, userId)) {
      return res.status(403).json({ error: "2FA required" });
    }
    return handler(req, res, { id: userId, email: user.email ?? "" });
  };
}
