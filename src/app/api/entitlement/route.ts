import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/server";
import { loadEntitlement } from "@/lib/entitlement";

// Auth-required — the signed-in user's plan entitlement + today's view count.
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await loadEntitlement(user.id);
  return NextResponse.json({ ...data, email: user.email ?? null });
}
