import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export interface PredictionResult {
  fixture: string;
  league: string;
  predicted_outcome: string;
  confidence: number;
  probabilities: {
    "1X2": { home: number; draw: number; away: number };
    "BTTS": { yes: number; no: number };
    "Over/Under 2.5": { over: number; under: number };
  };
  summary: string;
}


// External Python API config — set PYTHON_API_URL and PYTHON_API_KEY as secrets later.
async function callExternal(path: string, params: Record<string, string> = {}): Promise<unknown | null> {
  const base = process.env.PYTHON_API_URL;
  const key = process.env.PYTHON_API_KEY;
  if (!base || !key) return null;
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { headers: { "x-api-key": key, "Content-Type": "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const LEAGUES = [
  { id: "epl", name: "Premier League", country: "England" },
  { id: "laliga", name: "La Liga", country: "Spain" },
  { id: "seriea", name: "Serie A", country: "Italy" },
  { id: "bundesliga", name: "Bundesliga", country: "Germany" },
  { id: "ligue1", name: "Ligue 1", country: "France" },
  { id: "ucl", name: "Champions League", country: "Europe" },
];

const MOCK_FIXTURES: Record<string, { id: string; home: string; away: string; kickoff: string }[]> = {
  epl: [
    { id: "epl-1", home: "Arsenal", away: "Chelsea", kickoff: new Date(Date.now() + 3600e3 * 4).toISOString() },
    { id: "epl-2", home: "Man City", away: "Liverpool", kickoff: new Date(Date.now() + 3600e3 * 6).toISOString() },
    { id: "epl-3", home: "Tottenham", away: "Newcastle", kickoff: new Date(Date.now() + 3600e3 * 8).toISOString() },
    { id: "epl-4", home: "Man Utd", away: "Aston Villa", kickoff: new Date(Date.now() + 3600e3 * 10).toISOString() },
  ],
  laliga: [
    { id: "la-1", home: "Real Madrid", away: "Barcelona", kickoff: new Date(Date.now() + 3600e3 * 5).toISOString() },
    { id: "la-2", home: "Atletico", away: "Sevilla", kickoff: new Date(Date.now() + 3600e3 * 7).toISOString() },
    { id: "la-3", home: "Villarreal", away: "Real Betis", kickoff: new Date(Date.now() + 3600e3 * 9).toISOString() },
  ],
  seriea: [
    { id: "sa-1", home: "Inter", away: "Milan", kickoff: new Date(Date.now() + 3600e3 * 5).toISOString() },
    { id: "sa-2", home: "Juventus", away: "Roma", kickoff: new Date(Date.now() + 3600e3 * 7).toISOString() },
    { id: "sa-3", home: "Napoli", away: "Lazio", kickoff: new Date(Date.now() + 3600e3 * 9).toISOString() },
  ],
  bundesliga: [
    { id: "bl-1", home: "Bayern", away: "Dortmund", kickoff: new Date(Date.now() + 3600e3 * 4).toISOString() },
    { id: "bl-2", home: "Leverkusen", away: "Leipzig", kickoff: new Date(Date.now() + 3600e3 * 6).toISOString() },
  ],
  ligue1: [
    { id: "l1-1", home: "PSG", away: "Marseille", kickoff: new Date(Date.now() + 3600e3 * 5).toISOString() },
    { id: "l1-2", home: "Monaco", away: "Lyon", kickoff: new Date(Date.now() + 3600e3 * 8).toISOString() },
  ],
  ucl: [
    { id: "ucl-1", home: "Real Madrid", away: "Man City", kickoff: new Date(Date.now() + 3600e3 * 24).toISOString() },
    { id: "ucl-2", home: "Bayern", away: "PSG", kickoff: new Date(Date.now() + 3600e3 * 26).toISOString() },
  ],
};

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000; };
}

export const getLeagues = createServerFn({ method: "GET" }).handler(async () => {
  const ext = await callExternal("/leagues");
  return { leagues: (ext as { leagues?: typeof LEAGUES } | null)?.leagues ?? LEAGUES };
});

