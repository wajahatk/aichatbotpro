---
name: DB session auth pattern (not JWT)
description: NextAuth database sessions — getToken() returns null, use Prisma Session table instead
---

This app uses NextAuth with `strategy: "database"`. JWT tokens are NOT used.

**Rule:** Never call `getToken()` from `next-auth/jwt` — it always returns null.

**Pattern:**
```ts
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
```

**Why:** The database session strategy stores sessions in the DB (Session table)
and only puts a session token in the cookie — no JWT payload.
