import { NextResponse } from "next/server";
import { requireAdmin, listActivityOverview } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const overview = await listActivityOverview();
  return NextResponse.json(overview);
}
