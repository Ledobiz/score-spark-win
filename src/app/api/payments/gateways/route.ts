import { NextResponse } from "next/server";
import { getEnabledGateways } from "@/lib/payments";

// Public — which gateways are actually usable right now, so onboarding can
// decide which "Pay with..." buttons to render.
export async function GET() {
  const gateways = await getEnabledGateways();
  return NextResponse.json({ gateways });
}
