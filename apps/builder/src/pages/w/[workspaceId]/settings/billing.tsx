import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "@typebot.io/ui/icons/LoaderCircleIcon";
import { TriangleAlertIcon } from "@typebot.io/ui/icons/TriangleAlertIcon";
import { CheckmarkSquare02Icon } from "@typebot.io/ui/icons/CheckmarkSquare02Icon";
import { useRouter } from "next/router";
import { useState } from "react";
import { Seo } from "@/components/Seo";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { orpc } from "@/lib/queryClient";
import { toast } from "@/lib/toast";

const fmt = (date: Date | string | null | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const fmtMoney = (cents: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

const getDaysRemaining = (date: Date | string | null | undefined) => {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    TRIALING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    PAST_DUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    CANCELED: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    TRIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    OPEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
};

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingInterval: string;
  maxBots: number;
  maxLeadsPerMonth: number;
  teamSeats: number;
  brandingRemoval: boolean;
  whiteLabelAllowed: boolean;
  apiAccess: boolean;
  mobileAppAccess: boolean;
  stripePriceId: string | null;
  paypalPlanId: string | null;
};

type Provider = "STRIPE" | "PAYPAL";

export default function BillingSettingsPage() {
  const router = useRouter();
  const workspaceId = router.query.workspaceId?.toString() ?? "";

  const [selectedProvider, setSelectedProvider] = useState<Provider>("STRIPE");
  const [switchWarningPlan, setSwitchWarningPlan] = useState<Plan | null>(null);

  const { data, isLoading, error } = useQuery(
    orpc.billing.getOrgBilling.queryOptions({
      input: { workspaceId },
      enabled: !!workspaceId,
    }),
  );

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery(
    orpc.billing.getOrgInvoices.queryOptions({
      input: { workspaceId },
      enabled: !!workspaceId,
    }),
  );

  const { mutate: createPayPalSub, isPending: isCreatingPayPal } = useMutation(
    orpc.billing.createPayPalSubscription.mutationOptions({
      onSuccess: (data) => {
        window.location.href = data.approvalUrl;
      },
      onError: (err) => {
        toast({ type: "error", title: "PayPal error", description: err.message });
      },
    }),
  );

  const { mutate: createStripeSub, isPending: isCreatingStripe } = useMutation(
    orpc.billing.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        window.location.href = data.checkoutUrl;
      },
      onError: (err) => {
        toast({ type: "error", title: "Stripe error", description: err.message });
      },
    }),
  );

  const { mutate: getBillingPortal, isPending: isPortalLoading } = useMutation(
    orpc.billing.getBillingPortalUrl.mutationOptions({
      onSuccess: (data) => {
        window.location.href = data.billingPortalUrl;
      },
      onError: (err) => {
        toast({ type: "error", title: "Portal error", description: err.message });
      },
    }),
  );

  const handleUpgrade = (plan: Plan) => {
    const provider =
      data?.currentSubscription?.paymentProvider === "PAYPAL"
        ? "PAYPAL"
        : selectedProvider;

    if (provider === "PAYPAL") {
      if (!plan.paypalPlanId) {
        toast({
          type: "error",
          title: "PayPal not available",
          description: "This plan is not available via PayPal. Please use Stripe.",
        });
        return;
      }
      createPayPalSub({
        workspaceId,
        planSlug: plan.slug,
        returnUrl: `${window.location.origin}/w/${workspaceId}/settings/billing?upgraded=1`,
        cancelUrl: window.location.href,
      });
    } else {
      const stripeCompatiblePlan =
        plan.slug === "starter" || plan.slug === "pro"
          ? (plan.slug.toUpperCase() as "STARTER" | "PRO")
          : null;

      if (!stripeCompatiblePlan) {
        toast({
          type: "error",
          title: "Stripe checkout unavailable",
          description: "Contact sales for Enterprise plans.",
        });
        return;
      }
      createStripeSub({
        workspaceId,
        plan: stripeCompatiblePlan,
        returnUrl: `${window.location.origin}/w/${workspaceId}/settings/billing?upgraded=1`,
      });
    }
  };

  const currentPlan = data?.currentSubscription?.plan;
  const isOnPaidPlan = currentPlan && currentPlan.price > 0;
  const trialDays =
    data?.workspace.status === "TRIAL"
      ? getDaysRemaining(data.workspace.trialEndsAt)
      : null;

  const currentProvider = data?.currentSubscription?.paymentProvider as
    | Provider
    | undefined;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Seo title="Billing" />
      <DashboardHeader />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Billing
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your subscription, payment method, and invoices.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <LoaderCircleIcon className="animate-spin size-8 text-violet-600" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <TriangleAlertIcon className="size-5 shrink-0" />
            <span>Failed to load billing info. Please refresh.</span>
          </div>
        )}

        {data && (
          <>
            {/* Trial / Past Due Banner */}
            {trialDays !== null && (
              <div
                className={`rounded-lg border p-4 flex items-start gap-3 ${
                  trialDays <= 2
                    ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800"
                    : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800"
                }`}
              >
                <TriangleAlertIcon
                  className={`size-5 shrink-0 mt-0.5 ${trialDays <= 2 ? "text-red-600" : "text-yellow-600"}`}
                />
                <div>
                  <p className={`font-medium ${trialDays <= 2 ? "text-red-800 dark:text-red-300" : "text-yellow-800 dark:text-yellow-300"}`}>
                    {trialDays === 0
                      ? "Your free trial has ended"
                      : `${trialDays} day${trialDays === 1 ? "" : "s"} left in your trial`}
                  </p>
                  <p className={`text-sm mt-0.5 ${trialDays <= 2 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                    Trial ends {fmt(data.workspace.trialEndsAt)}. Choose a plan below to keep your bots running.
                  </p>
                </div>
              </div>
            )}

            {data.workspace.isPastDue && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 flex items-start gap-3">
                <TriangleAlertIcon className="size-5 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">Payment past due</p>
                  <p className="text-sm mt-0.5 text-red-600 dark:text-red-400">
                    Your last payment failed. Please update your payment method to restore access.
                  </p>
                </div>
              </div>
            )}

            {/* Current Subscription */}
            <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Current Plan
                </h2>
              </div>
              <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {currentPlan?.name ?? "Free Trial"}
                    </span>
                    {data.currentSubscription && (
                      <StatusBadge status={data.currentSubscription.status} />
                    )}
                    {!data.currentSubscription && data.workspace.status === "TRIAL" && (
                      <StatusBadge status="TRIAL" />
                    )}
                  </div>
                  {currentPlan && currentPlan.price > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${currentPlan.price}/month
                      {data.currentSubscription?.currentPeriodEnd && (
                        <> · Renews {fmt(data.currentSubscription.currentPeriodEnd)}</>
                      )}
                      {data.currentSubscription?.cancelAtPeriodEnd && (
                        <span className="ml-2 text-red-500">
                          (cancels at period end)
                        </span>
                      )}
                    </p>
                  )}
                  {currentProvider && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-1">
                      Payment via{" "}
                      <span className="font-medium">
                        {currentProvider === "PAYPAL" ? "PayPal" : "Stripe"}
                      </span>
                    </p>
                  )}
                </div>

                {/* Manage subscription button */}
                {isOnPaidPlan && currentProvider === "STRIPE" && (
                  <button
                    onClick={() =>
                      getBillingPortal({
                        workspaceId,
                        returnUrl: window.location.href,
                      })
                    }
                    disabled={isPortalLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {isPortalLoading ? (
                      <LoaderCircleIcon className="animate-spin size-4" />
                    ) : null}
                    Manage subscription
                  </button>
                )}
              </div>
            </div>

            {/* Payment Provider Selection (for new subscriptions) */}
            {!isOnPaidPlan && (
              <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Choose payment method
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedProvider("STRIPE")}
                    className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedProvider === "STRIPE"
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      💳 Stripe
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Credit / debit card, bank transfer
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedProvider("PAYPAL")}
                    className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedProvider === "PAYPAL"
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      🅿 PayPal
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      PayPal balance, linked cards
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Switch provider (for paid subscriptions) */}
            {isOnPaidPlan && (
              <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Switch payment method
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Switching from{" "}
                  {currentProvider === "PAYPAL" ? "PayPal to Stripe" : "Stripe to PayPal"}{" "}
                  will cancel your current subscription and create a new one.
                  You will not be charged twice for the same period.
                </p>
                <button
                  onClick={() => setSwitchWarningPlan(currentPlan)}
                  className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Switch to {currentProvider === "PAYPAL" ? "Stripe" : "PayPal"}
                </button>

                {switchWarningPlan && (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 p-4">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-3">
                      ⚠️ This will cancel your current{" "}
                      {currentProvider === "PAYPAL" ? "PayPal" : "Stripe"}{" "}
                      subscription. You&apos;ll be redirected to complete the new subscription.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSwitchWarningPlan(null);
                          const newProvider: Provider =
                            currentProvider === "PAYPAL" ? "STRIPE" : "PAYPAL";
                          if (newProvider === "PAYPAL") {
                            createPayPalSub({
                              workspaceId,
                              planSlug: switchWarningPlan.slug,
                              returnUrl: `${window.location.origin}/w/${workspaceId}/settings/billing?switched=1`,
                              cancelUrl: window.location.href,
                            });
                          } else {
                            const stripeCompatiblePlan =
                              switchWarningPlan.slug === "starter" ||
                              switchWarningPlan.slug === "pro"
                                ? (switchWarningPlan.slug.toUpperCase() as "STARTER" | "PRO")
                                : null;
                            if (stripeCompatiblePlan) {
                              createStripeSub({
                                workspaceId,
                                plan: stripeCompatiblePlan,
                                returnUrl: `${window.location.origin}/w/${workspaceId}/settings/billing?switched=1`,
                              });
                            }
                          }
                        }}
                        disabled={isCreatingPayPal || isCreatingStripe}
                        className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700 transition-colors disabled:opacity-50"
                      >
                        {(isCreatingPayPal || isCreatingStripe) && (
                          <LoaderCircleIcon className="animate-spin size-4" />
                        )}
                        Yes, switch
                      </button>
                      <button
                        onClick={() => setSwitchWarningPlan(null)}
                        className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plan Comparison Table */}
            {data.plans.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {isOnPaidPlan ? "Change plan" : "Choose a plan"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
                  {data.plans.map((plan) => {
                    const isCurrent = currentPlan?.id === plan.id;
                    const isUpgrade =
                      !currentPlan ||
                      plan.price > (currentPlan?.price ?? 0);

                    return (
                      <div
                        key={plan.id}
                        className={`p-5 flex flex-col gap-4 ${isCurrent ? "bg-violet-50 dark:bg-violet-950/20" : ""}`}
                      >
                        <div>
                          {isCurrent && (
                            <span className="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
                              Current plan
                            </span>
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {plan.name}
                          </h3>
                          <div className="mt-1">
                            {plan.price === 0 ? (
                              <span className="text-xl font-bold text-violet-600">
                                Free
                              </span>
                            ) : (
                              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                ${plan.price}
                                <span className="text-sm font-normal text-gray-500">/mo</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 flex-1">
                          <li className="flex items-center gap-2">
                            <CheckmarkSquare02Icon className="size-4 text-violet-500 shrink-0" />
                            {plan.maxBots === 999 ? "Unlimited" : plan.maxBots} bots
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckmarkSquare02Icon className="size-4 text-violet-500 shrink-0" />
                            {plan.maxLeadsPerMonth.toLocaleString()} responses/mo
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckmarkSquare02Icon className="size-4 text-violet-500 shrink-0" />
                            {plan.teamSeats} seat{plan.teamSeats > 1 ? "s" : ""}
                          </li>
                          {plan.brandingRemoval && (
                            <li className="flex items-center gap-2">
                              <CheckmarkSquare02Icon className="size-4 text-green-500 shrink-0" />
                              Remove branding
                            </li>
                          )}
                          {plan.whiteLabelAllowed && (
                            <li className="flex items-center gap-2">
                              <CheckmarkSquare02Icon className="size-4 text-green-500 shrink-0" />
                              White-label
                            </li>
                          )}
                          {plan.apiAccess && (
                            <li className="flex items-center gap-2">
                              <CheckmarkSquare02Icon className="size-4 text-green-500 shrink-0" />
                              API access
                            </li>
                          )}
                          {plan.mobileAppAccess && (
                            <li className="flex items-center gap-2">
                              <CheckmarkSquare02Icon className="size-4 text-green-500 shrink-0" />
                              Mobile app
                            </li>
                          )}
                        </ul>

                        {plan.price > 0 && !isCurrent && (
                          <button
                            onClick={() => handleUpgrade(plan)}
                            disabled={isCreatingStripe || isCreatingPayPal}
                            className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                              isUpgrade
                                ? "bg-violet-600 text-white hover:bg-violet-700"
                                : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {(isCreatingStripe || isCreatingPayPal) && (
                              <LoaderCircleIcon className="animate-spin size-4" />
                            )}
                            {isUpgrade ? "Upgrade" : "Downgrade"}
                          </button>
                        )}

                        {plan.slug === "enterprise" && (
                          <a
                            href="mailto:sales@aichatbotpro.com"
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Contact sales
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invoice History */}
            <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Invoice history
                </h2>
              </div>

              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderCircleIcon className="animate-spin size-6 text-violet-600" />
                </div>
              ) : !invoicesData?.invoices.length ? (
                <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No invoices yet. They will appear here after your first payment.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {invoicesData.invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                          {fmt(inv.createdAt)}
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {fmtMoney(inv.amount, inv.currency)}
                        </td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                          {inv.provider === "PAYPAL" ? "PayPal" : "Stripe"}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-6 py-3 text-right">
                          {inv.pdfUrl ? (
                            <a
                              href={inv.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
                            >
                              Download PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">
                              {inv.provider === "PAYPAL"
                                ? `TX: ${inv.providerInvoiceId.slice(0, 12)}…`
                                : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
