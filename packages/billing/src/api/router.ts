import {
  authenticatedProcedure,
  publicProcedure,
} from "@typebot.io/config/orpc/builder/middlewares";
import { workspaceSchema } from "@typebot.io/workspaces/schemas";
import { z } from "zod";
import { invoiceSchema } from "../schemas/invoice";
import { subscriptionSchema } from "../schemas/subscription";
import {
  createCheckoutSessionInputSchema,
  handleCreateCheckoutSession,
} from "./handleCreateCheckoutSession";
import {
  createCustomCheckoutSessionInputSchema,
  handleCreateCustomCheckoutSession,
} from "./handleCreateCustomCheckoutSession";
import {
  getBillingPortalUrlInputSchema,
  handleGetBillingPortalUrl,
} from "./handleGetBillingPortalUrl";
import {
  getSubscriptionInputSchema,
  handleGetSubscription,
} from "./handleGetSubscription";
import {
  getSubscriptionPreviewInputSchema,
  handleGetSubscriptionPreview,
} from "./handleGetSubscriptionPreview";
import { getUsageInputSchema, handleGetUsage } from "./handleGetUsage";
import {
  handleListInvoices,
  listInvoicesInputSchema,
} from "./handleListInvoices";
import {
  handleStripeWebhook,
  stripeWebhookInputSchema,
} from "./handleStripeWebhook";
import {
  handleUpdateSubscription,
  updateSubscriptionInputSchema,
} from "./handleUpdateSubscription";
import {
  createPayPalSubscriptionInputSchema,
  handleCreatePayPalSubscription,
} from "./handleCreatePayPalSubscription";
import {
  paypalWebhookInputSchema,
  handlePayPalWebhook,
} from "./handlePayPalWebhook";
import {
  getOrgBillingInputSchema,
  handleGetOrgBilling,
} from "./handleGetOrgBilling";
import {
  getOrgInvoicesInputSchema,
  handleGetOrgInvoices,
} from "./handleGetOrgInvoices";

