import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { referralPointEarnedEmailHtml, referralRedeemedEmailHtml } from "@/lib/email-templates";
import { loadEntitlement } from "@/lib/entitlement";
import { activateSubscription } from "@/lib/subscriptions";

const DAY_MS = 86_400_000;
/** Referrals needed per point when a plan's `referralsPerPoint` is left at 0. */
const DEFAULT_REFERRALS_PER_POINT = 2;

export interface ReferralPlanSummary {
  planId: string;
  planName: string;
  intervalDays: number;
  referralsPerPoint: number;
  qualifyingReferrals: number;
  earned: number;
  redeemed: number;
  available: number;
}

export interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  referredUsers: {
    id: string;
    name: string | null;
    email: string | null;
    joinedAt: string;
    hasPaid: boolean;
  }[];
  plans: ReferralPlanSummary[];
  redemptions: {
    id: string;
    planId: string;
    planName: string;
    pointsUsed: number;
    periodEndAt: string;
    createdAt: string;
  }[];
}

function slugifyBase(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
}

function randomSuffix(length = 4): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

/** Resolves a referral code to the referrer's userId. Unknown/invalid codes
 * resolve to null rather than throwing — a bad ?ref= value should never block
 * signup. */
export async function resolveReferrer(code: string): Promise<string | null> {
  const trimmed = code.trim().toLowerCase();
  if (!trimmed) return null;
  const profile = await prisma.profile.findUnique({
    where: { referralCode: trimmed },
    select: { id: true },
  });
  return profile?.id ?? null;
}

/** Lazily generates and persists a referral code for users who don't have one
 * yet, so pre-existing users work without a backfill migration. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { referralCode: true, fullName: true, email: true },
  });
  if (!profile) throw new Error("Profile not found");
  if (profile.referralCode) return profile.referralCode;

  const base = slugifyBase(profile.fullName || profile.email?.split("@")[0] || "user") || "user";
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${base}${randomSuffix()}`;
    const clash = await prisma.profile.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!clash) {
      await prisma.profile.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    }
  }
  throw new Error("Failed to generate a unique referral code");
}

/** Maps each referred userId to the planId of their first-ever successful
 * payment (or omits them if they've never paid). */
async function getFirstSuccessfulPaymentsByUser(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const payments = await prisma.payment.findMany({
    where: { userId: { in: userIds }, status: "success" },
    orderBy: { createdAt: "asc" },
    select: { userId: true, planId: true },
  });
  const map = new Map<string, string>();
  for (const p of payments) {
    if (!map.has(p.userId)) map.set(p.userId, p.planId);
  }
  return map;
}

async function getAvailablePoints(userId: string, planId: string): Promise<number> {
  const [earned, redeemedAgg] = await Promise.all([
    prisma.referralCredit.count({ where: { referrerId: userId, planId } }),
    prisma.referralRedemption.aggregate({ where: { userId, planId }, _sum: { pointsUsed: true } }),
  ]);
  return earned - (redeemedAgg._sum.pointsUsed ?? 0);
}

async function sendReferralPointEmail(userId: string, planId: string, planName: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return;
  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { email: true } });
  if (!profile?.email) return;

  const totalAvailable = await getAvailablePoints(userId, planId);
  const result = await sendEmail({
    to: profile.email,
    subject: "You earned a SHUZAM referral point",
    html: referralPointEarnedEmailHtml({ planName, totalAvailable }, appUrl),
  });
  if (!result.ok) {
    console.error(`[referral-point-email] failed to email ${profile.email}: ${result.error}`);
  }
}

async function sendReferralRedemptionEmail(
  userId: string,
  planName: string,
  pointsUsed: number,
  periodEnd: Date,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return;
  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { email: true } });
  if (!profile?.email) return;

  const result = await sendEmail({
    to: profile.email,
    subject: "Your SHUZAM referral redemption",
    html: referralRedeemedEmailHtml({ planName, pointsUsed, periodEnd }, appUrl),
  });
  if (!result.ok) {
    console.error(`[referral-redeemed-email] failed to email ${profile.email}: ${result.error}`);
  }
}

/**
 * Called right after a payment is marked `"success"` and its subscription is
 * activated (see verifyAndActivate in src/lib/payments/index.ts). Only a
 * referred user's first-ever successful payment counts. Points are recomputed
 * as `floor(qualifyingReferrals / referralsPerPoint)` and the delta vs.
 * already-existing ReferralCredit rows is inserted — idempotent by
 * construction, so this is safe to call more than once for the same payment.
 */
