import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULTS: Record<string, Record<string, string>> = {
  onboarding: {
    screen1Title: "Build AI chatbots in minutes",
    screen1Body: "Create powerful conversational experiences without code.",
    screen2Title: "Connect to your tools",
    screen2Body: "Integrate with Slack, CRMs, and hundreds of other apps.",
    screen3Title: "Go live instantly",
    screen3Body: "Publish to your website, app, or share via link.",
    ctaText: "Get Started",
  },
  pushNotifications: {
    newLeadTitle: "New lead captured 🎉",
    newLeadBody: "{{botName}} captured a new lead: {{email}}",
    trialEndingTitle: "Trial ending soon",
    trialEndingBody: "Your trial expires in {{days}} days. Upgrade now.",
  },
  emptyStates: {
    noBots: "No chatbots yet. Create your first one!",
    noConversations: "No conversations yet. Share your bot to get started.",
    noIntegrations: "No integrations connected.",
  },
  general: {
    appName: "AI Chat Bot Pro",
    tagline: "Build faster, Chat smarter",
    loadingText: "Loading…",
    errorText: "Something went wrong. Please try again.",
  },
};

let cache: { data: Record<string, unknown>; expiresAt: number } | null = null;

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (_req.method !== "GET") return res.status(405).end();

  if (cache && cache.expiresAt > Date.now()) {
    return res.status(200).json(cache.data);
  }

  const records = await prisma.appText.findMany();
  const merged: Record<string, Record<string, string>> = { ...DEFAULTS };
  for (const r of records) {
    merged[r.slug] = r.content as Record<string, string>;
  }

  const flat: Record<string, string> = {};
  for (const [section, fields] of Object.entries(merged)) {
    for (const [key, value] of Object.entries(fields)) {
      flat[`${section}.${key}`] = value;
    }
  }

  cache = { data: { sections: merged, flat }, expiresAt: Date.now() + 5 * 60 * 1000 };

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json(cache.data);
}