export const getFixtures = createServerFn({ method: "GET" })
  .inputValidator((d: { leagueId: string }) => z.object({ leagueId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const ext = await callExternal("/fixtures", { league: data.leagueId });
    const fixtures = (ext as { fixtures?: typeof MOCK_FIXTURES.epl } | null)?.fixtures ?? MOCK_FIXTURES[data.leagueId] ?? [];
    return { fixtures };
  });

export const getPrediction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fixtureId: string; home: string; away: string; league: string }) =>
    z.object({ fixtureId: z.string(), home: z.string(), away: z.string(), league: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const ext = await callExternal("/prediction", { league: data.league, home: data.home, away: data.away });
    if (ext) return ext as PredictionResult;

    const rand = seededRandom(data.fixtureId);
    const homeProb = 0.3 + rand() * 0.45;
    const drawProb = 0.15 + rand() * 0.2;
    const awayProb = Math.max(0.05, 1 - homeProb - drawProb);
    const total = homeProb + drawProb + awayProb;
    const norm = (n: number) => Math.round((n / total) * 1000) / 10;
    const bttsYes = 40 + Math.round(rand() * 50);
    const over25 = 40 + Math.round(rand() * 55);
    const outcomes = { home: norm(homeProb), draw: norm(drawProb), away: norm(awayProb) };
    const top = outcomes.home > outcomes.away ? (outcomes.home > outcomes.draw ? "Home Win" : "Draw") : (outcomes.away > outcomes.draw ? "Away Win" : "Draw");
    const confidence = Math.max(outcomes.home, outcomes.draw, outcomes.away);

    // log activity
    try {
      await context.supabase.from("user_activity").insert({
        user_id: context.userId,
        activity_type: "prediction_view",
        meta: { fixtureId: data.fixtureId, home: data.home, away: data.away, league: data.league },
      });
    } catch {}

    return {
      fixture: `${data.home} vs ${data.away}`,
      league: data.league,
      predicted_outcome: top,
      confidence,
      probabilities: {
        "1X2": outcomes,
        "BTTS": { yes: bttsYes, no: 100 - bttsYes },
        "Over/Under 2.5": { over: over25, under: 100 - over25 },
      },
      summary: `${data.home} enter this match in ${rand() > 0.5 ? "excellent" : "decent"} form (${Math.round(rand() * 3) + 2}W-${Math.round(rand() * 2)}D-${Math.round(rand() * 2)}L in last 5). Recent H2H favors ${outcomes.home > outcomes.away ? data.home : data.away}, with an average of ${(2 + rand() * 1.5).toFixed(1)} goals per game.`,
    };
  });

// --------------------------------------------------------------------------- //
// Detailed prediction — the full payload behind the "More Info" page. Fields
// mirror the FastAPI /prediction/detailed response (probabilities are 0..1
// floats here, unlike the compact card's 0..100). Learned-model-only sections
// (reasoning, factors, edge) are optional and absent for Poisson competitions.
// --------------------------------------------------------------------------- //
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface Outcome3 { home_win: number; draw: number; away_win: number }
export interface TeamForm { elo: number; form: string; ppg: number; gf: number; ga: number }
export interface FactorRow { label: string; home: number | string; away: number | string; fmt: string; better: string }
export interface FactorGroup { group: string; rows: FactorRow[] }
export interface H2HMeeting { date: string; year: string | null; home: string; away: string; home_goals: number; away_goals: number; winner: string | null }

export interface DetailedPrediction {
  competition: string;
  home_team: string;
  away_team: string;
  method: string;
  outcomes: Outcome3;
  model_outcomes?: Outcome3 | null;
  market_outcomes?: Outcome3 | null;
  confidence: number;               // 0..1
  confident: boolean;
  double_chance: { outcomes: string[]; label: string; probability: number };
  expected_goals: { home: number; away: number };
  goal_markets: Record<string, number>;   // over_0.5 / under_0.5 / ... 0..1
  btts: { yes: number; no: number };
  top_scores: { home: number; away: number; probability: number }[];
  most_likely_score: { home: number; away: number; probability: number };
  score_matrix: number[][];         // 6x6, 0..1
  form?: { home: TeamForm; away: TeamForm };
  reasoning?: string[];
  factors?: { compare: FactorGroup[]; context: string[]; probabilities: Record<string, JsonValue> };
  head_to_head: { count: number; home_wins?: number; away_wins?: number; draws?: number; first_year?: string | null; last_year?: string | null; meetings: H2HMeeting[] };
  is_cup: boolean;
  knockout?: { home_advance: number; away_advance: number; tiebreak_home: number };
  edge?: { by_outcome: Record<string, number>; best_outcome: string; best_edge: number; value: boolean };
  weather?: { temp_c: number | string | null; precip_mm: number | string | null; wind_kph: number | string | null } | null;
  simple: PredictionResult;
}

function poissonPmf(k: number, lam: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lam) * Math.pow(lam, k)) / fact;
}
function poissonCol(lam: number, max: number): number[] {
  return Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, lam));
}

/** A Poisson-grid mock so the More Info page renders in dev without the Python
 * API. Replaced entirely by the real payload once PYTHON_API_URL is set. */
