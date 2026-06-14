import { getBranding, type BrandingConfig } from "./branding";

let cache: { value: BrandingConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Loads branding from PlatformSettings, merges with defaults, and caches for 5 minutes.
 * Safe to call server-side only (uses Prisma).
 * Falls back to default branding if DB is unavailable.
 */
export async function getServerBranding(): Promise<BrandingConfig> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  try {
    const { default: prisma } = await import("@typebot.io/prisma");
    const settings = await prisma.platformSettings.findUnique({ where: { slug: "global" } });
    if (!settings) {
      cache = { value: getBranding(), expiresAt: Date.now() + CACHE_TTL_MS };
      return cache.value;
    }

    const overrides: Partial<BrandingConfig> = {
      ...(settings.appName && { appName: settings.appName }),
      ...(settings.appShortName && { appShortName: settings.appShortName }),
      ...(settings.tagline && { tagline: settings.tagline }),
      ...(settings.supportEmail && { supportEmail: settings.supportEmail }),
      ...(settings.companyName && { companyName: settings.companyName }),
      ...(settings.logoUrl && { defaultLogoUrl: settings.logoUrl }),
      ...(settings.faviconUrl && { defaultFaviconUrl: settings.faviconUrl }),
      ...(settings.primaryColor && { primaryColor: settings.primaryColor }),
      ...(settings.secondaryColor && { secondaryColor: settings.secondaryColor }),
      ...(settings.websiteUrl && { websiteUrl: settings.websiteUrl }),
      ...(settings.twitterUrl || settings.linkedinUrl
        ? {
            socialLinks: {
              ...(settings.twitterUrl && { twitter: settings.twitterUrl }),
              ...(settings.linkedinUrl && { linkedin: settings.linkedinUrl }),
            },
          }
        : {}),
    };

    const value = getBranding(overrides);
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch {
    return getBranding();
  }
}

/** Clear the branding cache (call after saving PlatformSettings). */
export function invalidateBrandingCache() {
  cache = null;
}
