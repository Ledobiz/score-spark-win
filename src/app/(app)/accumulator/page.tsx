"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Lock, Plus, Trash2, Save, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListRowSkeleton } from "@/components/ui/skeletons";
import { useEntitlement } from "@/lib/use-entitlement";
import type { BetSlipRow, SlipPick } from "@/app/api/bet-slips/route";
import type { Recommendation } from "@/lib/predictions/types";

async function fetchRecommendations(): Promise<{
  recommendations: Recommendation[];
  unavailable?: boolean;
}> {
  const res = await fetch("/api/recommendations");
  if (!res.ok) throw new Error("Failed to load tips");
  const data = (await res.json()) as {
    recommendations: Recommendation[];
    unavailable?: boolean;
  };
  return {
    ...data,
    recommendations: data.recommendations
      .slice()
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 40),
  };
}

async function fetchSlips(): Promise<BetSlipRow[]> {
  const res = await fetch("/api/bet-slips");
  if (res.status === 401 || res.status === 403) return [];
  if (!res.ok) throw new Error("Failed to load slips");
  const data = (await res.json()) as { slips: BetSlipRow[] };
  return data.slips;
}

export default function AccumulatorPage() {
  const { data: ent } = useEntitlement();
  const qc = useQueryClient();
  const canUse = ent?.entitlement.canUseAccumulator ?? false;

  const [picks, setPicks] = useState<SlipPick[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: recsData, isLoading: recsLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });
  const recs = recsData?.recommendations;
  const { data: slips, isLoading: slipsLoading } = useQuery({
    queryKey: ["slips"],
    queryFn: fetchSlips,
    enabled: canUse,
  });

  const combined = picks.reduce((acc, p) => acc * p.odds, 1);

  const add = (r: Recommendation) => {
    if (picks.find((p) => p.id === r.id)) return;
    setPicks([
      ...picks,
      {
        id: r.id,
        fixture: r.fixture,
        market: r.market,
        pick: r.pick,
        odds: r.odds,
        confidence: r.confidence,
      },
    ]);
  };

  const save = async () => {
    if (picks.length < 2) {
      toast.error("Add at least 2 picks.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/bet-slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, picks }),
      });
      if (res.status === 403) {
        toast.error("The accumulator is a paid feature.");
        return;
      }
      if (!res.ok) throw new Error("Save failed");
      toast.success("Slip saved");
      setPicks([]);
      setName("");
      qc.invalidateQueries({ queryKey: ["slips"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!canUse) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          Accumulator locked
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upgrade to combine multiple picks and build accumulators.
        </p>
        <Link href="/onboarding">
          <Button className="mt-6">See plans</Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">
        Accumulator builder
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Combine top tips into a single slip.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Available tips</h2>
          </div>
          <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
            {recsLoading && <ListRowSkeleton count={6} />}
            {!recsLoading && recs?.length === 0 && (
              <EmptyState
                icon={recsData?.unavailable ? WifiOff : Inbox}
                bordered={false}
                title={
                  recsData?.unavailable
                    ? "Prediction service unavailable"
                    : "No tips available"
                }
                description={
                  recsData?.unavailable
                    ? "We couldn't reach the prediction service. Please try again shortly."
                    : "Check back once today's recommendations are in."
                }
              />
            )}
            {!recsLoading && recs?.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {r.fixture}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.league} · {r.market}:{" "}
                    <span className="text-foreground">{r.pick}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-primary">
                    {r.confidence}%
                  </div>
                  <div className="font-mono text-muted-foreground">
                    @{r.odds.toFixed(2)}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => add(r)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold">Your slip</h2>
            <div className="mt-3 space-y-2">
              {picks.length === 0 && (
                <EmptyState
                  icon={Plus}
                  size="compact"
                  bordered={false}
                  title="No picks yet"
                  description="Add tips from the list on the left to build your slip."
                />
              )}
              {picks.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border p-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.fixture}</div>
                    <div className="text-muted-foreground">
                      {p.pick} @ {p.odds.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setPicks(picks.filter((x) => x.id !== p.id))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/10 p-3">
              <span className="text-xs uppercase text-muted-foreground">
                Combined odds
              </span>
              <span className="font-display text-xl font-bold text-primary">
                {combined.toFixed(2)}
              </span>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Slip name (optional)"
              className="mt-3"
            />
            <Button
              onClick={save}
              disabled={picks.length < 2}
              loading={saving}
              className="mt-3 w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              Save slip
            </Button>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Recent slips</h3>
            {slipsLoading ? (
              <ListRowSkeleton count={2} />
            ) : slips && slips.length > 0 ? (
              <div className="space-y-2">
                {slips.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border border-border p-2 text-xs"
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-muted-foreground">
                        {s.picks.length} picks · {s.status}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-primary">
                      @{s.combinedOdds.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Save}
                size="compact"
                bordered={false}
                title="No saved slips yet"
                description="Build and save an accumulator above to see it here."
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
