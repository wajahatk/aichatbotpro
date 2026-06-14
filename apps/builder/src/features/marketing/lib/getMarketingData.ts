import prisma from "@typebot.io/prisma";
import { defaultBranding } from "@typebot.io/config/branding";

export type MarketingBranding = {
  appName: string;
  appShortName: string;
  tagline: string;
  supportEmail: string;
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  websiteUrl: string;
  footerText: string | null;
  poweredByBadge: boolean;
  twitterUrl: string | null;
  linkedinUrl: string | null;
};

export type MarketingPageData = {
  branding: MarketingBranding;
  sections: Record<string, Record<string, unknown>>;
};

export const FALLBACK_BRANDING: MarketingBranding = {
  appName: defaultBranding.appName,
  appShortName: defaultBranding.appShortName,
  tagline: defaultBranding.tagline,
  supportEmail: defaultBranding.supportEmail,
  companyName: defaultBranding.companyName,
  logoUrl: defaultBranding.defaultLogoUrl,
  faviconUrl: defaultBranding.defaultFaviconUrl,
  primaryColor: defaultBranding.primaryColor,
  secondaryColor: defaultBranding.secondaryColor,
  websiteUrl: defaultBranding.websiteUrl,
  footerText: null,
  poweredByBadge: true,
  twitterUrl: null,
  linkedinUrl: null,
};

export async function getMarketingData(
  page: string,
  defaults: Record<string, Record<string, unknown>>
): Promise<MarketingPageData> {
  try {
    const [settings, pageContents] = await Promise.all([
      prisma.platformSettings.findUnique({ where: { slug: "global" } }),
      prisma.pageContent.findMany({ where: { page } }),
    ]);

    const branding: MarketingBranding = {
      appName: settings?.appName ?? FALLBACK_BRANDING.appName,
      appShortName: settings?.appShortName ?? FALLBACK_BRANDING.appShortName,
      tagline: settings?.tagline ?? FALLBACK_BRANDING.tagline,
      supportEmail: settings?.supportEmail ?? FALLBACK_BRANDING.supportEmail,
      companyName: settings?.companyName ?? FALLBACK_BRANDING.companyName,
      logoUrl: settings?.logoUrl ?? FALLBACK_BRANDING.logoUrl,
      faviconUrl: settings?.faviconUrl ?? FALLBACK_BRANDING.faviconUrl,
      primaryColor: settings?.primaryColor ?? FALLBACK_BRANDING.primaryColor,
      secondaryColor: settings?.secondaryColor ?? FALLBACK_BRANDING.secondaryColor,
      websiteUrl: settings?.websiteUrl ?? FALLBACK_BRANDING.websiteUrl,
      footerText: settings?.footerText ?? null,
      poweredByBadge: settings?.poweredByBadge ?? true,
      twitterUrl: settings?.twitterUrl ?? null,
      linkedinUrl: settings?.linkedinUrl ?? null,
    };

    const sections = { ...defaults };
    for (const content of pageContents) {
      sections[content.section] = content.content as Record<string, unknown>;
    }

    return { branding, sections };
  } catch {
    return { branding: FALLBACK_BRANDING, sections: defaults };
  }
}
