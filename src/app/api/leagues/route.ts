import { NextResponse } from "next/server";
import { getLeagues } from "@/lib/predictions/service";

// Public — league list from the Python API. `unavailable: true` when the API
// couldn't be reached, so the client can say so instead of showing nothing.
export async function GET() {
  const data = await getLeagues();
  return NextResponse.json(data);
}
