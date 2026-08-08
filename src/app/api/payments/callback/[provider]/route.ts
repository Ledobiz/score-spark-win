import { NextResponse, type NextRequest } from "next/server";
import { GATEWAY_PROVIDERS } from "@/lib/payments/types";

// The gateway's hosted checkout redirects the browser back here after
// payment. Flutterwave appends ?tx_ref&transaction_id, Paystack appends
// ?reference (and ?trxref, same value).
//
// This route only builds a redirect — it does NOT call verifyAndActivate()
// itself. That call is a network round-trip to the gateway and can take a
// couple of seconds; doing it here would leave the browser on a blank tab
// with no feedback for that whole window. Instead we hand off instantly to
// `/payment/verifying`, a client page that shows a spinner while it performs
// the actual verification via POST /api/payments/verify.
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

  const verifyUrl = new URL("/payment/verifying", appUrl);
  verifyUrl.searchParams.set("provider", provider);
  verifyUrl.searchParams.set("reference", reference);
  if (transactionId) verifyUrl.searchParams.set("transactionId", transactionId);

  return NextResponse.redirect(verifyUrl);
}
