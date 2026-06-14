import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export type OrgCtx = { userId: string; workspaceId: string };

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: OrgCtx,
) => Promise<void>;

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

export function withOrgApi(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userId = await getUserIdFromSession(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { orgId } = req.query as { orgId?: string };
    if (!orgId) return res.status(400).json({ error: "orgId required" });

    const membership = await prisma.memberInWorkspace.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: orgId } },
    });
    if (!membership) return res.status(403).json({ error: "Forbidden" });

    return handler(req, res, { userId, workspaceId: orgId });
  };
}