function mockDetailed(data: { home: string; away: string; league: string; fixtureId: string }): DetailedPrediction {
  const rand = seededRandom(data.fixtureId + "d");
  const hp = 0.3 + rand() * 0.45, dp = 0.15 + rand() * 0.2;
  const ap = Math.max(0.05, 1 - hp - dp);
  const t = hp + dp + ap;
  const outcomes: Outcome3 = { home_win: hp / t, draw: dp / t, away_win: ap / t };
  const homeXg = 0.8 + rand() * 1.8, awayXg = 0.6 + rand() * 1.5;

  const MAX = 10, hc = poissonCol(homeXg, MAX), ac = poissonCol(awayXg, MAX);
  const lines = [0.5, 1.5, 2.5, 3.5];
  const over: Record<number, number> = { 0.5: 0, 1.5: 0, 2.5: 0, 3.5: 0 };
  let bttsYes = 0, total = 0;
  const scores: { home: number; away: number; probability: number }[] = [];
  const matrix: number[][] = [];
  for (let i = 0; i <= MAX; i++) {
    const row: number[] = [];
    for (let j = 0; j <= MAX; j++) {
      const p = hc[i] * ac[j];
      row.push(p); total += p;
      if (i > 0 && j > 0) bttsYes += p;
      for (const l of lines) if (i + j > l) over[l] += p;
      if (i <= 6 && j <= 6) scores.push({ home: i, away: j, probability: p });
    }
    matrix.push(row);
  }
  const goal_markets: Record<string, number> = {};
  for (const l of lines) { goal_markets[`over_${l}`] = over[l] / total; goal_markets[`under_${l}`] = 1 - over[l] / total; }
  scores.sort((a, b) => b.probability - a.probability);
  const top_scores = scores.slice(0, 5).map((s) => ({ ...s, probability: s.probability / total }));
  const score_matrix = matrix.slice(0, 6).map((r) => r.slice(0, 6).map((p) => p / total));

  const ranked = (Object.entries(outcomes) as [keyof Outcome3, number][]).sort((a, b) => b[1] - a[1]);
  const label: Record<string, string> = { home_win: "Home Win", draw: "Draw", away_win: "Away Win" };
  const dcMap: Record<string, string> = { "home_win,draw": "home_or_draw", "draw,home_win": "home_or_draw", "home_win,away_win": "home_or_away", "away_win,home_win": "home_or_away", "draw,away_win": "draw_or_away", "away_win,draw": "draw_or_away" };
  const top2 = [ranked[0][0], ranked[1][0]];

  return {
    competition: data.league, home_team: data.home, away_team: data.away, method: "mock",
    outcomes, model_outcomes: null, market_outcomes: null,
    confidence: ranked[0][1], confident: ranked[0][1] >= 0.6,
    double_chance: { outcomes: top2, label: dcMap[top2.join(",")] ?? "home_or_draw", probability: ranked[0][1] + ranked[1][1] },
    expected_goals: { home: homeXg, away: awayXg },
    goal_markets, btts: { yes: bttsYes / total, no: 1 - bttsYes / total },
    top_scores, most_likely_score: top_scores[0], score_matrix,
    form: {
      home: { elo: 1500 + Math.round(rand() * 200), form: "WWDLW", ppg: +(1 + rand() * 1.5).toFixed(2), gf: +(1 + rand()).toFixed(2), ga: +(0.8 + rand()).toFixed(2) },
      away: { elo: 1500 + Math.round(rand() * 200), form: "LWDWL", ppg: +(1 + rand() * 1.5).toFixed(2), gf: +(1 + rand()).toFixed(2), ga: +(0.8 + rand()).toFixed(2) },
    },
    reasoning: [
      `${label[ranked[0][0]]} favoured at ${(ranked[0][1] * 100).toFixed(0)}%.`,
      `Expected goals ${data.home} ${homeXg.toFixed(2)} — ${data.away} ${awayXg.toFixed(2)}.`,
      "Mock data — set PYTHON_API_URL to use the real model.",
    ],
    head_to_head: { count: 0, meetings: [] },
    is_cup: false,
    simple: {
      fixture: `${data.home} vs ${data.away}`, league: data.league,
      predicted_outcome: label[ranked[0][0]], confidence: Math.round(ranked[0][1] * 100),
      probabilities: {
        "1X2": { home: +(outcomes.home_win * 100).toFixed(1), draw: +(outcomes.draw * 100).toFixed(1), away: +(outcomes.away_win * 100).toFixed(1) },
        BTTS: { yes: +((bttsYes / total) * 100).toFixed(1), no: +((1 - bttsYes / total) * 100).toFixed(1) },
        "Over/Under 2.5": { over: +(goal_markets["over_2.5"] * 100).toFixed(1), under: +(goal_markets["under_2.5"] * 100).toFixed(1) },
      },
      summary: `${data.home} vs ${data.away}: ${label[ranked[0][0]]} is the model's pick.`,
    },
  };
}

