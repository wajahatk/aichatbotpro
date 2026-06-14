import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const settings = await prisma.platformSettings.findFirst({
    select: {
      appName: true,
      appShortName: true,
      primaryColor: true,
      secondaryColor: true,
      logoUrl: true,
    },
  }).catch(() => null);

  const appName = settings?.appName ?? "AI Chat Bot Pro";
  const shortName = settings?.appShortName ?? "ChatBot Pro";
  const themeColor = settings?.primaryColor ?? "#6366f1";
  const bgColor = "#ffffff";

  const manifest = {
    name: appName,
    short_name: shortName,
    description: `${appName} — lead management dashboard`,
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    orientation: "portrait",
    theme_color: themeColor,
    background_color: bgColor,
    categories: ["business", "productivity"],
    icons: [
      { src: settings?.logoUrl || "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-72.svg", sizes: "72x72", type: "image/svg+xml" },
      { src: "/icons/icon-96.svg", sizes: "96x96", type: "image/svg+xml" },
      { src: "/icons/icon-128.svg", sizes: "128x128", type: "image/svg+xml" },
      { src: "/icons/icon-144.svg", sizes: "144x144", type: "image/svg+xml" },
      { src: "/icons/icon-152.svg", sizes: "152x152", type: "image/svg+xml" },
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon-384.svg", sizes: "384x384", type: "image/svg+xml" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
    screenshots: [],
    shortcuts: [
      { name: "Leads", url: "/app/leads", description: "View your leads" },
      { name: "Dashboard", url: "/app", description: "Open dashboard" },
    ],
  };

  res.setHeader("Content-Type", "application/manifest+json");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).json(manifest);
}
