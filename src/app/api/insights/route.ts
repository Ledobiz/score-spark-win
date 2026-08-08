import { NextResponse } from "next/server";
import { getInsights } from "@/lib/predictions/service";

// Public — model track record + confidence-tier calibration (global, not user
// data). `insights.unavailable: true` when the Python API couldn't be reached.
export async function GET() {
  const insights = await getInsights();
  return NextResponse.json({ insights });
}
