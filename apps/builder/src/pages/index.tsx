import type { GetServerSideProps } from "next";
import Link from "next/link";
import prisma from "@typebot.io/prisma";
import { MarketingLayout } from "@/features/marketing/components/MarketingLayout";
import {
  getMarketingData,
  type MarketingBranding,
} from "@/features/marketing/lib/getMarketingData";

type Feature = { icon: string; title: string; desc: string };
type Testimonial = { quote: string; author: string; role: string; company: string };

type Props = {
  branding: MarketingBranding;
  hero: Record<string, string>;
  features: { title: string; subtitle: string; items: Feature[] };
  testimonials: { title: string; items: Testimonial[] };
  cta: Record<string, string>;
};

const DEFAULT_HERO = {
  badge: "The #1 no-code chatbot builder",
  headline: "Build AI Chatbots\nThat Convert",
  subheadline:
    "Create powerful conversational experiences without code. Capture leads, qualify prospects, and delight customers — automatically.",
  ctaPrimary: "Start Free Trial",
  ctaSecondary: "See How It Works",
  stat1Value: "12,000+",
  stat1Label: "Bots Built",
  stat2Value: "4.2M+",
  stat2Label: "Leads Captured",
  stat3Value: "3.4×",
  stat3Label: "Avg Conversion Lift",
};

const DEFAULT_FEATURES = {
  title: "Everything you need to build, launch, and grow",
  subtitle: "One platform to replace your form builder, live chat, and lead qualification tools.",
  items: [
    { icon: "🎨", title: "Visual Flow Builder", desc: "Drag-and-drop conversation flows with 30+ block types — no code, ever." },
    { icon: "🎯", title: "Smart Lead Capture", desc: "Turn visitors into qualified leads with AI-powered conversational forms." },
    { icon: "🔌", title: "100+ Integrations", desc: "Connect your CRM, email platform, Slack, Stripe, and more in one click." },
    { icon: "🏷️", title: "White Label Ready", desc: "Remove our branding and serve bots under your own domain and brand." },
    { icon: "📱", title: "Multi-channel Deploy", desc: "Embed on any website, share as a link, or publish inside your app." },
    { icon: "📊", title: "Analytics & A/B Tests", desc: "Track completion rates, drop-off points, and run experiments to optimize." },
  ],
};

const DEFAULT_TESTIMONIALS = {
  title: "Trusted by fast-growing teams",
  items: [
    {
      quote: "We replaced 3 tools with this platform and cut our lead response time from 24 hours to 5 minutes.",
      author: "Sarah M.",
      role: "Head of Growth",
      company: "TechLaunch Co.",
    },
    {
      quote: "The visual builder is incredible. We went from idea to live chatbot in under an hour — no developer needed.",
      author: "James R.",
      role: "Founder",
      company: "Startup Studio",
    },
    {
      quote: "Our conversion rate jumped 3.4× after switching from a static form to an AI chatbot flow.",
      author: "Priya K.",
      role: "Marketing Director",
      company: "SaaS Metrics",
    },
  ],
};

const DEFAULT_CTA = {
  headline: "Ready to 10× your lead capture?",
  subheadline: "Free 14-day trial. No credit card required. Cancel any time.",
  ctaPrimary: "Start Free Trial",
  ctaSecondary: "Book a Demo",
};

