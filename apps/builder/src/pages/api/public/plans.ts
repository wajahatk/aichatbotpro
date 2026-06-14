import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isVisible: true, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      billingInterval: true,
      currency: true,
      maxBots: true,
      maxLeadsPerMonth: true,
      teamSeats: true,
      features: true,
      stripePriceId: true,
      whiteLabelAllowed: true,
      apiAccess: true,
      customDomainEnabled: true,
      brandingRemoval: true,
    },
  });
  return res.status(200).json(plans);
}
