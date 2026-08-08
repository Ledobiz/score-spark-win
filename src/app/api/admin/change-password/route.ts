import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, changeAdminPassword } from "@/lib/admin";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    await changeAdminPassword(
      guard.userId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