export async function creditReferralIfEligible(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "success") return;

  const referredProfile = await prisma.profile.findUnique({
    where: { id: payment.userId },
    select: { referredById: true },
  });
  const referrerId = referredProfile?.referredById;
  if (!referrerId) return;

  const successfulPaymentCount = await prisma.payment.count({
    where: { userId: payment.userId, status: "success" },
  });
  if (successfulPaymentCount !== 1) return;

  const plan = await prisma.plan.findUnique({ where: { id: payment.planId } });
  if (!plan || plan.priceNgn === 0) return;

  const referredIds = (
    await prisma.profile.findMany({ where: { referredById: referrerId }, select: { id: true } })
  ).map((p) => p.id);
  const firstPayments = await getFirstSuccessfulPaymentsByUser(referredIds);
  const qualifyingCount = [...firstPayments.values()].filter((pid) => pid === plan.id).length;

  const perPoint = plan.referralsPerPoint > 0 ? plan.referralsPerPoint : DEFAULT_REFERRALS_PER_POINT;
  const pointsShouldExist = Math.floor(qualifyingCount / perPoint);
  const existingCount = await prisma.referralCredit.count({ where: { referrerId, planId: plan.id } });
  const delta = pointsShouldExist - existingCount;
  if (delta <= 0) return;

  await prisma.referralCredit.createMany({
    data: Array.from({ length: delta }, () => ({ referrerId, planId: plan.id })),
  });

  await sendReferralPointEmail(referrerId, plan.id, plan.name);
}

export async function getReferralSummary(userId: string): Promise<ReferralSummary> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const referralCode = await getOrCreateReferralCode(userId);

  const [referredProfiles, plans, redemptions, earnedCounts, redeemedSums] = await Promise.all([
    prisma.profile.findMany({
      where: { referredById: userId },
      select: { id: true, fullName: true, email: true, createdAt: true },
    }),
    prisma.plan.findMany({
      where: { isActive: true, priceNgn: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.referralRedemption.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referralCredit.groupBy({ by: ["planId"], where: { referrerId: userId }, _count: { _all: true } }),
    prisma.referralRedemption.groupBy({ by: ["planId"], where: { userId }, _sum: { pointsUsed: true } }),
  ]);

  const referredIds = referredProfiles.map((p) => p.id);
  const firstPayments = await getFirstSuccessfulPaymentsByUser(referredIds);

  const referredUsers = referredProfiles.map((p) => ({
    id: p.id,
    name: p.fullName,
    email: maskEmail(p.email),
    joinedAt: p.createdAt.toISOString(),
    hasPaid: firstPayments.has(p.id),
  }));

  const earnedMap = new Map(earnedCounts.map((r) => [r.planId, r._count._all]));
  const redeemedMap = new Map(redeemedSums.map((r) => [r.planId, r._sum.pointsUsed ?? 0]));
  const qualifyingByPlan = new Map<string, number>();
  for (const pid of firstPayments.values()) {
    qualifyingByPlan.set(pid, (qualifyingByPlan.get(pid) ?? 0) + 1);
  }

  const planSummaries: ReferralPlanSummary[] = plans.map((plan) => {
    const earned = earnedMap.get(plan.id) ?? 0;
    const redeemed = redeemedMap.get(plan.id) ?? 0;
    return {
      planId: plan.id,
      planName: plan.name,
      intervalDays: plan.intervalDays,
      referralsPerPoint: plan.referralsPerPoint > 0 ? plan.referralsPerPoint : DEFAULT_REFERRALS_PER_POINT,
      qualifyingReferrals: qualifyingByPlan.get(plan.id) ?? 0,
      earned,
      redeemed,
      available: earned - redeemed,
    };
  });

  return {
    referralCode,
    referralLink: `${appUrl}/auth?mode=signup&ref=${referralCode}`,
    referredUsers,
    plans: planSummaries,
    redemptions: redemptions.map((r) => ({
      id: r.id,
      planId: r.planId,
      planName: r.plan.name,
      pointsUsed: r.pointsUsed,
      periodEndAt: r.periodEndAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/**
 * Redemption is only allowed when the user has no currently active
 * subscription — avoids having to define stacking/plan-switch rules for
 * someone already mid-subscription.
 */
export async function redeemReferralPoints(
  userId: string,
  planId: string,
  points: number,
): Promise<{ periodEnd: Date }> {
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error("Invalid point amount");
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new Error("Select a valid plan");
  if (plan.priceNgn === 0) {
    throw new Error("Referral points can't be redeemed for the free plan");
  }

  const available = await getAvailablePoints(userId, planId);
  if (points > available) throw new Error("Not enough referral points for this plan");

  const { entitlement } = await loadEntitlement(userId);
  if (entitlement.isActive) {
    throw new Error("You already have an active subscription — redeem once it ends");
  }

  const periodEnd = new Date(Date.now() + points * (plan.intervalDays || 30) * DAY_MS);

  const redemption = await prisma.referralRedemption.create({
    data: { userId, planId, pointsUsed: points, periodEndAt: periodEnd },
  });

  await activateSubscription(userId, planId, {
    periodEnd,
    paymentRef: redemption.id,
    paymentProvider: "referral",
  });

  await sendReferralRedemptionEmail(userId, plan.name, points, periodEnd);

  return { periodEnd };
}
