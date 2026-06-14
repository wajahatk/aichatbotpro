import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type ProviderConfig = {
  provider: string;
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  displayName: string;
};

const PROVIDER_META: Record<
  string,
  { label: string; color: string; logo: string; callbackId: string; setupUrl: string; setupLabel: string; needsTenant?: boolean; appleNote?: boolean }
> = {
  google: {
    label: "Google",
    color: "#4285F4",
    logo: "G",
    callbackId: "google",
    setupUrl: "https://console.cloud.google.com/apis/credentials",
    setupLabel: "Google Cloud Console",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    logo: "f",
    callbackId: "facebook",
    setupUrl: "https://developers.facebook.com/apps",
    setupLabel: "Meta for Developers",
  },
  github: {
    label: "GitHub",
    color: "#24292F",
    logo: "GH",
    callbackId: "github",
    setupUrl: "https://github.com/settings/developers",
    setupLabel: "GitHub Developer Settings",
  },
  "microsoft-entra-id": {
    label: "Microsoft / Azure AD",
    color: "#00A4EF",
    logo: "M",
    callbackId: "microsoft-entra-id",
    setupUrl: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    setupLabel: "Azure Portal",
    needsTenant: true,
  },
  apple: {
    label: "Apple",
    color: "#000000",
    logo: "",
    callbackId: "apple",
    setupUrl: "https://developer.apple.com/account/resources/identifiers/list/serviceId",
    setupLabel: "Apple Developer",
    appleNote: true,
  },
};

function CallbackUrl({ callbackId }: { callbackId: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(`${window.location.origin}/api/auth/callback/${callbackId}`);
  }, [callbackId]);
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">Authorized redirect / callback URL</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded bg-gray-800 px-3 py-1.5 text-xs text-green-300 font-mono break-all">
          {url || "loading…"}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(url)}
          className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function ProviderCard({
  config,
  onSave,
}: {
  config: ProviderConfig;
  onSave: (updated: ProviderConfig) => Promise<void>;
}) {
  const meta = PROVIDER_META[config.provider];
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.logo || "🍎"}
          </div>
          <div>
            <p className="font-semibold text-white">{meta.label}</p>
            <a
              href={meta.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Get credentials → {meta.setupLabel}
            </a>
          </div>
        </div>
        {/* Enable toggle */}
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-xs text-gray-400">{form.enabled ? "Enabled" : "Disabled"}</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${
                form.enabled ? "bg-indigo-600" : "bg-gray-600"
              }`}
            />
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>
      </div>

      {meta.appleNote && (
        <div className="rounded-lg bg-yellow-900/30 border border-yellow-700/50 px-3 py-2 text-xs text-yellow-300">
          Apple Sign In requires an Apple Developer account ($99/yr). The
          Client Secret must be a pre-generated JWT — see the{" "}
          <a
            href="https://next-auth.js.org/providers/apple"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            NextAuth Apple guide
          </a>{" "}
          for how to generate it from your <code>.p8</code> key.
        </div>
      )}

      {/* Credentials */}
      <div className="grid gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Client ID</label>
          <input
            className="w-full rounded-lg bg-gray-900 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            placeholder={
              config.provider === "apple"
                ? "com.example.yourapp"
                : "Paste Client ID"
            }
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {config.provider === "apple" ? "Client Secret (JWT)" : "Client Secret"}
          </label>
          <input
            className="w-full rounded-lg bg-gray-900 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none font-mono"
            placeholder={
              config.provider === "apple"
                ? "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9…"
                : form.clientSecret.startsWith("••••")
                ? form.clientSecret
                : "Paste Client Secret"
            }
            value={form.clientSecret}
            onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
          />
        </div>
        {meta.needsTenant && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Tenant ID <span className="text-gray-600">(leave blank for multi-tenant "common")</span>
            </label>
            <input
              className="w-full rounded-lg bg-gray-900 border border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.tenantId}
              onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
            />
          </div>
        )}
      </div>

      <CallbackUrl callbackId={meta.callbackId} />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
      </button>
    </div>
  );
}

export default function AuthenticationPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    fetch("/api/superadmin/oauth")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        setLoading(false);
      })
      .catch(() => {
        setGlobalError("Failed to load provider settings.");
        setLoading(false);
      });
  }, []);

  const handleSave = async (updated: ProviderConfig) => {
    const res = await fetch("/api/superadmin/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Save failed");
    }
    setProviders((prev) =>
      prev.map((p) => (p.provider === updated.provider ? updated : p)),
    );
  };

  return (
    <SuperAdminLayout title="Social Login / Authentication">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Social Login</h1>
          <p className="text-gray-400 text-sm">
            Enable OAuth providers so users can sign in with one click. Only enabled providers
            appear as buttons on the login page. Changes take effect within 5 minutes (server
            cache TTL) or immediately after restarting the server.
          </p>
        </div>

        {globalError && (
          <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
            {globalError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            Loading provider settings…
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {providers.map((p) => (
              <ProviderCard key={p.provider} config={p} onSave={handleSave} />
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-gray-700 bg-gray-800/50 p-5">
          <h2 className="font-semibold text-white mb-3">How OAuth providers work</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
            <li>
              Go to each provider&apos;s developer console (links above) and create an OAuth app.
            </li>
            <li>
              Copy the <strong className="text-gray-200">Authorized redirect URI</strong> shown in each card above and paste it into the provider&apos;s console. This is required for the OAuth callback to work.
            </li>
            <li>
              Copy the Client ID and Secret from the provider&apos;s console into the fields above and click Save.
            </li>
            <li>
              Toggle the provider <strong className="text-gray-200">Enabled</strong>. The button will appear on the login page within 5 minutes (no restart required for first-time setup after the page loads).
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              <strong className="text-gray-400">Account linking:</strong> If a user signed up with email first and later uses the same email address via a social provider, the accounts are automatically linked (only when the provider confirms the email is verified). The user&apos;s existing workspace and data are preserved.
            </p>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
