import { ORPCError } from "@orpc/server";
import prisma from "@typebot.io/prisma";
import type { User } from "@typebot.io/user/schemas";
import { isReadWorkspaceFobidden } from "@typebot.io/workspaces/isReadWorkspaceFobidden";
import { z } from "zod";

export const getOrgStatsInputSchema = z.object({
  workspaceId: z.string(),
});

export const orgStatsSchema = z.object({
  botCount: z.number(),
  memberCount: z.number(),
  monthlyResponseCount: z.number(),
  responsesResetsAt: z.date(),
  plan: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      maxBots: z.number(),
      maxLeadsPerMonth: z.number(),
      teamSeats: z.number(),
      brandingRemoval: z.boolean(),
      whiteLabelAllowed: z.boolean(),
      apiAccess: z.boolean(),
      mobileAppAccess: z.boolean(),
      price: z.number(),
    })
    .nullable(),
  subscription: z
    .object({
      status: z.string(),
      currentPeriodEnd: z.date().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      paymentProvider: z.string(),
    })
    .nullable(),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable(),
    ownerUserId: z.string().nullable(),
    status: z.string(),
    trialEndsAt: z.date().nullable(),
  }),
});

export type OrgStats = z.infer<typeof orgStatsSchema>;

export const handleGetOrgStats = async ({
  input: { workspaceId },
  context: { user },
}: {
  input: z.infer<typeof getOrgStatsInputSchema>;
  context: { user: Pick<User, "id" | "email"> };
}) => {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      ownerUserId: true,
      status: true,
      trialEndsAt: true,
      planId: true,
      members: { select: { userId: true } },
      typebots: {
        where: { isArchived: false },
        select: { id: true },
      },
      subscriptionPlan: {
        select: {
          id: true,
          name: true,
          slug: true,
          maxBots: true,
          maxLeadsPerMonth: true,
          teamSeats: true,
          brandingRemoval: true,
          whiteLabelAllowed: true,
          apiAccess: true,
          mobileAppAccess: true,
          price: true,
        },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          paymentProvider: true,
        },
      },
    },
  });

  if (!workspace || isReadWorkspaceFobidden(workspace, user))
    throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });

  const botIds = workspace.typebots.map((t) => t.id);

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  );

  const monthlyResponseCount =
    botIds.length > 0
      ? await prisma.result.count({
          where: {
            typebotId: { in: botIds },
            hasStarted: true,
            createdAt: { gte: firstDayOfMonth },
          },
        })
      : 0;

  return {
    botCount: botIds.length,
    memberCount: workspace.members.length,
    monthlyResponseCount,
    responsesResetsAt: firstDayOfNextMonth,
    plan: workspace.subscriptionPlan,
    subscription: workspace.subscriptions[0] ?? null,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerUserId: workspace.ownerUserId,
      status: workspace.status,
      trialEndsAt: workspace.trialEndsAt,
    },
  };
};
