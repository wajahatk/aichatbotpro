import prisma from "@typebot.io/prisma";
import { withOrgApi } from "@/features/leads/hoc/withOrgApi";

export default withOrgApi(async (req, res, { workspaceId }) => {
  if (req.method !== "GET") return res.status(405).end();

  const typebots = await prisma.typebot.findMany({
    where: { workspaceId, isArchived: { not: true } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isArchived: true,
      isClosed: true,
      publicId: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 100,
  });

  return res.status(200).json({ typebots });
});
