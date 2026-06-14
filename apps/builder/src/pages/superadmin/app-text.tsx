import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type AppTextMap = Record<string, Record<string, string>>;

const SECTION_LABELS: Record<string, string> = {
  onboarding: "Onboarding Screens",
  pushNotifications: "Push Notification Templates",
  emptyStates: "Empty State Messages",
  general: "General / App-wide",
};

export default function AppTextPage() {
  const [data, setData] = useState<AppTextMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = () => {
    fetch("/api/superadmin/app-text")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setField = (slug: string, key: string, value: string) =>
    setData((d) => ({ ...d, [slug]: { ...d[slug], [key]: value } }));

  const saveSection = async (slug: string) => {
    setSaving(slug);
    await fetch("/api/superadmin/app-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, content: data[slug] }),
    });
    setSaved(slug);
    setTimeout(() => setSaved(null), 2000);
    setSaving(null);
  };

  return (
    <SuperAdminLayout title="App Text / Mobile Content">
      <div className="mb-4 rounded-lg border border-blue-800/50 bg-blue-900/20 px-4 py-3">
        <p className="text-sm text-blue-300">
          Changes here are served via <code className="font-mono text-xs bg-blue-800/40 rounded px-1">/api/app-text</code> — your mobile app fetches this on launch so copy updates go live without an app store submission.
        </p>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(data).map(([slug, fields]) => (
            <div key={slug} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-white">{SECTION_LABELS[slug] ?? slug}</h2>
                <div className="flex items-center gap-3">
                  {saved === slug && <span className="text-sm text-green-400">✓ Saved!</span>}
                  <button onClick={() => saveSection(slug)} disabled={saving === slug} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
                    {saving === slug ? "Saving…" : "Save Section"}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(fields).map(([key, value]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-gray-400">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setField(slug, key, e.target.value)}
                      className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-2 font-semibold text-white">Public API Endpoint</h2>
        <p className="mb-3 text-sm text-gray-400">Add this endpoint to your mobile app's startup sequence:</p>
        <code className="block rounded bg-gray-800 px-4 py-3 font-mono text-sm text-green-300">GET /api/public/app-text</code>
        <p className="mt-2 text-xs text-gray-500">Returns all app text as a flat JSON object. No authentication required.</p>
      </div>
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
