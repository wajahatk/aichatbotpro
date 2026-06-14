import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";

export default withSuperAdminApi(async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalWorkspaces,
    activeWorkspaces,
    trialWorkspaces,
    suspendedWorkspaces,
    newThisMonth,
    activeSubs,
    canceledThisMonth,
    activeLastMonth,
    recentClients,
  ] = await Promise.all([
    prisma.workspace.count(),
    prisma.workspace.count({ where: { status: "ACTIVE" } }),
    prisma.workspace.count({ where: { status: "TRIAL" } }),
    prisma.workspace.count({ where: { status: "SUSPENDED" } }),
    prisma.workspace.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.orgSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { price: true, billingInterval: true } } },
    }),
    prisma.orgSubscription.count({
      where: {
        status: "CANCELED",
        updatedAt: { gte: startOfMonth },
      },
    }),
    prisma.orgSubscription.count({
      where: {
        status: { in: ["ACTIVE", "TRIALING"] },
        createdAt: { lte: endOfLastMonth },
      },
    }),
    prisma.workspace.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { owner: { select: { email: true } } },
    }),
  ]);

  const mrr = activeSubs.reduce((sum, s) => {
    const monthly =
      s.plan?.billingInterval === "YEARLY"
        ? (s.plan.price ?? 0) / 12
        : (s.plan?.price ?? 0);
    return sum + monthly;
  }, 0);

  const churnRate =
    activeLastMonth > 0 ? (canceledThisMonth / activeLastMonth) * 100 : 0;

  const trialToPayConversion =
    totalWorkspaces > 0 ? (activeWorkspaces / totalWorkspaces) * 100 : 0;

  const growth = await prisma.workspace.groupBy({
    by: ["createdAt"],
    _count: true,
    orderBy: { createdAt: "asc" },
  });

  const monthlyGrowth: Record<string, number> = {};
  for (const g of growth) {
    const key = `${g.createdAt.getFullYear()}-${String(g.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyGrowth[key] = (monthlyGrowth[key] ?? 0) + g._count;
  }

  return res.status(200).json({
    totalWorkspaces,
    activeWorkspaces,
    trialWorkspaces,
    suspendedWorkspaces,
    newThisMonth,
    mrr,
    arr: mrr * 12,
    churnRate: Math.round(churnRate * 10) / 10,
    trialToPayConversion: Math.round(trialToPayConversion * 10) / 10,
    monthlyGrowth: Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count })).slice(-12),
    recentClients: recentClients.map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      createdAt: w.createdAt,
      ownerEmail: w.owner?.email ?? "—",
    })),
  });
});
