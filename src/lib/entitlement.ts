import "server-only";
import { prisma } from "@/lib/prisma";
import { computeEntitlement, type EntitlementSnapshot } from "@/lib/plans";

export interface EntitlementProfile {
  fullName: string | null;
  notifyDailyTips: boolean;
  dailyViewLimit: number;
}

export interface EntitlementPayload {
  entitlement: EntitlementSnapshot;
  todayCount: number;
  profile: EntitlementProfile | null;
  planName: string | null;
}

/**
 * Server-side entitlement for a user. Reads subscription + plan via Prisma
 * (scoped by userId — no RLS) and counts today's prediction views for the daily
 * limit. Never call this from the browser.
 */
export async function loadEntitlement(userId: string): Promise<EntitlementPayload> {
  const sub = await prisma.subscription.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await prisma.userActivity.count({
    where: {
      userId,
      activityType: "prediction_view",
      createdAt: { gte: startOfDay },
    },
  });

  const profileRow = await prisma.profile.findUnique({
    where: { id: userId },
    select: { fullName: true, notifyDailyTips: true, dailyViewLimit: true },
  });

  const entitlement = computeEntitlement(
    sub
      ? {
          plan_id: sub.planId,
          status: sub.status,
          trial_ends_at: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
          current_period_end: sub.currentPeriodEnd
            ? sub.currentPeriodEnd.toISOString()
            : null,
        }
      : null,
    sub?.plan
      ? {
          daily_recommendation_limit: sub.plan.dailyRecommendationLimit,
          daily_custom_prediction_limit: sub.plan.dailyCustomPredictionLimit,
          can_use_accumulator: sub.plan.canUseAccumulator,
          can_export_history: sub.plan.canExportHistory,
        }
      : null,
  );

  // The user's own "responsible gambling" soft limit (Settings) can only
  // tighten the plan's daily custom-prediction limit, never loosen it. 0 means
  // the user hasn't set a personal limit.
  if (profileRow?.dailyViewLimit && profileRow.dailyViewLimit > 0) {
    entitlement.dailyCustomPredictionLimit = Math.min(
      entitlement.dailyCustomPredictionLimit,
      profileRow.dailyViewLimit,
    );
  }

  return {
    entitlement,
    todayCount,
    profile: profileRow
      ? {
          fullName: profileRow.fullName,
          notifyDailyTips: profileRow.notifyDailyTips,
          dailyViewLimit: profileRow.dailyViewLimit,
        }
      : null,
    planName: sub?.plan?.name ?? null,
  };
}
