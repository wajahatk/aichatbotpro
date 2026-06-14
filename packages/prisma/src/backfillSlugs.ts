import prisma from "@typebot.io/prisma";

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "workspace";
};

const workspaces = await prisma.workspace.findMany({
  where: { slug: null },
  select: { id: true, name: true, members: { where: { role: "ADMIN" }, select: { userId: true }, take: 1 } },
});
console.log(`Backfilling ${workspaces.length} workspaces without slugs...`);
for (const ws of workspaces) {
  let slug = generateSlug(ws.name);
  let attempt = 0;
  while (true) {
    const exists = await prisma.workspace.findFirst({ where: { slug, NOT: { id: ws.id } } });
    if (!exists) break;
    attempt++;
    slug = generateSlug(ws.name) + "-" + attempt;
  }
  const ownerId = ws.members[0]?.userId ?? null;
  await prisma.workspace.update({
    where: { id: ws.id },
    data: { slug, ownerUserId: ownerId, status: "ACTIVE", trialEndsAt: null },
  });
  console.log("  slug:", slug);
}

const freePlan = await prisma.subscriptionPlan.findFirst({ where: { slug: "free-trial" } });
if (freePlan) {
  const wsWithoutSub = await prisma.workspace.findMany({
    where: { subscriptions: { none: {} } },
    select: { id: true, name: true },
  });
  for (const ws of wsWithoutSub) {
    await prisma.orgSubscription.create({
      data: { workspaceId: ws.id, planId: freePlan.id, status: "ACTIVE", paymentProvider: "STRIPE" },
    });
    console.log(`  ✓ Created subscription for "${ws.name}"`);
  }
}
console.log("Done.");
await prisma.$disconnect();