export default function HomePage({ branding, hero, features, testimonials, cta }: Props) {
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;
  const gradLight = `linear-gradient(135deg, ${branding.primaryColor}15, ${branding.secondaryColor}15)`;

  return (
    <MarketingLayout branding={branding} title={undefined} description={hero.subheadline ?? undefined}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${branding.primaryColor}18, transparent)` }} />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {hero.badge && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border mb-6" style={{ borderColor: `${branding.primaryColor}40`, color: branding.primaryColor, background: `${branding.primaryColor}10` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: branding.primaryColor }} />
                {hero.badge}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900 mb-5">
              {(hero.headline ?? DEFAULT_HERO.headline).split("\n").map((line, i) => (
                <span key={i} className={i === 1 ? "block brand-grad-text" : "block"}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
              {hero.subheadline ?? DEFAULT_HERO.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/register" className="text-center text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-opacity text-sm" style={{ background: grad }}>
                {hero.ctaPrimary ?? DEFAULT_HERO.ctaPrimary}
              </Link>
              <Link href="/features" className="text-center font-medium px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm text-slate-700">
                {hero.ctaSecondary ?? DEFAULT_HERO.ctaSecondary} →
              </Link>
            </div>
            <p className="text-xs text-slate-400">✓ Free 14-day trial &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ Cancel any time</p>
          </div>

          {/* Product mockup */}
          <div className="relative">
            <div className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200" style={{ background: gradLight }}>
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-slate-400 text-xs font-mono">AI Chat Bot Pro — Builder</span>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { type: "bot", text: "Hi! What's your name?" },
                  { type: "user", text: "Alex Johnson" },
                  { type: "bot", text: "Nice to meet you, Alex! What's your email?" },
                  { type: "user", text: "alex@company.com" },
                  { type: "bot", text: "🎉 You're all set! We'll be in touch." },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium"
                      style={msg.type === "bot"
                        ? { background: "white", color: "#334155", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                        : { background: grad, color: "white" }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800/5 border-t border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs text-slate-400">Type your answer…</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ background: grad }}>→</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 w-full h-full rounded-2xl" style={{ background: `${branding.primaryColor}20` }} />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-50 border-y border-slate-100 py-10">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 grid grid-cols-3 divide-x divide-slate-200 text-center">
          {[
            { value: hero.stat1Value ?? DEFAULT_HERO.stat1Value, label: hero.stat1Label ?? DEFAULT_HERO.stat1Label },
            { value: hero.stat2Value ?? DEFAULT_HERO.stat2Value, label: hero.stat2Label ?? DEFAULT_HERO.stat2Label },
            { value: hero.stat3Value ?? DEFAULT_HERO.stat3Value, label: hero.stat3Label ?? DEFAULT_HERO.stat3Label },
          ].map((s) => (
            <div key={s.label} className="px-4 py-2">
              <div className="text-3xl font-extrabold brand-grad-text">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">{features.title}</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">{features.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.items.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-100 hover:border-transparent hover:shadow-lg transition-all duration-300" style={{ "--hover-shadow": `0 8px 40px ${branding.primaryColor}18` } as React.CSSProperties}>
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28" style={{ background: `${branding.primaryColor}06` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Up and running in minutes</h2>
            <p className="text-slate-600 text-lg">Three steps from signup to your first lead.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-10 left-1/3 right-1/3 h-0.5" style={{ background: `linear-gradient(to right, ${branding.primaryColor}40, ${branding.secondaryColor}40)` }} />
            {[
              { step: "1", title: "Create your bot", desc: "Pick a template or start from scratch. Add questions, logic, and integrations with drag-and-drop." },
              { step: "2", title: "Customize & brand it", desc: "Apply your colors, logo, and domain. Preview in real time before going live." },
              { step: "3", title: "Publish & capture leads", desc: "Share the link or embed on any site. Watch leads flow into your CRM automatically." },
            ].map((s) => (
              <div key={s.step} className="text-center relative">
                <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center text-xl font-extrabold text-white shadow-lg" style={{ background: grad }}>
                  {s.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-14">{testimonials.title}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.items.map((t) => (
              <div key={t.author} className="p-7 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl leading-none mb-4 brand-grad-text font-serif">"</div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: grad }}>
                    {t.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="rounded-3xl px-8 sm:px-14 py-14 text-center text-white relative overflow-hidden" style={{ background: grad }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 20%, white 1px, transparent 1px), radial-gradient(circle at 30% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <h2 className="relative text-3xl sm:text-4xl font-extrabold mb-4">{cta.headline ?? DEFAULT_CTA.headline}</h2>
            <p className="relative text-white/80 text-lg mb-8">{cta.subheadline ?? DEFAULT_CTA.subheadline}</p>
            <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="bg-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/90 transition-colors text-sm shadow-lg" style={{ color: branding.primaryColor }}>
                {cta.ctaPrimary ?? DEFAULT_CTA.ctaPrimary}
              </Link>
              <Link href="/about#contact" className="border border-white/40 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
                {cta.ctaSecondary ?? DEFAULT_CTA.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieToken =
    (req.cookies as Record<string, string>)["authjs.session-token"] ??
    (req.cookies as Record<string, string>)["__Secure-authjs.session-token"];
  if (cookieToken) {
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: cookieToken },
      select: { expires: true },
    });
    if (dbSession && dbSession.expires > new Date()) {
      return { redirect: { destination: "/chatbots", permanent: false } };
    }
  }

  const { branding, sections } = await getMarketingData("homepage", {
    hero: DEFAULT_HERO as unknown as Record<string, unknown>,
    features: DEFAULT_FEATURES as unknown as Record<string, unknown>,
    testimonials: DEFAULT_TESTIMONIALS as unknown as Record<string, unknown>,
    cta: DEFAULT_CTA as unknown as Record<string, unknown>,
  });

  return {
    props: {
      branding,
      hero: sections.hero ?? DEFAULT_HERO,
      features: sections.features ?? DEFAULT_FEATURES,
      testimonials: sections.testimonials ?? DEFAULT_TESTIMONIALS,
      cta: sections.cta ?? DEFAULT_CTA,
    },
  };
};
