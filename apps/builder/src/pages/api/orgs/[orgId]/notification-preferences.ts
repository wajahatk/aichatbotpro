import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { workspaceId }) => {
  if (req.method === "GET") {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { workspaceId },
    });
    return res.status(200).json({
      prefs: prefs ?? {
        workspaceId,
        enabledBotIds: [],
        quietHoursStart: null,
        quietHoursEnd: null,
        quietHoursTz: null,
        dailyDigest: false,
      },
    });
  }

  if (req.method === "PUT") {
    const { enabledBotIds, quietHoursStart, quietHoursEnd, quietHoursTz, dailyDigest } =
      req.body as {
        enabledBotIds?: string[];
        quietHoursStart?: number | null;
        quietHoursEnd?: number | null;
        quietHoursTz?: string | null;
        dailyDigest?: boolean;
      };

    const prefs = await prisma.notificationPreference.upsert({
      where: { workspaceId },
      update: {
        ...(enabledBotIds !== undefined ? { enabledBotIds } : {}),
        ...(quietHoursStart !== undefined ? { quietHoursStart } : {}),
        ...(quietHoursEnd !== undefined ? { quietHoursEnd } : {}),
        ...(quietHoursTz !== undefined ? { quietHoursTz } : {}),
        ...(dailyDigest !== undefined ? { dailyDigest } : {}),
      },
      create: {
        workspaceId,
        enabledBotIds: enabledBotIds ?? [],
        quietHoursStart: quietHoursStart ?? null,
        quietHoursEnd: quietHoursEnd ?? null,
        quietHoursTz: quietHoursTz ?? null,
        dailyDigest: dailyDigest ?? false,
      },
    });
    return res.status(200).json({ prefs });
  }

  return res.status(405).end();
});
