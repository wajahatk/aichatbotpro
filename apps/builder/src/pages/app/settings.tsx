import { AppLayout } from "@/features/pwa/components/AppLayout";
import { usePushSubscription } from "@/features/pwa/hooks/usePushSubscription";
import { useUser } from "@/features/user/hooks/useUser";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type Prefs = { enabledBotIds: string[]; quietHoursStart: number | null; quietHoursEnd: number | null; quietHoursTz: string | null; dailyDigest: boolean };

export default function SettingsPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const orgId = currentWorkspace?.id ?? null;
  const { user } = useUser();
  const { status: pushStatus, subscribe } = usePushSubscription(orgId);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/orgs/${orgId}/notification-preferences`)
      .then((r) => r.json())
      .then((d) => setPrefs(d.prefs))
      .catch(() => {});
  }, [orgId]);

  const savePrefs = async () => {
    if (!orgId || !prefs) return;
    setSaving(true);
    await fetch(`/api/orgs/${orgId}/notification-preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sendTest = async () => {
    if (!orgId) return;
    await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: orgId }),
    });
    alert("Test notification sent!");
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          </div>
          <div className="px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-gray-900">{user?.name || "Your Account"}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
            {currentWorkspace && <p className="text-xs text-gray-400">Workspace: {currentWorkspace.name}</p>}
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <a href="/chatbots" className="text-xs text-indigo-600 hover:underline">Go to bot builder →</a>
          </div>
        </div>

        {/* Push notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Push Notifications</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            {pushStatus === "unsupported" && <p className="text-xs text-gray-500">Push notifications are not supported by this browser.</p>}
            {pushStatus === "denied" && <p className="text-xs text-red-600">Notifications are blocked. Enable them in your browser/OS settings.</p>}
            {pushStatus === "subscribed" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 font-medium">Active</p>
                  <p className="text-xs text-gray-400">You&apos;ll receive push alerts for new leads</p>
                </div>
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
            )}
            {(pushStatus === "idle" || pushStatus === "error") && (
              <button onClick={subscribe} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl">
                Enable Push Notifications
              </button>
            )}
            {pushStatus === "subscribed" && (
              <button onClick={sendTest} className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl">
                Send Test Notification
              </button>
            )}
          </div>
        </div>

        {/* Notification preferences */}
        {prefs && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">Daily Digest</p>
                  <p className="text-xs text-gray-400">Get a daily summary instead of instant alerts</p>
                </div>
                <button
                  onClick={() => setPrefs({ ...prefs, dailyDigest: !prefs.dailyDigest })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs.dailyDigest ? "bg-indigo-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${prefs.dailyDigest ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-900">Quiet Hours</p>
                <div className="flex gap-2 items-center">
                  <select value={prefs.quietHoursStart ?? ""} onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value ? Number(e.target.value) : null })}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white">
                    <option value="">Off</option>
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>)}
                  </select>
                  <span className="text-gray-400 text-sm">to</span>
                  <select value={prefs.quietHoursEnd ?? ""} onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value ? Number(e.target.value) : null })}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white">
                    <option value="">Off</option>
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>)}
                  </select>
                </div>
              </div>

              <button onClick={savePrefs} disabled={saving}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${saving ? "bg-gray-100 text-gray-400" : saved ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"}`}>
                {saving ? "Saving…" : saved ? "✓ Saved" : "Save Preferences"}
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full px-4 py-3.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
