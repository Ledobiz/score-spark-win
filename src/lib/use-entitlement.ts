import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeEntitlement } from "@/lib/plans";

async function loadEntitlement() {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;
  const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();
  let plan = null as null | { daily_recommendation_limit: number; can_use_accumulator: boolean; can_export_history: boolean; name: string };
  if (sub) {
    const { data: planRow } = await supabase.from("plans").select("daily_recommendation_limit,can_use_accumulator,can_export_history,name").eq("id", sub.plan_id).maybeSingle();
    plan = planRow;
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return {
    user,
    profile,
    sub,
    plan,
    entitlement: computeEntitlement(sub, plan),
  };
}

export function useEntitlement() {
  return useQuery({ queryKey: ["entitlement"], queryFn: loadEntitlement });
}
