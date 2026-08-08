import { NextResponse } from "next/server";
import { requireAdmin, refreshFixturesCache } from "@/lib/admin";

export async function POST() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  try {
    await refreshFixturesCache(guard.userId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
