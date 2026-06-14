import { ORPCError } from "@orpc/server";
import prisma from "@typebot.io/prisma";
import type { User } from "@typebot.io/user/schemas";
import { isReadWorkspaceFobidden } from "@typebot.io/workspaces/isReadWorkspaceFobidden";
import { z } from "zod";

export const getOrgBillingInputSchema = z.object({
  workspaceId: z.string(),
});

export const handleGetOrgBilling = async ({
  input,
  context: { user },
}: {
  input: z.infer<typeof getOrgBillingInputSchema>;
  context: { user: Pick<User, "email" | "id"> };
}) => {
  const { workspaceId } = input;

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      status: true,
      trialEndsAt: true,
      planId: true,
      isPastDue: true,
      members: { select: { userId: true } },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          paymentProvider: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              maxBots: true,
              maxLeadsPerMonth: true,
              teamSeats: true,
              brandingRemoval: true,
              whiteLabelAllowed: true,
              apiAccess: true,
              mobileAppAccess: true,
              stripePriceId: true,
              paypalPlanId: true,
            },
          },
        },
      },
    },
  });

  if (!workspace || isReadWorkspaceFobidden(workspace, user)) {
    throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
  }

  const allPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      billingInterval: true,
      maxBots: true,
      maxLeadsPerMonth: true,
      teamSeats: true,
      brandingRemoval: true,
      whiteLabelAllowed: true,
      apiAccess: true,
      mobileAppAccess: true,
      stripePriceId: true,
      paypalPlanId: true,
    },
  });

  const currentSub = workspace.subscriptions[0] ?? null;

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      status: workspace.status,
      trialEndsAt: workspace.trialEndsAt,
      isPastDue: workspace.isPastDue,
    },
    currentSubscription: currentSub
      ? {
          id: currentSub.id,
          status: currentSub.status,
          paymentProvider: currentSub.paymentProvider,
          currentPeriodEnd: currentSub.currentPeriodEnd,
          cancelAtPeriodEnd: currentSub.cancelAtPeriodEnd,
          plan: currentSub.plan,
        }
      : null,
    plans: allPlans,
  };
};
