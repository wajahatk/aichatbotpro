import prisma from "@typebot.io/prisma";
const testWs = await prisma.workspace.findFirst({ where: { slug: "test-client-b" } });
if (testWs) {
  await prisma.workspace.delete({ where: { id: testWs.id } });
  console.log("Cleaned up test workspace");
} else {
  console.log("No test workspace found");
}
await prisma.$disconnect();
