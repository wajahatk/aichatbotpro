import { ORPCError } from "@orpc/server";
import { env } from "@typebot.io/env";
import prisma from "@typebot.io/prisma";
import type { User } from "@typebot.io/user/schemas";
import { isAdminWriteWorkspaceForbidden } from "@typebot.io/workspaces/isAdminWriteWorkspaceForbidden";
import { z } from "zod";
import { createPayPalSubscriptionApprovalUrl } from "../helpers/paypal";

export const createPayPalSubscriptionInputSchema = z.object({
  workspaceId: z.string(),
  planSlug: z.string(),
  returnUrl: z.string(),
  cancelUrl: z.string(),
});

export const handleCreatePayPalSubscription = async ({
  input,
  context: { user },
}: {
  input: z.infer<typeof createPayPalSubscriptionInputSchema>;
  context: { user: Pick<User, "email" | "id"> };
}) => {
  const { workspaceId, planSlug, returnUrl, cancelUrl } = input;

  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "PayPal is not configured on this server",
    });
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId },
    select: {
      members: { select: { userId: true, role: true } },
    },
  });

  if (!workspace || isAdminWriteWorkspaceForbidden(workspace, user)) {
    throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { slug: planSlug },
    select: { id: true, paypalPlanId: true, name: true },
  });

  if (!plan) {
    throw new ORPCError("NOT_FOUND", { message: "Plan not found" });
  }

  if (!plan.paypalPlanId) {
    throw new ORPCError("BAD_REQUEST", {
      message: `PayPal plan not configured for plan "${plan.name}". Contact support.`,
    });
  }

  const { approvalUrl, subscriptionId } =
    await createPayPalSubscriptionApprovalUrl({
      paypalPlanId: plan.paypalPlanId,
      workspaceId,
      planSlug,
      returnUrl,
      cancelUrl,
    });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { paypalSubscriptionId: subscriptionId },
  });

  return { approvalUrl, subscriptionId };
};
