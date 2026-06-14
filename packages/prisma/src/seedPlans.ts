import prisma from "@typebot.io/prisma";

const defaultPlans = [
  {
    name: "Free Trial",
    slug: "free-trial",
    description: "Get started and explore the platform",
    price: 0,
    billingInterval: "MONTHLY" as const,
    maxBots: 3,
    maxLeadsPerMonth: 200,
    teamSeats: 1,
    brandingRemoval: false,
    whiteLabelAllowed: false,
    apiAccess: false,
    mobileAppAccess: false,
    isActive: true,
    sortOrder: 0,
  },
  {
    name: "Starter",
    slug: "starter",
    description: "For freelancers and small businesses",
    price: 39,
    billingInterval: "MONTHLY" as const,
    maxBots: 10,
    maxLeadsPerMonth: 2000,
    teamSeats: 2,
    brandingRemoval: true,
    whiteLabelAllowed: false,
    apiAccess: true,
    mobileAppAccess: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Pro",
    slug: "pro",
    description: "For growing agencies and businesses",
    price: 89,
    billingInterval: "MONTHLY" as const,
    maxBots: 50,
    maxLeadsPerMonth: 10000,
    teamSeats: 5,
    brandingRemoval: true,
    whiteLabelAllowed: true,
    apiAccess: true,
    mobileAppAccess: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited power for large organizations",
    price: 299,
    billingInterval: "MONTHLY" as const,
    maxBots: 999,
    maxLeadsPerMonth: 100000,
    teamSeats: 10,
    brandingRemoval: true,
    whiteLabelAllowed: true,
    apiAccess: true,
    mobileAppAccess: true,
    isActive: true,
    sortOrder: 3,
  },
];

export const seedPlans = async () => {
  console.log("Seeding subscription plans...");
  for (const plan of defaultPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        maxBots: plan.maxBots,
        maxLeadsPerMonth: plan.maxLeadsPerMonth,
        teamSeats: plan.teamSeats,
        brandingRemoval: plan.brandingRemoval,
        whiteLabelAllowed: plan.whiteLabelAllowed,
        apiAccess: plan.apiAccess,
        mobileAppAccess: plan.mobileAppAccess,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
    console.log(`  ✓ ${plan.name}`);
  }
  console.log("Done seeding plans.");
};

seedPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
