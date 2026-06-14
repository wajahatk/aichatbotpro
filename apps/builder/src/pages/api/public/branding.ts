import prisma from "@typebot.io/prisma";
import { defaultBranding } from "@typebot.io/config/branding";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { slug: "global" },
      select: { appName: true, supportEmail: true, websiteUrl: true },
    });
    return res.status(200).json({
      appName: settings?.appName ?? defaultBranding.appName,
      supportEmail: settings?.supportEmail ?? defaultBranding.supportEmail,
      websiteUrl: settings?.websiteUrl ?? defaultBranding.websiteUrl,
    });
  } catch {
    return res.status(200).json({
      appName: defaultBranding.appName,
      supportEmail: defaultBranding.supportEmail,
      websiteUrl: defaultBranding.websiteUrl,
    });
  }
}
