import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, getUserDetail, deleteUser } from "@/lib/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { userId } = await params;
  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }
  const detail = await getUserDetail(userId);
  return NextResponse.json(detail);
}

export async function DELETE(
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
    await deleteUser(guard.userId, userId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
