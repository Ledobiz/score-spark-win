import { NextResponse } from "next/server";
import { requireAdmin, getOverview } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const overview = await getOverview();
  return NextResponse.json(overview);
}
