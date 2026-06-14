import prisma from "@typebot.io/prisma";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { userId, workspaceId }) => {
  if (req.method !== "GET") return res.status(405).end();

  const [workspace, members, typebots, results, leadEvents, deviceTokens, notifPrefs] =
    await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true, plan: true, createdAt: true },
      }),
      prisma.memberInWorkspace.findMany({
        where: { workspaceId },
        select: { userId: true, role: true },
      }),
      prisma.typebot.findMany({
        where: { workspaceId },
        select: { id: true, name: true, createdAt: true, updatedAt: true, isArchived: true },
      }),
      prisma.result.findMany({
        where: { typebot: { workspaceId } },
        select: {
          id: true, createdAt: true, isCompleted: true, variables: true,
          answersV2: { select: { blockId: true, content: true, createdAt: true } },
        },
        take: 10000,
        orderBy: { createdAt: "desc" },
      }),
      prisma.leadEvent.findMany({
        where: { workspaceId },
        select: { id: true, createdAt: true, typebotName: true, variables: true },
        take: 10000,
      }),
      prisma.deviceToken.findMany({
        where: { workspaceId },
        select: { id: true, platform: true, createdAt: true },
      }),
      prisma.notificationPreference.findUnique({ where: { workspaceId } }),
    ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    requestedByUserId: userId,
    user,
    workspace,
    members,
    typebots,
    results: results.map((r) => ({
      ...r,
      variables: r.variables,
    })),
    leadEvents,
    deviceTokens,
    notificationPreferences: notifPrefs,
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="gdpr-export-${workspaceId}-${new Date().toISOString().split("T")[0]}.json"`,
  );
  return res.status(200).json(exportData);
});
