import prisma from "@typebot.io/prisma";

export async function logAudit(
  adminId: string,
  adminEmail: string,
  action: string,
  target?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: { adminId, adminEmail, action, target, details },
  });
}
