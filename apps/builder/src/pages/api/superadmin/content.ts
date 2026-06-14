import prisma from "@typebot.io/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { withSuperAdminApi } from "@/features/superadmin/hoc/withSuperAdminApi";
import { logAudit } from "@/features/superadmin/lib/auditLog";

export default withSuperAdminApi(async (req, res, admin) => {
  if (req.method === "GET") {
    const { page } = req.query as { page?: string };
    const content = await prisma.pageContent.findMany({
      where: page ? { page } : undefined,
      orderBy: [{ page: "asc" }, { section: "asc" }],
    });
    return res.status(200).json(content);
  }

  if (req.method === "POST") {
    const { page, section, content } = req.body as {
      page: string;
      section: string;
      content: Record<string, unknown>;
    };

    const record = await prisma.pageContent.upsert({
      where: { page_section: { page, section } },
      create: { page, section, content },
      update: { content },
    });

    await logAudit(admin.id, admin.email, "UPDATE_CONTENT", `${page}/${section}`);
    return res.status(200).json(record);
  }

  return res.status(405).end();
});
