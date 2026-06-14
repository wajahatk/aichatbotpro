import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";

export default withSuperAdminApi(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  const { search = "", status, page = "1", limit = "25" } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }] } : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [workspaces, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
      include: {
        owner: { select: { email: true, name: true } },
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { plan: { select: { name: true, price: true, billingInterval: true } } },
        },
        _count: { select: { typebots: true } },
      },
    }),
    prisma.workspace.count({ where }),
  ]);

  return res.status(200).json({
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      plan: w.subscriptions[0]?.plan?.name ?? w.plan,
      mrr: w.subscriptions[0]?.plan
        ? w.subscriptions[0].plan.billingInterval === "YEARLY"
          ? (w.subscriptions[0].plan.price ?? 0) / 12
          : (w.subscriptions[0].plan.price ?? 0)
        : 0,
      ownerEmail: w.owner?.email ?? "—",
      ownerName: w.owner?.name ?? "—",
      createdAt: w.createdAt,
      trialEndsAt: w.trialEndsAt,
      isPastDue: w.isPastDue,
      botCount: w._count.typebots,
    })),
    total,
  });
});
