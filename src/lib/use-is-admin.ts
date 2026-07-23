import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { amIAdmin } from "@/lib/admin.functions";

export function useIsAdmin() {
  const fn = useServerFn(amIAdmin);
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => (await fn()).isAdmin,
    staleTime: 60_000,
  });
}
