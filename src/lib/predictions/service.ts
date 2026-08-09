import "server-only";
import type {
  DetailedPrediction,
  Fixture,
  Insights,
  League,
  Recommendation,
  Stats,
} from "./types";

/**
 * Server-to-server call to the Python FastAPI service. Adds the secret x-api-key
 * (never NEXT_PUBLIC). Returns null when the API is unconfigured or errors, so
 * callers can report unavailability instead of fabricating data.
 */
export async function callExternal(
  path: string,
  params: Record<string, string> = {},
): Promise<unknown | null> {
  const base = process.env.PYTHON_API_URL;
  const key = process.env.PYTHON_API_KEY;
  if (!base || !key) return null;
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), {
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      // Predictions are time-sensitive; don't let Next cache them.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getLeagues(): Promise<{
  leagues: League[];
  unavailable?: boolean;
}> {
  const ext = await callExternal("/leagues");
  if (!ext) return { leagues: [], unavailable: true };
  return { leagues: (ext as { leagues?: League[] }).leagues ?? [] };
}

export async function getFixtures(
  leagueId: string,
): Promise<{ fixtures: Fixture[]; unavailable?: boolean }> {
  const ext = await callExternal("/fixtures", { league: leagueId });
  if (!ext) return { fixtures: [], unavailable: true };
  return { fixtures: (ext as { fixtures?: Fixture[] }).fixtures ?? [] };
}

/**
 * Core detailed fetch (no auth / no persistence — the route handler adds those).
 * Returns null when the Python API is unconfigured or unreachable — callers must
 * surface that as an error, not fabricate a prediction.
 */
export async function fetchDetailed(data: {
  home: string;
  away: string;
  league: string;
  fixtureId: string;
  kickoff?: string;
}): Promise<DetailedPrediction | null> {
  const params: Record<string, string> = {
    league: data.league,
    home: data.home,
    away: data.away,
  };
  // Real match date, not when the prediction was requested — lets the Python
  // API's settlement job match this specific fixture to its actual result
  // instead of guessing by team names alone (see PredictionStore.settle()).
  if (data.kickoff) {
    const d = new Date(data.kickoff);
    if (!Number.isNaN(d.getTime())) {
      params.match_date = d.toISOString().slice(0, 10);
    }
  }
  const ext = await callExternal("/prediction/detailed", params);
  return ext as DetailedPrediction | null;
}

export async function getRecommendations(): Promise<{
  recommendations: Recommendation[];
  unavailable?: boolean;
}> {
  const ext = await callExternal("/recommendations", { limit: "500" });
  if (!ext) return { recommendations: [], unavailable: true };
  const all = (ext as { recommendations: Recommendation[] }).recommendations;
  const now = Date.now();
  return {
    // Defense-in-depth: the Python API's own "today only" filter is date-based
    // (not time-of-day), so it can still return fixtures that already kicked
    // off. Never recommend/allow picks on a match that's already started.
    recommendations: all.filter((r) => new Date(r.kickoff).getTime() > now),
  };
}

function emptyTierBucket() {
  return { settled: 0, correct: 0, success_rate: null, coverage: null };
}

function emptyInsights(): Insights {
  return {
    stats: {
      overall: { predictions: 0, settled: 0, pending: 0, correct: 0, success_rate: null, failure_rate: null },
      by_competition: {},
      by_source: {},
    },
    tiers: {
      threshold: 0.6,
      single: emptyTierBucket(),
      confident: emptyTierBucket(),
      double_chance: emptyTierBucket(),
    },
    calibration: [],
    recent: [],
  };
}

// Raw /insights shapes from the Python API (see app/store.py: calibration(), recent()) —
// field names differ from the Insights type, so getInsights() normalizes them below.
interface RawCalibrationBin {
  lo: number;
  hi: number;
  n: number;
  avg_confidence: number;
  hit_rate: number;
}
interface RawRecentRow {
  competition: string;
  home: string;
  away: string;
  pred: string;
  prob_home: number;
  prob_draw: number;
  prob_away: number;
  actual: string | null;
  correct: number | null;
  created_at: string;
  match_date: string | null;
  source: string;
}
interface RawInsights {
  stats: Insights["stats"];
  tiers: Insights["tiers"];
  calibration: RawCalibrationBin[];
  recent: RawRecentRow[];
}

export async function getInsights(): Promise<Insights & { unavailable?: boolean }> {
  const ext = await callExternal("/insights");
  if (!ext) return { ...emptyInsights(), unavailable: true };
  const raw = ext as RawInsights;
  return {
    stats: raw.stats,
    tiers: raw.tiers,
    calibration: raw.calibration.map((b) => ({
      label: `${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}%`,
      predicted: b.avg_confidence,
      actual: b.hit_rate,
      count: b.n,
    })),
    recent: raw.recent.map((r) => ({
      fixture: `${r.home} vs ${r.away}`,
      competition: r.competition,
      predicted_outcome: r.pred,
      confidence: Math.max(r.prob_home, r.prob_draw, r.prob_away),
      result: r.actual,
      correct: r.correct == null ? null : r.correct === 1,
      created_at: r.created_at,
      match_date: r.match_date,
      source: r.source,
    })),
  };
}

export async function getStats(): Promise<Stats & { unavailable?: boolean }> {
  const ext = await callExternal("/stats");
  if (ext) return ext as Stats;
  return {
    overall: { predictions: 0, settled: 0, pending: 0, correct: 0, success_rate: null, failure_rate: null },
    by_competition: {},
    unavailable: true,
  };
}
