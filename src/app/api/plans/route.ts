import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface PlanRow {
  id: string;
  name: string;
  interval: string;
  intervalDays: number;
  priceNgn: number;
  features: string[];
  sortOrder: number;
}

// Public — the plan catalog (global, not user data), for onboarding + pricing.
export async function GET() {
  const rows = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const plans: PlanRow[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    interval: p.interval,
    intervalDays: p.intervalDays,
    priceNgn: p.priceNgn,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    sortOrder: p.sortOrder,
  }));
  return NextResponse.json({ plans });
}
