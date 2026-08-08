import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, listPlans, updatePlan, createPlan, deletePlan } from "@/lib/admin";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const plans = await listPlans();
  return NextResponse.json({ plans });
}

const patchSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  priceNgn: z.number().nonnegative().optional(),
  intervalDays: z.number().int().nonnegative().optional(),
  dailyRecommendationLimit: z.number().int().nonnegative().optional(),
  dailyCustomPredictionLimit: z.number().int().nonnegative().optional(),
  canUseAccumulator: z.boolean().optional(),
  canExportHistory: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { id, ...patch } = parsed.data;
  await updatePlan(id, patch);
  return NextResponse.json({ ok: true });
}

const createSchema = z.object({
  name: z.string().min(1),
  interval: z.string().min(1),
  intervalDays: z.number().int().nonnegative(),
  priceNgn: z.number().nonnegative(),
  dailyRecommendationLimit: z.number().int().nonnegative().default(0),
  dailyCustomPredictionLimit: z.number().int().nonnegative().default(0),
  canUseAccumulator: z.boolean().default(false),
  canExportHistory: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const plan = await createPlan(parsed.data);
  return NextResponse.json({ plan });
}

const deleteSchema = z.object({ id: z.string() });

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = await deletePlan(parsed.data.id);
  return NextResponse.json(result);
}
