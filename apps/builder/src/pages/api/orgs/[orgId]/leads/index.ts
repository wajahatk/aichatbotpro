import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { workspaceId }) => {
  if (req.method !== "GET") return res.status(405).end();

  const {
    page = "1",
    limit = "25",
    botId,
    search,
    from,
    to,
    sort = "createdAt",
    order = "desc",
  } = req.query as Record<string, string>;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Math.min(Number(limit), 100);

  const typebotWhere = botId ? { typebotId: botId } : {};
  const dateWhere =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {};

  const results = await prisma.result.findMany({
    where: {
      typebot: { workspaceId },
      ...typebotWhere,
      ...dateWhere,
    },
    orderBy: { [sort === "createdAt" ? "createdAt" : sort]: order as "asc" | "desc" },
    skip,
    take,
    select: {
      id: true,
      createdAt: true,
      typebotId: true,
      variables: true,
      isCompleted: true,
      hasStarted: true,
      typebot: { select: { name: true } },
      answersV2: {
        select: { blockId: true, content: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const total = await prisma.result.count({
    where: {
      typebot: { workspaceId },
      ...typebotWhere,
      ...dateWhere,
    },
  });

  const searchLower = search?.toLowerCase();
  const filtered = searchLower
    ? results.filter((r) => {
        const vars = JSON.stringify(r.variables).toLowerCase();
        const answers = r.answersV2.map((a) => a.content).join(" ").toLowerCase();
        return vars.includes(searchLower) || answers.includes(searchLower);
      })
    : results;

  return res.status(200).json({
    leads: filtered.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      typebotId: r.typebotId,
      typebotName: r.typebot.name,
      variables: r.variables,
      isCompleted: r.isCompleted,
      hasStarted: r.hasStarted,
      answers: r.answersV2,
    })),
    total,
    page: Number(page),
    pages: Math.ceil(total / take),
  });
});
