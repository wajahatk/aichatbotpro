#!/usr/bin/env node
// Run: node scripts/generateVapidKeys.cjs
// Then copy the output values into your Replit environment secrets.
const webPush = require("web-push");
const keys = webPush.generateVAPIDKeys();
console.log("\n=== VAPID Keys ===");
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log('VAPID_EMAIL=mailto:admin@yourdomain.com');
console.log("\nCopy these three lines into your Replit environment secrets (Tools → Secrets).\n");
