import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, changePlan } from "@/lib/admin";

const schema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["set_plan", "start_trial", "cancel"]),
  planId: z.string().optional(),
  reason: z.string().max(300).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { userId, action, planId, reason } = parsed.data;
  try {
    await changePlan(guard.userId, userId, action, planId, reason);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
