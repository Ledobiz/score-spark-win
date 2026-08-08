import { NextResponse, type NextRequest } from "next/server";
import { verifyAndActivate } from "@/lib/payments";
import { GATEWAY_PROVIDERS, type GatewayProvider } from "@/lib/payments/types";

// The gateway's hosted checkout redirects the browser back here after
// payment. Flutterwave appends ?tx_ref&transaction_id, Paystack appends
// ?reference (and ?trxref, same value).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!(GATEWAY_PROVIDERS as string[]).includes(provider)) {
    return NextResponse.redirect(`${appUrl}/onboarding?payment=failed`);
  }

  const { searchParams } = request.nextUrl;
  const reference =
    searchParams.get("tx_ref") ?? searchParams.get("reference") ?? searchParams.get("trxref");
  const transactionId = searchParams.get("transaction_id") ?? undefined;

  if (!reference) {
    return NextResponse.redirect(`${appUrl}/onboarding?payment=failed`);
  }

  const result = await verifyAndActivate(provider as GatewayProvider, { reference, transactionId });
  return NextResponse.redirect(
    `${appUrl}/onboarding?payment=${result.success ? "success" : "failed"}`,
  );
}
