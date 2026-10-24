/**
 * Paddle integration (Merchant of Record — subscriptions + payments).
 *
 * Production flow:
 *  1. Products/prices are created in Paddle, one per agent × plan.
 *  2. The browser opens Paddle.js checkout with NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.
 *  3. Paddle sends signed webhooks to our backend; the backend verifies
 *     PADDLE_WEBHOOK_SECRET and activates/cancels the agent subscription.
 *
 * Until the client token is configured, `openCheckout` reports
 * { mode: "demo" } and the UI uses the built-in demo checkout modal instead.
 */

import { isPaddleConfigured, serverConfig } from "../config";

export interface CheckoutRequest {
  agentSlug: string;
  planId: string;
  customerEmail: string;
  /** Paddle price id for agent × plan, from your Paddle dashboard. */
  paddlePriceId?: string;
}

export type CheckoutResult =
  | { mode: "live"; message: string }
  | { mode: "demo"; message: string }
  | { mode: "error"; message: string };

export function paddleConfigured(): boolean {
  return isPaddleConfigured();
}

/**
 * Opens checkout for a subscription. In production this loads Paddle.js
 * (https://cdn.paddle.com/paddle/paddle.js) with the client token and calls
 * Paddle.Checkout.open({ items: [{ priceId, quantity: 1 }], customer }).
 * Kept as a typed seam so the subscribe page never touches keys directly.
 */
export async function openCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
  if (!isPaddleConfigured()) {
    return {
      mode: "demo",
      message:
        "Paddle is not configured (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN missing) — use the demo checkout. In production this opens the Paddle sandbox/live checkout.",
    };
  }
  if (!req.paddlePriceId) {
    return {
      mode: "error",
      message: `No Paddle price id mapped for agent "${req.agentSlug}" plan "${req.planId}" yet. Create the product/price in Paddle and map it here.`,
    };
  }
  // Paddle.js is loaded from the CDN in the browser at runtime in production;
  // the actual activation happens via the signed webhook below, never here.
  return {
    mode: "live",
    message: "Paddle checkout would open now; subscription activates on webhook.",
  };
}

/**
 * Server-side webhook verification seam (Paddle-Signature header, ts;h1=…).
 * Implement HMAC-SHA256 with PADDLE_WEBHOOK_SECRET when going live; events to
 * handle: subscription.created / .activated / .past_due / .canceled,
 * transaction.completed (wallet top-ups). Never trust the browser alone.
 */
export function paddleWebhookSecretConfigured(): boolean {
  return Boolean(serverConfig().paddleWebhookSecret);
}
