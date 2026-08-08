import "server-only";
import { prisma } from "@/lib/prisma";

export interface HistoryRow {
  id: string;
  competition: string;
  fixture: string;
  predictedOutcome: string | null;
  confidence: number | null;
  result: string | null;
  createdAt: string;
}

/**
 * The signed-in user's prediction history (most recent first). Scoped by userId
 * — there is no RLS, so this filter is the ownership boundary. Server-only.
 */
export async function loadHistory(
  userId: string,
  limit = 100,
): Promise<HistoryRow[]> {
  const rows = await prisma.userPrediction.findMany({
    where: { userId },
    select: {
      id: true,
      competition: true,
      fixture: true,
      predictedOutcome: true,
      confidence: true,
      result: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    competition: r.competition,
    fixture: r.fixture,
    predictedOutcome: r.predictedOutcome,
    confidence: r.confidence,
    result: r.result,
    createdAt: r.createdAt.toISOString(),
  }));
}
