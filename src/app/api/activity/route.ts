import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export interface ActivityRow {
  created_at: string;
  league: string | null;
}

// Auth-required — the signed-in user's prediction_view events over the last 30
// days (for the dashboard views / streak / top-league cards). Scoped by userId
// (no RLS). Never queried from the browser.
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.userActivity.findMany({
    where: {
      userId: user.id,
      activityType: "prediction_view",
      createdAt: { gte: since },
    },
    select: { createdAt: true, meta: true },
    orderBy: { createdAt: "desc" },
  });

  const activity: ActivityRow[] = rows.map((r) => ({
    created_at: r.createdAt.toISOString(),
    league:
      (r.meta as { league?: string } | null)?.league ?? null,
  }));

  return NextResponse.json({ activity });
}
