import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });
    return res.status(200).json(plans);
  }

  if (req.method === "POST") {
    const {
      name, slug, description, price, billingInterval, currency,
      maxBots, maxLeadsPerMonth, teamSeats, sortOrder,
      whiteLabelAllowed, apiAccess, mobileAppAccess,
      customDomainEnabled, brandingRemoval, isVisible, isActive,
      stripePriceId, paypalPlanId, features,
    } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name, slug, description,
        price: Number(price ?? 0),
        billingInterval: billingInterval ?? "MONTHLY",
        currency: currency ?? "usd",
        maxBots: maxBots != null ? Number(maxBots) : 3,
        maxLeadsPerMonth: maxLeadsPerMonth != null ? Number(maxLeadsPerMonth) : 200,
        teamSeats: teamSeats != null ? Number(teamSeats) : 1,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
        whiteLabelAllowed: !!whiteLabelAllowed,
        apiAccess: !!apiAccess,
        mobileAppAccess: !!mobileAppAccess,
        customDomainEnabled: !!customDomainEnabled,
        brandingRemoval: !!brandingRemoval,
        isVisible: isVisible !== false,
        isActive: isActive !== false,
        stripePriceId: stripePriceId ?? null,
        paypalPlanId: paypalPlanId ?? null,
        features: Array.isArray(features) ? features : [],
      },
    });
    await logAudit(admin.id, admin.email, "CREATE_PLAN", plan.id, { name: plan.name });
    return res.status(201).json(plan);
  }

  return res.status(405).end();
});
