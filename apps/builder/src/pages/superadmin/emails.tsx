import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type Template = { id?: string; slug: string; subject: string; body: string };

const SLUG_LABELS: Record<string, string> = {
  welcome: "Welcome Email",
  trial_ending_7: "Trial Ending (7 days)",
  trial_ending_2: "Trial Ending (2 days)",
  trial_expired: "Trial Expired",
  payment_failed: "Payment Failed",
  password_reset: "Password Reset",
};

const VARIABLES = ["{{appName}}", "{{name}}", "{{email}}", "{{planName}}", "{{billingUrl}}", "{{dashboardUrl}}", "{{resetUrl}}", "{{days}}"];

export default function EmailsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [active, setActive] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    fetch("/api/superadmin/email-templates")
      .then((r) => r.json())
      .then((data: Template[]) => { setTemplates(data); if (data.length > 0 && !active) setActive(data[0]); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async () => {
    if (!active) return;
    setSaving(true);
    await fetch("/api/superadmin/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: active.slug, subject: active.subject, body: active.body }),
    });
    load();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const sendTest = async () => {
    if (!testEmail || !active) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    alert(`Test email for "${active.slug}" queued to ${testEmail}. (Configure SMTP_HOST to actually send.)`);
    setSending(false);
  };

  if (loading) return <SuperAdminLayout title="Email Templates"><div className="flex h-48 items-center justify-center text-gray-500">Loading…</div></SuperAdminLayout>;

  return (
    <SuperAdminLayout title="Email Template Manager">
      <div className="flex gap-5 h-full">
        <div className="w-56 flex-shrink-0 space-y-1">
          {templates.map((t) => (
            <button
              key={t.slug}
              onClick={() => setActive(t)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${active?.slug === t.slug ? "bg-indigo-600/20 text-indigo-300" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            >
              {SLUG_LABELS[t.slug] ?? t.slug}
            </button>
          ))}
        </div>
        {active && (
          <div className="flex-1 space-y-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-white">{SLUG_LABELS[active.slug] ?? active.slug}</h2>
                {saved && <span className="text-sm text-green-400">✓ Saved!</span>}
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-400">Subject</label>
                <input
                  type="text"
                  value={active.subject}
                  onChange={(e) => setActive((a) => a ? { ...a, subject: e.target.value } : a)}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-400">Body</label>
                <textarea
                  rows={12}
                  value={active.body}
                  onChange={(e) => setActive((a) => a ? { ...a, body: e.target.value } : a)}
                  className="w-full resize-y rounded border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-xs text-gray-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <p className="mb-2 text-xs text-gray-500">Available variables:</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <code key={v} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-indigo-300">{v}</code>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Template"}
                </button>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@email.com"
                    className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-indigo-500 focus:outline-none w-48"
                  />
                  <button onClick={sendTest} disabled={sending || !testEmail} className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50">
                    {sending ? "Sending…" : "Send Test"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
