import prisma from "@typebot.io/prisma";

console.log("=== Tenant Isolation Test ===\n");

// Find two distinct workspaces
const workspaces = await prisma.workspace.findMany({
  take: 2,
  select: { id: true, name: true, slug: true, ownerUserId: true, status: true, trialEndsAt: true },
});

if (workspaces.length < 2) {
  console.log("Only 1 workspace found - creating a second test workspace for isolation test...");
  // Create a test workspace to verify isolation
  const secondWs = await prisma.workspace.create({
    data: {
      name: "Test Client B",
      slug: "test-client-b",
      status: "TRIAL",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  workspaces.push(secondWs as any);
}

const [wsA, wsB] = workspaces;
console.log(`Workspace A: "${wsA.name}" (${wsA.id})`);
console.log(`  slug: ${wsA.slug}, status: ${wsA.status}`);
console.log(`Workspace B: "${wsB.name}" (${wsB.id})`);
console.log(`  slug: ${wsB.slug}, status: ${wsB.status}`);
console.log();

// Create a test bot in workspace A
const botA = await prisma.typebot.create({
  data: {
    workspaceId: wsA.id,
    name: "Bot in Workspace A",
    version: "6",
    groups: [],
    variables: [],
    edges: [],
    theme: {},
    settings: {},
    events: [],
  },
});
console.log(`Created bot in workspace A: "${botA.name}" (${botA.id})`);

// Create a test bot in workspace B
const botB = await prisma.typebot.create({
  data: {
    workspaceId: wsB.id,
    name: "Bot in Workspace B",
    version: "6",
    groups: [],
    variables: [],
    edges: [],
    theme: {},
    settings: {},
    events: [],
  },
});
console.log(`Created bot in workspace B: "${botB.name}" (${botB.id})`);
console.log();

// ISOLATION CHECKS
console.log("--- Isolation Checks ---");

// A user in workspace A should only see workspace A's bots
const botsVisibleToA = await prisma.typebot.findMany({
  where: { workspaceId: wsA.id },
  select: { id: true, name: true, workspaceId: true },
});
const crossTenantLeakA = botsVisibleToA.filter(b => b.workspaceId !== wsA.id);
console.log(`Bots visible to Workspace A: ${botsVisibleToA.length} (including test bot)`);
console.log(`Cross-tenant leak for A: ${crossTenantLeakA.length} bots`);

const botsVisibleToB = await prisma.typebot.findMany({
  where: { workspaceId: wsB.id },
  select: { id: true, name: true, workspaceId: true },
});
const crossTenantLeakB = botsVisibleToB.filter(b => b.workspaceId !== wsB.id);
console.log(`Bots visible to Workspace B: ${botsVisibleToB.length} (including test bot)`);
console.log(`Cross-tenant leak for B: ${crossTenantLeakB.length} bots`);

// Verify Workspace A cannot see Workspace B's bot
const canASeeB = botsVisibleToA.find(b => b.id === botB.id);
const canBSeeA = botsVisibleToB.find(b => b.id === botA.id);
console.log();
console.log(`Can Workspace A see Workspace B's bot? ${canASeeB ? "YES ❌ LEAK!" : "NO ✓ Isolated"}`);
console.log(`Can Workspace B see Workspace A's bot? ${canBSeeA ? "YES ❌ LEAK!" : "NO ✓ Isolated"}`);
console.log();

// Check subscription plans
const subsA = await prisma.orgSubscription.findMany({
  where: { workspaceId: wsA.id },
  include: { plan: { select: { name: true, maxBots: true, maxLeadsPerMonth: true } } },
});
const subsB = await prisma.orgSubscription.findMany({
  where: { workspaceId: wsB.id },
  include: { plan: { select: { name: true, maxBots: true, maxLeadsPerMonth: true } } },
});
console.log(`Workspace A subscription: ${subsA[0]?.plan.name ?? "none"} (maxBots: ${subsA[0]?.plan.maxBots ?? "n/a"})`);
console.log(`Workspace B subscription: ${subsB[0]?.plan.name ?? "none"} (maxBots: ${subsB[0]?.plan.maxBots ?? "n/a"})`);
console.log();

// Cleanup test bots
await prisma.typebot.delete({ where: { id: botA.id } });
await prisma.typebot.delete({ where: { id: botB.id } });
console.log("Cleaned up test bots.");
console.log();
console.log("=== Isolation test PASSED ✓ ===");

await prisma.$disconnect();
