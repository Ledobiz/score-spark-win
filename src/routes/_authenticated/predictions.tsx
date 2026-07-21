import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLeagues, getFixtures, getPrediction, type PredictionResult } from "@/lib/predictions.functions";
import { useEntitlement } from "@/lib/use-entitlement";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2, Lock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/predictions")({ component: PredictionsPage });

function PredictionsPage() {
  const { data: ent } = useEntitlement();
  const active = ent?.entitlement.isActive ?? false;
  const [step, setStep] = useState(1);
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string>("");
  const [fixture, setFixture] = useState<{ id: string; home: string; away: string } | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [todayCount, setTodayCount] = useState<number>(0);

  const leaguesFn = useServerFn(getLeagues);
  const fixturesFn = useServerFn(getFixtures);
  const predictFn = useServerFn(getPrediction);

  const { data: leagues } = useQuery({ queryKey: ["leagues"], queryFn: () => leaguesFn() });
  const { data: fixtures, isFetching: fxLoading } = useQuery({
    queryKey: ["fixtures", leagueId],
    queryFn: () => fixturesFn({ data: { leagueId: leagueId! } }),
    enabled: !!leagueId,
  });

  // count today's custom predictions
  useState(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", data.user.id).eq("activity_type", "prediction_view")
        .gte("created_at", startOfDay.toISOString());
      setTodayCount(count ?? 0);
    });
  });

  const dailyLimit = active ? 9999 : 3;
  const overLimit = todayCount >= dailyLimit;

  const runPrediction = async (fx: { id: string; home: string; away: string }) => {
    if (overLimit) { toast.error(`Daily limit (${dailyLimit}) reached. Upgrade for unlimited.`); return; }
    setLoading(true); setFixture(fx); setPrediction(null);
    try {
      const res = await predictFn({ data: { fixtureId: fx.id, home: fx.home, away: fx.away, league: leagueName } });
      setPrediction(res as PredictionResult);
      setStep(3);
      setTodayCount((c) => c + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Custom prediction</h1>
          <p className="mt-1 text-sm text-muted-foreground">3 steps to a data-driven pick.</p>
        </div>
        <div className="text-right text-xs text-muted-foreground shrink-0">
          Today: <span className="font-semibold text-foreground">{todayCount}</span>
          {!active && ` / ${dailyLimit}`}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2 text-xs">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-full font-semibold ${step >= n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{n}</span>
            <span className={step >= n ? "font-medium" : "text-muted-foreground"}>
              {n === 1 ? "League" : n === 2 ? "Fixture" : "Prediction"}
            </span>
            {n < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leagues?.leagues.map((l) => (
            <button key={l.id} onClick={() => { setLeagueId(l.id); setLeagueName(l.name); setStep(2); }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/60 hover:bg-secondary/40">
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs text-muted-foreground">{l.country}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="mb-3">← Change league</Button>
          {fxLoading ? (
            <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid gap-3">
              {fixtures?.fixtures.map((f) => (
                <Card key={f.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{f.home} <span className="text-muted-foreground">vs</span> {f.away}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(f.kickoff), "EEE MMM d · HH:mm")}</div>
                  </div>
                  <Button size="sm" onClick={() => runPrediction(f)} disabled={loading || overLimit}>
                    {loading && fixture?.id === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Predict"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {step === 3 && prediction && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="mb-3">← New fixture</Button>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-muted-foreground">{prediction.league}</div>
                <h2 className="font-display text-2xl font-bold">{prediction.fixture}</h2>
              </div>
              <div className="rounded-xl bg-primary/10 px-4 py-3 text-right">
                <div className="text-xs text-muted-foreground">Prediction</div>
                <div className="font-display text-xl font-bold text-primary">{prediction.predicted_outcome}</div>
                <div className="text-xs text-muted-foreground">Confidence {prediction.confidence}%</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ProbBlock title="1X2" data={[
                { k: prediction.fixture.split(" vs ")[0], v: prediction.probabilities["1X2"].home },
                { k: "Draw", v: prediction.probabilities["1X2"].draw },
                { k: prediction.fixture.split(" vs ")[1], v: prediction.probabilities["1X2"].away },
              ]} />
              <ProbBlock title="BTTS" data={[
                { k: "Yes", v: prediction.probabilities.BTTS.yes },
                { k: "No", v: prediction.probabilities.BTTS.no },
              ]} />
              <ProbBlock title="Over/Under 2.5" data={[
                { k: "Over 2.5", v: prediction.probabilities["Over/Under 2.5"].over },
                { k: "Under 2.5", v: prediction.probabilities["Over/Under 2.5"].under },
              ]} />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Form & H2H
              </div>
              <p className="text-sm">{prediction.summary}</p>
            </div>
          </Card>
        </>
      )}

      {overLimit && !active && (
        <Card className="mt-6 flex items-center justify-between border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-3 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            You've hit today's {dailyLimit}-prediction limit.
          </div>
          <Link to="/onboarding"><Button size="sm">Upgrade</Button></Link>
        </Card>
      )}
    </AppShell>
  );
}

function ProbBlock({ title, data }: { title: string; data: { k: string; v: number }[] }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.k}>
            <div className="flex justify-between text-sm">
              <span className="truncate">{d.k}</span>
              <span className="font-mono font-semibold">{d.v.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary" style={{ width: `${d.v}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
