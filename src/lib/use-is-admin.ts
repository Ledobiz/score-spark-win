"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchIsAdmin(): Promise<boolean> {
  const res = await fetch("/api/me");
  if (!res.ok) return false;
  const data = (await res.json()) as { isAdmin?: boolean };
  return Boolean(data.isAdmin);
}

export function useIsAdmin() {
  return useQuery({ queryKey: ["is-admin"], queryFn: fetchIsAdmin });
}
