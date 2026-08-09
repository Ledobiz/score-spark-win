"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Clock, ListTree, Target, TrendingUp, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  StatCardGridSkeleton,
  ChartCardSkeleton,
  TableRowsSkeleton,
} from "@/components/ui/skeletons";
import type {
  Insights,
  RecentPrediction,
  StatsBucket,
  TierBucket,
} from "@/lib/predictions/types";

async function fetchInsights(): Promise<Insights | null> {
  const res = await fetch("/api/insights");
  if (!res.ok) throw new Error("Failed to load insights");
  const data = (await res.json()) as { insights: Insights | null };
  return data.insights;
}

const pct = (x: number | null | undefined) =>
  x == null ? "—" : `${Math.round(x * 100)}%`;

export default function InsightsPage() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
  });

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  const overall: StatsBucket | undefined = insights?.stats.overall;
  const tiers = insights?.tiers;
  const calibration = insights?.calibration ?? [];
  const recent = insights?.recent ?? [];
  const byComp = insights?.stats.by_competition ?? {};
  const compRows = Object.entries(byComp).filter(([, b]) => b.settled > 0);

  const calData = calibration.map((b) => ({
    label: b.label,
    Predicted: Math.round(b.predicted * 100),
    Actual: Math.round(b.actual * 100),
    count: b.count,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          Model track record
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Out-of-sample accuracy over every settled prediction. Straight 1X2 sits
          near the bookmaker line (~54%) — the edge is in the higher-confidence
          tiers and double-chance, not inflated win rates.
        </p>
      </div>

      {/* Overall */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Settled predictions"
          value={overall ? overall.settled.toString() : "—"}
        />
        <StatCard
          label="Correct"
          value={overall ? overall.correct.toString() : "—"}
        />
        <StatCard
          label="Overall accuracy"
          value={pct(overall?.success_rate)}
          accent
        />
      </div>

      {insights?.unavailable && (
        <EmptyState
          icon={WifiOff}
          className="mt-4"
          title="Prediction service unavailable"
          description="We couldn't reach the prediction service. Please try again shortly."
        />
      )}

      {!insights?.unavailable && overall && overall.settled === 0 && (
        <EmptyState
          icon={Target}
          className="mt-4"
          title="No predictions have settled yet"
          description="Accuracy and calibration populate here as fixtures resolve."
        />
      )}

      {/* Confidence tiers */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-bold">Confidence tiers</h2>
          {tiers && (
            <Badge variant="secondary" className="text-[10px]">
              confident ≥ {Math.round(tiers.threshold * 100)}%
            </Badge>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TierCard
            title="Single pick"
            subtitle="Every prediction"
            tier={tiers?.single}
          />
          <TierCard
            title="Confident"
            subtitle={
              tiers
                ? `Confidence ≥ ${Math.round(tiers.threshold * 100)}%`
                : "High confidence"
            }
            tier={tiers?.confident}
            highlight
          />
          <TierCard
            title="Double chance"
            subtitle="Two-outcome cover"
            tier={tiers?.double_chance}
          />
        </div>
      </section>

      {/* Calibration */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-bold">Calibration</h2>
        </div>
        <Card className="p-5">
          <p className="mb-4 text-sm text-muted-foreground">
            Predicted probability vs. how often those picks actually landed. A
            well-calibrated model tracks the diagonal.
          </p>
          {calData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={calData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="Actual"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="Predicted"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={TrendingUp}
              size="compact"
              bordered={false}
              className="h-[280px]"
              title="Not enough data yet"
              description="Not enough settled predictions to plot calibration yet."
            />
          )}
        </Card>
      </section>

      {/* By competition */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">By competition</h2>
        {compRows.length === 0 ? (
          <EmptyState
            icon={ListTree}
            title="No competition breakdown yet"
            description="This fills in once your settled predictions span a few competitions."
          />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Competition</th>
                  <th className="p-3 text-right">Settled</th>
                  <th className="p-3 text-right">Correct</th>
                  <th className="p-3 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {compRows.map(([name, b]) => (
                  <tr key={name} className="border-b border-border/50">
                    <td className="p-3 font-medium">{name}</td>
                    <td className="p-3 text-right font-mono">{b.settled}</td>
                    <td className="p-3 text-right font-mono">{b.correct}</td>
                    <td className="p-3 text-right font-mono">
                      {pct(b.success_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Recent settled */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">
          Recently settled
        </h2>
        {recent.length === 0 ? (
          <Card className="overflow-hidden p-0">
            <EmptyState
              icon={Clock}
              bordered={false}
              title="No settled predictions yet"
              description="Check back once fixtures resolve to see results here."
            />
          </Card>
        ) : (
          <>
            {/* Card list — small screens, avoids a horizontally-scrolling table */}
            <div className="grid gap-3 sm:hidden">
              {recent.map((r: RecentPrediction, i) => {
                const correct = r.correct;
                return (
                  <Card key={i} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.fixture}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.competition}
                        </p>
                      </div>
                      {correct == null ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {r.result ?? "—"}
                        </span>
                      ) : (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            correct
                              ? "bg-primary/15 text-primary"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {correct ? "Win" : "Loss"}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                      <span className="text-sm font-semibold">
                        {r.predicted_outcome}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {pct(r.confidence)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Table — sm and up */}
            <Card className="hidden overflow-x-auto p-0 sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">Fixture</th>
                    <th className="p-3">League</th>
                    <th className="p-3">Predicted</th>
                    <th className="p-3 text-right">Confidence</th>
                    <th className="p-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r: RecentPrediction, i) => {
                    const correct = r.correct;
                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="p-3 font-medium">{r.fixture}</td>
                        <td className="p-3 text-muted-foreground">
                          {r.competition}
                        </td>
                        <td className="p-3">{r.predicted_outcome}</td>
                        <td className="p-3 text-right font-mono">
                          {pct(r.confidence)}
                        </td>
                        <td className="p-3 text-right">
                          {correct == null ? (
                            <span className="text-xs text-muted-foreground">
                              {r.result ?? "—"}
                            </span>
                          ) : (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                correct
                                  ? "bg-primary/15 text-primary"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {correct ? "Win" : "Loss"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </section>
    </>
  );
}

function InsightsSkeleton() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-2/3 max-w-2xl" />
      </div>
      <StatCardGridSkeleton count={3} className="grid gap-4 sm:grid-cols-3" />
      <div className="mt-8">
        <Skeleton className="mb-3 h-6 w-48" />
        <StatCardGridSkeleton count={3} className="grid gap-4 sm:grid-cols-3" />
      </div>
      <div className="mt-8">
        <Skeleton className="mb-3 h-6 w-32" />
        <ChartCardSkeleton height="h-[280px]" title={false} />
      </div>
      <div className="mt-8">
        <Skeleton className="mb-3 h-6 w-40" />
        <Card className="overflow-hidden p-4">
          <table className="w-full text-sm">
            <tbody>
              <TableRowsSkeleton rows={5} cols={5} />
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-bold ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
    </Card>
  );
}

function TierCard({
  title,
  subtitle,
  tier,
  highlight,
}: {
  title: string;
  subtitle: string;
  tier: TierBucket | undefined;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`p-5 ${highlight ? "border-primary/60 glow-accent" : ""}`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {tier ? `${tier.settled} settled` : "—"}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      <div
        className={`mt-3 font-display text-3xl font-bold ${
          highlight ? "text-primary" : ""
        }`}
      >
        {tier ? pctOrDash(tier.success_rate) : "—"}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        accuracy
        {tier?.coverage != null && (
          <> · {Math.round(tier.coverage * 100)}% coverage</>
        )}
      </div>
    </Card>
  );
}

function pctOrDash(x: number | null | undefined) {
  return x == null ? "—" : `${Math.round(x * 100)}%`;
}
