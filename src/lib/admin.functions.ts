import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [{ data: profiles }, { data: subs }, { data: roles }] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("subscriptions").select("*"),
      db.from("user_roles").select("*"),
    ]);
    const subByUser = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return (profiles ?? []).map((p: any) => ({
      ...p,
      subscription: subByUser.get(p.id) ?? null,
      roles: rolesByUser.get(p.id) ?? [],
    }));
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "user"; grant: boolean }) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "user"]),
      grant: z.boolean(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const db = await admin();
    if (data.grant) {
      const { error } = await db.from("user_roles").upsert(
        { user_id: data.userId, role: data.role },
        { onConflict: "user_id,role" },
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("user_roles")
        .delete().eq("user_id", data.userId).eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminListPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data, error } = await db.from("plans").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    name?: string;
    price_ngn?: number;
    daily_recommendation_limit?: number;
    daily_custom_prediction_limit?: number;
    can_use_accumulator?: boolean;
    can_export_history?: boolean;
  }) => z.object({
    id: z.string(),
    name: z.string().optional(),
    price_ngn: z.number().nonnegative().optional(),
    daily_recommendation_limit: z.number().int().nonnegative().optional(),
    daily_custom_prediction_limit: z.number().int().nonnegative().optional(),
    can_use_accumulator: z.boolean().optional(),
    can_export_history: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const db = await admin();
    const { id, ...patch } = data;
    const { error } = await db.from("plans").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const db = await admin();
    const [profile, sub, activity, slips, audit, plans] = await Promise.all([
      db.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      db.from("subscriptions").select("*").eq("user_id", data.userId).maybeSingle(),
      db.from("user_activity").select("*").eq("user_id", data.userId)
        .order("created_at", { ascending: false }).limit(50),
      db.from("bet_slips").select("*").eq("user_id", data.userId)
        .order("created_at", { ascending: false }).limit(20),
      db.from("admin_audit_log").select("*").eq("target_user_id", data.userId)
        .order("created_at", { ascending: false }).limit(20),
      db.from("plans").select("id,name,price_ngn,interval").order("sort_order"),
    ]);
    return {
      profile: profile.data ?? null,
      subscription: sub.data ?? null,
      activity: activity.data ?? [],
      slips: slips.data ?? [],
      audit: audit.data ?? [],
      plans: plans.data ?? [],
    };
  });

export const adminChangePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; action: "set_plan" | "start_trial" | "cancel"; planId?: string; reason?: string }) =>
    z.object({
      userId: z.string().uuid(),
      action: z.enum(["set_plan", "start_trial", "cancel"]),
      planId: z.string().optional(),
      reason: z.string().max(300).optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data: existing } = await db.from("subscriptions")
      .select("*").eq("user_id", data.userId).maybeSingle();

    let payload: Record<string, unknown>;
    if (data.action === "cancel") {
      payload = { status: "cancelled" };
    } else if (data.action === "start_trial") {
      payload = {
        plan_id: "free_trial",
        status: "trialing",
        trial_ends_at: new Date(Date.now() + 14 * 86400e3).toISOString(),
        current_period_end: null,
      };
    } else {
      const planId = data.planId;
      if (!planId || planId === "free_trial") throw new Error("Select a paid plan");
      const days: Record<string, number> = { weekly: 7, monthly: 30, annual: 365 };
      payload = {
        plan_id: planId,
        status: "active",
        trial_ends_at: null,
        current_period_end: new Date(Date.now() + (days[planId] ?? 30) * 86400e3).toISOString(),
      };
    }

    if (existing) {
      const { error } = await db.from("subscriptions").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("subscriptions").insert({ user_id: data.userId, ...payload });
      if (error) throw new Error(error.message);
    }

    await db.from("admin_audit_log").insert({
      actor_id: context.userId,
      target_user_id: data.userId,
      action: data.action,
      details: {
        from: existing ? { plan_id: existing.plan_id, status: existing.status } : null,
        to: payload,
        reason: data.reason ?? null,
      },
    });

    return { ok: true };
  });

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const { data } = await db.from("admin_audit_log").select("*")
      .order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const adminListActivity = createServerFn({ method: "GET" })

  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const db = await admin();
    const [activity, recs, subs, users] = await Promise.all([
      db.from("user_activity").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("recommendations").select("*").order("kickoff", { ascending: false }).limit(100),
      db.from("subscriptions").select("plan_id,status"),
      db.from("profiles").select("id"),
    ]);
    const subCounts: Record<string, number> = {};
    (subs.data ?? []).forEach((s: any) => {
      const k = `${s.plan_id}:${s.status}`;
      subCounts[k] = (subCounts[k] ?? 0) + 1;
    });
    return {
      activity: activity.data ?? [],
      recommendations: recs.data ?? [],
      totals: {
        users: users.data?.length ?? 0,
        activity: activity.data?.length ?? 0,
        recommendations: recs.data?.length ?? 0,
        subCounts,
      },
    };
  });
