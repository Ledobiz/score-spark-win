import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const startFreeTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const trialEnd = new Date(Date.now() + 14 * 86400e3).toISOString();
    const { data: existing } = await context.supabase
      .from("subscriptions").select("id").eq("user_id", context.userId).maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("subscriptions").update({
        plan_id: "free_trial", status: "trialing", trial_ends_at: trialEnd, current_period_end: null,
      }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("subscriptions").insert({
        user_id: context.userId, plan_id: "free_trial", status: "trialing", trial_ends_at: trialEnd,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true, trialEnd };
  });

export const activatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { planId: "weekly" | "monthly" | "annual"; flutterwaveRef?: string }) =>
    z.object({ planId: z.enum(["weekly", "monthly", "annual"]), flutterwaveRef: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const daysMap = { weekly: 7, monthly: 30, annual: 365 };
    const end = new Date(Date.now() + daysMap[data.planId] * 86400e3).toISOString();
    const { data: existing } = await context.supabase
      .from("subscriptions").select("id").eq("user_id", context.userId).maybeSingle();
    const payload = {
      plan_id: data.planId, status: "active" as const, trial_ends_at: null,
      current_period_end: end, flutterwave_ref: data.flutterwaveRef ?? null,
    };
    if (existing) {
      const { error } = await context.supabase.from("subscriptions").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("subscriptions").insert({ user_id: context.userId, ...payload });
      if (error) throw new Error(error.message);
    }
    return { ok: true, currentPeriodEnd: end };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("subscriptions")
      .update({ status: "cancelled" }).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
