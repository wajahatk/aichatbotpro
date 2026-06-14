import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/features/superadmin/components/SuperAdminLayout";
import { withSuperAdmin } from "@/features/superadmin/hoc/withSuperAdmin";

type Plan = {
  id: string; name: string; slug: string; description: string | null;
  price: number; billingInterval: string; currency: string;
  maxBots: number; maxLeadsPerMonth: number; teamSeats: number; sortOrder: number;
  whiteLabelAllowed: boolean; apiAccess: boolean; mobileAppAccess: boolean;
  customDomainEnabled: boolean; brandingRemoval: boolean;
  isVisible: boolean; isActive: boolean;
  stripePriceId: string | null; paypalPlanId: string | null;
  features: string[];
};

const emptyPlan: Omit<Plan, "id"> = {
  name: "", slug: "", description: "", price: 0, billingInterval: "MONTHLY", currency: "usd",
  maxBots: 3, maxLeadsPerMonth: 200, teamSeats: 1, sortOrder: 0,
  whiteLabelAllowed: false, apiAccess: false, mobileAppAccess: false,
  customDomainEnabled: false, brandingRemoval: false, isVisible: true, isActive: true,
  stripePriceId: "", paypalPlanId: "", features: [],
};

function PlanModal({ plan, onClose, onSave }: {
  plan: Partial<Plan> & { id?: string }; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({ ...emptyPlan, ...plan });
  const [saving, setSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState(
    (Array.isArray(plan.features) ? plan.features : []).join("\n")
  );
  const isNew = !plan.id;

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const body = { ...form, features: featuresText.split("\n").map((s) => s.trim()).filter(Boolean) };
    const url = isNew ? "/api/superadmin/plans" : `/api/superadmin/plans/${plan.id}`;
    await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    onSave();
    setSaving(false);
    onClose();
  };

  const boolFields: [string, string][] = [
    ["whiteLabelAllowed", "White Label"],
    ["apiAccess", "API Access"],
    ["mobileAppAccess", "Mobile App"],
    ["customDomainEnabled", "Custom Domain"],
    ["brandingRemoval", "Remove Branding"],
    ["isVisible", "Visible"],
    ["isActive", "Active"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">{isNew ? "Create Plan" : "Edit Plan"}</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Slug</label>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Description</label>
            <input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Price (cents)</label>
              <input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Interval</label>
              <select value={form.billingInterval} onChange={(e) => set("billingInterval", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none">
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Currency</label>
              <input value={form.currency} onChange={(e) => set("currency", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Max Bots</label>
              <input type="number" value={form.maxBots} onChange={(e) => set("maxBots", Number(e.target.value))} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Max Leads/Month</label>
              <input type="number" value={form.maxLeadsPerMonth} onChange={(e) => set("maxLeadsPerMonth", Number(e.target.value))} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Team Seats</label>
              <input type="number" value={form.teamSeats} onChange={(e) => set("teamSeats", Number(e.target.value))} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {boolFields.map(([k, l]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={(form as any)[k]} onChange={(e) => set(k, e.target.checked)} className="accent-indigo-600" />
                {l}
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Stripe Price ID</label>
              <input value={form.stripePriceId ?? ""} onChange={(e) => set("stripePriceId", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none font-mono" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">PayPal Plan ID</label>
              <input value={form.paypalPlanId ?? ""} onChange={(e) => set("paypalPlanId", e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none font-mono" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Features (one per line)</label>
            <textarea rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:outline-none resize-none" />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">{saving ? "Saving…" : "Save Plan"}</button>
          <button onClick={onClose} className="rounded-lg border border-gray-700 px-5 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Plan> | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/superadmin/plans").then((r) => r.json()).then(setPlans).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/superadmin/plans/${id}`, { method: "DELETE" });
    load();
  };

  const fmtPrice = (p: number, interval: string) =>
    `$${(p / 100).toFixed(2)}/${interval === "YEARLY" ? "yr" : "mo"}`;

  return (
    <SuperAdminLayout title="Plans & Pricing">
      {modal !== null && <PlanModal plan={modal} onClose={() => setModal(null)} onSave={load} />}
      <div className="mb-4 flex justify-end">
        <button onClick={() => setModal(emptyPlan as any)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500">+ New Plan</button>
      </div>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                {["Name", "Price", "Bots", "Leads/Mo", "Seats", "Stripe ID", "PayPal ID", "Visible", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t border-gray-800 bg-gray-900/50 hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{fmtPrice(p.price, p.billingInterval)}</td>
                  <td className="px-4 py-3 text-gray-300">{p.maxBots}</td>
                  <td className="px-4 py-3 text-gray-300">{p.maxLeadsPerMonth}</td>
                  <td className="px-4 py-3 text-gray-300">{p.teamSeats}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.stripePriceId ? p.stripePriceId.slice(0, 18) + "…" : "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.paypalPlanId ? p.paypalPlanId.slice(0, 18) + "…" : "—"}</td>
                  <td className="px-4 py-3">{p.isVisible ? <span className="text-green-400">✓</span> : <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(p)} className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-900/30">Edit</button>
                      <button onClick={() => del(p.id, p.name)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No plans yet. Click "+ New Plan" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </SuperAdminLayout>
  );
}

export const getServerSideProps = withSuperAdmin(async () => ({ props: {} }));
