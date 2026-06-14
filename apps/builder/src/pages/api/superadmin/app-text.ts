import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

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

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const records = await prisma.appText.findMany({ orderBy: { slug: "asc" } });
    const inDb = Object.fromEntries(records.map((r) => [r.slug, r.content]));
    const merged = { ...DEFAULTS, ...inDb };
    return res.status(200).json(merged);
  }

  if (req.method === "POST") {
    const { slug, content } = req.body as { slug: string; content: Record<string, string> };
    await prisma.appText.upsert({
      where: { slug },
      create: { slug, content },
      update: { content },
    });
    await logAudit(admin.id, admin.email, "UPDATE_APP_TEXT", slug);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
});
