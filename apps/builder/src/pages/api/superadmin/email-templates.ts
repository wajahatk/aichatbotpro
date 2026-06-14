import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

const DEFAULT_TEMPLATES = [
  { slug: "welcome", subject: "Welcome to {{appName}}!", body: "Hi {{name}},\n\nWelcome to {{appName}}! Your account is ready.\n\nGet started: {{dashboardUrl}}\n\nThe {{appName}} Team" },
  { slug: "trial_ending_7", subject: "Your trial ends in 7 days — {{appName}}", body: "Hi {{name}},\n\nYour free trial ends in 7 days. Upgrade to keep access.\n\nUpgrade: {{billingUrl}}\n\nThe {{appName}} Team" },
  { slug: "trial_ending_2", subject: "2 days left in your trial — {{appName}}", body: "Hi {{name}},\n\nOnly 2 days left! Don't lose your bots — upgrade now.\n\nUpgrade: {{billingUrl}}\n\nThe {{appName}} Team" },
  { slug: "trial_expired", subject: "Your trial has ended — {{appName}}", body: "Hi {{name}},\n\nYour trial has expired. Upgrade to restore full access.\n\nUpgrade: {{billingUrl}}\n\nThe {{appName}} Team" },
  { slug: "payment_failed", subject: "Payment failed — action required", body: "Hi {{name}},\n\nWe couldn't process your payment for {{planName}}. Please update your billing info.\n\nUpdate: {{billingUrl}}\n\nThe {{appName}} Team" },
  { slug: "password_reset", subject: "Reset your {{appName}} password", body: "Hi {{name}},\n\nClick below to reset your password (expires in 1 hour):\n\n{{resetUrl}}\n\nIf you didn't request this, ignore this email.\n\nThe {{appName}} Team" },
];

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { slug: "asc" } });
    const slugsInDb = new Set(templates.map((t) => t.slug));
    const defaults = DEFAULT_TEMPLATES.filter((d) => !slugsInDb.has(d.slug));
    return res.status(200).json([...templates, ...defaults]);
  }

  if (req.method === "POST") {
    const { slug, subject, body } = req.body as { slug: string; subject: string; body: string };
    const template = await prisma.emailTemplate.upsert({
      where: { slug },
      create: { slug, subject, body },
      update: { subject, body },
    });
    await logAudit(admin.id, admin.email, "UPDATE_EMAIL_TEMPLATE", slug);
    return res.status(200).json(template);
  }

  return res.status(405).end();
});
