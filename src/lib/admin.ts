import "server-only";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth/server";
import { GATEWAY_PROVIDERS, hasKeysConfigured } from "@/lib/payments";
import { sendEmail } from "@/lib/email";
import type { Prisma } from "@prisma/client";

// ---- Types shared with the admin client UI ----------------------------------

export interface AdminSubscription {
  planId: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  paymentRef: string | null;
  paymentProvider: string | null;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  subscription: AdminSubscription | null;
  /** Derived from subscription status + trial/period end, not the raw status column. */
  subscriptionAccess: "active" | "expired" | "none";
  /** Days since access lapsed; null when active or never subscribed. */
  daysExpired: number | null;
  roles: string[];
}

export interface AdminPlan {
  id: string;
  referralsPerPoint: number;
  name: string;
  interval: string;
  intervalDays: number;
  priceNgn: number;
  dailyRecommendationLimit: number;
  dailyCustomPredictionLimit: number;
  canUseAccumulator: boolean;
  canExportHistory: boolean;
  isActive: boolean;
}

export interface AdminActivityRow {
  id: string;
  userId: string;
  activityType: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminSlipRow {
  id: string;
  name: string | null;
  picks: unknown[];
  combinedOdds: number;
  status: string;
  createdAt: string;
}

export interface AdminAuditRow {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserDetail {
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    createdAt: string;
  } | null;
  subscription: AdminSubscription | null;
  activity: AdminActivityRow[];
  slips: AdminSlipRow[];
  audit: AdminAuditRow[];
  plans: {
    id: string;
    name: string;
    priceNgn: number;
    interval: string;
    intervalDays: number;
  }[];
}

export interface AdminActivityOverview {
  activity: AdminActivityRow[];
  recommendations: {
    id: string;
    fixture: string;
    market: string;
    pick: string;
    odds: number;
    kickoff: string;
    result: string | null;
  }[];
  totals: {
    users: number;
    activity: number;
    recommendations: number;
    subCounts: Record<string, number>;
    revenueByPlan: {
      planId: string;
      planName: string;
      totalNgn: number;
      count: number;
    }[];
    signupTrend: { date: string; count: number }[];
  };
}

export interface AdminOverview {
  totalUsers: number;
  subscriptionsByStatus: Record<string, number>;
  totalRevenueNgn: number;
  revenueThisMonthNgn: number;
  newSignups7d: number;
  newSignups30d: number;
  pendingPayments: number;
  failedPayments7d: number;
  recentSignups: {
    id: string;
    email: string | null;
    fullName: string | null;
    createdAt: string;
  }[];
  recentPayments: {
    id: string;
    userEmail: string | null;
    planName: string;
    amountNgn: number;
    provider: string;
    status: string;
    createdAt: string;
  }[];
}

export interface AdminPaymentRow {
  id: string;
  userId: string;
  userEmail: string | null;
  planId: string;
  planName: string;
  provider: string;
  reference: string;
  providerRef: string | null;
  amountNgn: number;
  status: string;
  createdAt: string;
}

export interface AdminPredictionRow {
  id: string;
  userId: string;
  userEmail: string | null;
  competition: string;
  fixture: string;
  predictedOutcome: string | null;
  confidence: number | null;
  method: string | null;
  result: string | null;
  createdAt: string;
}

export interface AdminReferralStats {
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  topReferrers: { userId: string; email: string | null; points: number }[];
}

export interface AdminReferralCreditRow {
  id: string;
  referrerId: string;
  referrerEmail: string | null;
  planId: string;
  planName: string;
  createdAt: string;
}

export interface AdminReferralRedemptionRow {
  id: string;
  userId: string;
  userEmail: string | null;
  planId: string;
  planName: string;
  pointsUsed: number;
  periodEndAt: string;
  createdAt: string;
}

export interface AdminAuditLogRow {
  id: string;
  actorId: string;
  actorEmail: string | null;
  targetUserId: string;
  targetEmail: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

// ---- Access control ---------------------------------------------------------

/** True if the user holds the admin role. Replaces the Supabase has_role RPC. */
export async function isAdmin(userId: string): Promise<boolean> {
  const row = await prisma.userRole.findFirst({
    where: { userId, role: "admin" },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Route-handler guard. Returns the admin's userId, or a NextResponse (401/403)
 * to return directly. Use at the top of every /api/admin/* handler.
 */
export async function requireAdmin(): Promise<
  { userId: string } | NextResponse
> {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId: user.id };
}

// ---- Data ops (call only after confirming the caller is admin) --------------

/**
 * Access is derived from status + trial/period end (same shape as
 * computeEntitlement() in src/lib/plans.ts) rather than trusting the raw
 * status column alone, since a subscription can be "active"/"trialing" in
 * the DB after its end date has already passed.
 */
function getSubscriptionAccess(sub: {
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
} | null): { access: "active" | "expired" | "none"; daysExpired: number | null } {
  if (!sub) return { access: "none", daysExpired: null };
  const end = sub.trialEndsAt ?? sub.currentPeriodEnd;
  const endMs = end ? end.getTime() : null;
  const now = Date.now();
  const statusOk = sub.status === "active" || sub.status === "trialing";
  if (statusOk && (endMs === null || endMs > now)) {
    return { access: "active", daysExpired: null };
  }
  const daysExpired = endMs ? Math.max(0, Math.floor((now - endMs) / 86_400_000)) : null;
  return { access: "expired", daysExpired };
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const [profiles, subs, roles] = await Promise.all([
    prisma.profile.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.subscription.findMany(),
    prisma.userRole.findMany(),
  ]);
  const subByUser = new Map(subs.map((s) => [s.userId, s]));
  const rolesByUser = new Map<string, string[]>();
  for (const r of roles) {
    const arr = rolesByUser.get(r.userId) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.userId, arr);
  }
  return profiles.map((p) => {
    const s = subByUser.get(p.id);
    const { access, daysExpired } = getSubscriptionAccess(s ?? null);
    return {
      id: p.id,
      email: p.email,
      fullName: p.fullName,
      createdAt: p.createdAt.toISOString(),
      subscription: s
        ? {
            planId: s.planId,
            status: s.status,
            trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
            currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
            paymentRef: s.paymentRef,
            paymentProvider: s.paymentProvider,
          }
        : null,
      subscriptionAccess: access,
      daysExpired,
      roles: rolesByUser.get(p.id) ?? [],
    };
  });
}

/** Grant or revoke a role. Uses find-then-create (no reliance on a DB unique). */
export async function setRole(
  userId: string,
  role: "admin" | "user",
  grant: boolean,
): Promise<void> {
  if (grant) {
    const existing = await prisma.userRole.findFirst({
      where: { userId, role },
      select: { id: true },
    });
    if (!existing) await prisma.userRole.create({ data: { userId, role } });
  } else {
    await prisma.userRole.deleteMany({ where: { userId, role } });
  }
}

export async function listPlans(): Promise<AdminPlan[]> {
  const rows = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    interval: p.interval,
    intervalDays: p.intervalDays,
    priceNgn: p.priceNgn,
    dailyRecommendationLimit: p.dailyRecommendationLimit,
    dailyCustomPredictionLimit: p.dailyCustomPredictionLimit,
    canUseAccumulator: p.canUseAccumulator,
    canExportHistory: p.canExportHistory,
    isActive: p.isActive,
    referralsPerPoint: p.referralsPerPoint,
  }));
}

