import { NextResponse } from "next/server";
import { getStats } from "@/lib/predictions/service";

// Public — model track record for the win-rate card. `unavailable: true` when
// the Python API couldn't be reached (never a fabricated success rate).
export async function GET() {
  const stats = await getStats();
  return NextResponse.json(stats);
}
