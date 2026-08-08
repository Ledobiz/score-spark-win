import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { loadEntitlement } from "@/lib/entitlement";
import { fetchDetailed } from "@/lib/predictions/service";
import type { Prisma } from "@prisma/client";

const bodySchema = z.object({
  fixtureId: z.string().min(1),
  home: z.string().min(1),
  away: z.string().min(1),
  league: z.string().min(1),
});

/**
 * Auth-required detailed prediction (CLAUDE.md §6). On each call:
 *  1. authenticate + enforce the free-tier daily limit,
 *  2. call /prediction/detailed — 503 if the Python API is unreachable, with no
 *     fabricated fallback and no charge against the daily limit,
 *  3. log a `prediction_view` activity row + persist to history,
 *  4. return the payload.
 * DB writes are wrapped so a storage failure never breaks a prediction. Every
 * write is scoped to the authenticated userId — there is no RLS.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = parsed.data;

  // Enforce the daily prediction limit — sourced from the user's plan (and
  // tightened further by their personal "responsible gambling" limit, if set).
  const { entitlement, todayCount } = await loadEntitlement(user.id);
  const dailyLimit = entitlement.dailyCustomPredictionLimit;
  if (todayCount >= dailyLimit) {
    return NextResponse.json(
      { error: `Daily limit (${dailyLimit}) reached. Upgrade for unlimited.` },
      { status: 429 },
    );
  }

  const result = await fetchDetailed(data);
  if (!result) {
    return NextResponse.json(
      { error: "Prediction service is currently unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  // Only count the view — against the daily limit — once we actually got a
  // real prediction back.
  try {
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activityType: "prediction_view",
        meta: {
          fixtureId: data.fixtureId,
          home: data.home,
          away: data.away,
          league: data.league,
        },
      },
    });
  } catch {
    // logging must never break a prediction
  }

  // Persist to the user's prediction history so it loads on sign-in.
  try {
    await prisma.userPrediction.create({
      data: {
        userId: user.id,
        competition: result.competition,
        homeTeam: result.home_team,
        awayTeam: result.away_team,
        fixture: result.simple.fixture,
        predictedOutcome: result.simple.predicted_outcome,
        confidence: result.simple.confidence,
        method: result.method,
        payload: result as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // storage failure must never break a prediction
  }

  return NextResponse.json(result);
}
