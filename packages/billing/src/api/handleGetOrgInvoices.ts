import { ORPCError } from "@orpc/server";
import prisma from "@typebot.io/prisma";
import type { User } from "@typebot.io/user/schemas";
import { isReadWorkspaceFobidden } from "@typebot.io/workspaces/isReadWorkspaceFobidden";
import { z } from "zod";

export const getOrgInvoicesInputSchema = z.object({
  workspaceId: z.string(),
});

export const handleGetOrgInvoices = async ({
  input,
  context: { user },
}: {
  input: z.infer<typeof getOrgInvoicesInputSchema>;
  context: { user: Pick<User, "email" | "id"> };
}) => {
  const { workspaceId } = input;

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId },
    select: { id: true, members: { select: { userId: true } } },
  });

  if (!workspace || isReadWorkspaceFobidden(workspace, user)) {
    throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
  }

  const invoices = await prisma.orgInvoice.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      amount: true,
      currency: true,
      status: true,
      provider: true,
      providerInvoiceId: true,
      pdfUrl: true,
    },
  });

  return { invoices };
};
