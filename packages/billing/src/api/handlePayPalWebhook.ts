import { ORPCError } from "@orpc/server";
import { env } from "@typebot.io/env";
import prisma from "@typebot.io/prisma";
import { z } from "zod";
import { verifyPayPalWebhookSignature } from "../helpers/paypal";

export const paypalWebhookInputSchema = z.object({
  body: z.string(),
  headers: z.object({
    "paypal-auth-algo": z.string().optional(),
    "paypal-cert-url": z.string().optional(),
    "paypal-transmission-id": z.string().optional(),
    "paypal-transmission-sig": z.string().optional(),
    "paypal-transmission-time": z.string().optional(),
  }),
});

type PayPalEvent = {
  event_type: string;
  resource: {
    id: string;
    status?: string;
    plan_id?: string;
    custom_id?: string;
    billing_info?: {
      next_billing_time?: string;
      last_payment?: {
        amount: { currency_code: string; value: string };
        time: string;
      };
    };
    amount?: { total: string; currency: string };
    create_time?: string;
    state?: string;
  };
};

export const handlePayPalWebhook = async ({
  input: { body, headers },
}: {
  input: z.infer<typeof paypalWebhookInputSchema>;
}) => {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "PayPal is not configured",
    });
  }

  const isValid = await verifyPayPalWebhookSignature({
    headers: headers as Record<string, string>,
    body,
  });

  if (!isValid && env.NODE_ENV === "production") {
    throw new ORPCError("UNAUTHORIZED", {
      message: "PayPal webhook signature verification failed",
    });
  }

  const event = JSON.parse(body) as PayPalEvent;
  const { event_type, resource } = event;

  switch (event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const subscriptionId = resource.id;
      const customId = resource.custom_id
        ? (JSON.parse(resource.custom_id) as {
            workspaceId: string;
            planSlug: string;
          })
        : null;

      if (!customId?.workspaceId) {
        return { message: "No workspaceId in custom_id, skipping" };
      }

      const { workspaceId, planSlug } = customId;

      const plan = await prisma.subscriptionPlan.findFirst({
        where: { slug: planSlug },
      });

      if (!plan) return { message: "Plan not found, skipping" };

      const nextBillingTime = resource.billing_info?.next_billing_time;

      await prisma.$transaction([
        prisma.orgSubscription.updateMany({
          where: { workspaceId },
          data: {
            status: "ACTIVE",
            paymentProvider: "PAYPAL",
            planId: plan.id,
            cancelAtPeriodEnd: false,
            currentPeriodEnd: nextBillingTime
              ? new Date(nextBillingTime)
              : null,
          },
        }),
        prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            paypalSubscriptionId: subscriptionId,
            status: "ACTIVE",
            isPastDue: false,
          },
        }),
      ]);

      return { message: "Workspace activated via PayPal" };
    }

    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const workspace = await prisma.workspace.findFirst({
        where: { paypalSubscriptionId: resource.id },
        select: { id: true },
      });

      if (!workspace) return { message: "Workspace not found, skipping" };

      await prisma.$transaction([
        prisma.orgSubscription.updateMany({
          where: { workspaceId: workspace.id },
          data: { status: "CANCELED", cancelAtPeriodEnd: false },
        }),
        prisma.workspace.update({
          where: { id: workspace.id },
          data: { status: "SUSPENDED" },
        }),
      ]);

      return { message: "Workspace suspended due to PayPal cancellation" };
    }

    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      const workspace = await prisma.workspace.findFirst({
        where: { paypalSubscriptionId: resource.id },
        select: { id: true },
      });

      if (!workspace) return { message: "Workspace not found, skipping" };

      await prisma.orgSubscription.updateMany({
        where: { workspaceId: workspace.id },
        data: { status: "PAST_DUE" },
      });
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { isPastDue: true },
      });

      return { message: "Workspace marked past due via PayPal" };
    }

    case "PAYMENT.SALE.COMPLETED": {
      const billingAgreementId =
        (
          resource as unknown as {
            billing_agreement_id?: string;
          }
        ).billing_agreement_id ?? resource.id;

      const workspace = await prisma.workspace.findFirst({
        where: { paypalSubscriptionId: billingAgreementId },
        select: { id: true, paypalSubscriptionId: true },
      });

      if (!workspace) return { message: "No matching workspace, skipping" };

      const amountStr = resource.amount?.total ?? "0";
      const currency = resource.amount?.currency ?? "USD";
      const amountCents = Math.round(parseFloat(amountStr) * 100);

      await prisma.orgInvoice.upsert({
        where: { providerInvoiceId: resource.id },
        create: {
          workspaceId: workspace.id,
          amount: amountCents,
          currency: currency.toLowerCase(),
          status: "PAID",
          provider: "PAYPAL",
          providerInvoiceId: resource.id,
        },
        update: { status: "PAID" },
      });

      return { message: "PayPal invoice recorded" };
    }

    default:
      return { message: `Unhandled event type: ${event_type}` };
  }
};
