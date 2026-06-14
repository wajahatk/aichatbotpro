import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { workspaceId }) => {
  if (req.method !== "GET") return res.status(405).end();

  const { page = "1", limit = "50" } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const events = await prisma.leadEvent.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    skip,
    take: Math.min(Number(limit), 100),
  });

  const total = await prisma.leadEvent.count({ where: { workspaceId } });

  return res.status(200).json({ events, total, page: Number(page) });
});
