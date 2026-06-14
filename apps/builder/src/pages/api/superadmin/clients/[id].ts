import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

export default withSuperAdminApi(async (req, res, admin) => {
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: { select: { email: true, name: true } },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 5, include: { plan: true } },
        invoices: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { typebots: true, members: true } },
      },
    });
    if (!workspace) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(workspace);
  }

  if (req.method === "POST") {
    const { action, planId, days } = req.body as {
      action: "suspend" | "reactivate" | "change_plan" | "extend_trial" | "delete";
      planId?: string;
      days?: number;
    };

    const workspace = await prisma.workspace.findUnique({ where: { id }, select: { name: true } });
    if (!workspace) return res.status(404).json({ error: "Not found" });

    if (action === "suspend") {
      await prisma.workspace.update({ where: { id }, data: { status: "SUSPENDED", isSuspended: true } });
      await logAudit(admin.id, admin.email, "SUSPEND_CLIENT", id, { name: workspace.name });
    } else if (action === "reactivate") {
      await prisma.workspace.update({ where: { id }, data: { status: "ACTIVE", isSuspended: false } });
      await logAudit(admin.id, admin.email, "REACTIVATE_CLIENT", id, { name: workspace.name });
    } else if (action === "change_plan" && planId) {
      await prisma.workspace.update({ where: { id }, data: { planId } });
      await logAudit(admin.id, admin.email, "CHANGE_PLAN", id, { name: workspace.name, planId });
    } else if (action === "extend_trial" && days) {
      const current = await prisma.workspace.findUnique({ where: { id }, select: { trialEndsAt: true } });
      const base = current?.trialEndsAt && current.trialEndsAt > new Date() ? current.trialEndsAt : new Date();
      const trialEndsAt = new Date(base.getTime() + days * 86_400_000);
      await prisma.workspace.update({ where: { id }, data: { trialEndsAt, status: "TRIAL" } });
      await logAudit(admin.id, admin.email, "EXTEND_TRIAL", id, { name: workspace.name, days });
    } else if (action === "delete") {
      await prisma.workspace.delete({ where: { id } });
      await logAudit(admin.id, admin.email, "DELETE_CLIENT", id, { name: workspace.name });
      return res.status(200).json({ ok: true, deleted: true });
    } else {
      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
});
