import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/predictions/service";

// Public — today's recommendations (one row per market per fixture).
export async function GET() {
  const recommendations = await getRecommendations();
  return NextResponse.json({ recommendations });
}
