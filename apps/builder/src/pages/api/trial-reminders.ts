import prisma from "@typebot.io/prisma";
import { sendTrialReminderEmail } from "@typebot.io/emails/transactional/TrialReminderEmail";
import type { NextApiRequest, NextApiResponse } from "next";

const CRON_SECRET = process.env.CRON_SECRET;

const fmt = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

const isBetween = (
  date: Date,
  daysFromNow: number,
  windowHours = 12,
): boolean => {
  const target = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const windowMs = windowHours * 60 * 60 * 1000;
  const diff = Math.abs(date.getTime() - target.getTime());
  return diff < windowMs;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const now = new Date();
  const appUrl =
    process.env.NEXTAUTH_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;

  const trialWorkspaces = await prisma.workspace.findMany({
    where: {
      status: "TRIAL",
      trialEndsAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      trialEndsAt: true,
      members: {
        where: { role: "ADMIN" },
        select: {
          user: { select: { email: true } },
        },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const ws of trialWorkspaces) {
    const trialEnd = ws.trialEndsAt!;
    const adminEmails = ws.members
      .map((m) => m.user?.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) continue;

    const upgradeUrl = `${appUrl}/w/${ws.id}/settings/billing`;
    const trialEndsDate = fmt(trialEnd);

    let reminderDay: 7 | 2 | 0 | null = null;

    if (isBetween(trialEnd, 7)) {
      reminderDay = 7;
    } else if (isBetween(trialEnd, 2)) {
      reminderDay = 2;
    } else if (trialEnd <= now && isBetween(trialEnd, 0)) {
      reminderDay = 0;
    }

    if (reminderDay === null) continue;

    for (const email of adminEmails) {
      try {
        await sendTrialReminderEmail({
          to: email,
          workspaceName: ws.name,
          daysRemaining: reminderDay,
          upgradeUrl,
          trialEndsDate,
        });
        sent++;
      } catch (err) {
        errors.push(`${ws.name} → ${email}: ${String(err)}`);
      }
    }
  }

  return res.status(200).json({
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
