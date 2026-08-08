import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, setRole } from "@/lib/admin";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user"]),
  grant: z.boolean(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { userId, role, grant } = parsed.data;
  await setRole(userId, role, grant);
  return NextResponse.json({ ok: true });
}
