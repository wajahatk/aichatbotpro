import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";
import { invalidateBrandingCache } from "@typebot.io/config/brandingDb";

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const settings = await prisma.platformSettings.upsert({
      where: { slug: "global" },
      create: { slug: "global" },
      update: {},
    });
    return res.status(200).json(settings);
  }

  if (req.method === "POST") {
    const {
      appName, appShortName, tagline, supportEmail, companyName,
      logoUrl, faviconUrl, primaryColor, secondaryColor, fontFamily,
      websiteUrl, footerText, poweredByBadge, twitterUrl, linkedinUrl,
      sentryDsn, cookieConsentEnabled, cookieConsentText,
    } = req.body;

    const settings = await prisma.platformSettings.upsert({
      where: { slug: "global" },
      create: {
        slug: "global", appName, appShortName, tagline, supportEmail, companyName,
        logoUrl, faviconUrl, primaryColor, secondaryColor, fontFamily,
        websiteUrl, footerText, poweredByBadge, twitterUrl, linkedinUrl,
        sentryDsn, cookieConsentEnabled, cookieConsentText,
      },
      update: {
        appName, appShortName, tagline, supportEmail, companyName,
        logoUrl, faviconUrl, primaryColor, secondaryColor, fontFamily,
        websiteUrl, footerText, poweredByBadge, twitterUrl, linkedinUrl,
        sentryDsn, cookieConsentEnabled, cookieConsentText,
      },
    });

    invalidateBrandingCache();
    await logAudit(admin.id, admin.email, "UPDATE_BRANDING", "PlatformSettings");
    return res.status(200).json(settings);
  }

  return res.status(405).end();
});
