import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";
import { encrypt } from "@typebot.io/credentials/encrypt";
import { decrypt } from "@typebot.io/credentials/decrypt";

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const gateways = await prisma.paymentGatewaySettings.findMany({ orderBy: { slug: "asc" } });
    const result = await Promise.all(
      gateways.map(async (g) => {
        let decrypted: Record<string, string> = {};
        if (g.encryptedData && g.iv) {
          try {
            decrypted = JSON.parse(
              await decrypt({ encryptedData: g.encryptedData, iv: g.iv }),
            );
          } catch {}
        }
        return {
          id: g.id,
          slug: g.slug,
          mode: g.mode,
          isActive: g.isActive,
          keys: Object.fromEntries(
            Object.entries(decrypted).map(([k, v]) => [
              k,
              k.toLowerCase().includes("secret") ? "••••••••" + v.slice(-4) : v,
            ]),
          ),
        };
      }),
    );
    return res.status(200).json(result);
  }

  if (req.method === "POST") {
    const { slug, mode, isActive, keys } = req.body as {
      slug: string;
      mode: string;
      isActive: boolean;
      keys: Record<string, string>;
    };

    const existing = await prisma.paymentGatewaySettings.findUnique({ where: { slug } });
    let existingDecrypted: Record<string, string> = {};
    if (existing?.encryptedData && existing?.iv) {
      try {
        existingDecrypted = JSON.parse(
          await decrypt({ encryptedData: existing.encryptedData, iv: existing.iv }),
        );
      } catch {}
    }
    const merged = { ...existingDecrypted, ...Object.fromEntries(
      Object.entries(keys).filter(([, v]) => !v.startsWith("••••"))
    )};

    const { encryptedData, iv } = await encrypt(JSON.stringify(merged));

    await prisma.paymentGatewaySettings.upsert({
      where: { slug },
      create: { slug, encryptedData, iv, mode, isActive },
      update: { encryptedData, iv, mode, isActive },
    });

    await logAudit(admin.id, admin.email, "UPDATE_GATEWAY", slug, { mode, isActive });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
});
