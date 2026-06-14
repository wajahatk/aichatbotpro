import { AppLayout } from "@/features/pwa/components/AppLayout";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Lead = {
  id: string; createdAt: string; typebotId: string; typebotName: string; typebotPublicId: string | null;
  variables: Record<string, unknown>; isCompleted: boolean; answers: { blockId: string; content: string; createdAt: string }[];
  logs: { status: string; description: string; createdAt: string }[];
};

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isPhone(v: string) { return /^[\+\d\s\-\(\)]{7,}$/.test(v.trim()); }

export default function LeadDetailPage() {
  const router = useRouter();
  const { workspace: currentWorkspace } = useWorkspace();
  const orgId = currentWorkspace?.id;
  const leadId = router.query.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !leadId) return;
    fetch(`/api/orgs/${orgId}/leads/${leadId}`)
      .then((r) => r.json())
      .then((d) => { setLead(d.lead); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId, leadId]);

  return (
    <AppLayout title={lead ? `Lead — ${lead.typebotName}` : "Lead Detail"} back="/app/leads">
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !lead && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">🔍</p>
          <p className="text-sm">Lead not found</p>
        </div>
      )}

      {lead && (
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Header card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${lead.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {lead.isCompleted ? "✓ Completed" : "⋯ In Progress"}
              </span>
              <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString()}</span>
            </div>
            <p className="font-semibold text-gray-900">{lead.typebotName}</p>
            {lead.typebotPublicId && (
              <a href={`${process.env.NEXT_PUBLIC_VIEWER_URL ?? ""}/${lead.typebotPublicId}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline">View bot →</a>
            )}
          </div>

          {/* Quick action links */}
          {(() => {
            const vals = Object.values(lead.variables ?? {}).map(String);
            const emails = vals.filter(isEmail);
            const phones = vals.filter(isPhone);
            if (emails.length === 0 && phones.length === 0) return null;
            return (
              <div className="flex gap-2 flex-wrap">
                {phones[0] && (
                  <>
                    <a href={`tel:${phones[0]}`} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl">📞 Call</a>
                    <a href={`https://wa.me/${phones[0].replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-white text-sm font-medium rounded-xl">💬 WhatsApp</a>
                    <a href={`sms:${phones[0]}`} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl">💬 SMS</a>
                  </>
                )}
                {emails[0] && (
                  <a href={`mailto:${emails[0]}`} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl">✉ Email</a>
                )}
              </div>
            );
          })()}

          {/* Collected variables */}
          {Object.keys(lead.variables ?? {}).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Collected Data</h2>
              </div>
              <dl className="divide-y divide-gray-100">
                {Object.entries(lead.variables).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([key, val]) => (
                  <div key={key} className="px-4 py-3 flex gap-3">
                    <dt className="text-xs text-gray-400 w-24 shrink-0 pt-0.5">{key}</dt>
                    <dd className="text-sm text-gray-900 break-words flex-1">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Answers timeline */}
          {lead.answers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Answers ({lead.answers.length})</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {lead.answers.map((ans, i) => (
                  <li key={i} className="px-4 py-3">
                    <p className="text-xs text-gray-400">{new Date(ans.createdAt).toLocaleTimeString()}</p>
                    <p className="text-sm text-gray-900 mt-0.5 break-words">{ans.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
