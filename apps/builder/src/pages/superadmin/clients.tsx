import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type Client = {
  id: string; name: string; status: string; plan: string; mrr: number;
  ownerEmail: string; ownerName: string; createdAt: string; trialEndsAt: string | null;
  isPastDue: boolean; botCount: number;
};

const StatusBadge = ({ s }: { s: string }) => {
  const c: Record<string, string> = {
    ACTIVE: "bg-green-900/40 text-green-300",
    TRIAL: "bg-blue-900/40 text-blue-300",
    SUSPENDED: "bg-red-900/40 text-red-300",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${c[s] ?? "bg-gray-700 text-gray-400"}`}>{s}</span>;
};

function ActionModal({ client, onClose, onDone }: { client: Client; onClose: () => void; onDone: () => void }) {
  const [action, setAction] = useState<string>("");
  const [days, setDays] = useState(14);
  const [saving, setSaving] = useState(false);

  const run = async () => {
    if (!action) return;
    if (action === "delete" && !confirm(`Permanently delete "${client.name}"? This cannot be undone.`)) return;
    setSaving(true);
    await fetch(`/api/superadmin/clients/${client.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, days: action === "extend_trial" ? days : undefined }),
    });
    onDone();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h2 className="mb-1 font-bold text-white">{client.name}</h2>
        <p className="mb-5 text-xs text-gray-500">{client.ownerEmail}</p>
        <div className="space-y-2">
          {[
            ["suspend", "Suspend Account", client.status !== "SUSPENDED"],
            ["reactivate", "Reactivate Account", client.status === "SUSPENDED"],
            ["extend_trial", "Extend Trial", true],
            ["delete", "Delete & Archive", true],
          ].filter(([, , show]) => show).map(([a, label]) => (
            <label key={a as string} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 p-3 hover:bg-gray-800">
              <input type="radio" name="action" value={a as string} checked={action === a} onChange={() => setAction(a as string)} className="accent-indigo-600" />
              <span className={`text-sm ${a === "delete" ? "text-red-400" : "text-gray-200"}`}>{label as string}</span>
            </label>
          ))}
        </div>
        {action === "extend_trial" && (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-gray-400">Extend by (days)</label>
            <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={run} disabled={saving || !action} className={`rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50 ${action === "delete" ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"}`}>
            {saving ? "Running…" : "Confirm"}
          </button>
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-5 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Client | null>(null);
  const limit = 25;

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit), search, ...(status ? { status } : {}) });
    fetch(`/api/superadmin/clients?${q}`)
      .then((r) => r.json())
      .then((d) => { setClients(d.workspaces); setTotal(d.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, status]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  return (
    <SuperAdminLayout title="Client Management">
      {selected && <ActionModal client={selected} onClose={() => setSelected(null)} onDone={load} />}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none w-56"
          />
          <button type="submit" className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700">Search</button>
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">{total} clients</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              {["Org Name", "Owner", "Status", "Plan", "MRR", "Bots", "Joined", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-500">Loading…</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-500">No clients found.</td></tr>
            ) : clients.map((c) => (
              <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-100">{c.name}</p>
                  {c.isPastDue && <span className="text-xs text-red-400">Past Due</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  <p>{c.ownerName}</p>
                  <p>{c.ownerEmail}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge s={c.status} /></td>
                <td className="px-4 py-3 text-gray-300">{c.plan}</td>
                <td className="px-4 py-3 text-gray-300">{c.mrr > 0 ? `$${(c.mrr / 100).toFixed(0)}/mo` : "—"}</td>
                <td className="px-4 py-3 text-gray-400">{c.botCount}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(c)} className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-900/30">Actions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded px-3 py-1 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)} className="rounded px-3 py-1 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-40">Next →</button>
        </div>
      )}
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
