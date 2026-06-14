import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type Gateway = { id: string; slug: string; mode: string; isActive: boolean; keys: Record<string, string> };

const GATEWAY_FIELDS: Record<string, { label: string; fields: string[] }> = {
  stripe: {
    label: "Stripe",
    fields: ["publishableKey", "secretKey", "webhookSecret"],
  },
  paypal: {
    label: "PayPal",
    fields: ["clientId", "clientSecret", "webhookId"],
  },
};

function GatewayCard({ slug, gateway, onSave }: {
  slug: string;
  gateway?: Gateway;
  onSave: () => void;
}) {
  const meta = GATEWAY_FIELDS[slug];
  const [keys, setKeys] = useState<Record<string, string>>(gateway?.keys ?? {});
  const [mode, setMode] = useState(gateway?.mode ?? "sandbox");
  const [isActive, setIsActive] = useState(gateway?.isActive ?? false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch("/api/superadmin/gateways", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, mode, isActive, keys }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
    setSaving(false);
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/superadmin/gateways/test?slug=${slug}`);
      const json = await res.json();
      setTestResult(json.ok ? "✓ Connection successful" : `✗ ${json.error}`);
    } catch {
      setTestResult("✗ Network error");
    }
    setTesting(false);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">{meta.label}</h2>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
          <span className="text-sm text-gray-400">Active</span>
        </label>
      </div>
      {slug === "paypal" && (
        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-400">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none">
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="live">Live (Production)</option>
          </select>
        </div>
      )}
      <div className="space-y-3">
        {meta.fields.map((field) => (
          <div key={field}>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              {field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
            </label>
            <input
              type="text"
              value={keys[field] ?? ""}
              onChange={(e) => setKeys((k) => ({ ...k, [field]: e.target.value }))}
              placeholder={field.toLowerCase().includes("secret") || field.toLowerCase().includes("key") ? "sk_••••••••" : ""}
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 font-mono text-xs text-gray-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 items-center">
        <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={test} disabled={testing} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50">
          {testing ? "Testing…" : "Test Connection"}
        </button>
        {saved && <span className="text-sm text-green-400">✓ Saved!</span>}
        {testResult && (
          <span className={`text-sm ${testResult.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{testResult}</span>
        )}
      </div>
    </div>
  );
}

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/superadmin/gateways")
      .then((r) => r.json())
      .then(setGateways)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <SuperAdminLayout title="Payment Gateway Settings">
      <div className="mb-4 rounded-lg border border-yellow-800/50 bg-yellow-900/20 px-4 py-3">
        <p className="text-sm text-yellow-300">
          <strong>Security:</strong> All keys are encrypted at rest using AES-GCM. Saved values are masked — only the last 4 characters are visible. Entering a new value replaces the stored one.
        </p>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-6">
          {["stripe", "paypal"].map((slug) => (
            <GatewayCard
              key={slug}
              slug={slug}
              gateway={gateways.find((g) => g.slug === slug)}
              onSave={load}
            />
          ))}
        </div>
      )}
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
