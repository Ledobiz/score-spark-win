"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReferralSummary } from "@/lib/referrals";

async function fetchReferrals(): Promise<ReferralSummary | null> {
  const res = await fetch("/api/referrals");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load referrals");
  return res.json();
}

export function useReferrals() {
  return useQuery({ queryKey: ["referrals"], queryFn: fetchReferrals });
}
