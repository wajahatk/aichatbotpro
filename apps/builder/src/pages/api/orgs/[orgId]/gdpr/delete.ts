import prisma from "@typebot.io/prisma";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { userId, workspaceId }) => {
  if (req.method !== "DELETE") return res.status(405).end();

  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "DELETE_MY_DATA") {
    return res.status(400).json({
      error: 'Send { "confirm": "DELETE_MY_DATA" } in the request body to confirm deletion.',
    });
  }

  // Verify requester is the workspace owner
  const membership = await prisma.memberInWorkspace.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership || membership.role !== "OWNER") {
    return res.status(403).json({ error: "Only workspace owners can request full data deletion." });
  }

  try {
    // Delete in dependency order
    await prisma.leadEvent.deleteMany({ where: { workspaceId } });
    await prisma.deviceToken.deleteMany({ where: { workspaceId } });
    await prisma.notificationPreference.deleteMany({ where: { workspaceId } });

    const typebots = await prisma.typebot.findMany({
      where: { workspaceId },
      select: { id: true },
    });
    const typebotIds = typebots.map((t) => t.id);
    if (typebotIds.length > 0) {
      const resultIds = await prisma.result.findMany({
        where: { typebotId: { in: typebotIds } },
        select: { id: true },
      });
      const rIds = resultIds.map((r) => r.id);
      if (rIds.length > 0) {
        await prisma.answer.deleteMany({ where: { resultId: { in: rIds } } });
        await prisma.answerV2.deleteMany({ where: { resultId: { in: rIds } } });
        await prisma.log.deleteMany({ where: { resultId: { in: rIds } } });
        await prisma.result.deleteMany({ where: { id: { in: rIds } } });
      }
      await prisma.collaboratorsOnTypebots.deleteMany({ where: { typebotId: { in: typebotIds } } });
      await prisma.typebot.deleteMany({ where: { id: { in: typebotIds } } });
    }

    await prisma.memberInWorkspace.deleteMany({ where: { workspaceId } });
    await prisma.workspace.delete({ where: { id: workspaceId } });

    return res.status(200).json({
      deleted: true,
      workspaceId,
      message: "All workspace data has been permanently deleted.",
    });
  } catch (err) {
    console.error("[GDPR delete] error:", err);
    return res.status(500).json({ error: "Deletion failed. Some data may remain — contact support." });
  }
});
