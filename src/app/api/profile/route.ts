import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { loadEntitlement } from "@/lib/entitlement";

const patchSchema = z.object({
  fullName: z.string().max(120).optional(),
  notifyDailyTips: z.boolean().optional(),
  dailyViewLimit: z.number().int().min(0).max(500).optional(),
});

// Auth-required — update the signed-in user's own profile (scoped by id).
export async function PATCH(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { fullName, notifyDailyTips, dailyViewLimit } = parsed.data;

  // A personal "responsible gambling" limit may only tighten the plan's daily
  // limit, never exceed it — clamp here too so the API can't be used to bypass
  // the cap the UI enforces.
  let clampedDailyViewLimit = dailyViewLimit;
  if (dailyViewLimit !== undefined && dailyViewLimit > 0) {
    const { planDailyCustomPredictionLimit } = await loadEntitlement(user.id);
    clampedDailyViewLimit = Math.min(dailyViewLimit, planDailyCustomPredictionLimit);
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      ...(fullName !== undefined ? { fullName } : {}),
      ...(notifyDailyTips !== undefined ? { notifyDailyTips } : {}),
      ...(clampedDailyViewLimit !== undefined ? { dailyViewLimit: clampedDailyViewLimit } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
