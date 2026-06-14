import type { GetServerSideProps } from "next";
import { MarketingLayout } from "@/features/marketing/components/MarketingLayout";
import {
  getMarketingData,
  type MarketingBranding,
} from "@/features/marketing/lib/getMarketingData";

type Props = {
  branding: MarketingBranding;
  title: string;
  body: string;
  lastUpdated: string;
};

const LEGAL_DEFAULTS: Record<string, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: `**Last updated: January 1, 2025**

## 1. Information We Collect

We collect information you provide directly, such as your name, email address, and payment details when you register or subscribe to our services. We also automatically collect certain technical data including IP address, browser type, and usage logs.

## 2. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions and send related notices
- Send technical notices, updates, and support messages
- Respond to your comments and questions

## 3. Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share information with service providers who assist us in operating our platform, subject to confidentiality obligations.

## 4. Data Retention

We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.

## 5. Security

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 6. Your Rights (GDPR)

If you are in the European Economic Area, you have the right to access, correct, or delete your personal data. Contact us to exercise these rights.

## 7. Cookies

We use essential cookies for authentication and analytics. You can control cookie settings through your browser.

## 8. Contact

If you have questions about this Privacy Policy, please contact us at the email address listed on our Contact page.`,
  },
  terms: {
    title: "Terms of Service",
    body: `**Last updated: January 1, 2025**

## 1. Acceptance of Terms

By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part, you may not access the service.

## 2. Use of Service

You agree to use the service only for lawful purposes. You must not use our service to create content that is harmful, fraudulent, or deceptive.

## 3. Accounts

You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account.

## 4. Payment Terms

Paid plans are billed in advance on a monthly or annual basis. Fees are non-refundable except as required by law or as set out in our Refund Policy. We reserve the right to change pricing with 30 days' notice.

## 5. Intellectual Property

The service and its original content, features, and functionality are owned by us and are protected by intellectual property laws. Your content remains yours.

## 6. Limitation of Liability

To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.

## 7. Termination

We may terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users.

## 8. Governing Law

These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.

## 9. Changes

We reserve the right to modify these terms at any time. We will notify you of significant changes via email or in-app notice.`,
  },
  refund: {
    title: "Refund Policy",
    body: `**Last updated: January 1, 2025**

## Overview

We want you to be satisfied with your subscription. This policy explains when and how we issue refunds.

## 14-Day Free Trial

All paid plans begin with a 14-day free trial. No payment is collected during the trial period. You may cancel at any time before the trial ends without charge.

## Monthly Plans

Monthly subscriptions may be cancelled at any time. Your plan will remain active until the end of the current billing cycle. We do not provide partial-month refunds.

## Annual Plans

Annual subscriptions may be cancelled at any time. If you cancel within 30 days of your annual renewal date, we will issue a full refund. After 30 days, no refunds are issued for annual plans.

## Exceptions

We may issue refunds at our discretion in cases of:
- Significant service outages (more than 24 hours of cumulative downtime in a month)
- Billing errors caused by our systems

## How to Request a Refund

To request a refund, contact us at the email address listed on our Contact page with your account email and the reason for your request. We process refund requests within 5 business days.

## Questions

If you have questions about this policy, please contact our support team.`,
  },
};

export default function LegalPage({ branding, title, body, lastUpdated }: Props) {
  const lines = body.split("\n");

  const renderContent = () =>
    lines.map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-slate-900 mt-10 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm text-slate-500 mb-6 italic">{line.slice(2, -2)}</p>;
      if (line.startsWith("- ")) return <li key={i} className="text-slate-700 leading-relaxed text-sm ml-4">{line.slice(2)}</li>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-700 leading-relaxed text-sm mb-3">{line}</p>;
    });

  return (
    <MarketingLayout branding={branding} title={title}>
      <section className="bg-white pt-16 pb-6 sm:pt-24 border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ background: `${branding.primaryColor}12`, color: branding.primaryColor }}>Legal</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">{title}</h1>
          {lastUpdated && <p className="text-sm text-slate-400">{lastUpdated}</p>}
        </div>
      </section>

      <section className="bg-white pb-24 pt-10">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 prose-lg">
          <div>{renderContent()}</div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  const defaultData = LEGAL_DEFAULTS[slug];

  if (!defaultData) return { notFound: true };

  const { branding, sections } = await getMarketingData(`legal-${slug}`, {
    content: { title: defaultData.title, body: defaultData.body } as Record<string, unknown>,
  });

  const content = sections.content as { title?: string; body?: string } | undefined;

  return {
    props: {
      branding,
      title: content?.title ?? defaultData.title,
      body: content?.body ?? defaultData.body,
      lastUpdated: "",
    },
  };
};
