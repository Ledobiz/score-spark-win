"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  Lock,
  TrendingUp,
  Trophy,
  Flame,
  Eye,
  Inbox,
  BarChart3,
  WifiOff,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  StatCardGridSkeleton,
  ChartCardSkeleton,
  TableRowsSkeleton,
  ListRowSkeleton,
} from "@/components/ui/skeletons";
import { useEntitlement } from "@/lib/use-entitlement";
import type { Recommendation, Stats } from "@/lib/predictions/types";
import type { ActivityRow } from "@/app/api/activity/route";

const MARKETS = [
  "Home Win",
  "Away Win",
  "Draw",
  "BTTS",
  "Over 1.5",
  "Over 2.5",
] as const;

async function fetchRecommendations(): Promise<{
  recommendations: Recommendation[];
  unavailable?: boolean;
}> {
  const res = await fetch("/api/recommendations");
  if (!res.ok) throw new Error("Failed to load recommendations");
  return res.json();
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function fetchActivity(): Promise<ActivityRow[]> {
  const res = await fetch("/api/activity");
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load activity");
  const data = (await res.json()) as { activity: ActivityRow[] };
  return data.activity;
}

export default function DashboardPage() {
  const { data: ent, isLoading } = useEntitlement();
  const { data: recsData } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });
  const recs = recsData?.recommendations;
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: activity } = useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
  });

  if (isLoading || !ent) {
    return <DashboardSkeleton />;
  }

  const e = ent.entitlement;
  const displayName =
    ent.profile?.fullName || ent.email?.split("@")[0] || "Player";

  // Real per-user activity from user_activity (prediction_view events), bucketed
  // by local day.
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const dayCounts: Record<string, number> = {};
  for (const a of activity ?? []) {
    const k = ymd(new Date(a.created_at));
    dayCounts[k] = (dayCounts[k] ?? 0) + 1;
  }

  // Most-viewed league across the user's recent predictions.
  const leagueCounts: Record<string, number> = {};
  for (const a of activity ?? [])
    if (a.league) leagueCounts[a.league] = (leagueCounts[a.league] ?? 0) + 1;
  const topLeague =
    Object.entries(leagueCounts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return { day: format(d, "EEE"), views: dayCounts[ymd(d)] ?? 0 };
  });
  const views7d = days.reduce((s, d) => s + d.views, 0);

  // Real per-league breakdown (last 30 days) — replaces a previous chart that
  // extrapolated fake "wins" from views × the model's global hit rate, which
  // misrepresented per-user outcomes (see CLAUDE.md honesty guardrail).
  const topLeagues = Object.entries(leagueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([league, count]) => ({ league, count }));

  // Consecutive-day activity streak (tolerant of not having viewed yet today).
  let streak = 0;
  {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (!(dayCounts[ymd(d)] > 0)) d.setDate(d.getDate() - 1);
    while (dayCounts[ymd(d)] > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
  }
  const activityLoading = activity === undefined;
  const recsLoading = recs === undefined;

  // Real model track record from /stats (out-of-sample accuracy over every
  // settled prediction), not a synthetic followed-tips rate.
  const winRate =
    stats && stats.overall.success_rate != null
      ? Math.round(stats.overall.success_rate * 100)
      : null;

  // A paid subscription's status stays "active" in the DB until the user
  // resubscribes — there's no background job that flips it — so "expired"
  // has to be derived from currentPeriodEnd having already passed rather
  // than read off `status` directly.
  const paidExpired = e.status === "active" && !e.isPaid;
  const paidExpiringSoon = e.isPaid && e.daysLeft !== null && e.daysLeft <= 3;

  return (
    <>
      {/* Header */}
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">
            Hey {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s cooking today.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="secondary" className="border-primary/30 text-primary">
            {e.planId ? e.planId.replace("_", " ").toUpperCase() : "NO PLAN"}
          </Badge>
          {e.isTrial && e.daysLeft !== null && (
            <span className="text-xs text-muted-foreground">
              Trial: {e.daysLeft}d left
            </span>
          )}
          {e.isPaid && e.daysLeft !== null && !paidExpiringSoon && (
            <span className="text-xs text-muted-foreground">
              Renews in {e.daysLeft}d
            </span>
          )}
          {paidExpiringSoon && (
            <Badge className="gap-1 border-transparent bg-warning text-warning-foreground">
              <AlertTriangle className="h-3 w-3" />
              Expires in {e.daysLeft}d
            </Badge>
          )}
          {paidExpired && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Subscription expired
            </Badge>
          )}
          {!e.isActive && (
            <Link href="/onboarding">
              <Button size="sm">
                {paidExpired ? "Resubscribe" : "Choose plan"}
              </Button>
            </Link>
          )}
          {paidExpiringSoon && (
            <Link href="/onboarding">
              <Button size="sm" variant="outline">
                Renew now
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Predictions viewed (7d)"
          value={activityLoading ? "—" : views7d.toString()}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Model win rate"
          value={winRate !== null ? `${winRate}%` : "—"}
          accent
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Top league"
          value={activityLoading ? "—" : (topLeague ?? "—")}
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Day streak"
          value={activityLoading ? "—" : `${streak}d`}
          accent
        />
      </div>

      {/* Charts */}
      {activityLoading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Views (last 7 days)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days}>
                  <defs>
                    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0.7}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="var(--color-chart-1)"
                    fill="url(#gv)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Top leagues (last 30 days)</h3>
            <div className="h-56">
              {topLeagues.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  size="compact"
                  bordered={false}
                  className="h-full"
                  title="No league activity yet"
                  description="View some predictions to see your top leagues here."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topLeagues} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                    />
                    <YAxis
                      dataKey="league"
                      type="category"
                      width={100}
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Views"
                      fill="var(--color-chart-1)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">
            Today&apos;s recommendations
          </h2>
          {!e.isActive && (
            <Link href="/onboarding">
              <Button size="sm" variant="secondary">
                Unlock all
              </Button>
            </Link>
          )}
        </div>
        <Tabs defaultValue="Home Win">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 py-1.5">
            {MARKETS.map((m) => (
              <TabsTrigger
                key={m}
                value={m}
                className="min-h-9 px-3.5 py-2"
              >
                {m}
              </TabsTrigger>
            ))}
          </TabsList>
          {MARKETS.map((m) => {
            const all = recs?.filter((r) => r.market === m) ?? [];
            const visible = e.isActive ? all : all.slice(0, e.dailyRecommendationLimit);
            const locked = all.length - visible.length;
            return (
              <TabsContent key={m} value={m} className="mt-4">
                {recsLoading && (
                  <>
                    <div className="hidden sm:block">
                      <Card className="overflow-hidden p-0">
                        <table className="w-full text-sm">
                          <tbody>
                            <TableRowsSkeleton rows={4} cols={6} />
                          </tbody>
                        </table>
                      </Card>
                    </div>
                    <div className="grid gap-3 sm:hidden">
                      <ListRowSkeleton count={4} />
                    </div>
                  </>
                )}

                {!recsLoading && visible.length === 0 && (
                  <Card className="overflow-hidden p-0">
                    <EmptyState
                      icon={recsData?.unavailable ? WifiOff : Inbox}
                      bordered={false}
                      title={
                        recsData?.unavailable
                          ? "Prediction service unavailable"
                          : "No picks in this market yet"
                      }
                      description={
                        recsData?.unavailable
                          ? "We couldn't reach the prediction service. Please try again shortly."
                          : "Recommendations refresh throughout the day — check back soon or try another market tab."
                      }
                    />
                  </Card>
                )}

                {!recsLoading && visible.length > 0 && (
                  <>
                    {/* Card list — small screens, avoids a horizontally-scrolling table */}
                    <div className="grid gap-3 sm:hidden">
                      {visible.map((r) => (
                        <Card key={r.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{r.fixture}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {r.league} ·{" "}
                                {format(new Date(r.kickoff), "MMM d, HH:mm")}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                r.confidence >= 80
                                  ? "bg-primary/15 text-primary"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {r.confidence}%
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                            <span className="text-sm font-semibold">{r.pick}</span>
                            <span className="font-mono text-sm text-muted-foreground">
                              {r.odds.toFixed(2)}
                            </span>
                          </div>
                        </Card>
                      ))}
                      {locked > 0 && (
                        <Card className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            {locked} more pick{locked > 1 ? "s" : ""} hidden.
                          </div>
                          <Link href="/onboarding">
                            <Button size="sm">Upgrade</Button>
                          </Link>
                        </Card>
                      )}
                    </div>

                    {/* Table — sm and up */}
                    <Card className="hidden overflow-hidden p-0 sm:block">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                              <th className="p-3">Fixture</th>
                              <th className="p-3">League</th>
                              <th className="whitespace-nowrap p-3">Kickoff</th>
                              <th className="p-3">Pick</th>
                              <th className="p-3 text-right">Confidence</th>
                              <th className="p-3 text-right">Odds</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visible.map((r) => (
                              <tr
                                key={r.id}
                                className="border-b border-border/50 hover:bg-secondary/30"
                              >
                                <td className="p-3 font-medium">{r.fixture}</td>
                                <td className="p-3 text-muted-foreground">
                                  {r.league}
                                </td>
                                <td className="whitespace-nowrap p-3 text-muted-foreground">
                                  {format(new Date(r.kickoff), "MMM d, HH:mm")}
                                </td>
                                <td className="p-3">{r.pick}</td>
                                <td className="p-3 text-right">
                                  <span
                                    className={
                                      r.confidence >= 80
                                        ? "font-semibold text-primary"
                                        : ""
                                    }
                                  >
                                    {r.confidence}%
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {r.odds.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {locked > 0 && (
                          <div className="flex items-center justify-between border-t border-border bg-secondary/40 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              {locked} more pick{locked > 1 ? "s" : ""} hidden —
                              upgrade to unlock.
                            </div>
                            <Link href="/onboarding">
                              <Button size="sm">Upgrade</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </Card>
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <StatCardGridSkeleton />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <div className="mt-8">
        <Skeleton className="mb-4 h-6 w-56" />
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <Card className="overflow-hidden p-4">
          <table className="w-full text-sm">
            <tbody>
              <TableRowsSkeleton rows={5} cols={6} />
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div
        className={`flex items-center gap-2 text-xs uppercase tracking-wide ${
          accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}
