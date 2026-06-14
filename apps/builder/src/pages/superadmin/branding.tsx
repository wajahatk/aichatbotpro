import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type Settings = {
  appName?: string; appShortName?: string; tagline?: string; supportEmail?: string;
  companyName?: string; logoUrl?: string; faviconUrl?: string;
  primaryColor?: string; secondaryColor?: string; fontFamily?: string;
  websiteUrl?: string; footerText?: string; poweredByBadge?: boolean;
  twitterUrl?: string; linkedinUrl?: string;
};

function Field({ label, name, value, onChange, type = "text", hint }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void;
  type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-300">{label}</label>
      {hint && <p className="mb-1 text-xs text-gray-500">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}

export default function BrandingPage() {
  const [form, setForm] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/superadmin/branding")
      .then((r) => r.json())
      .then(setForm)
      .finally(() => setLoading(false));
  }, []);

  const set = (name: string, value: string) =>
    setForm((f) => ({ ...f, [name]: value }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/superadmin/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  return (
    <SuperAdminLayout title="Branding & Theming">
      {loading ? (
        <div className="flex h-64 items-center justify-center text-gray-500">Loading…</div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Platform Identity</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="App Name" name="appName" value={form.appName ?? ""} onChange={set} />
              <Field label="Short Name" name="appShortName" value={form.appShortName ?? ""} onChange={set} />
              <Field label="Tagline" name="tagline" value={form.tagline ?? ""} onChange={set} />
              <Field label="Company Name" name="companyName" value={form.companyName ?? ""} onChange={set} />
              <Field label="Support Email" name="supportEmail" value={form.supportEmail ?? ""} onChange={set} type="email" />
              <Field label="Website URL" name="websiteUrl" value={form.websiteUrl ?? ""} onChange={set} type="url" />
              <div className="sm:col-span-2">
                <Field label="Footer Text" name="footerText" value={form.footerText ?? ""} onChange={set} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Brand Assets</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo URL" name="logoUrl" value={form.logoUrl ?? ""} onChange={set} hint="Full URL to your logo SVG or PNG" />
              <Field label="Favicon URL" name="faviconUrl" value={form.faviconUrl ?? ""} onChange={set} hint="Full URL to favicon" />
            </div>
            {form.logoUrl && (
              <div className="mt-4 flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
                <span className="text-xs text-gray-400">Logo preview:</span>
                <img src={form.logoUrl} alt="Logo preview" className="h-8 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Colors & Typography</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={form.primaryColor ?? "#6B5CE7"} onChange={(e) => set("primaryColor", e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-gray-700 bg-transparent p-0.5" />
                  <input type="text" value={form.primaryColor ?? ""} onChange={(e) => set("primaryColor", e.target.value)} className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Secondary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={form.secondaryColor ?? "#0EA5E9"} onChange={(e) => set("secondaryColor", e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-gray-700 bg-transparent p-0.5" />
                  <input type="text" value={form.secondaryColor ?? ""} onChange={(e) => set("secondaryColor", e.target.value)} className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
              <Field label="Font Family" name="fontFamily" value={form.fontFamily ?? ""} onChange={set} hint='e.g. "Inter", sans-serif' />
            </div>
            <div className="mt-4 rounded-lg border border-gray-700 p-4" style={{ fontFamily: form.fontFamily || "inherit" }}>
              <p className="text-xs text-gray-500 mb-2">Live preview</p>
              <h3 className="text-xl font-bold" style={{ color: form.primaryColor || "#6B5CE7" }}>{form.appName || "AI Chat Bot Pro"}</h3>
              <p className="text-sm" style={{ color: form.secondaryColor || "#0EA5E9" }}>{form.tagline || "Build faster, Chat smarter"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Social Links</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Twitter / X URL" name="twitterUrl" value={form.twitterUrl ?? ""} onChange={set} type="url" />
              <Field label="LinkedIn URL" name="linkedinUrl" value={form.linkedinUrl ?? ""} onChange={set} type="url" />
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Badge Settings</h2>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.poweredByBadge ?? true}
                onChange={(e) => setForm((f) => ({ ...f, poweredByBadge: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-600 accent-indigo-600"
              />
              <span className="text-sm text-gray-300">Show "Powered by AI Chat Bot Pro" badge globally</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">Individual plans can override this setting.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Branding"}
            </button>
            {saved && <span className="text-sm text-green-400">✓ Saved!</span>}
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