export async function updatePlan(
  id: string,
  patch: Partial<Omit<AdminPlan, "id" | "interval">>,
): Promise<void> {
  await prisma.plan.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.priceNgn !== undefined ? { priceNgn: patch.priceNgn } : {}),
      ...(patch.intervalDays !== undefined
        ? { intervalDays: patch.intervalDays }
        : {}),
      ...(patch.dailyRecommendationLimit !== undefined
        ? { dailyRecommendationLimit: patch.dailyRecommendationLimit }
        : {}),
      ...(patch.dailyCustomPredictionLimit !== undefined
        ? { dailyCustomPredictionLimit: patch.dailyCustomPredictionLimit }
        : {}),
      ...(patch.canUseAccumulator !== undefined
        ? { canUseAccumulator: patch.canUseAccumulator }
        : {}),
      ...(patch.canExportHistory !== undefined
        ? { canExportHistory: patch.canExportHistory }
        : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.referralsPerPoint !== undefined
        ? { referralsPerPoint: patch.referralsPerPoint }
        : {}),
    },
  });
}

const PLAN_ID_SLUG_RE = /[^a-z0-9]+/g;

/** Create a new plan. Id is auto-slugged from the name and de-duplicated. */
export async function createPlan(input: {
  name: string;
  interval: string;
  intervalDays: number;
  priceNgn: number;
  dailyRecommendationLimit: number;
  dailyCustomPredictionLimit: number;
  canUseAccumulator: boolean;
  canExportHistory: boolean;
}): Promise<AdminPlan> {
  const base = input.name.trim().toLowerCase().replace(PLAN_ID_SLUG_RE, "_").replace(/^_+|_+$/g, "") || "plan";
  let id = base;
  let n = 2;
  while (await prisma.plan.findUnique({ where: { id }, select: { id: true } })) {
    id = `${base}_${n++}`;
  }
  const maxSort = await prisma.plan.aggregate({ _max: { sortOrder: true } });
  const created = await prisma.plan.create({
    data: {
      id,
      name: input.name,
      interval: input.interval,
      intervalDays: input.intervalDays,
      priceNgn: input.priceNgn,
      dailyRecommendationLimit: input.dailyRecommendationLimit,
      dailyCustomPredictionLimit: input.dailyCustomPredictionLimit,
      canUseAccumulator: input.canUseAccumulator,
      canExportHistory: input.canExportHistory,
      features: [],
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      isActive: true,
    },
  });
  return {
    id: created.id,
    name: created.name,
    interval: created.interval,
    intervalDays: created.intervalDays,
    priceNgn: created.priceNgn,
    dailyRecommendationLimit: created.dailyRecommendationLimit,
    dailyCustomPredictionLimit: created.dailyCustomPredictionLimit,
    canUseAccumulator: created.canUseAccumulator,
    canExportHistory: created.canExportHistory,
    isActive: created.isActive,
    referralsPerPoint: created.referralsPerPoint,
  };
}

