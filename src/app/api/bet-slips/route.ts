import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { loadEntitlement } from "@/lib/entitlement";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface SlipPick {
  id: string;
  fixture: string;
  market: string;
  pick: string;
  odds: number;
  confidence: number;
}

export interface BetSlipRow {
  id: string;
  name: string | null;
  picks: SlipPick[];
  combinedOdds: number;
  status: string;
  createdAt: string;
}

// GET — the user's recent bet slips (scoped by userId).
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.betSlip.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const slips: BetSlipRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    picks: (r.picks as unknown as SlipPick[]) ?? [],
    combinedOdds: Number(r.combinedOdds),
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
  return NextResponse.json({ slips });
}

const pickSchema = z.object({
  id: z.string(),
  fixture: z.string(),
  market: z.string(),
  pick: z.string(),
  odds: z.number().positive(),
  confidence: z.number(),
});
// 15 legs matches typical bookmaker accumulator caps and keeps combined odds
// (product of all leg odds) well inside the combined_odds Decimal(14,2) column.
const MAX_PICKS = 15;
const MAX_COMBINED_ODDS = 99_999_999_999.99;
const createSchema = z.object({
  name: z.string().max(120).optional(),
  picks: z.array(pickSchema).min(2).max(MAX_PICKS),
});

// POST — save a slip. Paid feature: the accumulator gate is enforced HERE, and
// combined odds are recomputed server-side (never trust the client). Scoped by
// userId.
export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitlement } = await loadEntitlement(user.id);
  if (!entitlement.canUseAccumulator) {
    return NextResponse.json(
      { error: "The accumulator is a paid feature." },
      { status: 403 },
    );
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Add at least 2 valid picks." },
      { status: 400 },
    );
  }
  const { name, picks } = parsed.data;
  const combinedOdds = picks.reduce((acc, p) => acc * p.odds, 1);

  // Guard the DB's Decimal(14,2) column explicitly — some markets can carry
  // high enough odds that even within MAX_PICKS legs the product overflows.
  if (combinedOdds > MAX_COMBINED_ODDS) {
    return NextResponse.json(
      { error: "Combined odds too high — remove a pick and try again." },
      { status: 400 },
    );
  }

  try {
    await prisma.betSlip.create({
      data: {
        userId: user.id,
        name: name?.trim() || `Slip ${new Date().toLocaleDateString()}`,
        picks: picks as unknown as Prisma.InputJsonValue,
        combinedOdds,
        status: "pending",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save slip. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
