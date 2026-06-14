import { AppLayout } from "@/features/pwa/components/AppLayout";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { useEffect, useState } from "react";

type Bot = { id: string; name: string; isArchived: boolean; isClosed: boolean; publicId: string | null; createdAt: string };

export default function BotsPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const orgId = currentWorkspace?.id;
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/orgs/${orgId}/bots`)
      .then((r) => r.json())
      .then((d) => { setBots(d.typebots ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId]);

  return (
    <AppLayout title="Bots">
      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bots.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🤖</p>
            <p className="text-sm font-medium">No bots yet</p>
            <p className="text-xs mt-1">Create your first bot in the builder</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {bots.map((bot) => (
              <li key={bot.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{bot.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Created {new Date(bot.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                    bot.isArchived ? "bg-gray-100 text-gray-500"
                    : bot.isClosed ? "bg-red-100 text-red-700"
                    : bot.publicId ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                    {bot.isArchived ? "Archived" : bot.isClosed ? "Closed" : bot.publicId ? "Published" : "Draft"}
                  </span>
                </div>
                {bot.publicId && (
                  <div className="mt-3 flex gap-2">
                    <a href={`${process.env.NEXT_PUBLIC_VIEWER_URL ?? ""}/${bot.publicId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium">Preview ↗</a>
                    <a href={`/chatbots/${bot.id}/edit`}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-medium">Edit →</a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
