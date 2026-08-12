import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/server";
import { getReferralSummary } from "@/lib/referrals";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await getReferralSummary(user.id);
  return NextResponse.json(summary);
}
