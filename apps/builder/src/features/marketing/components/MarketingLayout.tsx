import Head from "next/head";
import type { MarketingBranding } from "../lib/getMarketingData";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

type Props = {
  branding: MarketingBranding;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function MarketingLayout({ branding, title, description, children }: Props) {
  const pageTitle = title ? `${title} — ${branding.appName}` : branding.appName;
  const pageDesc = description ?? branding.tagline;
  const grad = `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="icon" href={branding.faviconUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          :root {
            --brand-primary: ${branding.primaryColor};
            --brand-secondary: ${branding.secondaryColor};
            --brand-grad: ${grad};
          }
          .brand-grad-text {
            background: ${grad};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .brand-grad-bg {
            background: ${grad};
          }
          .brand-border {
            border-color: ${branding.primaryColor}40;
          }
        `}</style>
      </Head>
      <div className="min-h-screen bg-white text-slate-900 antialiased flex flex-col">
        <Nav branding={branding} />
        <main className="flex-1">{children}</main>
        <Footer branding={branding} />
      </div>
    </>
  );
}
