import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import prisma from "@typebot.io/prisma";
import { MarketingLayout } from "@/features/marketing/components/MarketingLayout";
import {
  getMarketingData,
  type MarketingBranding,
} from "@/features/marketing/lib/getMarketingData";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxBots: number;
  maxLeadsPerMonth: number;
  teamSeats: number;
  whiteLabelAllowed: boolean;
  apiAccess: boolean;
  mobileAppAccess: boolean;
  customDomainEnabled: boolean;
  brandingRemoval: boolean;
  features: string[];
  isFeatured: boolean;
};

type Props = {
  branding: MarketingBranding;
  plans: Plan[];
  header: Record<string, string>;
};

const DEFAULT_HEADER = {
  title: "Simple, transparent pricing",
  subtitle: "Start free. Scale as you grow. No hidden fees.",
  badge: "Pricing",
};

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlanCard({ plan, yearly, branding }: { plan: Plan; yearly: boolean; branding: MarketingBranding }) {
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;
  const price = yearly ? plan.priceYearly : plan.priceMonthly;
  const priceDisplay = price === 0 ? "Free" : `$${(price / 100).toFixed(0)}`;
  const perLabel = price === 0 ? "forever" : yearly ? "/mo, billed yearly" : "/month";

  const baseFeatures = [
    `${plan.maxBots === -1 ? "Unlimited" : plan.maxBots} bots`,
    `${plan.maxLeadsPerMonth === -1 ? "Unlimited" : plan.maxLeadsPerMonth.toLocaleString()} leads/month`,
    `${plan.teamSeats} team seat${plan.teamSeats !== 1 ? "s" : ""}`,
    ...(plan.apiAccess ? ["API access"] : []),
    ...(plan.whiteLabelAllowed ? ["White label"] : []),
    ...(plan.mobileAppAccess ? ["Mobile app"] : []),
    ...(plan.customDomainEnabled ? ["Custom domain"] : []),
    ...(plan.brandingRemoval ? ["Remove branding"] : []),
  ];
  const allFeatures = [...baseFeatures, ...plan.features];

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-7 border ${plan.isFeatured ? "border-transparent shadow-2xl scale-105 z-10" : "border-slate-200 shadow-sm"}`}
      style={plan.isFeatured ? { background: "white", boxShadow: `0 20px 60px ${branding.primaryColor}25` } : { background: "white" }}
    >
      {plan.isFeatured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="text-xs font-bold text-white px-4 py-1.5 rounded-full shadow-md" style={{ background: grad }}>
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
        {plan.description && <p className="text-sm text-slate-500">{plan.description}</p>}
      </div>

      <div className="mb-7">
        <span className="text-4xl font-extrabold text-slate-900">{priceDisplay}</span>
        {price > 0 && <span className="text-sm text-slate-500 ml-1">{perLabel}</span>}
        {price === 0 && <span className="text-sm text-slate-500 ml-1">{perLabel}</span>}
        {yearly && price > 0 && (
          <p className="text-xs text-green-600 font-semibold mt-1">
            Save ${(((plan.priceMonthly * 12) - (plan.priceYearly * 12)) / 100).toFixed(0)}/year
          </p>
        )}
      </div>

      <Link
        href={`/register?plan=${plan.slug}`}
        className="block text-center font-semibold py-3 rounded-xl mb-7 text-sm transition-opacity hover:opacity-90"
        style={plan.isFeatured ? { background: grad, color: "white" } : { border: `1.5px solid ${branding.primaryColor}`, color: branding.primaryColor }}
      >
        Get started
      </Link>

      <ul className="space-y-3 flex-1">
        {allFeatures.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
            <CheckIcon color={branding.primaryColor} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingPage({ branding, plans, header }: Props) {
  const [yearly, setYearly] = useState(false);
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;

  const hasYearly = plans.some((p) => p.priceYearly !== p.priceMonthly && p.priceYearly > 0);

  return (
    <MarketingLayout branding={branding} title="Pricing" description={header.subtitle}>
      {/* Header */}
      <section className="bg-white pt-16 pb-8 sm:pt-24 text-center">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          {header.badge && (
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5" style={{ background: `${branding.primaryColor}12`, color: branding.primaryColor }}>
              {header.badge}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">{header.title ?? DEFAULT_HEADER.title}</h1>
          <p className="text-lg text-slate-600">{header.subtitle ?? DEFAULT_HEADER.subtitle}</p>

          {hasYearly && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm font-medium ${!yearly ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
              <button
                onClick={() => setYearly((v) => !v)}
                className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                style={{ background: yearly ? branding.primaryColor : "#cbd5e1" }}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${yearly ? "translate-x-6" : "translate-x-0"}`} />
              </button>
              <span className={`text-sm font-medium ${yearly ? "text-slate-900" : "text-slate-400"}`}>
                Yearly <span className="text-green-600 font-semibold text-xs ml-1">Save 20%</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Plans grid */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {plans.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <p className="text-lg mb-4">Plans coming soon.</p>
              <Link href="/register" className="text-sm font-semibold px-6 py-3 rounded-xl text-white" style={{ background: grad }}>
                Sign up to be notified
              </Link>
            </div>
          ) : (
            <div className={`grid gap-6 items-start ${plans.length <= 3 ? `sm:grid-cols-${plans.length}` : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} yearly={yearly} branding={branding} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-10">Frequently asked questions</h2>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {[
              { q: "Can I change plans later?", a: "Yes — upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
              { q: "What payment methods do you accept?", a: "We accept all major credit cards via Stripe, and PayPal. Annual plans are also available via invoice." },
              { q: "Is there a free trial?", a: "Every plan starts with a 14-day free trial. No credit card required to begin." },
              { q: "What happens when I hit my lead limit?", a: "Bots continue to run but new submissions are paused. You can upgrade to restore access instantly." },
              { q: "Can I self-host?", a: "The Community Edition is open-source. Paid plans are cloud-hosted and include automatic updates, backups, and support." },
            ].map(({ q, a }) => (
              <details key={q} className="group px-6 py-5 cursor-pointer">
                <summary className="flex justify-between items-center font-semibold text-sm text-slate-900 list-none">
                  {q}
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 sm:pb-28 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <div className="rounded-3xl py-12 px-8 text-white" style={{ background: grad }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Still have questions?</h2>
            <p className="text-white/80 mb-6 text-sm">Talk to us — we're happy to help you find the right plan.</p>
            <Link href="/about#contact" className="inline-block bg-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/90 transition-colors shadow-md" style={{ color: branding.primaryColor }}>
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const [{ branding, sections }, rawPlans] = await Promise.all([
    getMarketingData("pricing", { header: DEFAULT_HEADER as unknown as Record<string, unknown> }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true, isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const plans: Plan[] = rawPlans.map((p, i) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    priceMonthly: p.billingInterval === "MONTHLY" ? p.price : 0,
    priceYearly: p.billingInterval === "YEARLY" ? p.price : 0,
    currency: p.currency,
    maxBots: p.maxBots,
    maxLeadsPerMonth: p.maxLeadsPerMonth,
    teamSeats: p.teamSeats,
    whiteLabelAllowed: p.whiteLabelAllowed,
    apiAccess: p.apiAccess,
    mobileAppAccess: p.mobileAppAccess,
    customDomainEnabled: p.customDomainEnabled,
    brandingRemoval: p.brandingRemoval,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    isFeatured: i === 1,
  }));

  return {
    props: {
      branding,
      plans,
      header: sections.header ?? DEFAULT_HEADER,
    },
  };
};
