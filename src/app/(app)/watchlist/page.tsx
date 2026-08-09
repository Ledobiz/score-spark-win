"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, Trash2, Plus, Info, Lock, WifiOff, CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardListSkeleton } from "@/components/ui/skeletons";
import { useEntitlement } from "@/lib/use-entitlement";
import { stashDetailed } from "@/lib/predictions/detail-store";
import type { WatchlistItem } from "@/app/api/watchlist/route";
import type {
  DetailedPrediction,
  Fixture,
  League,
  Recommendation,
} from "@/lib/predictions/types";

async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const res = await fetch("/api/watchlist");
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Failed to load watchlist");
  const data = (await res.json()) as { items: WatchlistItem[] };
  return data.items;
}

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

async function fetchRecommendations(): Promise<{
  recommendations: Recommendation[];
  unavailable?: boolean;
}> {
  const res = await fetch("/api/recommendations");
  if (!res.ok) throw new Error("Failed to load recommendations");
  return res.json();
}

/** One card per upcoming fixture — the highest-confidence market row stands in
 * as the "best pick" so a watched team/league surfaces a single actionable
 * line instead of six near-duplicate market rows. */
interface FixtureGroup {
  key: string;
  fixture: string;
  league: string;
  kickoff: string;
  best: Recommendation;
  marketCount: number;
}

