/**
 * DEV-ONLY quick login — creates an admin session without email verification.
 *
 * Guards (ALL must be satisfied — endpoint returns 404 otherwise):
 *   1. NODE_ENV !== "production"
 *   2. SMTP_HOST is not set  (confirms email delivery is unavailable)
 *   3. ADMIN_EMAIL is set    (we have a specific account to sign in as)
 *
 * The session is scoped exclusively to the ADMIN_EMAIL account.
 * No credentials are accepted from the client — all decisions are server-side.
 *
 * POST /api/dev/login  (no body required)
 * → sets authjs.session-token cookie → 302 /chatbots
 */

import { randomBytes } from "crypto";
import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

function isEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    !process.env.SMTP_HOST &&
    !!process.env.ADMIN_EMAIL
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Return 404 (not 401/403) to avoid signalling the endpoint exists in prod
  if (!isEnabled()) return res.status(404).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Email is fixed server-side — no client input accepted
  const email = process.env.ADMIN_EMAIL!;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        emailVerified: new Date(),
      },
    });
  } else if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  // Create a 30-day session
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  // Set the NextAuth v5 session cookie (dev has no __Secure- prefix)
  res.setHeader(
    "Set-Cookie",
    `authjs.session-token=${sessionToken}; Path=/; Expires=${expires.toUTCString()}; HttpOnly; SameSite=Lax`,
  );

  res.redirect(302, "/chatbots");
}
