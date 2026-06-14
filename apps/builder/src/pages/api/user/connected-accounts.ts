import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

async function getUserIdFromSession(req: NextApiRequest): Promise<string | null> {
  const token =
    req.cookies["authjs.session-token"] ??
    req.cookies["__Secure-authjs.session-token"];
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    select: { userId: true, expires: true },
  });
  if (!session || session.expires < new Date()) return null;
  return session.userId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // GET — list linked OAuth accounts
  if (req.method === "GET") {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { provider: true, type: true },
    });

    const emailAccount = accounts.find((a) => a.type === "email");

    return res.status(200).json({
      accounts: accounts.map((a) => ({ provider: a.provider, type: a.type })),
      hasEmailLogin: !!emailAccount,
      totalLoginMethods: accounts.length,
    });
  }

  // DELETE — unlink a provider
  if (req.method === "DELETE") {
    const { provider } = req.query as { provider: string };
    if (!provider) return res.status(400).json({ error: "provider is required" });

    const allAccounts = await prisma.account.findMany({
      where: { userId },
      select: { provider: true, type: true },
    });

    const target = allAccounts.find((a) => a.provider === provider);
    if (!target) return res.status(404).json({ error: "Provider not linked" });

    const remainingAfterDelete = allAccounts.filter(
      (a) => a.provider !== provider,
    );
    if (remainingAfterDelete.length === 0) {
      return res.status(400).json({
        error:
          "Cannot unlink your only login method. Link another provider or enable email login first.",
      });
    }

    await prisma.account.deleteMany({
      where: { userId, provider },
    });

    return res.status(200).json({ ok: true, unlinked: provider });
  }

  return res.status(405).end();
}
