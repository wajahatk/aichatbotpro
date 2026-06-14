import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";

export default withSuperAdminApi(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  const { page = "1", limit = "50", action, adminId } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(adminId ? { adminId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.status(200).json({ logs, total });
});
