import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type LogEntry = {
  id: string; createdAt: string; adminId: string; adminEmail: string;
  action: string; target: string | null; details: Record<string, unknown> | null;
};

const ACTION_COLORS: Record<string, string> = {
  UPDATE_BRANDING: "text-blue-400",
  UPDATE_GATEWAY: "text-yellow-400",
  CREATE_PLAN: "text-green-400",
  UPDATE_PLAN: "text-green-300",
  DELETE_PLAN: "text-red-400",
  SUSPEND_CLIENT: "text-red-400",
  REACTIVATE_CLIENT: "text-green-400",
  CHANGE_PLAN: "text-yellow-400",
  EXTEND_TRIAL: "text-blue-400",
  DELETE_CLIENT: "text-red-500",
  UPDATE_CONTENT: "text-purple-400",
  UPDATE_EMAIL_TEMPLATE: "text-indigo-400",
  UPDATE_APP_TEXT: "text-teal-400",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 50;

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit), ...(action ? { action } : {}) });
    fetch(`/api/superadmin/audit?${q}`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs); setTotal(d.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, action]);

  const exportCsv = () => {
    const rows = [["Timestamp", "Admin", "Action", "Target", "Details"], ...logs.map((l) => [
      new Date(l.createdAt).toISOString(), l.adminEmail, l.action, l.target ?? "", JSON.stringify(l.details ?? {}),
    ])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <SuperAdminLayout title="Audit Log">
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          placeholder="Filter by action…"
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none w-52"
        />
        <span className="ml-auto self-center text-sm text-gray-500">{total} entries</span>
        <button onClick={exportCsv} className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800">Export CSV</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              {["Timestamp", "Admin", "Action", "Target", "Details"].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-500">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-gray-500">No audit logs yet.</td></tr>
            ) : logs.map((l) => (
              <>
                <tr
                  key={l.id}
                  onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                  className="cursor-pointer border-t border-gray-800 hover:bg-gray-800/40"
                >
                  <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{l.adminEmail}</td>
                  <td className={`px-4 py-2.5 font-mono text-xs font-medium ${ACTION_COLORS[l.action] ?? "text-gray-300"}`}>{l.action}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{l.target ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{l.details ? "click to expand" : "—"}</td>
                </tr>
                {expanded === l.id && l.details && (
                  <tr key={`${l.id}-exp`} className="border-t border-gray-800 bg-gray-800/30">
                    <td colSpan={5} className="px-4 py-3">
                      <pre className="text-xs text-gray-300 font-mono overflow-x-auto">{JSON.stringify(l.details, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </>
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
