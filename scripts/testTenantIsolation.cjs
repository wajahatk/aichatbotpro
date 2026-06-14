#!/usr/bin/env node
/**
 * Tenant Isolation Smoke Test
 * 
 * Tests that authenticated requests cannot access data from other workspaces.
 * Run: node scripts/testTenantIsolation.cjs
 * 
 * Requires:
 *   BASE_URL        — app URL (default: http://localhost:3000)
 *   ORG_A_TOKEN     — NextAuth JWT token for workspace A user
 *   ORG_B_TOKEN     — NextAuth JWT token for workspace B user
 *   ORG_A_ID        — workspace A ID
 *   ORG_B_ID        — workspace B ID
 * 
 * How to get a token (dev only):
 *   1. Sign in as the user
 *   2. Open DevTools → Application → Cookies → copy `next-auth.session-token`
 *      (or `__Secure-next-auth.session-token` in prod)
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ORG_A_TOKEN = process.env.ORG_A_TOKEN ?? "";
const ORG_B_TOKEN = process.env.ORG_B_TOKEN ?? "";
const ORG_A_ID = process.env.ORG_A_ID ?? "";
const ORG_B_ID = process.env.ORG_B_ID ?? "";

if (!ORG_A_TOKEN || !ORG_B_TOKEN || !ORG_A_ID || !ORG_B_ID) {
  console.error("Set ORG_A_TOKEN, ORG_B_TOKEN, ORG_A_ID, ORG_B_ID as env vars.");
  process.exit(1);
}

const cookieFor = (token) => `next-auth.session-token=${token}`;

async function get(path, cookieToken) {
  const r = await fetch(`${BASE_URL}${path}`, {
    headers: { Cookie: cookieFor(cookieToken) },
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

let passed = 0;
let failed = 0;

function assert(label, condition, details) {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL  ${label}`, details ?? "");
    failed++;
  }
}

async function run() {
  console.log(`\nTenant Isolation Tests — ${BASE_URL}\n`);

  // 1. Org A user can read Org A leads
  console.log("1. Authorized access");
  const ownLeads = await get(`/api/orgs/${ORG_A_ID}/leads`, ORG_A_TOKEN);
  assert("Org A user reads Org A leads → 200", ownLeads.status === 200);

  // 2. Org A user CANNOT read Org B leads
  console.log("\n2. Cross-org lead list access");
  const crossLeads = await get(`/api/orgs/${ORG_B_ID}/leads`, ORG_A_TOKEN);
  assert("Org A user blocked from Org B leads → 403", crossLeads.status === 403,
    `Got ${crossLeads.status}`);

  // 3. Org A user CANNOT read Org B bots
  console.log("\n3. Cross-org bot access");
  const crossBots = await get(`/api/orgs/${ORG_B_ID}/bots`, ORG_A_TOKEN);
  assert("Org A user blocked from Org B bots → 403", crossBots.status === 403,
    `Got ${crossBots.status}`);

  // 4. Org A user CANNOT read Org B notification preferences
  console.log("\n4. Cross-org notification preferences");
  const crossPrefs = await get(`/api/orgs/${ORG_B_ID}/notification-preferences`, ORG_A_TOKEN);
  assert("Org A user blocked from Org B prefs → 403", crossPrefs.status === 403,
    `Got ${crossPrefs.status}`);

  // 5. Unauthenticated request rejected
  console.log("\n5. Unauthenticated access");
  const unauthed = await get(`/api/orgs/${ORG_A_ID}/leads`, "invalid-token");
  assert("Unauthenticated request → 401", unauthed.status === 401,
    `Got ${unauthed.status}`);

  // 6. Org B user CANNOT read Org A lead events
  console.log("\n6. Cross-org lead events");
  const crossEvents = await get(`/api/orgs/${ORG_A_ID}/lead-events`, ORG_B_TOKEN);
  assert("Org B user blocked from Org A events → 403", crossEvents.status === 403,
    `Got ${crossEvents.status}`);

  // 7. GDPR export cross-org blocked
  console.log("\n7. Cross-org GDPR export");
  const crossExport = await get(`/api/orgs/${ORG_B_ID}/gdpr/export`, ORG_A_TOKEN);
  assert("Org A user blocked from Org B GDPR export → 403", crossExport.status === 403,
    `Got ${crossExport.status}`);

  console.log(`\n─────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("❌ ISOLATION FAILURES DETECTED — do not launch!");
    process.exit(1);
  } else {
    console.log("✅ All tenant isolation checks passed.");
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
