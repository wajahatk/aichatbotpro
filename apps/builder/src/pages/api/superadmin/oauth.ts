import { decrypt } from "@typebot.io/credentials/decrypt";
import { encrypt } from "@typebot.io/credentials/encrypt";
import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { invalidateDbProvidersCache } from "@typebot.io/auth/lib/dbProviders";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

const SUPPORTED_PROVIDERS = [
  "google",
  "facebook",
  "github",
  "microsoft-entra-id",
  "apple",
] as const;
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••";
  return "••••••••" + value.slice(-4);
}

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const rows = await prisma.oAuthProviderConfig.findMany({
      orderBy: { provider: "asc" },
    });

    const result = await Promise.all(
      SUPPORTED_PROVIDERS.map(async (provider) => {
        const row = rows.find((r) => r.provider === provider);
        let clientSecret = "";
        let tenantId = row?.tenantId ?? "";
        if (row?.encryptedData && row.iv) {
          try {
            const secrets = (await decrypt(row.encryptedData, row.iv)) as {
              clientSecret?: string;
              tenantId?: string;
            };
            clientSecret = secrets.clientSecret
              ? maskSecret(secrets.clientSecret)
              : "";
            tenantId = secrets.tenantId ?? tenantId;
          } catch {}
        }
        return {
          provider,
          enabled: row?.enabled ?? false,
          clientId: row?.clientId ?? "",
          clientSecret,
          tenantId,
          displayName: row?.displayName ?? "",
        };
      }),
    );

    return res.status(200).json(result);
  }

  if (req.method === "POST") {
    const { provider, enabled, clientId, clientSecret, tenantId, displayName } =
      req.body as {
        provider: SupportedProvider;
        enabled: boolean;
        clientId?: string;
        clientSecret?: string;
        tenantId?: string;
        displayName?: string;
      };

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    // Merge with existing encrypted data to preserve masked secrets
    const existing = await prisma.oAuthProviderConfig.findUnique({
      where: { provider },
    });
    let existingSecrets: { clientSecret?: string; tenantId?: string } = {};
    if (existing?.encryptedData && existing.iv) {
      try {
        existingSecrets = (await decrypt(existing.encryptedData, existing.iv)) as {
          clientSecret?: string;
          tenantId?: string;
        };
      } catch {}
    }

    const newSecrets = {
      clientSecret:
        clientSecret && !clientSecret.startsWith("••••")
          ? clientSecret
          : existingSecrets.clientSecret ?? "",
      tenantId: tenantId ?? existingSecrets.tenantId ?? "",
    };

    const { encryptedData, iv } = await encrypt(newSecrets);

    await prisma.oAuthProviderConfig.upsert({
      where: { provider },
      create: {
        provider,
        enabled,
        clientId: clientId ?? "",
        encryptedData,
        iv,
        tenantId: tenantId ?? "",
        displayName: displayName ?? "",
      },
      update: {
        enabled,
        clientId: clientId ?? existing?.clientId ?? "",
        encryptedData,
        iv,
        tenantId: tenantId ?? existing?.tenantId ?? "",
        displayName: displayName ?? existing?.displayName ?? "",
      },
    });

    invalidateDbProvidersCache();
    await logAudit(admin.id, admin.email, "UPDATE_OAUTH_PROVIDER", provider, {
      enabled,
    });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
});
