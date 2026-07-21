export type PlanTier = "free_trial" | "weekly" | "monthly" | "annual";

export interface EntitlementSnapshot {
  planId: PlanTier | null;
  status: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
  isTrial: boolean;
  isPaid: boolean;
  daysLeft: number | null;
  dailyRecommendationLimit: number;
  canUseAccumulator: boolean;
  canExportHistory: boolean;
}

export function computeEntitlement(sub: {
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
} | null, plan: { daily_recommendation_limit: number; can_use_accumulator: boolean; can_export_history: boolean } | null): EntitlementSnapshot {
  if (!sub || !plan) {
    return {
      planId: null, status: null, trialEndsAt: null, currentPeriodEnd: null,
      isActive: false, isTrial: false, isPaid: false, daysLeft: null,
      dailyRecommendationLimit: 3, canUseAccumulator: false, canExportHistory: false,
    };
  }
  const now = Date.now();
  const end = sub.trial_ends_at ?? sub.current_period_end;
  const daysLeft = end ? Math.max(0, Math.ceil((new Date(end).getTime() - now) / 86400000)) : null;
  const isTrial = sub.plan_id === "free_trial" && sub.status === "trialing" && (daysLeft ?? 0) > 0;
  const isPaid = sub.plan_id !== "free_trial" && sub.status === "active" && (daysLeft ?? 1) > 0;
  const isActive = isTrial || isPaid;
  return {
    planId: sub.plan_id as PlanTier,
    status: sub.status,
    trialEndsAt: sub.trial_ends_at,
    currentPeriodEnd: sub.current_period_end,
    isActive, isTrial, isPaid, daysLeft,
    dailyRecommendationLimit: isPaid ? 9999 : (isTrial ? 9999 : 3),
    canUseAccumulator: isPaid || isTrial,
    canExportHistory: isPaid || isTrial,
  };
}
