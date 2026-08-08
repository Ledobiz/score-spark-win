import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/server";
import { loadHistory } from "@/lib/history";

// Auth-required — the signed-in user's prediction history (scoped by userId).
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const history = await loadHistory(user.id);
  return NextResponse.json({ history });
}
