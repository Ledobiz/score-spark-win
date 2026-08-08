import "server-only";
import type {
  DetailedPrediction,
  Fixture,
  Insights,
  League,
  Outcome3,
  PredictionResult,
  Recommendation,
  Stats,
} from "./types";

/**
 * Server-to-server call to the Python FastAPI service. Adds the secret x-api-key
 * (never NEXT_PUBLIC). Returns null when the API is unconfigured or errors, so
 * callers fall back to the dev mocks.
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

const LEAGUES: League[] = [
  { id: "epl", name: "Premier League", country: "England" },
  { id: "laliga", name: "La Liga", country: "Spain" },
  { id: "seriea", name: "Serie A", country: "Italy" },
  { id: "bundesliga", name: "Bundesliga", country: "Germany" },
  { id: "ligue1", name: "Ligue 1", country: "France" },
  { id: "ucl", name: "Champions League", country: "Europe" },
];

const MOCK_FIXTURES: Record<string, Fixture[]> = {
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
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export async function getLeagues(): Promise<{ leagues: League[] }> {
  const ext = await callExternal("/leagues");
  return { leagues: (ext as { leagues?: League[] } | null)?.leagues ?? LEAGUES };
}

export async function getFixtures(leagueId: string): Promise<{ fixtures: Fixture[] }> {
  const ext = await callExternal("/fixtures", { league: leagueId });
  const fixtures =
    (ext as { fixtures?: Fixture[] } | null)?.fixtures ??
    MOCK_FIXTURES[leagueId] ??
    [];
  return { fixtures };
}

function poissonPmf(k: number, lam: number): number {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.exp(-lam) * Math.pow(lam, k)) / fact;
}
function poissonCol(lam: number, max: number): number[] {
  return Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, lam));
}

/** Poisson-grid mock so the detail page renders in dev without the Python API. */
export function mockDetailed(data: {
  home: string;
  away: string;
  league: string;
  fixtureId: string;
}): DetailedPrediction {
  const rand = seededRandom(data.fixtureId + "d");
  const hp = 0.3 + rand() * 0.45,
    dp = 0.15 + rand() * 0.2;
  const ap = Math.max(0.05, 1 - hp - dp);
  const t = hp + dp + ap;
  const outcomes: Outcome3 = { home_win: hp / t, draw: dp / t, away_win: ap / t };
  const homeXg = 0.8 + rand() * 1.8,
    awayXg = 0.6 + rand() * 1.5;

  const MAX = 10,
    hc = poissonCol(homeXg, MAX),
    ac = poissonCol(awayXg, MAX);
  const lines = [0.5, 1.5, 2.5, 3.5];
  const over: Record<number, number> = { 0.5: 0, 1.5: 0, 2.5: 0, 3.5: 0 };
  let bttsYes = 0,
    total = 0;
  const scores: { home: number; away: number; probability: number }[] = [];
  const matrix: number[][] = [];
  for (let i = 0; i <= MAX; i++) {
    const row: number[] = [];
    for (let j = 0; j <= MAX; j++) {
      const p = hc[i] * ac[j];
      row.push(p);
      total += p;
      if (i > 0 && j > 0) bttsYes += p;
      for (const l of lines) if (i + j > l) over[l] += p;
      if (i <= 6 && j <= 6) scores.push({ home: i, away: j, probability: p });
    }
    matrix.push(row);
  }
  const goal_markets: Record<string, number> = {};
  for (const l of lines) {
    goal_markets[`over_${l}`] = over[l] / total;
    goal_markets[`under_${l}`] = 1 - over[l] / total;
  }
  scores.sort((a, b) => b.probability - a.probability);
  const top_scores = scores.slice(0, 5).map((s) => ({ ...s, probability: s.probability / total }));
  const score_matrix = matrix.slice(0, 6).map((r) => r.slice(0, 6).map((p) => p / total));

  const ranked = (Object.entries(outcomes) as [keyof Outcome3, number][]).sort((a, b) => b[1] - a[1]);
  const label: Record<string, string> = { home_win: "Home Win", draw: "Draw", away_win: "Away Win" };
  const dcMap: Record<string, string> = {
    "home_win,draw": "home_or_draw",
    "draw,home_win": "home_or_draw",
    "home_win,away_win": "home_or_away",
    "away_win,home_win": "home_or_away",
    "draw,away_win": "draw_or_away",
    "away_win,draw": "draw_or_away",
  };
  const top2 = [ranked[0][0], ranked[1][0]];

  return {
    competition: data.league,
    home_team: data.home,
    away_team: data.away,
    method: "mock",
    outcomes,
    model_outcomes: null,
    market_outcomes: null,
    confidence: ranked[0][1],
    confident: ranked[0][1] >= 0.6,
    double_chance: {
      outcomes: top2,
      label: dcMap[top2.join(",")] ?? "home_or_draw",
      probability: ranked[0][1] + ranked[1][1],
    },
    expected_goals: { home: homeXg, away: awayXg },
    goal_markets,
    btts: { yes: bttsYes / total, no: 1 - bttsYes / total },
    top_scores,
    most_likely_score: top_scores[0],
    score_matrix,
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
      fixture: `${data.home} vs ${data.away}`,
      league: data.league,
      predicted_outcome: label[ranked[0][0]],
      confidence: Math.round(ranked[0][1] * 100),
      probabilities: {
        "1X2": {
          home: +(outcomes.home_win * 100).toFixed(1),
          draw: +(outcomes.draw * 100).toFixed(1),
          away: +(outcomes.away_win * 100).toFixed(1),
        },
        BTTS: { yes: +((bttsYes / total) * 100).toFixed(1), no: +((1 - bttsYes / total) * 100).toFixed(1) },
        "Over/Under 2.5": {
          over: +(goal_markets["over_2.5"] * 100).toFixed(1),
          under: +(goal_markets["under_2.5"] * 100).toFixed(1),
        },
      },
      summary: `${data.home} vs ${data.away}: ${label[ranked[0][0]]} is the model's pick.`,
    },
  };
}

