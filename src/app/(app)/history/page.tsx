"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, History as HistoryIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  StatCardGridSkeleton,
  TableRowsSkeleton,
  ListRowSkeleton,
} from "@/components/ui/skeletons";
import { useEntitlement } from "@/lib/use-entitlement";
import type { HistoryRow } from "@/lib/history";

// predicted_outcome label -> settled result key, to grade once results exist.
const OUTCOME_KEY: Record<string, string> = {
  "Home Win": "home_win",
  "Away Win": "away_win",
  Draw: "draw",
};

async function fetchHistory(): Promise<HistoryRow[]> {
  const res = await fetch("/api/history");
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load history");
  const data = (await res.json()) as { history: HistoryRow[] };
  return data.history;
}

export default function HistoryPage() {
  const { data: ent } = useEntitlement();
  const canExport = ent?.entitlement.canExportHistory ?? false;
  const [exporting, setExporting] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ["user-predictions"],
    queryFn: fetchHistory,
  });

  const rows = history ?? [];
  const total = rows.length;
  const settled = rows.filter((h) => h.result != null);
  const wins = settled.filter(
    (h) => OUTCOME_KEY[h.predictedOutcome ?? ""] === h.result,
  ).length;
  const winRate = settled.length
    ? Math.round((wins / settled.length) * 100)
    : null;
  const avgConf = total
    ? Math.round(rows.reduce((s, h) => s + (h.confidence ?? 0), 0) / total)
    : 0;

  const doExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/history/export");
      if (res.status === 403) {
        toast.error("CSV export is a paid feature.");
        return;
      }
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prediction-history.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Prediction history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every prediction you&apos;ve run.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={doExport}
          disabled={!canExport}
          loading={exporting}
        >
          {exporting ? (
            "Exporting…"
          ) : canExport ? (
            <>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Export locked
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <StatCardGridSkeleton
          count={3}
          className="mt-6 grid gap-4 sm:grid-cols-3"
        />
      ) : (
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Predictions" value={total.toString()} />
        <StatCard label="Avg confidence" value={`${avgConf}%`} />
        <StatCard
          label="Win rate"
          value={winRate !== null ? `${winRate}%` : "—"}
          accent
        />
      </div>
      )}

      {isLoading && (
        <>
          <Card className="mt-6 hidden overflow-hidden p-0 sm:block">
            <table className="w-full text-sm">
              <tbody>
                <TableRowsSkeleton rows={6} cols={6} />
              </tbody>
            </table>
          </Card>
          <div className="mt-6 grid gap-3 sm:hidden">
            <ListRowSkeleton count={6} />
          </div>
        </>
      )}

      {!isLoading && total === 0 && (
        <Card className="mt-6 overflow-hidden p-0">
          <EmptyState
            icon={HistoryIcon}
            bordered={false}
            title="No predictions yet"
            description="Run a custom prediction and it'll show up here."
            action={{ label: "Make a prediction", href: "/predictions" }}
          />
        </Card>
      )}

      {!isLoading && total > 0 && (
        <>
          {/* Card list — small screens, avoids a horizontally-scrolling table */}
          <div className="mt-6 grid gap-3 sm:hidden">
            {rows.map((h) => {
              const won = h.result
                ? OUTCOME_KEY[h.predictedOutcome ?? ""] === h.result
                : null;
              return (
                <Card key={h.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{h.fixture}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {h.competition} ·{" "}
                        {format(new Date(h.createdAt), "MMM d, HH:mm")}
                      </p>
                    </div>
                    {won === null ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Pending
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          won
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {won ? "Win" : "Loss"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                    <span className="text-sm font-semibold">
                      {h.predictedOutcome ?? "—"}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {h.confidence ?? "—"}%
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Table — sm and up */}
          <Card className="mt-6 hidden overflow-x-auto p-0 sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Fixture</th>
                  <th className="p-3">League</th>
                  <th className="p-3">Predicted</th>
                  <th className="p-3 text-right">Confidence</th>
                  <th className="whitespace-nowrap p-3">Date</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => {
                  const won = h.result
                    ? OUTCOME_KEY[h.predictedOutcome ?? ""] === h.result
                    : null;
                  return (
                    <tr key={h.id} className="border-b border-border/50">
                      <td className="p-3 font-medium">{h.fixture}</td>
                      <td className="p-3 text-muted-foreground">{h.competition}</td>
                      <td className="p-3">{h.predictedOutcome ?? "—"}</td>
                      <td className="p-3 text-right font-mono">
                        {h.confidence ?? "—"}%
                      </td>
                      <td className="whitespace-nowrap p-3 text-muted-foreground">
                        {format(new Date(h.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="p-3 text-right">
                        {won === null ? (
                          <span className="text-xs text-muted-foreground">
                            Pending
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              won
                                ? "bg-primary/15 text-primary"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {won ? "Win" : "Loss"}
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

      {!canExport && (
        <Card className="mt-4 flex items-center justify-between border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" /> Export CSV is a paid
            feature.
          </div>
          <Link href="/onboarding">
            <Button size="sm">Upgrade</Button>
          </Link>
        </Card>
      )}
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
