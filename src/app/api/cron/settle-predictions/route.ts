import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatchResult } from "@/lib/predictions/service";

/**
 * Hourly settlement sweep, called by .github/workflows/settle-predictions.yml.
 * Reads back settled outcomes from the Python API (which settles daily against
 * matches.csv — see PredictionStore.settle()), so most rows won't flip off
 * "Pending" until the next daily data refresh has run, not immediately after
 * full time.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only consider matches that have had time to finish (kickoff + 3h buffer).
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const rows = await prisma.userPrediction.findMany({
    where: { result: null, kickoff: { not: null, lt: cutoff } },
    orderBy: { kickoff: "asc" },
    take: 200,
  });

  let settled = 0;
  for (const row of rows) {
    try {
      const matchDate = row.kickoff!.toISOString().slice(0, 10);
      const res = await getMatchResult({
        league: row.competition,
        home: row.homeTeam,
        away: row.awayTeam,
        matchDate,
      });
      if (res.found && res.outcome) {
        await prisma.userPrediction.update({
          where: { id: row.id },
          data: { result: res.outcome },
        });
        settled += 1;
      }
    } catch {
      // one row's failure must never abort the batch
    }
  }

  return NextResponse.json({ checked: rows.length, settled });
}
