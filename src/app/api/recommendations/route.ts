import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/predictions/service";

// Public — today's recommendations (one row per market per fixture).
// `unavailable: true` when the Python API couldn't be reached.
export async function GET() {
  const data = await getRecommendations();
  return NextResponse.json(data);
}
