import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useEntitlement } from "@/lib/use-entitlement";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRecommendations, getStats } from "@/lib/predictions.functions";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { Lock, TrendingUp, Trophy, Flame, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const MARKETS = ["Home Win", "Away Win", "Draw", "BTTS", "Over 1.5", "Over 2.5"] as const;

function Dashboard() {
  const { data: ent, isLoading } = useEntitlement();
  const recFn = useServerFn(getRecommendations);
  const { data: recs } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => recFn(),
  });
  const statsFn = useServerFn(getStats);
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => statsFn(),
  });
  // Per-user activity (prediction_view events, last 30 days) for the views &
  // streak cards. RLS scopes these rows to the signed-in user.
  const { data: activity } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [] as { created_at: string; league: string | null }[];
      const since = new Date(); since.setDate(since.getDate() - 30); since.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("user_activity")
        .select("created_at, meta")
        .eq("user_id", u.user.id)
        .eq("activity_type", "prediction_view")
        .gte("created_at", since.toISOString());
      return (data ?? []).map((r) => ({
        created_at: r.created_at as string,
        league: (r.meta as unknown as { league?: string } | null)?.league ?? null,
      }));
    },
  });

  if (isLoading || !ent) return <AppShell><div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppShell>;

  const e = ent.entitlement;
  const displayName = ent.profile?.full_name || ent.user.email?.split("@")[0] || "Player";

  // Real per-user activity from user_activity (prediction_view events), bucketed
  // by local day.
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayCounts: Record<string, number> = {};
  for (const a of activity ?? []) {
    const k = ymd(new Date(a.created_at));
    dayCounts[k] = (dayCounts[k] ?? 0) + 1;
  }

  // Most-viewed league across the user's recent predictions.
  const leagueCounts: Record<string, number> = {};
  for (const a of activity ?? []) if (a.league) leagueCounts[a.league] = (leagueCounts[a.league] ?? 0) + 1;
  const topLeague = Object.entries(leagueCounts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;

  const modelRate = stats?.overall.success_rate ?? 0.5;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const views = dayCounts[ymd(d)] ?? 0;
    // No resolved followed-bet data — estimate wins as views × model hit rate.
    return { day: format(d, "EEE"), views, wins: Math.round(views * modelRate) };
  });
  const views7d = days.reduce((s, d) => s + d.views, 0);

  // Consecutive-day activity streak (tolerant of not having viewed yet today).
  let streak = 0;
  {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (!(dayCounts[ymd(d)] > 0)) d.setDate(d.getDate() - 1);
    while (dayCounts[ymd(d)] > 0) { streak++; d.setDate(d.getDate() - 1); }
  }
  const activityLoading = activity === undefined;

  // Real model track record from /stats (out-of-sample accuracy over every
  // settled prediction), not a synthetic followed-tips rate.
  const winRate = stats ? Math.round(stats.overall.success_rate * 100) : null;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">Hey {displayName} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's cooking today.</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="secondary" className="border-primary/30 text-primary">
            {e.planId ? e.planId.replace("_", " ").toUpperCase() : "NO PLAN"}
          </Badge>
          {e.isTrial && e.daysLeft !== null && (
            <span className="text-xs text-muted-foreground">Trial: {e.daysLeft}d left</span>
          )}
          {e.isPaid && e.daysLeft !== null && (
            <span className="text-xs text-muted-foreground">Renews in {e.daysLeft}d</span>
          )}
          {!e.isActive && <Link to="/onboarding"><Button size="sm">Choose plan</Button></Link>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Predictions viewed (7d)" value={activityLoading ? "—" : views7d.toString()} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Model win rate" value={winRate !== null ? `${winRate}%` : "—"} accent />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Top league" value={activityLoading ? "—" : (topLeague ?? "—")} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Day streak" value={activityLoading ? "—" : `${streak}d`} accent />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Views (last 7 days)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="views" stroke="var(--color-chart-1)" fill="url(#gv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-4 font-semibold">Wins vs Views</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="views" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wins" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Today's recommendations</h2>
          {!e.isActive && <Link to="/onboarding"><Button size="sm" variant="secondary">Unlock all</Button></Link>}
        </div>
        <Tabs defaultValue="Home Win">
          <TabsList className="flex w-full flex-wrap justify-start">
            {MARKETS.map((m) => <TabsTrigger key={m} value={m}>{m}</TabsTrigger>)}
          </TabsList>
          {MARKETS.map((m) => {
            const all = recs?.filter((r) => r.market === m) ?? [];
            const visible = e.isActive ? all : all.slice(0, 3);
            const locked = all.length - visible.length;
            return (
              <TabsContent key={m} value={m} className="mt-4">
                <Card className="overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                          <th className="p-3">Fixture</th>
                          <th className="p-3">League</th>
                          <th className="p-3 whitespace-nowrap">Kickoff</th>
                          <th className="p-3">Pick</th>
                          <th className="p-3 text-right">Confidence</th>
                          <th className="p-3 text-right">Odds</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((r) => (
                          <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="p-3 font-medium">{r.fixture}</td>
                            <td className="p-3 text-muted-foreground">{r.league}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(r.kickoff), "MMM d, HH:mm")}</td>
                            <td className="p-3">{r.pick}</td>
                            <td className="p-3 text-right"><span className={r.confidence >= 80 ? "text-primary font-semibold" : ""}>{r.confidence}%</span></td>
                            <td className="p-3 text-right font-mono">{r.odds.toFixed(2)}</td>
                          </tr>
                        ))}
                        {visible.length === 0 && (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No picks in this market yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                    {locked > 0 && (
                      <div className="flex items-center justify-between border-t border-border bg-secondary/40 p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lock className="h-4 w-4" />
                          {locked} more pick{locked > 1 ? "s" : ""} hidden — upgrade to unlock.
                        </div>
                        <Link to="/onboarding"><Button size="sm">Upgrade</Button></Link>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wide ${accent ? "text-primary" : "text-muted-foreground"}`}>
        {icon}{label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}