export const billingRouter = {
  webhook: publicProcedure
    .route({
      method: "POST",
      path: "/stripe/webhook",
      summary: "Handle webhook",
      tags: ["Billing"],
      inputStructure: "detailed",
    })
    .input(stripeWebhookInputSchema)
    .output(z.object({ message: z.string() }))
    .handler(handleStripeWebhook),

  paypalWebhook: publicProcedure
    .route({
      method: "POST",
      path: "/paypal/webhook",
      summary: "Handle PayPal webhook",
      tags: ["Billing"],
      inputStructure: "detailed",
    })
    .input(paypalWebhookInputSchema)
    .output(z.object({ message: z.string() }))
    .handler(handlePayPalWebhook),

  createPayPalSubscription: authenticatedProcedure
    .route({
      method: "POST",
      path: "/v1/billing/paypal/subscription",
      summary: "Create PayPal subscription approval URL",
      tags: ["Billing"],
    })
    .input(createPayPalSubscriptionInputSchema)
    .output(
      z.object({ approvalUrl: z.string(), subscriptionId: z.string() }),
    )
    .handler(handleCreatePayPalSubscription),

  getOrgBilling: authenticatedProcedure
    .route({
      method: "GET",
      path: "/v1/billing/org",
      summary: "Get organization billing status and plans",
      tags: ["Billing"],
    })
    .input(getOrgBillingInputSchema)
    .output(
      z.object({
        workspace: z.object({
          id: z.string(),
          name: z.string(),
          status: z.string(),
          trialEndsAt: z.date().nullable(),
          isPastDue: z.boolean(),
        }),
        currentSubscription: z
          .object({
            id: z.string(),
            status: z.string(),
            paymentProvider: z.string(),
            currentPeriodEnd: z.date().nullable(),
            cancelAtPeriodEnd: z.boolean(),
            plan: z
              .object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                price: z.number(),
                maxBots: z.number(),
                maxLeadsPerMonth: z.number(),
                teamSeats: z.number(),
                brandingRemoval: z.boolean(),
                whiteLabelAllowed: z.boolean(),
                apiAccess: z.boolean(),
                mobileAppAccess: z.boolean(),
                stripePriceId: z.string().nullable(),
                paypalPlanId: z.string().nullable(),
              })
              .nullable(),
          })
          .nullable(),
        plans: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            price: z.number(),
            billingInterval: z.string(),
            maxBots: z.number(),
            maxLeadsPerMonth: z.number(),
            teamSeats: z.number(),
            brandingRemoval: z.boolean(),
            whiteLabelAllowed: z.boolean(),
            apiAccess: z.boolean(),
            mobileAppAccess: z.boolean(),
            stripePriceId: z.string().nullable(),
            paypalPlanId: z.string().nullable(),
          }),
        ),
      }),
    )
    .handler(handleGetOrgBilling),

  getOrgInvoices: authenticatedProcedure
    .route({
      method: "GET",
      path: "/v1/billing/org/invoices",
      summary: "Get organization invoice history",
      tags: ["Billing"],
    })
    .input(getOrgInvoicesInputSchema)
    .output(
      z.object({
        invoices: z.array(
          z.object({
            id: z.string(),
            createdAt: z.date(),
            amount: z.number(),
            currency: z.string(),
            status: z.string(),
            provider: z.string(),
            providerInvoiceId: z.string(),
            pdfUrl: z.string().nullable(),
          }),
        ),
      }),
    )
    .handler(handleGetOrgInvoices),

  getUsage: authenticatedProcedure
    .route({
      method: "GET",
      path: "/v1/billing/usage",
      summary: "Get current plan usage",
      tags: ["Billing"],
    })
    .input(getUsageInputSchema)
    .output(z.object({ totalChatsUsed: z.number(), resetsAt: z.date() }))
    .handler(handleGetUsage),

  listInvoices: authenticatedProcedure
    .route({
      method: "GET",
      path: "/v1/billing/invoices",
      summary: "List invoices",
      tags: ["Billing"],
    })
    .input(listInvoicesInputSchema)
    .output(
      z.object({
        invoices: z.array(invoiceSchema),
      }),
    )
    .handler(handleListInvoices),
  createCheckoutSession: authenticatedProcedure
    .input(createCheckoutSessionInputSchema)
    .output(
      z.object({
        checkoutUrl: z.string(),
      }),
    )
    .handler(handleCreateCheckoutSession),

  createCustomCheckoutSession: authenticatedProcedure
    .input(createCustomCheckoutSessionInputSchema)
    .output(
      z.object({
        checkoutUrl: z.string(),
      }),
    )
    .handler(handleCreateCustomCheckoutSession),

  getBillingPortalUrl: authenticatedProcedure
    .input(getBillingPortalUrlInputSchema)
    .output(
      z.object({
        billingPortalUrl: z.string(),
      }),
    )
    .handler(handleGetBillingPortalUrl),

  getSubscription: authenticatedProcedure
    .input(getSubscriptionInputSchema)
    .output(
      z.object({
        subscription: subscriptionSchema.or(z.null()),
      }),
    )
    .handler(handleGetSubscription),

  getSubscriptionPreview: authenticatedProcedure
    .input(getSubscriptionPreviewInputSchema)
    .output(
      z.object({
        amountDue: z.number(),
        currency: z.enum(["usd", "eur"]),
      }),
    )
    .handler(handleGetSubscriptionPreview),

  updateSubscription: authenticatedProcedure
    .input(updateSubscriptionInputSchema)
    .output(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("success"),
          workspace: workspaceSchema,
        }),
        z.object({
          type: z.literal("error"),
          title: z.string(),
          description: z.string().nullish(),
        }),
        z.object({
          type: z.literal("checkoutUrl"),
          checkoutUrl: z.string(),
        }),
      ]),
    )
    .handler(handleUpdateSubscription),
};
