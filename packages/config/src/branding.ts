export type BrandingConfig = {
  appName: string;
  appShortName: string;
  tagline: string;
  supportEmail: string;
  companyName: string;
  legalEntityName: string;
  defaultLogoUrl: string;
  defaultFaviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  websiteUrl: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
};

export const defaultBranding: BrandingConfig = {
  appName: "AI Chat Bot Pro",
  appShortName: "ACB Pro",
  tagline: "Build faster, Chat smarter",
  supportEmail: "support@aichatbotpro.com",
  companyName: "AI Chat Bot Pro",
  legalEntityName: "AI Chat Bot Pro Inc.",
  defaultLogoUrl: "/images/acb-pro-logo.svg",
  defaultFaviconUrl: "/favicon.svg",
  primaryColor: "#6B5CE7",
  secondaryColor: "#0EA5E9",
  websiteUrl: "https://aichatbotpro.com",
  socialLinks: {
    twitter: "https://twitter.com/aichatbotpro",
    linkedin: "https://linkedin.com/company/aichatbotpro",
  },
};

/**
 * Returns the active branding config.
 *
 * Phase 4 (Super Admin Panel): pass `overrides` loaded from the database to
 * customise branding at runtime without a redeploy. The config file values
 * act only as fallback defaults.
 *
 * @example
 *   // With DB overrides (Phase 4)
 *   const branding = getBranding(await fetchBrandingFromDb());
 *
 *   // Defaults only (current)
 *   const branding = getBranding();
 */
export const getBranding = (
  overrides?: Partial<BrandingConfig>,
): BrandingConfig => ({
  ...defaultBranding,
  ...overrides,
  socialLinks: {
    ...defaultBranding.socialLinks,
    ...overrides?.socialLinks,
  },
});

export const branding = getBranding();
