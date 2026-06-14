#!/usr/bin/env tsx
/**
 * Seed the first Super Admin account.
 *
 * Usage:
 *   SUPERADMIN_EMAIL=me@example.com SUPERADMIN_NAME="Your Name" npx tsx scripts/seedSuperAdmin.ts
 *
 * The account must already exist in the database (i.e. the user has signed in at least once).
 * This script promotes them to SUPERADMIN role.
 *
 * Run from the repo root.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  if (!email) {
    console.error("❌  Set SUPERADMIN_EMAIL env var to the email of the user to promote.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error(`❌  No user found with email "${email}".`);
    console.error("    Sign in at /signin first to create the account, then run this script.");
    process.exit(1);
  }

  if (user.role === "SUPERADMIN") {
    console.log(`✅  User "${email}" is already a SUPERADMIN.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "SUPERADMIN" },
  });

  console.log(`✅  Promoted "${email}" to SUPERADMIN.`);
  console.log("    They can now access /superadmin after setting up 2FA.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
