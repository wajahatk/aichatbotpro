import { useQuery } from "@tanstack/react-query";
import { CheckmarkSquare02Icon } from "@typebot.io/ui/icons/CheckmarkSquare02Icon";
import { TriangleAlertIcon } from "@typebot.io/ui/icons/TriangleAlertIcon";
import { LoaderCircleIcon } from "@typebot.io/ui/icons/LoaderCircleIcon";
import { useRouter } from "next/router";
import { Seo } from "@/components/Seo";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { orpc } from "@/lib/queryClient";

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const getDaysRemaining = (date: Date | null | undefined): number | null => {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const UsageBar = ({
  used,
  max,
  label,
}: {
  used: number;
  max: number;
  label: string;
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const color =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
        ? "bg-yellow-500"
        : "bg-violet-600";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {used.toLocaleString()} / {max === 999 ? "∞" : max.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const workspaceId = router.query.workspaceId?.toString();
  const { workspace } = useWorkspace();

  const { data, isLoading, error } = useQuery(
    orpc.workspace.getOrgStats.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      enabled: !!workspaceId,
    }),
  );

  if (!workspaceId) return null;

  const trialDays =
    data?.workspace.status === "TRIAL"
      ? getDaysRemaining(data?.workspace.trialEndsAt)
      : null;

  const plan = data?.plan;
  const sub = data?.subscription;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Seo title="Organization Settings" />
      <DashboardHeader />

      <div className="mx-auto w-full max-w-3xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your organization plan, usage, and billing.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoaderCircleIcon className="animate-spin size-8 text-violet-600" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <TriangleAlertIcon className="size-5 shrink-0" />
            <span>Failed to load organization stats. Please refresh.</span>
          </div>
        )}

        {data && (
          <>
            {/* Trial Banner */}
            {data.workspace.status === "TRIAL" && trialDays !== null && (
              <div
                className={`rounded-lg border p-4 flex items-start gap-3 ${
                  trialDays <= 3
                    ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800"
                    : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800"
                }`}
              >
                <TriangleAlertIcon
                  className={`size-5 shrink-0 mt-0.5 ${trialDays <= 3 ? "text-red-600" : "text-yellow-600"}`}
                />
                <div>
                  <p
                    className={`font-medium ${trialDays <= 3 ? "text-red-800 dark:text-red-300" : "text-yellow-800 dark:text-yellow-300"}`}
                  >
                    {trialDays === 0
                      ? "Your trial has expired"
                      : `${trialDays} day${trialDays === 1 ? "" : "s"} remaining in your trial`}
                  </p>
                  <p
                    className={`text-sm mt-0.5 ${trialDays <= 3 ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}
                  >
                    Trial ends {formatDate(data.workspace.trialEndsAt)}.
                    Upgrade to keep your bots running.
                  </p>
                </div>
              </div>
            )}

            {/* Plan Card */}
            <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {plan ? plan.name : "Free Trial"}
                  </h2>
                  {sub && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Status:{" "}
                      <span
                        className={`capitalize font-medium ${
                          sub.status === "ACTIVE"
                            ? "text-green-600"
                            : sub.status === "TRIALING"
                              ? "text-yellow-600"
                              : sub.status === "PAST_DUE"
                                ? "text-red-600"
                                : "text-gray-500"
                        }`}
                      >
                        {sub.status.toLowerCase().replace("_", " ")}
                      </span>
                      {sub.currentPeriodEnd && (
                        <span>
                          {" "}
                          · Renews {formatDate(sub.currentPeriodEnd)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {plan && plan.price > 0 ? (
                    <div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ${plan.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /mo
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-violet-600">
                      Free
                    </span>
                  )}
                </div>
              </div>

              {plan && (
                <div className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Plan features
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      plan.brandingRemoval && "Branding removal",
                      plan.whiteLabelAllowed && "White-label",
                      plan.apiAccess && "API access",
                      plan.mobileAppAccess && "Mobile app",
                    ]
                      .filter(Boolean)
                      .map((feature) => (
                        <div
                          key={String(feature)}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckmarkSquare02Icon className="size-4 text-green-500 shrink-0" />
                          {feature}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Usage
              </h2>

              <UsageBar
                used={data.botCount}
                max={plan?.maxBots ?? 3}
                label="Bots"
              />
              <UsageBar
                used={data.monthlyResponseCount}
                max={plan?.maxLeadsPerMonth ?? 200}
                label={`Responses this month (resets ${formatDate(data.responsesResetsAt)})`}
              />
              <UsageBar
                used={data.memberCount}
                max={plan?.teamSeats ?? 1}
                label="Team members"
              />
            </div>

            {/* Org Details */}
            <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Organization details
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    Name
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                    {data.workspace.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    Slug
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-gray-700 dark:text-gray-300">
                    {data.workspace.slug ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </dt>
                  <dd className="mt-1 capitalize font-medium text-gray-900 dark:text-gray-100">
                    {data.workspace.status.toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">
                    Created
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(workspace?.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Account Security */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Account security
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Manage your connected social login accounts and authentication methods.
              </p>
              <a
                href="/account/security"
                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                🔐 Manage connected accounts →
              </a>
            </div>

            {/* Upgrade CTA */}
            {(!plan || plan.price === 0 || data.workspace.status === "TRIAL") && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-700 p-6">
                <h3 className="font-semibold text-violet-900 dark:text-violet-200">
                  Ready to upgrade?
                </h3>
                <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">
                  Unlock more bots, higher response limits, team seats, and
                  remove branding.
                </p>
                <div className="mt-4 flex gap-3">
                  <a
                    href={`/w/${workspaceId}/settings/billing`}
                    className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                  >
                    View plans &amp; upgrade
                  </a>
                  <a
                    href="mailto:support@aichatbotpro.com"
                    className="inline-flex items-center rounded-lg border border-violet-300 dark:border-violet-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    Contact sales
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
