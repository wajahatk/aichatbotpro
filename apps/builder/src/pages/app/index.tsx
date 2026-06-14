import { AppLayout } from "@/features/pwa/components/AppLayout";
import { usePushSubscription } from "@/features/pwa/hooks/usePushSubscription";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = { today: number; week: number; month: number; total: number; byBot: { name: string; count: number }[] };

export default function DashboardPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const orgId = currentWorkspace?.id ?? null;
  const { subscribe, status: pushStatus } = usePushSubscription(orgId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

    Promise.all([
      fetch(`/api/orgs/${orgId}/leads?limit=100`).then((r) => r.json()),
    ]).then(([data]) => {
      const leads = data.leads ?? [];
      const total = data.total ?? 0;
      const todayCount = leads.filter((l: any) => new Date(l.createdAt) >= today).length;
      const weekCount = leads.filter((l: any) => new Date(l.createdAt) >= weekAgo).length;
      const monthCount = leads.filter((l: any) => new Date(l.createdAt) >= monthAgo).length;
      const botMap: Record<string, number> = {};
      leads.forEach((l: any) => { botMap[l.typebotName] = (botMap[l.typebotName] ?? 0) + 1; });
      const byBot = Object.entries(botMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      setStats({ today: todayCount, week: weekCount, month: monthCount, total, byBot });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orgId]);

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Push prompt */}
        {pushStatus === "idle" && orgId && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900">Enable push notifications</p>
              <p className="text-xs text-indigo-600">Get notified instantly when new leads arrive</p>
            </div>
            <button onClick={subscribe} className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg">Enable</button>
          </div>
        )}
        {pushStatus === "denied" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            Notifications blocked — re-enable in browser settings to get lead alerts.
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Today", value: stats?.today ?? "-", color: "text-indigo-600" },
            { label: "This Week", value: stats?.week ?? "-", color: "text-emerald-600" },
            { label: "This Month", value: stats?.month ?? "-", color: "text-blue-600" },
            { label: "All Time", value: stats?.total ?? "-", color: "text-gray-900" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color} ${loading ? "animate-pulse bg-gray-100 rounded text-gray-100" : ""}`}>{loading ? "000" : value}</p>
              <p className="text-xs text-gray-500 mt-1">Leads</p>
            </div>
          ))}
        </div>

        {/* By bot */}
        {stats && stats.byBot.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Leads by Bot</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.byBot.map(({ name, count }) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={name} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate">{name}</span>
                      <span className="text-sm font-semibold text-gray-900 shrink-0 ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/app/leads" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-gray-50">
            <span className="text-2xl">👥</span>
            <div><p className="text-sm font-semibold text-gray-900">View Leads</p><p className="text-xs text-gray-400">All conversations</p></div>
          </Link>
          <Link href="/app/bots" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-gray-50">
            <span className="text-2xl">🤖</span>
            <div><p className="text-sm font-semibold text-gray-900">Your Bots</p><p className="text-xs text-gray-400">Bot overview</p></div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
