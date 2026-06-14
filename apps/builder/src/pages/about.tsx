import type { GetServerSideProps } from "next";
import { useState } from "react";
import { MarketingLayout } from "@/features/marketing/components/MarketingLayout";
import {
  getMarketingData,
  type MarketingBranding,
} from "@/features/marketing/lib/getMarketingData";

type Props = {
  branding: MarketingBranding;
  hero: Record<string, string>;
  mission: Record<string, string>;
  contact: Record<string, string>;
};

const DEFAULT_HERO = {
  badge: "About us",
  title: "We're on a mission to make\nconversations convert",
  subtitle: "AI Chat Bot Pro was born from a simple belief: talking to customers should be as easy as texting a friend — and as powerful as a full sales team.",
};

const DEFAULT_MISSION = {
  title: "Why we built this",
  body: "Static forms and live-chat widgets were leaving billions of dollars on the table. We saw teams losing leads to complicated multi-page forms that felt impersonal and robotic.\n\nWe set out to build a tool that makes every visitor interaction feel like a real conversation — one that guides, qualifies, and converts automatically, without requiring a developer or a big budget.\n\nToday, thousands of teams use AI Chat Bot Pro to capture more leads, close deals faster, and deliver a better customer experience at scale.",
};

const DEFAULT_CONTACT = {
  title: "Get in touch",
  subtitle: "Have a question or want to see a demo? Send us a message and we'll get back to you within one business day.",
};

type FormState = "idle" | "submitting" | "success" | "error";

export default function AboutPage({ branding, hero, mission, contact }: Props) {
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <MarketingLayout branding={branding} title="About" description={hero.subtitle}>
      {/* Hero */}
      <section className="bg-white pt-16 pb-14 sm:pt-24 text-center">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          {hero.badge && (
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5" style={{ background: `${branding.primaryColor}12`, color: branding.primaryColor }}>
              {hero.badge}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-5">
            {(hero.title ?? DEFAULT_HERO.title).split("\n").map((l, i) => (
              <span key={i} className={i === 1 ? "block brand-grad-text" : "block"}>{l}</span>
            ))}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{hero.subtitle ?? DEFAULT_HERO.subtitle}</p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">{mission.title ?? DEFAULT_MISSION.title}</h2>
          <div className="text-slate-700 leading-relaxed space-y-4">
            {(mission.body ?? DEFAULT_MISSION.body).split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10 text-center">What we stand for</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Simplicity first", desc: "We ruthlessly cut complexity. If it takes more than a minute to understand, we redesign it." },
              { icon: "🔒", title: "Privacy by default", desc: "Your data and your customers' data never leaves your control. We're GDPR-compliant by design." },
              { icon: "🚀", title: "Builders welcome", desc: "Whether you're a solo founder or a Fortune 500 team, our platform grows with you." },
            ].map((v) => (
              <div key={v.title} className="p-6 rounded-2xl border border-slate-100 text-center">
                <span className="text-3xl mb-3 block">{v.icon}</span>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" className="py-16 sm:py-24" style={{ background: `${branding.primaryColor}06` }}>
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">{contact.title ?? DEFAULT_CONTACT.title}</h2>
            <p className="text-slate-600">{contact.subtitle ?? DEFAULT_CONTACT.subtitle}</p>
            {branding.supportEmail && (
              <a href={`mailto:${branding.supportEmail}`} className="inline-block mt-3 text-sm font-semibold" style={{ color: branding.primaryColor }}>
                {branding.supportEmail}
              </a>
            )}
          </div>

          {status === "success" ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent!</h3>
              <p className="text-slate-600">We'll get back to you within one business day.</p>
              <button onClick={() => setStatus("idle")} className="mt-6 text-sm font-semibold" style={{ color: branding.primaryColor }}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name *</label>
                  <input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow" style={{ focusRingColor: branding.primaryColor } as React.CSSProperties} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-shadow" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject</label>
                <input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-shadow" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message *</label>
                <textarea required rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us what's on your mind…" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-shadow resize-none" />
              </div>
              {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{errorMsg}</p>
              )}
              <button type="submit" disabled={status === "submitting"} className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ background: grad }}>
                {status === "submitting" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { branding, sections } = await getMarketingData("about", {
    hero: DEFAULT_HERO as unknown as Record<string, unknown>,
    mission: DEFAULT_MISSION as unknown as Record<string, unknown>,
    contact: DEFAULT_CONTACT as unknown as Record<string, unknown>,
  });

  return {
    props: {
      branding,
      hero: sections.hero ?? DEFAULT_HERO,
      mission: sections.mission ?? DEFAULT_MISSION,
      contact: sections.contact ?? DEFAULT_CONTACT,
    },
  };
};
