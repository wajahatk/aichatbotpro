import prisma from "@typebot.io/prisma";
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { buildSaSessionCookie, isSaSessionValid } from "../lib/saSession";

/** Read the authenticated user ID from the database session cookie. */
async function getUserIdFromSession(
  req: GetServerSidePropsContext["req"],
): Promise<string | null> {
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

export function withSuperAdmin<P extends Record<string, unknown>>(
  handler: (
    ctx: GetServerSidePropsContext,
    adminId: string,
  ) => Promise<GetServerSidePropsResult<P>>,
): (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<P>> {
  return async (ctx) => {
    const userId = await getUserIdFromSession(ctx.req);
    if (!userId) {
      return { redirect: { destination: "/signin", permanent: false } };
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, totpSecret: true },
    });
    if (!user || user.role !== "SUPERADMIN") {
      return { redirect: { destination: "/superadmin/forbidden", permanent: false } };
    }
    if (!user.totpSecret) {
      return { redirect: { destination: "/superadmin/2fa-setup", permanent: false } };
    }
    if (!isSaSessionValid(ctx.req, userId)) {
      return { redirect: { destination: "/superadmin/verify-2fa", permanent: false } };
    }
    // Re-issue the SA session cookie with Path=/ on every page load so that
    // any old cookie (previously scoped to Path=/superadmin) is transparently
    // replaced and API routes under /api/superadmin/* can receive it too.
    ctx.res.setHeader("Set-Cookie", buildSaSessionCookie(userId));
    return handler(ctx, userId);
  };
}
