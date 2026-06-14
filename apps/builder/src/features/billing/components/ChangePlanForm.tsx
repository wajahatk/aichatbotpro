import { useEffect, useState } from "react";
import { useTranslate } from "@tolgee/react";
import { Plan } from "@typebot.io/prisma/enum";
import { Button } from "@typebot.io/ui/components/Button";
import { TickIcon } from "@typebot.io/ui/icons/TickIcon";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import type { WorkspaceInApp } from "@/features/workspace/WorkspaceProvider";
import { isSelfHostedInstance } from "@/helpers/isSelfHostedInstance";
import { orpc, queryClient } from "@/lib/queryClient";
import { toast } from "@/lib/toast";

type SaaSPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billingInterval: string;
  currency: string;
  maxBots: number;
  maxLeadsPerMonth: number;
  teamSeats: number;
  features: string[];
  stripePriceId: string | null;
  whiteLabelAllowed: boolean;
  apiAccess: boolean;
  customDomainEnabled: boolean;
  brandingRemoval: boolean;
};

type PublicBranding = {
  appName: string;
  supportEmail: string;
  websiteUrl: string;
};

type Props = {
  workspace: WorkspaceInApp;
  currentUserMode?: "guest" | "read" | "write";
  excludedPlans?: ("STARTER" | "PRO")[];
};

/**
 * Maps a SubscriptionPlan slug to the Prisma Plan enum for Stripe checkout.
 * Only STARTER and PRO are wired to Stripe; all other slugs get contact flow.
 */
const SLUG_TO_PLAN: Record<string, Plan> = {
  starter: Plan.STARTER,
  pro: Plan.PRO,
};

const formatPrice = (priceCents: number, currency: string, interval: string) => {
  const amount = priceCents / 100;
  const sym = currency.toLowerCase() === "eur" ? "€" : "$";
  const period = interval === "YEARLY" ? "/yr" : "/mo";
  return `${sym}${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}${period}`;
};

export const ChangePlanForm = ({
  workspace,
  currentUserMode,
}: Props) => {
  const { t } = useTranslate();
  const router = useRouter();
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  // Mirror original subscription-state guard: skip Stripe status queries on
  // self-hosted instances (which includes this deployment).
  const { data: subscriptionData } = useQuery(
    orpc.billing.getSubscription.queryOptions({
      input: { workspaceId: workspace.id },
      enabled: !isSelfHostedInstance(),
    }),
  );

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPlans(data))
      .catch(() => {});
    fetch("/api/public/branding")
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  const { mutate: createCheckoutSession } = useMutation(
    orpc.billing.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        router.push(data.checkoutUrl);
      },
      onError: (error) => {
        setLoadingPlanId(null);
        toast({ type: "error", title: t("errorMessage"), description: error.message });
      },
    }),
  );

  const { mutate: updateSubscription } = useMutation(
    orpc.billing.updateSubscription.mutationOptions({
      onSuccess: (data) => {
        setLoadingPlanId(null);
        if (data.type === "checkoutUrl") { window.location.href = data.checkoutUrl; return; }
        if (data.type === "error") {
          toast({ type: "error", title: data.title, description: data.description ?? undefined });
          return;
        }
        queryClient.invalidateQueries({ queryKey: orpc.workspace.getWorkspace.key() });
        toast({ type: "success", description: "Plan updated successfully." });
      },
      onError: (error) => {
        setLoadingPlanId(null);
        toast({ type: "error", title: t("errorMessage"), description: error.message });
      },
    }),
  );

  // Subscription-state guards (mirrors original behavior):
  // hide plan options when the subscription is cancelling or past-due.
  if (
    subscriptionData?.subscription?.cancelDate ||
    subscriptionData?.subscription?.status === "past_due"
  )
    return null;

  if (currentUserMode !== "write")
    return (
      <p className="text-sm text-gray-500">
        Only workspace admins can change the subscription plan.
      </p>
    );

  if (plans.length === 0) return null;

  const openContactUrl = (planName?: string) => {
    const email = branding?.supportEmail;
    const website = branding?.websiteUrl ?? "#";
    const dest = email
      ? `mailto:${email}?subject=${encodeURIComponent(planName ? `Upgrade inquiry – ${planName}` : "Plan inquiry")}`
      : website;
    window.open(dest, "_blank");
  };

  const handleUpgradeClick = (plan: SaaSPlan) => {
    const mappedPlan = plan.stripePriceId ? SLUG_TO_PLAN[plan.slug.toLowerCase()] : undefined;

    // If no Stripe price ID or slug doesn't map to a known Plan enum, use contact flow.
    if (!mappedPlan) {
      openContactUrl(plan.name);
      return;
    }

    setLoadingPlanId(plan.id);
    if (workspace.stripeId && workspace.plan !== Plan.FREE) {
      updateSubscription({ plan: mappedPlan, workspaceId: workspace.id, returnUrl: window.location.href });
    } else {
      createCheckoutSession({ workspaceId: workspace.id, returnUrl: window.location.href, plan: mappedPlan });
    }
  };

  const contactUrl = branding?.supportEmail
    ? `mailto:${branding.supportEmail}?subject=${encodeURIComponent("Enterprise inquiry")}`
    : branding?.websiteUrl ?? "#";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-stretch gap-4 flex-wrap">
        {plans.map((plan) => {
          const isCurrent = workspace.plan.toLowerCase() === plan.slug.toLowerCase();
          const isLoading = loadingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className="flex flex-col gap-4 p-5 rounded-lg border flex-1 min-w-[180px] justify-between"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-gray-500">{plan.description}</p>
                )}
                <p className="text-2xl font-bold">
                  {plan.price === 0
                    ? "Free"
                    : formatPrice(plan.price, plan.currency, plan.billingInterval)}
                </p>
                {plan.features.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-sm">
                        <TickIcon className="size-4 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={() => handleUpgradeClick(plan)}
                disabled={isCurrent || isLoading}
                className="w-full"
              >
                {isCurrent
                  ? "Current plan"
                  : isLoading
                  ? "Loading…"
                  : plan.price === 0
                  ? "Select"
                  : "Upgrade"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-500">
        Need a custom plan?{" "}
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 hover:text-blue-700"
        >
          Contact us
        </a>
      </p>
    </div>
  );
};
