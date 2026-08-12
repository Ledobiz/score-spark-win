import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { redeemReferralPoints } from "@/lib/referrals";

const schema = z.object({
  planId: z.string().min(1),
  points: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { periodEnd } = await redeemReferralPoints(user.id, parsed.data.planId, parsed.data.points);
    return NextResponse.json({ periodEnd: periodEnd.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to redeem points";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
