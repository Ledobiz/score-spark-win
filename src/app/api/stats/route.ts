import { NextResponse } from "next/server";
import { getStats } from "@/lib/predictions/service";

// Public — model track record for the win-rate card.
export async function GET() {
  const stats = await getStats();
  return NextResponse.json(stats);
}