/**
 * Removes a plan. Hard-deletes only if no subscription/payment has ever
 * referenced it (protects FK integrity); otherwise archives it (isActive:
 * false) so it drops out of onboarding/admin-create flows without breaking
 * existing subscribers' history.
 */
export async function deletePlan(id: string): Promise<{ archived: boolean }> {
  const [subCount, paymentCount] = await Promise.all([
    prisma.subscription.count({ where: { planId: id } }),
    prisma.payment.count({ where: { planId: id } }),
  ]);
  if (subCount === 0 && paymentCount === 0) {
    await prisma.plan.delete({ where: { id } });
    return { archived: false };
  }
  await prisma.plan.update({ where: { id }, data: { isActive: false } });
  return { archived: true };
}

export interface AdminGateway {
  provider: string;
  enabled: boolean;
  keysConfigured: boolean;
}

export async function listGateways(): Promise<AdminGateway[]> {
  const rows = await prisma.paymentGatewayConfig.findMany();
  const byProvider = new Map(rows.map((r) => [r.provider, r.enabled]));
  return GATEWAY_PROVIDERS.map((provider) => ({
    provider,
    enabled: byProvider.get(provider) ?? false,
    keysConfigured: hasKeysConfigured(provider),
  }));
}

export async function setGatewayEnabled(provider: string, enabled: boolean): Promise<void> {
  await prisma.paymentGatewayConfig.upsert({
    where: { provider },
    update: { enabled },
    create: { provider, enabled },
  });
}

