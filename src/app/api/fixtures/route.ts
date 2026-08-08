import { NextResponse, type NextRequest } from "next/server";
import { getFixtures } from "@/lib/predictions/service";

// Public — fixtures for a league. GET /api/fixtures?league=<id>
// `unavailable: true` when the Python API couldn't be reached.
export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league");
  if (!league) {
    return NextResponse.json({ error: "Missing league" }, { status: 400 });
  }
  const data = await getFixtures(league);
  return NextResponse.json(data);
}
