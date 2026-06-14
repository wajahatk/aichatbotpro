/**
 * Loads OAuth providers from the database (OAuthProviderConfig table),
 * decrypts their secrets, and builds NextAuth Provider objects.
 *
 * Uses a 5-minute in-process TTL cache so the DB is only queried when
 * credentials change. Call `ensureDbProvidersLoaded()` before the first
 * auth request; call `invalidateDbProvidersCache()` after superadmin saves.
 */

import { decrypt } from "@typebot.io/credentials/decrypt";
import prisma from "@typebot.io/prisma";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedProviders: Provider[] = [];
let cacheExpiresAt = 0;
let loadPromise: Promise<void> | null = null;

type ProviderSecrets = {
  clientSecret?: string;
  tenantId?: string;
};

async function loadFromDb(): Promise<void> {
  try {
    const configs = await prisma.oAuthProviderConfig.findMany({
      where: { enabled: true },
    });

    const loaded: Provider[] = [];

    for (const config of configs) {
      if (!config.clientId || !config.encryptedData || !config.iv) continue;

      let secrets: ProviderSecrets = {};
      try {
        secrets = (await decrypt(
          config.encryptedData,
          config.iv,
        )) as ProviderSecrets;
      } catch {
        console.warn(`[dbProviders] Failed to decrypt secrets for ${config.provider}`);
        continue;
      }

      const { clientSecret, tenantId } = secrets;
      if (!clientSecret) continue;

      switch (config.provider) {
        case "google":
          loaded.push(
            GoogleProvider({
              clientId: config.clientId,
              clientSecret,
              allowDangerousEmailAccountLinking: true,
            }),
          );
          break;
        case "facebook":
          loaded.push(
            FacebookProvider({
              clientId: config.clientId,
              clientSecret,
              allowDangerousEmailAccountLinking: true,
            }),
          );
          break;
        case "github":
          loaded.push(
            GitHubProvider({
              clientId: config.clientId,
              clientSecret,
              allowDangerousEmailAccountLinking: true,
            }),
          );
          break;
        case "microsoft-entra-id":
          loaded.push(
            MicrosoftEntraID({
              clientId: config.clientId,
              clientSecret,
              issuer: `https://login.microsoftonline.com/${tenantId ?? "common"}/v2.0`,
              allowDangerousEmailAccountLinking: true,
            } as Parameters<typeof MicrosoftEntraID>[0]),
          );
          break;
        case "apple":
          // Apple Sign In uses a JWT-based client secret generated from a
          // .p8 private key. Store the pre-generated JWT as clientSecret.
          // See: https://next-auth.js.org/providers/apple
          try {
            const Apple = (await import("next-auth/providers/apple")).default;
            loaded.push(
              Apple({
                clientId: config.clientId,
                clientSecret,
                allowDangerousEmailAccountLinking: true,
              } as Parameters<typeof Apple>[0]),
            );
          } catch {
            console.warn("[dbProviders] next-auth/providers/apple not available");
          }
          break;
        default:
          break;
      }
    }

    cachedProviders = loaded;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  } catch (err) {
    console.error("[dbProviders] Failed to load from DB:", err);
    // Keep stale cache on error rather than clearing it
    if (cachedProviders.length === 0) cacheExpiresAt = Date.now() + 30_000;
  } finally {
    loadPromise = null;
  }
}

/** Async — awaits initial load or refresh. Call before first auth request. */
export async function ensureDbProvidersLoaded(): Promise<void> {
  if (Date.now() < cacheExpiresAt) return;
  if (!loadPromise) loadPromise = loadFromDb();
  await loadPromise;
}

/** Sync — returns whatever is in the cache right now. */
export function getCachedDbProviders(): Provider[] {
  if (Date.now() >= cacheExpiresAt && !loadPromise) {
    loadPromise = loadFromDb();
  }
  return cachedProviders;
}

/** Call this after the superadmin updates provider settings. */
export function invalidateDbProvidersCache(): void {
  cacheExpiresAt = 0;
  cachedProviders = [];
}
