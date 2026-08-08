"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarX, ChevronRight, Info, Lock, TrendingUp, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { useEntitlement } from "@/lib/use-entitlement";
import { stashDetailed } from "@/lib/predictions/detail-store";
import type {
  DetailedPrediction,
  Fixture,
  League,
  PredictionResult,
} from "@/lib/predictions/types";

async function fetchLeagues(): Promise<{ leagues: League[]; unavailable?: boolean }> {
  const res = await fetch("/api/leagues");
  if (!res.ok) throw new Error("Failed to load leagues");
  return res.json();
}

async function fetchFixtures(
  leagueId: string,
): Promise<{ fixtures: Fixture[]; unavailable?: boolean }> {
  const res = await fetch(`/api/fixtures?league=${encodeURIComponent(leagueId)}`);
  if (!res.ok) throw new Error("Failed to load fixtures");
  return res.json();
}

export default function PredictionsPage() {
  const router = useRouter();
  const { data: ent } = useEntitlement();

  const [step, setStep] = useState(1);
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [localViews, setLocalViews] = useState(0);

  const { data: leagues, isLoading: leaguesLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: fetchLeagues,
  });
  const { data: fixtures, isFetching: fxLoading } = useQuery({
    queryKey: ["fixtures", leagueId],
    queryFn: () => fetchFixtures(leagueId!),
    enabled: !!leagueId,
  });

  const todayCount = (ent?.todayCount ?? 0) + localViews;
  const dailyLimit = ent?.entitlement.dailyCustomPredictionLimit ?? 3;
  const overLimit = todayCount >= dailyLimit;

  const runPrediction = async (fx: Fixture) => {
    if (overLimit) {
      toast.error(`Daily limit (${dailyLimit}) reached. Upgrade for unlimited.`);
      return;
    }
    setLoading(true);
    setFixture(fx);
    setPrediction(null);
    try {
      const res = await fetch("/api/predictions/detailed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: fx.id,
          home: fx.home,
          away: fx.away,
          league: leagueName,
        }),
      });
      if (res.status === 429 || res.status === 503) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(
          body?.error ??
            (res.status === 503
              ? "Prediction service is currently unavailable. Please try again shortly."
              : "Daily limit reached. Upgrade for unlimited."),
        );
        return;
      }
      if (!res.ok) throw new Error("Prediction failed");
      const detailed = (await res.json()) as DetailedPrediction;
      stashDetailed(detailed);
      setPrediction(detailed.simple);
      setStep(3);
      setLocalViews((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Custom prediction
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            3 steps to a data-driven pick.
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          Today:{" "}
          <span className="font-semibold text-foreground">{todayCount}</span>
          {dailyLimit < 9999 && ` / ${dailyLimit}`}
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2 text-xs">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full font-semibold ${
                step >= n
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {n}
            </span>
            <span className={step >= n ? "font-medium" : "text-muted-foreground"}>
              {n === 1 ? "League" : n === 2 ? "Fixture" : "Prediction"}
            </span>
            {n < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && leaguesLoading && (
        <CardListSkeleton
          count={6}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        />
      )}

      {step === 1 && !leaguesLoading && leagues && leagues.leagues.length === 0 && (
        <EmptyState
          icon={leagues.unavailable ? WifiOff : CalendarX}
          title={
            leagues.unavailable
              ? "Prediction service unavailable"
              : "No leagues available"
          }
          description={
            leagues.unavailable
              ? "We couldn't reach the prediction service. Please try again shortly."
              : "There's nothing to show here right now — check back later."
          }
        />
      )}

      {step === 1 && !leaguesLoading && leagues && leagues.leagues.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.leagues.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLeagueId(l.id);
                setLeagueName(l.name);
                setStep(2);
              }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/60 hover:bg-secondary/40"
            >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="mb-3"
          >
            ← Change league
          </Button>
          {fxLoading ? (
            <CardListSkeleton count={4} className="grid gap-3" />
          ) : fixtures?.fixtures.length === 0 ? (
            <EmptyState
              icon={fixtures.unavailable ? WifiOff : CalendarX}
              title={
                fixtures.unavailable
                  ? "Prediction service unavailable"
                  : "No upcoming fixtures"
              }
              description={
                fixtures.unavailable
                  ? "We couldn't reach the prediction service. Please try again shortly."
                  : "This league has nothing scheduled right now — try another league."
              }
            />
          ) : (
            <div className="grid gap-3">
              {fixtures?.fixtures.map((f) => (
                <Card key={f.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {f.home} <span className="text-muted-foreground">vs</span>{" "}
                      {f.away}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(f.kickoff), "EEE MMM d · HH:mm")}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => runPrediction(f)}
                    disabled={overLimit}
                    loading={loading && fixture?.id === f.id}
                  >
                    Predict
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {step === 3 && prediction && (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
              ← New fixture
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/predictions/detail")}
            >
              <Info className="mr-2 h-4 w-4" /> More Info
            </Button>
          </div>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-muted-foreground">
                  {prediction.league}
                </div>
                <h2 className="font-display text-2xl font-bold">
                  {prediction.fixture}
                </h2>
              </div>
              <div className="rounded-xl bg-primary/10 px-4 py-3 text-right">
                <div className="text-xs text-muted-foreground">Prediction</div>
                <div className="font-display text-xl font-bold text-primary">
                  {prediction.predicted_outcome}
                </div>
                <div className="text-xs text-muted-foreground">
                  Confidence {prediction.confidence}%
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ProbBlock
                title="1X2"
                data={[
                  {
                    k: prediction.fixture.split(" vs ")[0],
                    v: prediction.probabilities["1X2"].home,
                  },
                  { k: "Draw", v: prediction.probabilities["1X2"].draw },
                  {
                    k: prediction.fixture.split(" vs ")[1],
                    v: prediction.probabilities["1X2"].away,
                  },
                ]}
              />
              <ProbBlock
                title="BTTS"
                data={[
                  { k: "Yes", v: prediction.probabilities.BTTS.yes },
                  { k: "No", v: prediction.probabilities.BTTS.no },
                ]}
              />
              <ProbBlock
                title="Over/Under 2.5"
                data={[
                  {
                    k: "Over 2.5",
                    v: prediction.probabilities["Over/Under 2.5"].over,
                  },
                  {
                    k: "Under 2.5",
                    v: prediction.probabilities["Over/Under 2.5"].under,
                  },
                ]}
              />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Form &amp; H2H
              </div>
              <p className="text-sm">{prediction.summary}</p>
            </div>
          </Card>
        </>
      )}

      {overLimit && (
        <Card className="mt-6 flex items-center justify-between border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-3 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            You&apos;ve hit today&apos;s {dailyLimit}-prediction limit.
          </div>
          <Link href="/onboarding">
            <Button size="sm">Upgrade</Button>
          </Link>
        </Card>
      )}
    </>
  );
}

function ProbBlock({
  title,
  data,
}: {
  title: string;
  data: { k: string; v: number }[];
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </div>
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
