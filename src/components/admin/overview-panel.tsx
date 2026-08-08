"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminOverview } from "@/lib/admin";
import { json, fmt, fmtNgn } from "@/components/admin/shared";
import { Stat } from "@/components/admin/stat-card";
import { StatCardGridSkeleton } from "@/components/ui/skeletons";

export function OverviewPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => json<AdminOverview>("/api/admin/overview"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <StatCardGridSkeleton className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" />
        <StatCardGridSkeleton className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={data?.totalUsers ?? 0} />
        <Stat
          label="Total revenue"
          value={fmtNgn(data?.totalRevenueNgn ?? 0)}
        />
        <Stat
          label="Revenue this month"
          value={fmtNgn(data?.revenueThisMonthNgn ?? 0)}
        />
        <Stat label="New signups (7d)" value={data?.newSignups7d ?? 0} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New signups (30d)" value={data?.newSignups30d ?? 0} />
        <Stat label="Pending payments" value={data?.pendingPayments ?? 0} />
        <Stat
          label="Failed payments (7d)"
          value={data?.failedPayments7d ?? 0}
        />
        <Stat
          label="Active subscriptions"
          value={data?.subscriptionsByStatus.active ?? 0}
        />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold">Subscriptions by status</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data?.subscriptionsByStatus ?? {}).map(([k, v]) => (
            <Badge key={k} variant="secondary">
              {k}: {v}
            </Badge>
          ))}
          {!isLoading &&
            Object.keys(data?.subscriptionsByStatus ?? {}).length === 0 && (
              <span className="text-sm text-muted-foreground">
                No subscriptions yet.
              </span>
            )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold">Recent signups</h3>
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentSignups ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="py-2 pr-3">{u.fullName ?? "—"}</td>
                    <td className="py-2 pr-3">{u.email ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {fmt(u.createdAt)}
                    </td>
                  </tr>
                ))}
                {!isLoading && (data?.recentSignups.length ?? 0) === 0 && (
                  <tr>
                    <td className="py-6 text-muted-foreground" colSpan={3}>
                      No signups yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Recent payments</h3>
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentPayments ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="py-2 pr-3">{p.userEmail ?? "—"}</td>
                    <td className="py-2 pr-3">{p.planName}</td>
                    <td className="py-2 pr-3">{fmtNgn(p.amountNgn)}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        variant={
                          p.status === "success"
                            ? "default"
                            : p.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!isLoading && (data?.recentPayments.length ?? 0) === 0 && (
                  <tr>
                    <td className="py-6 text-muted-foreground" colSpan={4}>
                      No payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
