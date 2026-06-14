export type PushProvider = "fcm" | "onesignal";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushProviderClient {
  send(tokens: string[], payload: PushNotificationPayload): Promise<void>;
}
