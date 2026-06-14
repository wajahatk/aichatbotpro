import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { workspaceId }) => {
  const { leadId } = req.query as { leadId: string };

  if (req.method === "GET") {
    const result = await prisma.result.findFirst({
      where: { id: leadId, typebot: { workspaceId } },
      select: {
        id: true,
        createdAt: true,
        typebotId: true,
        variables: true,
        isCompleted: true,
        hasStarted: true,
        typebot: { select: { name: true, publicId: true } },
        answersV2: {
          select: { blockId: true, content: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        logs: {
          select: { status: true, description: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!result) return res.status(404).json({ error: "Lead not found" });

    return res.status(200).json({
      lead: {
        id: result.id,
        createdAt: result.createdAt,
        typebotId: result.typebotId,
        typebotName: result.typebot.name,
        typebotPublicId: result.typebot.publicId,
        variables: result.variables,
        isCompleted: result.isCompleted,
        hasStarted: result.hasStarted,
        answers: result.answersV2,
        logs: result.logs,
      },
    });
  }

  return res.status(405).end();
});
