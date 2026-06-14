import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type ContentRecord = { id: string; page: string; section: string; content: Record<string, unknown> };

const PAGES = ["home", "pricing", "about", "faq"];
const DEFAULT_SECTIONS: Record<string, { section: string; fields: string[] }[]> = {
  home: [
    { section: "hero", fields: ["heading", "subheading", "ctaText", "ctaUrl", "secondaryCtaText", "secondaryCtaUrl"] },
    { section: "features", fields: ["heading", "feature1Title", "feature1Description", "feature2Title", "feature2Description", "feature3Title", "feature3Description"] },
    { section: "testimonials", fields: ["heading", "testimonial1Author", "testimonial1Text", "testimonial2Author", "testimonial2Text"] },
    { section: "cta", fields: ["heading", "subheading", "buttonText", "buttonUrl"] },
  ],
  pricing: [
    { section: "hero", fields: ["heading", "subheading"] },
    { section: "faq", fields: ["q1", "a1", "q2", "a2", "q3", "a3"] },
  ],
  about: [
    { section: "hero", fields: ["heading", "subheading", "body"] },
    { section: "team", fields: ["heading", "member1Name", "member1Role", "member2Name", "member2Role"] },
  ],
  faq: [
    { section: "main", fields: ["q1", "a1", "q2", "a2", "q3", "a3", "q4", "a4", "q5", "a5"] },
  ],
};

export default function ContentPage() {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [activePage, setActivePage] = useState("home");
  const [form, setForm] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/superadmin/content?page=${activePage}`)
      .then((r) => r.json())
      .then((data: ContentRecord[]) => {
        setRecords(data);
        const f: Record<string, Record<string, string>> = {};
        for (const r of data) f[r.section] = r.content as Record<string, string>;
        setForm(f);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [activePage]);

  const setField = (section: string, field: string, value: string) =>
    setForm((f) => ({ ...f, [section]: { ...f[section], [field]: value } }));

  const saveSection = async (section: string) => {
    setSaving(true);
    await fetch("/api/superadmin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: activePage, section, content: form[section] ?? {} }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const sections = DEFAULT_SECTIONS[activePage] ?? [];

  return (
    <SuperAdminLayout title="Homepage / Content Manager">
      <div className="mb-5 flex gap-2 border-b border-gray-800 pb-3">
        {PAGES.map((p) => (
          <button key={p} onClick={() => setActivePage(p)} className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${activePage === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}>
            {p}
          </button>
        ))}
        {saved && <span className="ml-auto self-center text-sm text-green-400">✓ Saved!</span>}
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-6">
          {sections.map(({ section, fields }) => (
            <div key={section} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold capitalize text-white">{section} Section</h3>
                <button onClick={() => saveSection(section)} disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50">
                  {saving ? "Saving…" : "Save Section"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-gray-400 capitalize">
                      {field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </label>
                    {field.toLowerCase().includes("body") || field.toLowerCase().includes("description") || field.startsWith("a") ? (
                      <textarea
                        rows={3}
                        value={(form[section]?.[field] as string) ?? ""}
                        onChange={(e) => setField(section, field, e.target.value)}
                        className="w-full resize-none rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={(form[section]?.[field] as string) ?? ""}
                        onChange={(e) => setField(section, field, e.target.value)}
                        className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
