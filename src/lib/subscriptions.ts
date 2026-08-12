import { prisma } from "@/lib/prisma";

/**
 * Activates (or extends) a user's subscription to a plan. `Subscription` only
 * ever holds one row per user (see prisma/schema.prisma), so this is a
 * find-or-create keyed on userId, not an append. Shared by both gateway
 * payments (src/lib/payments/index.ts) and referral redemptions
 * (src/lib/referrals.ts) so the activation logic only lives in one place.
 */
export async function activateSubscription(
  userId: string,
  planId: string,
  opts: { periodEnd: Date; paymentRef: string; paymentProvider: string },
): Promise<void> {
  const subData = {
    planId,
    status: "active",
    trialEndsAt: null,
    currentPeriodEnd: opts.periodEnd,
    paymentRef: opts.paymentRef,
    paymentProvider: opts.paymentProvider,
  };
  const existing = await prisma.subscription.findFirst({ where: { userId } });
  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data: subData });
  } else {
    await prisma.subscription.create({ data: { userId, ...subData } });
  }
}
