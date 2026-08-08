import { NextResponse } from "next/server";
import { getLeagues } from "@/lib/predictions/service";

// Public — league list (from the Python API, or dev mocks).
export async function GET() {
  const data = await getLeagues();
  return NextResponse.json(data);
}
