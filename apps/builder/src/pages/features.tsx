import type { GetServerSideProps } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/features/marketing/components/MarketingLayout";
import {
  getMarketingData,
  type MarketingBranding,
} from "@/features/marketing/lib/getMarketingData";

type FeatureSection = {
  icon: string;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
};

type Props = {
  branding: MarketingBranding;
  hero: Record<string, string>;
  features: FeatureSection[];
  cta: Record<string, string>;
};

const DEFAULT_HERO = {
  badge: "Features",
  title: "One platform.\nEndless possibilities.",
  subtitle: "From a simple lead-gen form to a multi-step AI assistant — AI Chat Bot Pro handles it all without a single line of code.",
};

const DEFAULT_FEATURES: FeatureSection[] = [
  {
    icon: "🎨",
    title: "Visual Flow Builder",
    tagline: "Build any conversation, visually",
    description: "Our drag-and-drop editor makes it easy to create complex conversation flows. Start with a blank canvas or pick from 50+ pre-built templates.",
    bullets: [
      "30+ question types: text, email, phone, file upload, NPS, and more",
      "Logic jumps, conditionals, and variable capture",
      "Real-time mobile + desktop preview as you build",
      "Undo/redo, duplicate blocks, keyboard shortcuts",
    ],
  },
  {
    icon: "🎯",
    title: "Lead Capture & Qualification",
    tagline: "Turn visitors into pipeline",
    description: "Replace static forms with AI-driven conversations that qualify, score, and route leads automatically — all without developer help.",
    bullets: [
      "Progressive profiling: ask only what matters at each step",
      "Lead scoring rules based on answers",
      "Auto-route to Slack, email, or CRM on submission",
      "GDPR-compliant consent blocks built in",
    ],
  },
  {
    icon: "🔌",
    title: "Integrations & Automation",
    tagline: "Connect your entire stack",
    description: "Native integrations with the tools your team already uses. Or build your own via webhooks and our open API.",
    bullets: [
      "CRM: HubSpot, Salesforce, Pipedrive, Airtable",
      "Email: Mailchimp, ActiveCampaign, ConvertKit",
      "Payments: Stripe inline in your bot flow",
      "Webhooks & REST API for custom automation",
    ],
  },
  {
    icon: "📊",
    title: "Analytics & A/B Testing",
    tagline: "Optimize with data",
    description: "See exactly where visitors drop off, which messages perform, and which variant drives more completions — with built-in A/B testing.",
    bullets: [
      "Completion rate, drop-off, and time-on-step charts",
      "Compare variants side-by-side in real time",
      "Export raw response data as CSV",
      "Custom UTM tracking and source attribution",
    ],
  },
  {
    icon: "🏷️",
    title: "White Label & Custom Branding",
    tagline: "Make it yours (or your client's)",
    description: "Remove all traces of our branding. Agencies and resellers can deploy bots under their own domain, logo, and colors.",
    bullets: [
      "Custom CNAME / subdomain per workspace",
      "Full CSS theming: fonts, colors, border radius",
      "Remove 'Powered by' badge",
      "Client management portal for agencies",
    ],
  },
  {
    icon: "📱",
    title: "Multi-channel Publishing",
    tagline: "Meet users where they are",
    description: "Publish bots to any surface — websites, mobile apps, popups, or standalone pages — with a single copy-paste snippet.",
    bullets: [
      "Website embed: popup, bubble, or full-page",
      "React / Web Component SDK",
      "Shareable public link (no embed needed)",
      "Mobile SDK for iOS and Android",
    ],
  },
];

const DEFAULT_CTA = {
  title: "See it in action — for free",
  subtitle: "14-day free trial. No credit card required.",
  cta: "Start building now",
};

function FeatureBlock({ feature, reversed, branding }: { feature: FeatureSection; reversed: boolean; branding: MarketingBranding }) {
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;

  const visual = (
    <div className="rounded-2xl p-8 flex items-center justify-center min-h-[240px]" style={{ background: `linear-gradient(135deg, ${branding.primaryColor}12, ${branding.secondaryColor}12)`, border: `1.5px solid ${branding.primaryColor}20` }}>
      <span className="text-7xl">{feature.icon}</span>
    </div>
  );

  const content = (
    <div className="flex flex-col justify-center">
      <span className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: branding.primaryColor }}>{feature.tagline}</span>
      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{feature.title}</h3>
      <p className="text-slate-600 leading-relaxed mb-6">{feature.description}</p>
      <ul className="space-y-2.5">
        {feature.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: grad }}>✓</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`grid md:grid-cols-2 gap-10 items-center ${reversed ? "md:grid-flow-dense" : ""}`}>
      {reversed ? <>{content}<div className="md:col-start-2">{visual}</div></> : <>{visual}{content}</>}
    </div>
  );
}

export default function FeaturesPage({ branding, hero, features, cta }: Props) {
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;

  return (
    <MarketingLayout branding={branding} title="Features" description={hero.subtitle}>
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
          <p className="text-lg text-slate-600">{hero.subtitle ?? DEFAULT_HERO.subtitle}</p>
        </div>
      </section>

      {/* Feature sections */}
      <section className="bg-white pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-20 sm:space-y-28">
          {features.map((f, i) => (
            <FeatureBlock key={f.title} feature={f} reversed={i % 2 !== 0} branding={branding} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="rounded-3xl py-14 px-8 text-center text-white" style={{ background: grad }}>
            <h2 className="text-3xl font-extrabold mb-3">{cta.title ?? DEFAULT_CTA.title}</h2>
            <p className="text-white/80 mb-7">{cta.subtitle ?? DEFAULT_CTA.subtitle}</p>
            <Link href="/register" className="inline-block bg-white font-semibold px-7 py-3.5 rounded-xl text-sm hover:bg-white/90 transition-colors shadow-md" style={{ color: branding.primaryColor }}>
              {cta.cta ?? DEFAULT_CTA.cta}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { branding, sections } = await getMarketingData("features", {
    hero: DEFAULT_HERO as unknown as Record<string, unknown>,
    features: DEFAULT_FEATURES as unknown as Record<string, unknown>,
    cta: DEFAULT_CTA as unknown as Record<string, unknown>,
  });

  return {
    props: {
      branding,
      hero: sections.hero ?? DEFAULT_HERO,
      features: (sections.features as FeatureSection[] | undefined) ?? DEFAULT_FEATURES,
      cta: sections.cta ?? DEFAULT_CTA,
    },
  };
};
