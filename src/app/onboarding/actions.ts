"use server";

import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

const DAY_MS = 86_400_000;

/**
 * Starts (or resets to) the free trial for the authenticated user. The free
 * plan and its trial length are admin-managed (full CRUD), so this looks up
 * the active, zero-price plan rather than assuming a fixed id/day count.
 */
export async function startFreeTrial() {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");

  const freePlan = await prisma.plan.findFirst({
    where: { priceNgn: 0, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!freePlan) throw new Error("No free trial plan is currently configured");

  const trialEnd = new Date(Date.now() + freePlan.intervalDays * DAY_MS);
  const existing = await prisma.subscription.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        planId: freePlan.id,
        status: "trialing",
        trialEndsAt: trialEnd,
        currentPeriodEnd: null,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        status: "trialing",
        trialEndsAt: trialEnd,
      },
    });
  }

  return { ok: true, trialEnd: trialEnd.toISOString() };
}

/** Cancels the user's subscription (used by Settings). Auth-scoped by userId. */
export async function cancelSubscription() {
  const user = await getAuthedUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.subscription.updateMany({
    where: { userId: user.id },
    data: { status: "cancelled" },
  });
  return { ok: true };
}
