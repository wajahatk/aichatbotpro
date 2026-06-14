import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Seo } from "@/components/Seo";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { getProviders, signIn, useSession } from "next-auth/react";

type ConnectedAccount = {
  provider: string;
  type: string;
};

type AccountsData = {
  accounts: ConnectedAccount[];
  hasEmailLogin: boolean;
  totalLoginMethods: number;
};

type ProviderInfo = {
  id: string;
  name: string;
  type: string;
};

const PROVIDER_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  google: { label: "Google", color: "#4285F4", icon: "G" },
  facebook: { label: "Facebook", color: "#1877F2", icon: "f" },
  github: { label: "GitHub", color: "#24292F", icon: "GH" },
  "microsoft-entra-id": { label: "Microsoft", color: "#00A4EF", icon: "M" },
  apple: { label: "Apple", color: "#000000", icon: "🍎" },
  nodemailer: { label: "Email (magic link)", color: "#6B7280", icon: "✉️" },
};

const OAUTH_PROVIDER_IDS = new Set([
  "google",
  "facebook",
  "github",
  "microsoft-entra-id",
  "apple",
  "gitlab",
  "keycloak",
  "custom-oauth",
]);

export default function AccountSecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AccountsData | null>(null);
  const [activeProviders, setActiveProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/user/connected-accounts").then((r) => r.json()),
        getProviders(),
      ])
        .then(([accountsData, providers]) => {
          setData(accountsData);
          const oauthProviders = Object.values(providers ?? {})
            .filter((p): p is ProviderInfo => !!p && OAUTH_PROVIDER_IDS.has(p.id));
          setActiveProviders(oauthProviders);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load account information.");
          setLoading(false);
        });
    }
  }, [status, router]);

  const handleUnlink = async (provider: string) => {
    if (!confirm(`Unlink your ${PROVIDER_DISPLAY[provider]?.label ?? provider} account?`)) return;
    setUnlinking(provider);
    setError("");
    try {
      const res = await fetch(`/api/user/connected-accounts?provider=${provider}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Unlink failed");
      setData((prev) =>
        prev
          ? {
              ...prev,
              accounts: prev.accounts.filter((a) => a.provider !== provider),
              totalLoginMethods: prev.totalLoginMethods - 1,
            }
          : prev,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unlink failed");
    } finally {
      setUnlinking(null);
    }
  };

  const handleLink = (provider: string) => {
    signIn(provider, { callbackUrl: "/account/security" });
  };

  const linkedProviders = new Set(data?.accounts.map((a) => a.provider) ?? []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Seo title="Account Security" />
      <DashboardHeader />
      <main className="flex-1 px-4 py-8 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href={`/chatbots`}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Account Security
            </h1>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Connected Accounts */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
              Connected accounts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Link social accounts to sign in with one click. You must always keep at least one
              login method active.
            </p>

            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
                {/* Email */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">
                      ✉️
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Email (magic link)
                      </p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Connected
                  </span>
                </div>

                {/* Only show OAuth providers that are currently active */}
                {activeProviders.length === 0 && (
                  <p className="py-4 text-sm text-gray-400 text-center">
                    No social login providers are currently enabled by your administrator.
                  </p>
                )}

                {activeProviders.map((provider) => {
                  const meta = PROVIDER_DISPLAY[provider.id] ?? {
                    label: provider.name,
                    color: "#6B7280",
                    icon: provider.name.charAt(0).toUpperCase(),
                  };
                  const isLinked = linkedProviders.has(provider.id);
                  const canUnlink =
                    isLinked &&
                    (data?.totalLoginMethods ?? 0) > 1;

                  return (
                    <div key={provider.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.icon}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {meta.label}
                        </p>
                      </div>
                      {isLinked ? (
                        <button
                          type="button"
                          onClick={() => handleUnlink(provider.id)}
                          disabled={!canUnlink || unlinking === provider.id}
                          title={
                            !canUnlink
                              ? "Cannot unlink your only login method"
                              : undefined
                          }
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            canUnlink
                              ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              : "border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {unlinking === provider.id ? "Unlinking…" : "Unlink"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLink(provider.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          Link
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-500 dark:text-gray-400">
            <strong className="text-gray-700 dark:text-gray-300">Account linking: </strong>
            If you sign in with a social account using the same email address as an existing
            account, they are automatically linked — your workspaces and data are preserved.
            Only providers enabled by your platform administrator appear on the login page.
          </div>
        </div>
      </main>
    </div>
  );
}