export async function getUserDetail(userId: string): Promise<AdminUserDetail> {
  const [profile, sub, activity, slips, audit, plans] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.betSlip.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.adminAuditLog.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        priceNgn: true,
        interval: true,
        intervalDays: true,
      },
    }),
  ]);

  return {
    profile: profile
      ? {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          createdAt: profile.createdAt.toISOString(),
        }
      : null,
    subscription: sub
      ? {
          planId: sub.planId,
          status: sub.status,
          trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          paymentRef: sub.paymentRef,
          paymentProvider: sub.paymentProvider,
        }
      : null,
    activity: activity.map((a) => ({
      id: a.id,
      userId: a.userId,
      activityType: a.activityType,
      meta: (a.meta as Record<string, unknown> | null) ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    slips: slips.map((s) => ({
      id: s.id,
      name: s.name,
      picks: (s.picks as unknown[]) ?? [],
      combinedOdds: Number(s.combinedOdds),
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
    audit: audit.map((a) => ({
      id: a.id,
      action: a.action,
      details: (a.details as Record<string, unknown> | null) ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      priceNgn: p.priceNgn,
      interval: p.interval,
      intervalDays: p.intervalDays,
    })),
  };
}

const DAY_MS = 86_400_000;

/** The admin-designated "free" plan used for trials — cheapest active plan priced at 0. */
async function getFreePlan() {
  const plan = await prisma.plan.findFirst({
    where: { priceNgn: 0, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!plan) throw new Error("No free trial plan is configured");
  return plan;
}

/** Change a user's subscription and write an audit-log entry. actorId = admin. */
export async function changePlan(
  actorId: string,
  userId: string,
  action: "set_plan" | "start_trial" | "cancel",
  planId?: string,
  reason?: string,
): Promise<void> {
  const existing = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  let data: {
    planId: string;
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
  };

  if (action === "cancel") {
    data = {
      planId: existing?.planId ?? (await getFreePlan()).id,
      status: "cancelled",
      trialEndsAt: existing?.trialEndsAt ?? null,
      currentPeriodEnd: existing?.currentPeriodEnd ?? null,
    };
  } else if (action === "start_trial") {
    const freePlan = await getFreePlan();
    data = {
      planId: freePlan.id,
      status: "trialing",
      trialEndsAt: new Date(Date.now() + freePlan.intervalDays * DAY_MS),
      currentPeriodEnd: null,
    };
  } else {
    if (!planId) throw new Error("Select a plan");
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || plan.priceNgn === 0) throw new Error("Select a paid plan");
    data = {
      planId,
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() + (plan.intervalDays || 30) * DAY_MS),
    };
  }

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data });
  } else {
    await prisma.subscription.create({ data: { userId, ...data } });
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId,
      targetUserId: userId,
      action,
      details: {
        from: existing
          ? { plan_id: existing.planId, status: existing.status }
          : null,
        to: {
          plan_id: data.planId,
          status: data.status,
          trial_ends_at: data.trialEndsAt?.toISOString() ?? null,
          current_period_end: data.currentPeriodEnd?.toISOString() ?? null,
        },
        reason: reason ?? null,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function listActivityOverview(): Promise<AdminActivityOverview> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);
  const [activity, recs, subs, userCount, successfulPayments, plans, recentSignups] =
    await Promise.all([
      prisma.userActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.recommendation.findMany({
        orderBy: { kickoff: "desc" },
        take: 100,
      }),
      prisma.subscription.findMany({ select: { planId: true, status: true } }),
      prisma.profile.count(),
      prisma.payment.findMany({
        where: { status: "success" },
        select: { planId: true, amountNgn: true },
      }),
      prisma.plan.findMany({ select: { id: true, name: true } }),
      prisma.profile.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

  const subCounts: Record<string, number> = {};
  for (const s of subs) {
    const k = `${s.planId}:${s.status}`;
    subCounts[k] = (subCounts[k] ?? 0) + 1;
  }

  const planNameById = new Map(plans.map((p) => [p.id, p.name]));
  const revenueByPlanMap = new Map<string, { totalNgn: number; count: number }>();
  for (const p of successfulPayments) {
    const entry = revenueByPlanMap.get(p.planId) ?? { totalNgn: 0, count: 0 };
    entry.totalNgn += p.amountNgn;
    entry.count += 1;
    revenueByPlanMap.set(p.planId, entry);
  }
  const revenueByPlan = Array.from(revenueByPlanMap.entries())
    .map(([planId, v]) => ({
      planId,
      planName: planNameById.get(planId) ?? planId,
      totalNgn: v.totalNgn,
      count: v.count,
    }))
    .sort((a, b) => b.totalNgn - a.totalNgn);

  const signupByDay = new Map<string, number>();
  for (const p of recentSignups) {
    const day = p.createdAt.toISOString().slice(0, 10);
    signupByDay.set(day, (signupByDay.get(day) ?? 0) + 1);
  }
  const signupTrend: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    signupTrend.push({ date, count: signupByDay.get(date) ?? 0 });
  }

  return {
    activity: activity.map((a) => ({
      id: a.id,
      userId: a.userId,
      activityType: a.activityType,
      meta: (a.meta as Record<string, unknown> | null) ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    recommendations: recs.map((r) => ({
      id: r.id,
      fixture: r.fixture,
      market: r.market,
      pick: r.pick,
      odds: Number(r.odds),
      kickoff: r.kickoff.toISOString(),
      result: r.result,
    })),
    totals: {
      users: userCount,
      activity: activity.length,
      recommendations: recs.length,
      subCounts,
      revenueByPlan,
      signupTrend,
    },
  };
}

// ---- Overview / KPIs ---------------------------------------------------------

export async function getOverview(): Promise<AdminOverview> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [
    totalUsers,
    subGroups,
    revenueTotal,
    revenueThisMonth,
    newSignups7d,
    newSignups30d,
    pendingPayments,
    failedPayments7d,
    recentSignupRows,
    recentPaymentRows,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.payment.aggregate({
      where: { status: "success" },
      _sum: { amountNgn: true },
    }),
    prisma.payment.aggregate({
      where: { status: "success", createdAt: { gte: startOfMonth } },
      _sum: { amountNgn: true },
    }),
    prisma.profile.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.profile.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.payment.count({
      where: { status: "failed", createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { plan: { select: { name: true } } },
    }),
  ]);

  const paymentUserIds = recentPaymentRows.map((p) => p.userId);
  const paymentUsers = paymentUserIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: paymentUserIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailByUserId = new Map(paymentUsers.map((u) => [u.id, u.email]));

  const subscriptionsByStatus: Record<string, number> = {};
  for (const g of subGroups) {
    subscriptionsByStatus[g.status] = g._count._all;
  }

  return {
    totalUsers,
    subscriptionsByStatus,
    totalRevenueNgn: revenueTotal._sum.amountNgn ?? 0,
    revenueThisMonthNgn: revenueThisMonth._sum.amountNgn ?? 0,
    newSignups7d,
    newSignups30d,
    pendingPayments,
    failedPayments7d,
    recentSignups: recentSignupRows.map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.fullName,
      createdAt: p.createdAt.toISOString(),
    })),
    recentPayments: recentPaymentRows.map((p) => ({
      id: p.id,
      userEmail: emailByUserId.get(p.userId) ?? null,
      planName: p.plan.name,
      amountNgn: p.amountNgn,
      provider: p.provider,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

// ---- Payments / transactions -------------------------------------------------

export async function listPayments(filters: {
  status?: string;
  provider?: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: AdminPaymentRow[]; total: number }> {
  const where: Prisma.PaymentWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.provider ? { provider: filters.provider } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const users = userIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: emailByUserId.get(r.userId) ?? null,
      planId: r.planId,
      planName: r.plan.name,
      provider: r.provider,
      reference: r.reference,
      providerRef: r.providerRef,
      amountNgn: r.amountNgn,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

// ---- Platform-wide audit log --------------------------------------------------

export async function listAuditLog(filters: {
  page: number;
  pageSize: number;
}): Promise<{ rows: AdminAuditLogRow[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.adminAuditLog.count(),
  ]);

  const userIds = [...new Set(rows.flatMap((r) => [r.actorId, r.targetUserId]))];
  const users = userIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return {
    rows: rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorEmail: emailByUserId.get(r.actorId) ?? null,
      targetUserId: r.targetUserId,
      targetEmail: emailByUserId.get(r.targetUserId) ?? null,
      action: r.action,
      details: (r.details as Record<string, unknown> | null) ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

/**
 * Read-only referral monitoring: aggregate stats plus the raw credit/redemption
 * rows, newest first. No mutations here — the one referral-related setting
 * admins can change (`Plan.referralsPerPoint`) goes through the existing
 * updatePlan()/`/api/admin/plans` path.
 */
export async function getReferralActivity(): Promise<{
  stats: AdminReferralStats;
  credits: AdminReferralCreditRow[];
  redemptions: AdminReferralRedemptionRow[];
}> {
  const [credits, redemptions, topReferrerGroups] = await Promise.all([
    prisma.referralCredit.findMany({
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.referralRedemption.findMany({
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.referralCredit.groupBy({
      by: ["referrerId"],
      _count: { _all: true },
      orderBy: { _count: { referrerId: "desc" } },
      take: 5,
    }),
  ]);

  const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + r.pointsUsed, 0);

  const userIds = [
    ...new Set([
      ...credits.map((c) => c.referrerId),
      ...redemptions.map((r) => r.userId),
      ...topReferrerGroups.map((g) => g.referrerId),
    ]),
  ];
  const users = userIds.length
    ? await prisma.profile.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } })
    : [];
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return {
    stats: {
      totalPointsEarned: await prisma.referralCredit.count(),
      totalPointsRedeemed,
      topReferrers: topReferrerGroups.map((g) => ({
        userId: g.referrerId,
        email: emailByUserId.get(g.referrerId) ?? null,
        points: g._count._all,
      })),
    },
    credits: credits.map((c) => ({
      id: c.id,
      referrerId: c.referrerId,
      referrerEmail: emailByUserId.get(c.referrerId) ?? null,
      planId: c.planId,
      planName: c.plan.name,
      createdAt: c.createdAt.toISOString(),
    })),
    redemptions: redemptions.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: emailByUserId.get(r.userId) ?? null,
      planId: r.planId,
      planName: r.plan.name,
      pointsUsed: r.pointsUsed,
      periodEndAt: r.periodEndAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/**
 * Platform-wide prediction history, newest first — the admin counterpart to
 * `loadHistory()` (src/lib/history.ts), which is scoped to a single user.
 * Filterable by a user-email substring and a created-at date range so an
 * admin can audit what a specific user ran, or everything run in a window.
 */
export async function listPredictionHistory(filters: {
  userEmail?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}): Promise<{ rows: AdminPredictionRow[]; total: number }> {
  let userIdFilter: string[] | undefined;
  if (filters.userEmail) {
    const matches = await prisma.profile.findMany({
      where: { email: { contains: filters.userEmail, mode: "insensitive" } },
      select: { id: true },
    });
    userIdFilter = matches.map((m) => m.id);
    if (userIdFilter.length === 0) return { rows: [], total: 0 };
  }

  const where: Prisma.UserPredictionWhereInput = {
    ...(userIdFilter ? { userId: { in: userIdFilter } } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.userPrediction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.userPrediction.count({ where }),
  ]);

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const users = userIds.length
    ? await prisma.profile.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return {
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: emailByUserId.get(r.userId) ?? null,
      competition: r.competition,
      fixture: r.fixture,
      predictedOutcome: r.predictedOutcome,
      confidence: r.confidence,
      method: r.method,
      result: r.result,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}

// ---- Admin account -------------------------------------------------------------

/** Changes the calling admin's own password. Verifies currentPassword first. */
export async function changeAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  if (!profile?.passwordHash) {
    throw new Error("This account has no password set (sign in via Google)");
  }
  const valid = await bcrypt.compare(currentPassword, profile.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.profile.update({ where: { id: userId }, data: { passwordHash } });
}

// ---- Create user -----------------------------------------------------------------

/**
 * Admin-provisioned account creation. When no password is supplied, a
 * random one is generated and returned once (never stored in plaintext) so
 * the admin can hand it to the user directly — there's no email provider
 * wired up for a real invite-link flow (see src/lib/email.ts).
 */
export async function createUserByAdmin(
  actorId: string,
  input: {
    email: string;
    fullName?: string;
    password?: string;
    planId?: string;
    startTrial?: boolean;
  },
): Promise<{ userId: string; temporaryPassword: string | null }> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists");

  const generated = !input.password;
  const password = input.password ?? randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  const profile = await prisma.profile.create({
    data: {
      email,
      passwordHash,
      fullName: input.fullName?.trim() || null,
      emailVerified: new Date(),
      ageConfirmed: true,
    },
  });

  let subPlanId: string | null = null;
  if (input.startTrial) {
    const freePlan = await getFreePlan();
    subPlanId = freePlan.id;
    await prisma.subscription.create({
      data: {
        userId: profile.id,
        planId: freePlan.id,
        status: "trialing",
        trialEndsAt: new Date(Date.now() + freePlan.intervalDays * DAY_MS),
        currentPeriodEnd: null,
      },
    });
  } else if (input.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan || plan.priceNgn === 0) throw new Error("Select a paid plan");
    subPlanId = plan.id;
    await prisma.subscription.create({
      data: {
        userId: profile.id,
        planId: plan.id,
        status: "active",
        trialEndsAt: null,
        currentPeriodEnd: new Date(Date.now() + (plan.intervalDays || 30) * DAY_MS),
      },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId,
      targetUserId: profile.id,
      action: "create_user",
      details: { email, plan_id: subPlanId } as Prisma.InputJsonValue,
    },
  });

  return { userId: profile.id, temporaryPassword: generated ? password : null };
}

// ---- Subscription reminder email --------------------------------------------------

/** Emails a resubscribe nudge to a user whose access has lapsed. */
export async function sendExpiryReminder(actorId: string, userId: string): Promise<void> {
  const [profile, sub] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!profile?.email) throw new Error("This user has no email on file");

  const { access, daysExpired } = getSubscriptionAccess(sub ?? null);
  if (access === "active") {
    throw new Error("This user's subscription is currently active");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const expiredLine =
    daysExpired && daysExpired > 0
      ? `Your subscription expired ${daysExpired} day${daysExpired === 1 ? "" : "s"} ago.`
      : "You don't currently have an active subscription.";

  const result = await sendEmail({
    to: profile.email,
    subject: "You're missing today's predictions",
    html: `
      <p>Hi ${profile.fullName ?? "there"},</p>
      <p>${expiredLine} You're missing out on today's recommendations and predictions.</p>
      <p><a href="${appUrl}/onboarding">Resubscribe now</a> to pick up right where you left off.</p>
    `,
  });
  if (!result.ok) throw new Error(result.error);

  await prisma.adminAuditLog.create({
    data: {
      actorId,
      targetUserId: userId,
      action: "send_reminder_email",
      details: { email: profile.email, days_expired: daysExpired } as Prisma.InputJsonValue,
    },
  });
}

// ---- Fixtures cache --------------------------------------------------------------

/** Calls the Python API's /fixtures/refresh to bust its server-side fixture cache. */
export async function refreshFixturesCache(actorId: string): Promise<void> {
  const base = process.env.PYTHON_API_URL;
  const key = process.env.PYTHON_API_KEY;
  if (!base || !key) {
    throw new Error("Prediction API is not configured");
  }
  const res = await fetch(new URL("/fixtures/refresh", base).toString(), {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Refresh failed (${res.status})`);
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId,
      targetUserId: actorId,
      action: "refresh_fixtures_cache",
      details: {} as Prisma.InputJsonValue,
    },
  });
}

// ---- Delete user ---------------------------------------------------------------

/**
 * Permanently removes a user and every row they own. None of these tables
 * have a DB-level FK/cascade back to `profiles` (ownership is enforced in
 * app code, per the schema-level note), so this transaction is the cascade.
 */
export async function deleteUser(actorId: string, userId: string): Promise<void> {
  if (actorId === userId) {
    throw new Error("You cannot delete your own account");
  }

  const [target, isTargetAdmin, adminCount] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId } }),
    prisma.userRole.findFirst({ where: { userId, role: "admin" }, select: { id: true } }),
    prisma.userRole.count({ where: { role: "admin" } }),
  ]);
  if (!target) throw new Error("User not found");
  if (isTargetAdmin && adminCount <= 1) {
    throw new Error("Cannot delete the last remaining admin");
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId,
      targetUserId: userId,
      action: "delete_user",
      details: {
        email: target.email,
        full_name: target.fullName,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.$transaction([
    prisma.userPrediction.deleteMany({ where: { userId } }),
    prisma.userActivity.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.subscription.deleteMany({ where: { userId } }),
    prisma.payment.deleteMany({ where: { userId } }),
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.betSlip.deleteMany({ where: { userId } }),
    prisma.watchlist.deleteMany({ where: { userId } }),
    prisma.profile.delete({ where: { id: userId } }),
  ]);
}

// ---- CSV export ---------------------------------------------------------------

/** Builds a CSV string (with header row) from an array of flat objects. */
export function toCsv<T extends object>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
