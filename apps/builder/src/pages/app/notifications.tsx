import { AppLayout } from "@/features/pwa/components/AppLayout";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

type LeadEvent = { id: string; createdAt: string; typebotId: string; typebotName: string; resultId: string; variables: Record<string, unknown>; seen: boolean };

function notifBody(ev: LeadEvent) {
  const vars = Object.entries(ev.variables ?? {}).filter(([, v]) => v).slice(0, 2).map(([, v]) => String(v)).join(", ");
  return vars || "New response received";
}

export default function NotificationsPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const orgId = currentWorkspace?.id;
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/orgs/${orgId}/lead-events`)
      .then((r) => r.json())
      .then((d) => { setEvents(d.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId]);

  return (
    <AppLayout title="Notifications">
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs mt-1">New lead alerts will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 bg-white">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link href={`/app/leads/${ev.resultId}`} className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${ev.seen ? "bg-gray-300" : "bg-indigo-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">New lead from {ev.typebotName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{notifBody(ev)}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatDate(ev.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
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
  return d.toLocaleDateString();
}
