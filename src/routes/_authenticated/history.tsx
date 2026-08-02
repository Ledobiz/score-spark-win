import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlement } from "@/lib/use-entitlement";
import { Download, Lock } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/history")({ component: HistoryPage });

// predicted_outcome label -> settled result key, to grade once results exist.
const OUTCOME_KEY: Record<string, string> = { "Home Win": "home_win", "Away Win": "away_win", "Draw": "draw" };

function HistoryPage() {
  const { data: ent } = useEntitlement();
  const canExport = ent?.entitlement.canExportHistory ?? false;

  // The signed-in user's own predictions (RLS scopes rows to them).
  const { data: history } = useQuery({
    queryKey: ["user-predictions"],
    queryFn: async () => {
      const { data } = await supabase.from("user_predictions")
        .select("id, competition, fixture, predicted_outcome, confidence, result, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const rows = history ?? [];
  const total = rows.length;
  const settled = rows.filter((h) => h.result != null);
  const wins = settled.filter((h) => OUTCOME_KEY[h.predicted_outcome ?? ""] === h.result).length;
  const winRate = settled.length ? Math.round((wins / settled.length) * 100) : null;
  const avgConf = total ? Math.round(rows.reduce((s, h) => s + (h.confidence ?? 0), 0) / total) : 0;

  const doExport = () => {
    if (!canExport) return;
    const out = [["Fixture", "League", "Predicted", "Confidence", "Date", "Result"]];
    rows.forEach((r) => out.push([
      r.fixture, r.competition, r.predicted_outcome ?? "", String(r.confidence ?? ""),
      r.created_at, r.result ?? "Pending",
    ]));
    const csv = out.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "prediction-history.csv"; a.click();
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Prediction history</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every prediction you've run.</p>
        </div>
        <Button variant="secondary" onClick={doExport} disabled={!canExport}>
          {canExport ? <><Download className="mr-2 h-4 w-4" /> Export CSV</> : <><Lock className="mr-2 h-4 w-4" /> Export locked</>}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Predictions" value={total.toString()} />
        <StatCard label="Avg confidence" value={`${avgConf}%`} />
        <StatCard label="Win rate" value={winRate !== null ? `${winRate}%` : "—"} accent />
      </div>

      <Card className="mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">Fixture</th><th className="p-3">League</th><th className="p-3">Predicted</th>
              <th className="p-3 text-right">Confidence</th><th className="p-3 whitespace-nowrap">Date</th>
              <th className="p-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const won = h.result ? OUTCOME_KEY[h.predicted_outcome ?? ""] === h.result : null;
              return (
                <tr key={h.id} className="border-b border-border/50">
                  <td className="p-3 font-medium">{h.fixture}</td>
                  <td className="p-3 text-muted-foreground">{h.competition}</td>
                  <td className="p-3">{h.predicted_outcome ?? "—"}</td>
                  <td className="p-3 text-right font-mono">{h.confidence ?? "—"}%</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(h.created_at), "MMM d, HH:mm")}</td>
                  <td className="p-3 text-right">
                    {won === null ? (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${won ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                        {won ? "Win" : "Loss"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {total === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No predictions yet — run one from the Predictions page.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {!canExport && (
        <Card className="mt-4 flex items-center justify-between border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4 text-primary" /> Export CSV is a paid feature.</div>
          <Link to="/onboarding"><Button size="sm">Upgrade</Button></Link>
        </Card>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (<Card className="p-4"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className={`mt-2 font-display text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div></Card>);
}
