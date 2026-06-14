import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { decrypt } from "@typebot.io/credentials/decrypt";

export default withSuperAdminApi(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  const { slug } = req.query as { slug: string };
  if (!slug) return res.status(400).json({ error: "slug required" });

  const gw = await prisma.paymentGatewaySettings.findUnique({ where: { slug } });
  if (!gw || !gw.encryptedData || !gw.iv) {
    return res.status(200).json({ ok: false, error: "No credentials configured" });
  }

  try {
    const raw = JSON.parse(await decrypt({ encryptedData: gw.encryptedData, iv: gw.iv })) as Record<string, string>;

    if (slug === "stripe") {
      const resp = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${raw.secretKey ?? ""}` },
      });
      if (resp.ok) return res.status(200).json({ ok: true });
      const err = await resp.json();
      return res.status(200).json({ ok: false, error: err.error?.message ?? "Stripe rejected the key" });
    }

    if (slug === "paypal") {
      const base = gw.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
      const resp = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${raw.clientId ?? ""}:${raw.clientSecret ?? ""}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      if (resp.ok) return res.status(200).json({ ok: true });
      return res.status(200).json({ ok: false, error: "PayPal rejected the credentials" });
    }

    return res.status(200).json({ ok: false, error: "Unknown gateway" });
  } catch (e: any) {
    return res.status(200).json({ ok: false, error: e.message });
  }
});
