import type { PushProviderClient } from "./interface";

export type PushProviderName = "fcm" | "onesignal" | "none";

export function createPushProvider(): PushProviderClient | null {
  const provider = (process.env.PUSH_PROVIDER ?? "fcm") as PushProviderName;

  if (provider === "none") return null;

  if (provider === "onesignal") {
    const { OneSignalProvider } = require("./onesignal");
    return new OneSignalProvider();
  }

  const { FcmProvider } = require("./fcm");
  return new FcmProvider();
}
