import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  fullName: z.string().max(120).optional(),
  notifyDailyTips: z.boolean().optional(),
  dailyViewLimit: z.number().int().min(1).max(500).optional(),
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

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      ...(fullName !== undefined ? { fullName } : {}),
      ...(notifyDailyTips !== undefined ? { notifyDailyTips } : {}),
      ...(dailyViewLimit !== undefined ? { dailyViewLimit } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
