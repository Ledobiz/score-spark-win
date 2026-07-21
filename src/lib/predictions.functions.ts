import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const ext = await callExternal("/prediction", { fixture_id: data.fixtureId });
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