function groupByFixture(recs: Recommendation[]): FixtureGroup[] {
  const map = new Map<string, Recommendation[]>();
  for (const r of recs) {
    const key = `${r.league}__${r.fixture}__${r.kickoff}`;
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  return Array.from(map.entries())
    .map(([key, rows]) => {
      const best = rows.slice().sort((a, b) => b.confidence - a.confidence)[0];
      return {
        key,
        fixture: best.fixture,
        league: best.league,
        kickoff: best.kickoff,
        best,
        marketCount: rows.length,
      };
    })
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
}

function matchesForItem(item: WatchlistItem, recs: Recommendation[]): FixtureGroup[] {
  const filtered = recs.filter((r) =>
    item.entityType === "league"
      ? r.league === item.entityName
      : r.fixture
          .split(" vs ")
          .map((s) => s.trim())
          .includes(item.entityName),
  );
  return groupByFixture(filtered);
}

export default function WatchlistPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: ent } = useEntitlement();

  const [entityType, setEntityType] = useState<"team" | "league">("team");
  const [addLeagueId, setAddLeagueId] = useState("");
  const [selectedLeagueName, setSelectedLeagueName] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [predictingKey, setPredictingKey] = useState<string | null>(null);
  const [localViews, setLocalViews] = useState(0);

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: fetchWatchlist,
  });
  const { data: leaguesData, isLoading: leaguesLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: fetchLeagues,
  });
  const { data: fixturesData, isFetching: fixturesLoading } = useQuery({
    queryKey: ["fixtures", addLeagueId],
    queryFn: () => fetchFixtures(addLeagueId),
    enabled: entityType === "team" && !!addLeagueId,
  });
  const { data: recsData, isLoading: recsLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  const teamOptions = useMemo(() => {
    if (!fixturesData) return [];
    const names = new Set<string>();
    fixturesData.fixtures.forEach((f) => {
      names.add(f.home);
      names.add(f.away);
    });
    return Array.from(names).sort();
  }, [fixturesData]);

  const e = ent?.entitlement;
  const todayCount = (ent?.todayCount ?? 0) + localViews;
  const dailyPredictionLimit = e?.dailyCustomPredictionLimit ?? 3;
  const overPredictionLimit = todayCount >= dailyPredictionLimit;
  const dailyRecLimit = e?.dailyRecommendationLimit ?? 3;

  const add = async () => {
    const name = entityType === "league" ? selectedLeagueName : selectedTeamName;
    if (!name) return;
    if (items?.some((i) => i.entityType === entityType && i.entityName === name)) {
      toast.error("Already on your watchlist");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityName: name }),
      });
      if (!res.ok) {
        toast.error("Failed to add");
        return;
      }
      toast.success(`Watching ${name}`);
      setSelectedTeamName("");
      setSelectedLeagueName("");
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    try {
      await fetch(`/api/watchlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } finally {
      setRemovingId(null);
    }
  };

  const viewPrediction = async (g: FixtureGroup) => {
    if (overPredictionLimit) {
      toast.error(
        `Daily limit (${dailyPredictionLimit}) reached. Upgrade for unlimited.`,
      );
      return;
    }
    const [home, away] = g.fixture.split(" vs ").map((s) => s.trim());
    setPredictingKey(g.key);
    try {
      const res = await fetch("/api/predictions/detailed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: g.best.id,
          home,
          away,
          league: g.league,
        }),
      });
      if (res.status === 429 || res.status === 503) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? "Couldn't load prediction. Please try again.");
        return;
      }
      if (!res.ok) throw new Error("Prediction failed");
      const detailed = (await res.json()) as DetailedPrediction;
      stashDetailed(detailed);
      setLocalViews((v) => v + 1);
      router.push("/predictions/detail");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setPredictingKey(null);
    }
  };

  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Watchlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Follow teams and leagues to see their upcoming fixtures and best picks
        here, without digging through the full recommendations list.
      </p>

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Watch
            </label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value as "team" | "league");
                setSelectedLeagueName("");
                setSelectedTeamName("");
              }}
              className="h-9 rounded-md border border-input bg-input px-3 text-sm"
            >
              <option value="team">A team</option>
              <option value="league">A league</option>
            </select>
          </div>

          {entityType === "team" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                League
              </label>
              <select
                value={addLeagueId}
                onChange={(e) => {
                  setAddLeagueId(e.target.value);
                  setSelectedTeamName("");
                }}
                disabled={leaguesLoading}
                className="h-9 min-w-[180px] rounded-md border border-input bg-input px-3 text-sm"
              >
                <option value="">
                  {leaguesLoading ? "Loading leagues…" : "Select a league"}
                </option>
                {leaguesData?.leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {entityType === "team" ? "Team" : "League"}
            </label>
            {entityType === "team" ? (
              <select
                value={selectedTeamName}
                onChange={(e) => setSelectedTeamName(e.target.value)}
                disabled={!addLeagueId || fixturesLoading}
                className="h-9 min-w-[200px] rounded-md border border-input bg-input px-3 text-sm"
              >
                <option value="">
                  {!addLeagueId
                    ? "Pick a league first"
                    : fixturesLoading
                      ? "Loading teams…"
                      : teamOptions.length === 0
                        ? "No teams available"
                        : "Select a team"}
                </option>
                {teamOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedLeagueName}
                onChange={(e) => setSelectedLeagueName(e.target.value)}
                disabled={leaguesLoading}
                className="h-9 min-w-[200px] rounded-md border border-input bg-input px-3 text-sm"
              >
                <option value="">
                  {leaguesLoading ? "Loading leagues…" : "Select a league"}
                </option>
                {leaguesData?.leagues.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Button
            onClick={add}
            loading={adding}
            disabled={entityType === "team" ? !selectedTeamName : !selectedLeagueName}
          >
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </Card>

      {itemsLoading ? (
        <CardListSkeleton count={3} className="mt-6 space-y-3" />
      ) : (
        <div className="mt-6 space-y-3">
          {items?.length === 0 && (
            <EmptyState
              icon={Star}
              title="Nothing on your watchlist yet"
              description="Add a team or league above to see their upcoming fixtures and best picks here."
            />
          )}
          {items?.map((item) => {
            const groups = matchesForItem(item, recsData?.recommendations ?? []);
            const visible = e?.isActive ? groups : groups.slice(0, dailyRecLimit);
            const lockedCount = groups.length - visible.length;
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <div className="font-medium">{item.entityName}</div>
                      <div className="text-xs uppercase text-muted-foreground">
                        {item.entityType}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(item.id)}
                    loading={removingId === item.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {recsLoading && <CardListSkeleton count={1} className="space-y-2" />}

                  {!recsLoading && recsData?.unavailable && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <WifiOff className="h-3.5 w-3.5" /> Prediction service
                      unavailable — check back shortly.
                    </p>
                  )}

                  {!recsLoading && !recsData?.unavailable && groups.length === 0 && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarX className="h-3.5 w-3.5" /> No upcoming picks yet
                      — we&apos;ll show them here as soon as a fixture is
                      scheduled.
                    </p>
                  )}

                  {!recsLoading &&
                    visible.map((g) => (
                      <div
                        key={g.key}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{g.fixture}</div>
                          <div className="text-muted-foreground">
                            {g.league} ·{" "}
                            {format(new Date(g.kickoff), "EEE MMM d · HH:mm")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {g.best.market}: {g.best.pick}
                            </div>
                            <div className="font-mono text-muted-foreground">
                              {g.best.confidence}% · @{g.best.odds.toFixed(2)}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => viewPrediction(g)}
                            disabled={overPredictionLimit}
                            loading={predictingKey === g.key}
                            title="View full prediction"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                  {!recsLoading && lockedCount > 0 && (
                    <Link
                      href="/onboarding"
                      className="flex items-center gap-2 rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    >
                      <Lock className="h-3.5 w-3.5" /> {lockedCount} more upcoming{" "}
                      {lockedCount === 1 ? "pick" : "picks"} — upgrade to see all
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {overPredictionLimit && (
        <Card className="mt-6 flex items-center justify-between border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-3 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            You&apos;ve hit today&apos;s {dailyPredictionLimit}-prediction limit.
          </div>
          <Link href="/onboarding">
            <Button size="sm">Upgrade</Button>
          </Link>
        </Card>
      )}
    </>
  );
}
