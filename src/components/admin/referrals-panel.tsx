"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/admin/stat-card";
import type {
  AdminReferralStats,
  AdminReferralCreditRow,
  AdminReferralRedemptionRow,
} from "@/lib/admin";
import { json, fmt } from "@/components/admin/shared";
import { TableRowsSkeleton } from "@/components/ui/skeletons";

export function ReferralsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "referrals"],
    queryFn: () =>
      json<{
        stats: AdminReferralStats;
        credits: AdminReferralCreditRow[];
        redemptions: AdminReferralRedemptionRow[];
      }>("/api/admin/referrals"),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Total points earned" value={data?.stats.totalPointsEarned ?? 0} />
        <Stat label="Total points redeemed" value={data?.stats.totalPointsRedeemed ?? 0} />
        <Stat
          label="Top referrer"
          value={data?.stats.topReferrers[0]?.email ?? "—"}
        />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold">Points earned</h3>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Referrer</th>
                <th className="py-2 pr-3">Plan</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton rows={5} cols={3} />}
              {!isLoading &&
                (data?.credits ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">{fmt(c.createdAt)}</td>
                    <td className="py-2 pr-3">{c.referrerEmail ?? c.referrerId.slice(0, 8)}</td>
                    <td className="py-2 pr-3">{c.planName}</td>
                  </tr>
                ))}
              {!isLoading && (data?.credits.length ?? 0) === 0 && (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={3}>
                    No referral points earned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold">Redemptions</h3>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Points used</th>
                <th className="py-2 pr-3">Period end</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowsSkeleton rows={5} cols={5} />}
              {!isLoading &&
                (data?.redemptions ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">{fmt(r.createdAt)}</td>
                    <td className="py-2 pr-3">{r.userEmail ?? r.userId.slice(0, 8)}</td>
                    <td className="py-2 pr-3">{r.planName}</td>
                    <td className="py-2 pr-3">{r.pointsUsed}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{fmt(r.periodEndAt)}</td>
                  </tr>
                ))}
              {!isLoading && (data?.redemptions.length ?? 0) === 0 && (
                <tr>
                  <td className="py-6 text-muted-foreground" colSpan={5}>
                    No redemptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
