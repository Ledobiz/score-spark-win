"use client";

import { useQuery } from "@tanstack/react-query";
import type { EntitlementSnapshot } from "@/lib/plans";

export interface EntitlementResponse {
  entitlement: EntitlementSnapshot;
  todayCount: number;
  profile: {
    fullName: string | null;
    notifyDailyTips: boolean;
    dailyViewLimit: number;
  } | null;
  planName: string | null;
  email: string | null;
}

async function fetchEntitlement(): Promise<EntitlementResponse | null> {
  const res = await fetch("/api/entitlement");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load entitlement");
  return res.json();
}

export function useEntitlement() {
  return useQuery({ queryKey: ["entitlement"], queryFn: fetchEntitlement });
}
