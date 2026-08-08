import { NextResponse, type NextRequest } from "next/server";
import { verifyAndActivate } from "@/lib/payments";
import { verifyFlutterwaveWebhookSignature } from "@/lib/payments/flutterwave";
import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack";
import { GATEWAY_PROVIDERS } from "@/lib/payments/types";

// Backstop for the redirect callback — fires even if the user closes the tab
// before the browser redirect completes. Must read the raw body (not
// request.json()) since Paystack's signature is computed over the raw bytes.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!(GATEWAY_PROVIDERS as string[]).includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const rawBody = await request.text();

  if (provider === "flutterwave") {
    if (!verifyFlutterwaveWebhookSignature(request.headers.get("verif-hash"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const payload = JSON.parse(rawBody) as { data?: { tx_ref?: string; id?: number } };
    const reference = payload.data?.tx_ref;
    const transactionId = payload.data?.id != null ? String(payload.data.id) : undefined;
    if (reference) await verifyAndActivate("flutterwave", { reference, transactionId });
  } else {
    if (!verifyPaystackWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const payload = JSON.parse(rawBody) as { data?: { reference?: string } };
    const reference = payload.data?.reference;
    if (reference) await verifyAndActivate("paystack", { reference });
  }

  // Both providers expect a fast 200 regardless of internal outcome, to avoid retries.
  return NextResponse.json({ received: true });
}
