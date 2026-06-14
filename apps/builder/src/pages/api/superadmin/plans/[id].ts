import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

export default withSuperAdminApi(async (req, res, admin) => {
  const { id } = req.query as { id: string };

  if (req.method === "PUT") {
    const {
      name, slug, description, price, billingInterval, currency,
      maxBots, maxLeadsPerMonth, teamSeats, sortOrder,
      whiteLabelAllowed, apiAccess, mobileAppAccess,
      customDomainEnabled, brandingRemoval, isVisible, isActive,
      stripePriceId, paypalPlanId, features,
    } = req.body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name != null && { name }),
        ...(slug != null && { slug }),
        ...(description != null && { description }),
        ...(price != null && { price: Number(price) }),
        ...(billingInterval != null && { billingInterval }),
        ...(currency != null && { currency }),
        ...(maxBots != null && { maxBots: Number(maxBots) }),
        ...(maxLeadsPerMonth != null && { maxLeadsPerMonth: Number(maxLeadsPerMonth) }),
        ...(teamSeats != null && { teamSeats: Number(teamSeats) }),
        ...(sortOrder != null && { sortOrder: Number(sortOrder) }),
        ...(whiteLabelAllowed != null && { whiteLabelAllowed: !!whiteLabelAllowed }),
        ...(apiAccess != null && { apiAccess: !!apiAccess }),
        ...(mobileAppAccess != null && { mobileAppAccess: !!mobileAppAccess }),
        ...(customDomainEnabled != null && { customDomainEnabled: !!customDomainEnabled }),
        ...(brandingRemoval != null && { brandingRemoval: !!brandingRemoval }),
        ...(isVisible != null && { isVisible: !!isVisible }),
        ...(isActive != null && { isActive: !!isActive }),
        ...(stripePriceId != null && { stripePriceId }),
        ...(paypalPlanId != null && { paypalPlanId }),
        ...(features != null && { features }),
      },
    });
    await logAudit(admin.id, admin.email, "UPDATE_PLAN", id, { name: plan.name });
    return res.status(200).json(plan);
  }

  if (req.method === "DELETE") {
    await prisma.subscriptionPlan.delete({ where: { id } });
    await logAudit(admin.id, admin.email, "DELETE_PLAN", id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
});
