import type { InitiateArgs, InitiateResult, PaymentGatewayClient, VerifyResult } from "./types";

const API_BASE = "https://api.flutterwave.com/v3";

function secretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("Flutterwave is not configured");
  return key;
}

/**
 * v3 Standard payments — POST /v3/payments returns a hosted checkout link;
 * Flutterwave then redirects back to redirectUrl with ?status&tx_ref&transaction_id.
 */
async function initiate({ reference, amountNgn, email, redirectUrl }: InitiateArgs): Promise<InitiateResult> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount: amountNgn,
      currency: "NGN",
      redirect_url: redirectUrl,
      customer: { email },
    }),
  });
  const body = (await res.json().catch(() => null)) as { data?: { link?: string } } | null;
  if (!res.ok || !body?.data?.link) {
    throw new Error("Failed to initiate Flutterwave payment");
  }
  return { redirectUrl: body.data.link };
}

/**
 * Verify by the numeric transaction_id from the redirect — the reliably
 * documented Flutterwave verify path (GET /v3/transactions/{id}/verify).
 * `identifier` here is that transaction_id.
 */
async function verify(transactionId: string): Promise<VerifyResult> {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as {
    data?: {
      status?: string;
      currency?: string;
      amount?: number;
      tx_ref?: string;
      id?: number;
    };
  } | null;
  const data = body?.data;
  if (!res.ok || !data) {
    return { success: false, providerRef: transactionId, ourReference: "", amountNgn: 0 };
  }
  const success = data.status === "successful" && data.currency === "NGN";
  return {
    success,
    providerRef: String(data.id ?? transactionId),
    ourReference: data.tx_ref ?? "",
    amountNgn: data.amount ?? 0,
  };
}

/**
 * Flutterwave's documented webhook auth is a plain string comparison of the
 * `verif-hash` header against a secret hash configured in the dashboard —
 * not HMAC.
 */
export function verifyFlutterwaveWebhookSignature(headerValue: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  if (!expected || !headerValue) return false;
  return headerValue === expected;
}

export const flutterwaveClient: PaymentGatewayClient = { initiate, verify };
