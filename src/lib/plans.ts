/** Plan ids are admin-managed (full CRUD), not a fixed set — treat as opaque strings. */
export type PlanTier = string;

export interface EntitlementSnapshot {
  planId: PlanTier | null;
  status: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
  isTrial: boolean;
  isPaid: boolean;
  daysLeft: number | null;
  /** Max recommendation rows shown per market on the dashboard. */
  dailyRecommendationLimit: number;
  /** Max custom (league/fixture) predictions a user can run per day. */
  dailyCustomPredictionLimit: number;
  canUseAccumulator: boolean;
  canExportHistory: boolean;
}

export function computeEntitlement(sub: {
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
} | null, plan: {
  daily_recommendation_limit: number;
  daily_custom_prediction_limit: number;
  can_use_accumulator: boolean;
  can_export_history: boolean;
} | null): EntitlementSnapshot {
  if (!sub || !plan) {
    return {
      planId: null, status: null, trialEndsAt: null, currentPeriodEnd: null,
      isActive: false, isTrial: false, isPaid: false, daysLeft: null,
      dailyRecommendationLimit: 3, dailyCustomPredictionLimit: 3,
      canUseAccumulator: false, canExportHistory: false,
    };
  }
  const now = Date.now();
  const end = sub.trial_ends_at ?? sub.current_period_end;
  const daysLeft = end ? Math.max(0, Math.ceil((new Date(end).getTime() - now) / 86400000)) : null;
  // Trial vs. paid is determined by subscription status alone, not by
  // comparing against a hardcoded plan id — plan ids are admin-managed.
  const isTrial = sub.status === "trialing" && (daysLeft ?? 0) > 0;
  const isPaid = sub.status === "active" && (daysLeft ?? 1) > 0;
  const isActive = isTrial || isPaid;
  // A plan's daily_* limit takes effect once an admin sets it (>0). Plans left
  // at the schema default of 0 fall back to the active/free tier default so an
  // unconfigured plan never accidentally locks users out at 0.
  const tierDefault = isActive ? 9999 : 3;
  const dailyRecommendationLimit =
    plan.daily_recommendation_limit > 0 ? plan.daily_recommendation_limit : tierDefault;
  const dailyCustomPredictionLimit =
    plan.daily_custom_prediction_limit > 0 ? plan.daily_custom_prediction_limit : tierDefault;
  return {
    planId: sub.plan_id as PlanTier,
    status: sub.status,
    trialEndsAt: sub.trial_ends_at,
    currentPeriodEnd: sub.current_period_end,
    isActive, isTrial, isPaid, daysLeft,
    dailyRecommendationLimit,
    dailyCustomPredictionLimit,
    canUseAccumulator: isPaid || isTrial,
    canExportHistory: isPaid || isTrial,
  };
}
