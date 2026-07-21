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

function HistoryPage() {
  const { data: ent } = useEntitlement();
  const canExport = ent?.entitlement.canExportHistory ?? false;

  // Simulated resolution: mark past recommendations with random win/loss
  const { data: history } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data } = await supabase.from("recommendations").select("*").order("kickoff").limit(60);
      return (data ?? []).map((r) => {
        const past = new Date(r.kickoff).getTime() < Date.now();
        return {
          ...r,
          resolved: past,
          won: past ? (r.confidence > 60 ? Math.random() > 0.3 : Math.random() > 0.5) : null,
        };
      });
    },
  });

  const resolved = history?.filter((h) => h.resolved) ?? [];
  const wins = resolved.filter((h) => h.won).length;
  const winRate = resolved.length ? Math.round((wins / resolved.length) * 100) : 0;

  const doExport = () => {
    if (!canExport) return;
    const rows = [["Fixture", "League", "Kickoff", "Market", "Pick", "Confidence", "Odds", "Result"]];
    resolved.forEach((r) => rows.push([r.fixture, r.league, r.kickoff, r.market, r.pick, String(r.confidence), String(r.odds), r.won ? "Win" : "Loss"]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "prediction-history.csv"; a.click();
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Prediction history</h1>
          <p className="mt-1 text-sm text-muted-foreground">How past tips have resolved.</p>
        </div>
        <Button variant="secondary" onClick={doExport} disabled={!canExport}>
          {canExport ? <><Download className="mr-2 h-4 w-4" /> Export CSV</> : <><Lock className="mr-2 h-4 w-4" /> Export locked</>}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Resolved tips" value={resolved.length.toString()} />
        <StatCard label="Wins" value={wins.toString()} />
        <StatCard label="Win rate" value={`${winRate}%`} accent />
      </div>

      <Card className="mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">Fixture</th><th className="p-3">Market</th><th className="p-3 whitespace-nowrap">Kickoff</th>
              <th className="p-3 text-right">Odds</th><th className="p-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {history?.map((h) => (
              <tr key={h.id} className="border-b border-border/50">
                <td className="p-3 font-medium">{h.fixture}</td>
                <td className="p-3 text-muted-foreground">{h.market}: {h.pick}</td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(h.kickoff), "MMM d, HH:mm")}</td>
                <td className="p-3 text-right font-mono">{h.odds.toFixed(2)}</td>
                <td className="p-3 text-right">
                  {h.resolved ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${h.won ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      {h.won ? "Win" : "Loss"}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">Pending</span>}
                </td>
              </tr>
            ))}
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
