import { env } from "@typebot.io/env";

export type PayPalSubscriptionStatus =
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

interface PayPalSubscription {
  id: string;
  status: PayPalSubscriptionStatus;
  plan_id: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: {
      amount: { currency_code: string; value: string };
      time: string;
    };
  };
  subscriber?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  links?: Array<{ href: string; rel: string; method: string }>;
}

export const getPayPalAccessToken = async (): Promise<string> => {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const baseUrl = env.PAYPAL_BASE_URL;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
};

export const createPayPalSubscriptionApprovalUrl = async ({
  paypalPlanId,
  workspaceId,
  planSlug,
  returnUrl,
  cancelUrl,
}: {
  paypalPlanId: string;
  workspaceId: string;
  planSlug: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ approvalUrl: string; subscriptionId: string }> => {
  const token = await getPayPalAccessToken();
  const baseUrl = env.PAYPAL_BASE_URL;

  const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      plan_id: paypalPlanId,
      custom_id: JSON.stringify({ workspaceId, planSlug }),
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: "AI Chat Bot Pro",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PayPal subscription creation failed: ${response.status} ${text}`,
    );
  }

  const data = (await response.json()) as PayPalSubscription;
  const approvalLink = data.links?.find((l) => l.rel === "approve");

  if (!approvalLink) {
    throw new Error("PayPal did not return an approval link");
  }

  return { approvalUrl: approvalLink.href, subscriptionId: data.id };
};

export const getPayPalSubscription = async (
  subscriptionId: string,
): Promise<PayPalSubscription> => {
  const token = await getPayPalAccessToken();
  const baseUrl = env.PAYPAL_BASE_URL;

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PayPal get subscription failed: ${response.status} ${text}`,
    );
  }

  return response.json() as Promise<PayPalSubscription>;
};

export const cancelPayPalSubscription = async (
  subscriptionId: string,
  reason = "User requested cancellation",
): Promise<void> => {
  const token = await getPayPalAccessToken();
  const baseUrl = env.PAYPAL_BASE_URL;

  const response = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  );

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw new Error(
      `PayPal cancel subscription failed: ${response.status} ${text}`,
    );
  }
};

export const verifyPayPalWebhookSignature = async ({
  headers,
  body,
}: {
  headers: Record<string, string>;
  body: string;
}): Promise<boolean> => {
  const token = await getPayPalAccessToken();
  const baseUrl = env.PAYPAL_BASE_URL;
  const webhookId = env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) return false;

  const response = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        client_id: env.PAYPAL_CLIENT_ID,
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    },
  );

  if (!response.ok) return false;
  const data = (await response.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
};
