import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const POLL_INTERVAL_MS = 2500;

export const config = { api: { responseLimit: false } };

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
  if (req.method !== "GET") return res.status(405).end();

  const userId = await getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { orgId } = req.query as { orgId?: string };
  if (!orgId) return res.status(400).json({ error: "orgId required" });

  const membership = await prisma.memberInWorkspace.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: orgId } },
  });
  if (!membership) return res.status(403).json({ error: "Forbidden" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`: connected to lead stream for org ${orgId}\n\n`);

  let lastSeenAt = new Date();
  let closed = false;

  const sendHeartbeat = () => {
    if (!closed) res.write(": heartbeat\n\n");
  };

  const heartbeat = setInterval(sendHeartbeat, 30_000);

  const poll = setInterval(async () => {
    if (closed) return;
    try {
      const events = await prisma.leadEvent.findMany({
        where: {
          workspaceId: orgId,
          createdAt: { gt: lastSeenAt },
        },
        orderBy: { createdAt: "asc" },
      });

      if (events.length > 0) {
        lastSeenAt = events[events.length - 1].createdAt;
        for (const event of events) {
          res.write(`event: lead\n`);
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        await prisma.leadEvent.updateMany({
          where: { id: { in: events.map((e) => e.id) } },
          data: { seen: true },
        });
      }
    } catch (err) {
      console.error("[SSE] poll error:", err);
    }
  }, POLL_INTERVAL_MS);

  req.on("close", () => {
    closed = true;
    clearInterval(poll);
    clearInterval(heartbeat);
    res.end();
  });

  req.on("error", () => {
    closed = true;
    clearInterval(poll);
    clearInterval(heartbeat);
  });
}