/** Core detailed fetch (no auth / no persistence — the route handler adds those). */
export async function fetchDetailed(data: {
  home: string;
  away: string;
  league: string;
  fixtureId: string;
}): Promise<DetailedPrediction> {
  const ext = await callExternal("/prediction/detailed", {
    league: data.league,
    home: data.home,
    away: data.away,
  });
  return (ext as DetailedPrediction | null) ?? mockDetailed(data);
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
        Draw: { pick: "Draw", p: 0.18 + rand() * 0.15 },
        BTTS: { pick: "Yes", p: 0.4 + rand() * 0.4 },
        "Over 1.5": { pick: "Over 1.5", p: 0.6 + rand() * 0.35 },
        "Over 2.5": { pick: "Over 2.5", p: 0.4 + rand() * 0.45 },
      };
      for (const m of REC_MARKETS) {
        const { pick, p } = spec[m];
        out.push({
          id: `${fx.id}|${m}`,
          fixture: `${fx.home} vs ${fx.away}`,
          league,
          kickoff: fx.kickoff,
          market: m,
          pick,
          confidence: Math.round(p * 100),
          odds: Math.round((1 / p) * 100) / 100,
          synthetic: true,
        });
      }
    }
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const ext = await callExternal("/recommendations", { limit: "500" });
  if (ext) return (ext as { recommendations: Recommendation[] }).recommendations;
  return mockRecommendations();
}

function emptyTierBucket() {
  return { settled: 0, correct: 0, success_rate: null, coverage: null };
}

function mockInsights(): Insights {
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

export async function getInsights(): Promise<Insights> {
  const ext = await callExternal("/insights");
  return (ext as Insights | null) ?? mockInsights();
}

export async function getStats(): Promise<Stats> {
  const ext = await callExternal("/stats");
  if (ext) return ext as Stats;
  // Mock: the honest ~54.5% out-of-sample ceiling (CLAUDE.md §7).
  return {
    overall: { predictions: 0, settled: 0, pending: 0, correct: 0, success_rate: 0.545, failure_rate: 0.455 },
    by_competition: {},
  };
}
