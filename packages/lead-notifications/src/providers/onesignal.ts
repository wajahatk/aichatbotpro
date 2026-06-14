import type { PushNotificationPayload, PushProviderClient } from "./interface";

export class OneSignalProvider implements PushProviderClient {
  private appId: string;
  private apiKey: string;

  constructor() {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;
    if (!appId || !apiKey) {
      throw new Error(
        "OneSignal not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY.",
      );
    }
    this.appId = appId;
    this.apiKey = apiKey;
  }

  async send(tokens: string[], payload: PushNotificationPayload): Promise<void> {
    if (tokens.length === 0) return;
    try {
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          include_player_ids: tokens,
          headings: { en: payload.title },
          contents: { en: payload.body },
          data: payload.data ?? {},
        }),
      });
      if (!res.ok) {
        console.error("[OneSignal] notification failed:", await res.text());
      }
    } catch (err) {
      console.error("[OneSignal] send error:", err);
    }
  }
}
