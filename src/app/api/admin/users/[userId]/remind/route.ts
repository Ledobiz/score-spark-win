import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, sendExpiryReminder } from "@/lib/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { userId } = await params;
  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }
  try {
    await sendExpiryReminder(guard.userId, userId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
