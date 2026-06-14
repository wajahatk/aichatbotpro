import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type Analytics = {
  totalWorkspaces: number;
  activeWorkspaces: number;
  trialWorkspaces: number;
  suspendedWorkspaces: number;
  newThisMonth: number;
  mrr: number;
  arr: number;
  churnRate: number;
  trialToPayConversion: number;
  monthlyGrowth: { month: string; count: number }[];
  recentClients: { id: string; name: string; status: string; createdAt: string; ownerEmail: string }[];
};

const fmt = (n: number, style: "currency" | "percent" | "decimal" = "decimal") =>
  new Intl.NumberFormat("en-US", {
    style,
    currency: "USD",
    minimumFractionDigits: style === "percent" ? 1 : 0,
    maximumFractionDigits: style === "currency" ? 0 : 1,
  }).format(style === "percent" ? n / 100 : n);

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SuperAdminLayout title="Analytics Dashboard">
      {loading ? (
        <div className="flex h-64 items-center justify-center text-gray-500">Loading…</div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Clients" value={String(data.totalWorkspaces)} sub={`+${data.newThisMonth} this month`} />
            <StatCard label="MRR" value={fmt(data.mrr, "currency")} sub={`ARR ${fmt(data.arr, "currency")}`} />
            <StatCard label="Churn Rate" value={`${data.churnRate}%`} sub="this month" />
            <StatCard label="Trial → Paid" value={`${data.trialToPayConversion}%`} sub="conversion rate" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Active" value={String(data.activeWorkspaces)} />
            <StatCard label="In Trial" value={String(data.trialWorkspaces)} />
            <StatCard label="Suspended" value={String(data.suspendedWorkspaces)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-300">Monthly Growth (New Clients)</h3>
              <div className="flex items-end gap-1 h-32">
                {data.monthlyGrowth.map((g) => {
                  const max = Math.max(...data.monthlyGrowth.map((x) => x.count), 1);
                  const pct = (g.count / max) * 100;
                  return (
                    <div key={g.month} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-indigo-600 min-h-[2px]"
                        style={{ height: `${pct}%` }}
                        title={`${g.month}: ${g.count}`}
                      />
                      <span className="text-[10px] text-gray-600 rotate-45 origin-left">{g.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-300">Recent Sign-ups</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentClients.map((c) => (
                    <tr key={c.id} className="border-t border-gray-800">
                      <td className="py-1.5 text-gray-200">{c.name}</td>
                      <td className="py-1.5 text-gray-400 text-xs">{c.ownerEmail}</td>
                      <td className="py-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          c.status === "ACTIVE" ? "bg-green-900/40 text-green-300" :
                          c.status === "TRIAL" ? "bg-blue-900/40 text-blue-300" :
                          "bg-gray-700 text-gray-400"
                        }`}>{c.status}</span>
                      </td>
                      <td className="py-1.5 text-xs text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Failed to load analytics.</p>
      )}
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