export const getPredictionDetailed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fixtureId: string; home: string; away: string; league: string }) =>
    z.object({ fixtureId: z.string(), home: z.string(), away: z.string(), league: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    // Count the view whether or not the external API is used, so the daily limit
    // stays accurate.
    try {
      await context.supabase.from("user_activity").insert({
        user_id: context.userId,
        activity_type: "prediction_view",
        meta: { fixtureId: data.fixtureId, home: data.home, away: data.away, league: data.league },
      });
    } catch {}
    const ext = await callExternal("/prediction/detailed", { league: data.league, home: data.home, away: data.away });
    const result = (ext as DetailedPrediction | null) ?? mockDetailed(data);

    // Persist to the user's prediction history (RLS scopes the row to them), so
    // it loads on sign-in. Storage must never break a prediction.
    try {
      await context.supabase.from("user_predictions").insert({
        user_id: context.userId,
        competition: result.competition,
        home_team: result.home_team,
        away_team: result.away_team,
        fixture: result.simple.fixture,
        predicted_outcome: result.simple.predicted_outcome,
        confidence: result.simple.confidence,
        method: result.method,
        payload: result as unknown as Json,
      });
    } catch {}
    return result;
  });

// --------------------------------------------------------------------------- //
// Today's recommendations (dashboard). One row per market per fixture; each
// market tab is a leaderboard sorted by confidence. Shape mirrors the FastAPI
// /recommendations rows so the dashboard can group by `market` unchanged.
// --------------------------------------------------------------------------- //
export interface Recommendation {
  id: string;
  fixture: string;
  league: string;
  kickoff: string;
  market: string;
  pick: string;
  confidence: number;   // 0..100
  odds: number;         // model-fair decimal odds
}

const REC_MARKETS = ["Home Win", "Away Win", "Draw", "BTTS", "Over 1.5", "Over 2.5"] as const;

function mockRecommendations(): Recommendation[] {
  const out: Recommendation[] = [];
  for (const [id, fxs] of Object.entries(MOCK_FIXTURES)) {
    const league = LEAGUES.find((l) => l.id === id)?.name ?? id;
    for (const fx of fxs) {
      const rand = seededRandom(fx.id + "rec");
      const spec: Record<string, { pick: string; p: number }> = {
        "Home Win": { pick: fx.home, p: 0.3 + rand() * 0.4 },
        "Away Win": { pick: fx.away, p: 0.2 + rand() * 0.35 },
        "Draw": { pick: "Draw", p: 0.18 + rand() * 0.15 },
        "BTTS": { pick: "Yes", p: 0.4 + rand() * 0.4 },
        "Over 1.5": { pick: "Over 1.5", p: 0.6 + rand() * 0.35 },
        "Over 2.5": { pick: "Over 2.5", p: 0.4 + rand() * 0.45 },
      };
      for (const m of REC_MARKETS) {
        const { pick, p } = spec[m];
        out.push({
          id: `${fx.id}|${m}`, fixture: `${fx.home} vs ${fx.away}`, league,
          kickoff: fx.kickoff, market: m, pick,
          confidence: Math.round(p * 100), odds: Math.round((1 / p) * 100) / 100,
        });
      }
    }
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}

export const getRecommendations = createServerFn({ method: "GET" }).handler(async () => {
  const ext = await callExternal("/recommendations", { limit: "500" });
  if (ext) return (ext as { recommendations: Recommendation[] }).recommendations;
  return mockRecommendations();
});

// --------------------------------------------------------------------------- //
// Track record (dashboard stat cards). Mirrors the FastAPI /stats response.
// `success_rate` is a 0..1 fraction — the model's out-of-sample accuracy over
// every settled prediction, not an individual user's followed-tips rate.
// --------------------------------------------------------------------------- //
export interface StatsBucket {
  predictions: number;
  settled: number;
  pending: number;
  correct: number;
  success_rate: number;   // 0..1
  failure_rate: number;
}
export interface Stats {
  overall: StatsBucket;
  by_competition: Record<string, StatsBucket>;
}

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const ext = await callExternal("/stats");
  if (ext) return ext as Stats;
  // Mock: the honest ~54.5% out-of-sample ceiling.
  return {
    overall: { predictions: 0, settled: 0, pending: 0, correct: 0, success_rate: 0.545, failure_rate: 0.455 },
    by_competition: {},
  } satisfies Stats;
});
