import { NextResponse } from "next/server";
import { getInsights } from "@/lib/predictions/service";

// Public — model track record + confidence-tier calibration (global, not user data).
export async function GET() {
  const insights = await getInsights();
  return NextResponse.json({ insights });
}
