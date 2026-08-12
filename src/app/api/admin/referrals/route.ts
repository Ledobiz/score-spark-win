import { NextResponse } from "next/server";
import { requireAdmin, getReferralActivity } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const activity = await getReferralActivity();
  return NextResponse.json(activity);
}
