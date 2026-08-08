"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminActivityOverview } from "@/lib/admin";
import { json, fmtNgn } from "@/components/admin/shared";
import { Stat } from "@/components/admin/stat-card";
import {
  StatCardGridSkeleton,
  ChartCardSkeleton,
} from "@/components/ui/skeletons";

export function AnalyticsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => json<AdminActivityOverview>("/api/admin/activity"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <StatCardGridSkeleton className="grid gap-3 sm:grid-cols-3" count={3} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCardSkeleton height="h-[220px]" />
          <ChartCardSkeleton height="h-[220px]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCardSkeleton height="h-64" />
          <ChartCardSkeleton height="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total users" value={data?.totals.users ?? 0} />
        <Stat
          label="Recent activity events"
          value={data?.totals.activity ?? 0}
        />
        <Stat
          label="Recommendations"
          value={data?.totals.recommendations ?? 0}
        />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold">Subscriptions breakdown</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data?.totals.subCounts ?? {}).map(([k, v]) => (
            <Badge key={k} variant="secondary">
              {k}: {v}
            </Badge>
          ))}
          {!isLoading &&
            Object.keys(data?.totals.subCounts ?? {}).length === 0 && (
              <span className="text-sm text-muted-foreground">
                No subscriptions yet.
              </span>
            )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold">Revenue by plan</h3>
          <p className="text-xs text-muted-foreground">
            Successful payments only.
          </p>
          <div className="mt-3">
            {(data?.totals.revenueByPlan.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.totals.revenueByPlan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="planName"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip
                    formatter={(v: number) => fmtNgn(v)}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="totalNgn" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No successful payments yet.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Signups — last 30 days</h3>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.totals.signupTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  tickFormatter={(d: string) => d.slice(5)}
                  interval={4}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold">Recent user activity</h3>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {(data?.activity ?? []).map((a) => (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {a.userId.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-3">{a.activityType}</td>
                  </tr>
                ))}
                {!isLoading && (data?.activity.length ?? 0) === 0 && (
                  <tr>
                    <td className="py-6 text-muted-foreground" colSpan={3}>
                      No activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Recent recommendations</h3>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Kickoff</th>
                  <th className="py-2 pr-3">Fixture</th>
                  <th className="py-2 pr-3">Market</th>
                  <th className="py-2 pr-3">Pick</th>
                  <th className="py-2 pr-3">Odds</th>
                  <th className="py-2 pr-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recommendations ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 text-muted-foreground">
                      {new Date(r.kickoff).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">{r.fixture}</td>
                    <td className="py-2 pr-3">{r.market}</td>
                    <td className="py-2 pr-3 font-medium">{r.pick}</td>
                    <td className="py-2 pr-3">{r.odds}</td>
                    <td className="py-2 pr-3">{r.result ?? "—"}</td>
                  </tr>
                ))}
                {!isLoading && (data?.recommendations.length ?? 0) === 0 && (
                  <tr>
                    <td className="py-6 text-muted-foreground" colSpan={6}>
                      No recommendations yet.
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

