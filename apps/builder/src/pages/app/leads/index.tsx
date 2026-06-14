import { AppLayout } from "@/features/pwa/components/AppLayout";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Lead = {
  id: string; createdAt: string; typebotId: string; typebotName: string;
  variables: Record<string, unknown>; isCompleted: boolean; answers: { content: string }[];
};

function leadSummary(lead: Lead) {
  const answers = lead.answers.map((a) => a.content).filter(Boolean).slice(0, 2).join(", ");
  if (answers) return answers;
  const vars = Object.entries(lead.variables ?? {}).filter(([, v]) => v).slice(0, 2).map(([, v]) => String(v)).join(", ");
  return vars || "No data collected";
}

export default function LeadsPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const orgId = currentWorkspace?.id;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [botFilter, setBotFilter] = useState("");
  const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const fetchLeads = useCallback(async (p = 1, reset = false) => {
    if (!orgId) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (search) params.set("search", search);
    if (botFilter) params.set("botId", botFilter);
    const res = await fetch(`/api/orgs/${orgId}/leads?${params}`).catch(() => null);
    if (!res?.ok) { setLoading(false); return; }
    const data = await res.json();
    const newLeads: Lead[] = data.leads ?? [];
    setLeads((prev) => reset ? newLeads : [...prev, ...newLeads]);
    setHasMore(data.page < data.pages);
    setPage(p);
    setLoading(false);
    localStorage.setItem(`leads-cache-${orgId}`, JSON.stringify(newLeads));
  }, [orgId, search, botFilter]);

  useEffect(() => {
    if (!orgId) return;
    const cached = localStorage.getItem(`leads-cache-${orgId}`);
    if (cached) { try { setLeads(JSON.parse(cached)); setLoading(false); } catch (_) {} }
    fetchLeads(1, true);
  }, [orgId, fetchLeads]);

  // SSE for real-time
  useEffect(() => {
    if (!orgId) return;
    const es = new EventSource(`/api/orgs/${orgId}/leads/stream`);
    sseRef.current = es;
    es.addEventListener("lead", () => fetchLeads(1, true));
    return () => { es.close(); };
  }, [orgId, fetchLeads]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) fetchLeads(page + 1);
    });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, page, fetchLeads]);

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 80 && window.scrollY === 0) {
      setRefreshing(true);
      fetchLeads(1, true).finally(() => setRefreshing(false));
    }
  };

  return (
    <AppLayout title="Leads">
      <div className="flex flex-col h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Search + filter */}
        <div className="sticky top-[57px] md:top-0 z-10 bg-gray-50 border-b border-gray-200 p-3 space-y-2">
          {refreshing && <p className="text-center text-xs text-indigo-600 py-1">↻ Refreshing…</p>}
          <input
            type="search" placeholder="Search leads…" value={search}
            onChange={(e) => { setSearch(e.target.value); fetchLeads(1, true); }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {bots.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => { setBotFilter(""); fetchLeads(1, true); }}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${!botFilter ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>All</button>
              {bots.map((b) => (
                <button key={b.id} onClick={() => { setBotFilter(b.id); fetchLeads(1, true); }}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${botFilter === b.id ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {leads.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-3">👥</span>
              <p className="text-sm font-medium">No leads yet</p>
              <p className="text-xs mt-1">Complete a bot conversation to see it here</p>
            </div>
          )}
          <ul className="divide-y divide-gray-100 bg-white">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link href={`/app/leads/${lead.id}`} className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${lead.isCompleted ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{leadSummary(lead)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{lead.typebotName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(lead.createdAt)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${lead.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {lead.isCompleted ? "Complete" : "In progress"}
                    </span>
                  </div>
                  <span className="text-gray-300 self-center ml-1">›</span>
                </Link>
              </li>
            ))}
          </ul>
          {loading && (
            <div className="flex justify-center p-6">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={loaderRef} className="h-4" />
        </div>
      </div>
    </AppLayout>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString();
}
