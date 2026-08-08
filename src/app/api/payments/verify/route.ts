import { NextResponse } from "next/server";
import { verifyAndActivate } from "@/lib/payments";
import { GATEWAY_PROVIDERS, type GatewayProvider } from "@/lib/payments/types";

/**
 * Called client-side from `/payment/verifying` right after the gateway
 * redirects back. Doing the (network-bound) verification here rather than in
 * the redirect route itself means the browser has something on screen — a
 * spinner — for the duration of the gateway round-trip, instead of a blank
 * tab while the server redirect hangs.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { provider?: string; reference?: string; transactionId?: string }
    | null;

  const provider = body?.provider;
  const reference = body?.reference;
  if (!provider || !reference || !(GATEWAY_PROVIDERS as string[]).includes(provider)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const result = await verifyAndActivate(provider as GatewayProvider, {
    reference,
    transactionId: body?.transactionId,
  });
  return NextResponse.json(result);
}
