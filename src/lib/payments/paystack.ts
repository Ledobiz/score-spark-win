import { createHmac, timingSafeEqual } from "crypto";
import type { InitiateArgs, InitiateResult, PaymentGatewayClient, VerifyResult } from "./types";

const API_BASE = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack is not configured");
  return key;
}

/** POST /transaction/initialize — amount is in kobo (NGN * 100). */
async function initiate({ reference, amountNgn, email, redirectUrl }: InitiateArgs): Promise<InitiateResult> {
  const res = await fetch(`${API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountNgn * 100),
      reference,
      callback_url: redirectUrl,
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { authorization_url?: string };
  } | null;
  if (!res.ok || !body?.data?.authorization_url) {
    throw new Error("Failed to initiate Paystack payment");
  }
  return { redirectUrl: body.data.authorization_url };
}

/** GET /transaction/verify/:reference — `identifier` is our own reference. */
async function verify(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as {
    data?: { status?: string; amount?: number; reference?: string; id?: number };
  } | null;
  const data = body?.data;
  if (!res.ok || !data) {
    return { success: false, providerRef: reference, ourReference: "", amountNgn: 0 };
  }
  return {
    success: data.status === "success",
    providerRef: data.id != null ? String(data.id) : reference,
    ourReference: data.reference ?? "",
    amountNgn: (data.amount ?? 0) / 100,
  };
}

/**
 * Paystack signs the raw webhook body: x-paystack-signature =
 * HMAC-SHA512(secretKey, rawBody). Must hash the raw string, not a
 * re-serialized object, or the signature won't match.
 */
export function verifyPaystackWebhookSignature(rawBody: string, headerValue: string | null): boolean {
  if (!headerValue) return false;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(headerValue, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export const paystackClient: PaymentGatewayClient = { initiate, verify };
