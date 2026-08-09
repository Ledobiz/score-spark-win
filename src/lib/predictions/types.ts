// Shared prediction types — safe to import from client components (type-only).
// Mirrors the FastAPI contract (see CLAUDE.md §3).

export interface League {
  id: string;
  name: string;
  country: string;
}

export interface Fixture {
  id: string;
  home: string;
  away: string;
  kickoff: string;
}

/** Compact card shape — /prediction and the embedded `simple` block. 0..100. */
export interface PredictionResult {
  fixture: string;
  league: string;
  predicted_outcome: string;
  confidence: number;
  probabilities: {
    "1X2": { home: number; draw: number; away: number };
    BTTS: { yes: number; no: number };
    "Over/Under 2.5": { over: number; under: number };
  };
  summary: string;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface Outcome3 {
  home_win: number;
  draw: number;
  away_win: number;
}
export interface TeamForm {
  elo: number;
  form: string;
  ppg: number;
  gf: number;
  ga: number;
}
export interface FactorRow {
  label: string;
  home: number | string;
  away: number | string;
  fmt: string;
  better: string;
}
export interface FactorGroup {
  group: string;
  rows: FactorRow[];
}
export interface H2HMeeting {
  date: string;
  year: string | null;
  home: string;
  away: string;
  home_goals: number;
  away_goals: number;
  winner: string | null;
}

/** Full /prediction/detailed payload. Probabilities are 0..1 fractions here. */
export interface DetailedPrediction {
  competition: string;
  home_team: string;
  away_team: string;
  method: string;
  outcomes: Outcome3;
  model_outcomes?: Outcome3 | null;
  market_outcomes?: Outcome3 | null;
  confidence: number; // 0..1
  confident: boolean;
  double_chance: { outcomes: string[]; label: string; probability: number };
  expected_goals: { home: number; away: number };
  goal_markets: Record<string, number>; // over_0.5 / under_0.5 / ... 0..1
  btts: { yes: number; no: number };
  top_scores: { home: number; away: number; probability: number }[];
  most_likely_score: { home: number; away: number; probability: number };
  score_matrix: number[][]; // 6x6, 0..1
  form?: { home: TeamForm; away: TeamForm };
  reasoning?: string[];
  factors?: {
    compare: FactorGroup[];
    context: string[];
    probabilities: Record<string, JsonValue>;
  };
  head_to_head: {
    count: number;
    home_wins?: number;
    away_wins?: number;
    draws?: number;
    first_year?: string | null;
    last_year?: string | null;
    meetings: H2HMeeting[];
  };
  is_cup: boolean;
  knockout?: {
    home_advance: number;
    away_advance: number;
    tiebreak_home: number;
  };
  edge?: {
    by_outcome: Record<string, number>;
    best_outcome: string;
    best_edge: number;
    value: boolean;
  };
  weather?: {
    temp_c: number | string | null;
    precip_mm: number | string | null;
    wind_kph: number | string | null;
  } | null;
  simple: PredictionResult;
}

export interface Recommendation {
  id: string;
  fixture: string;
  league: string;
  kickoff: string;
  market: string;
  pick: string;
  confidence: number; // 0..100
  odds: number;
  synthetic?: boolean;
}

export interface StatsBucket {
  predictions: number;
  settled: number;
  pending: number;
  correct: number;
  success_rate: number | null; // 0..1, null until any prediction settles
  failure_rate: number | null;
}
export interface Stats {
  overall: StatsBucket;
  by_competition: Record<string, StatsBucket>;
  by_source?: Record<string, StatsBucket>;
  tiers?: Tiers;
  /** true when the Python prediction API couldn't be reached — never a fabricated stat. */
  unavailable?: boolean;
}

/** Confidence-tier track record — the core honest-value story (CLAUDE.md §7). */
export interface TierBucket {
  settled: number;
  correct: number;
  success_rate: number | null; // 0..1
  coverage: number | null; // share of predictions that fell in this tier, 0..1
}
export interface Tiers {
  threshold: number; // confidence cutoff for "confident" (e.g. 0.6)
  single: TierBucket;
  confident: TierBucket;
  double_chance: TierBucket;
}

/** One confidence-calibration bin (normalized from /insights in getInsights()). */
export interface CalibrationBin {
  label: string; // e.g. "60–70%"
  predicted: number; // avg predicted confidence in the bin, 0..1
  actual: number; // observed hit rate in the bin, 0..1
  count: number;
}

/** One recently settled prediction (normalized from /insights in getInsights()). */
export interface RecentPrediction {
  fixture: string;
  competition: string;
  predicted_outcome: string;
  confidence: number; // 0..1
  result: string | null;
  correct: boolean | null;
  created_at: string;
  /** Date the match was actually played, e.g. "2025-10-31" — distinct from
   * created_at, which is when this row was (re)written to the DB and can be
   * far more recent than the match itself for backtest-sourced rows. */
  match_date: string | null;
  /** "backtest" / "provider_backtest" rows are historical out-of-sample
   * validation, not a live result the platform just settled. */
  source: string;
}

export interface Insights {
  stats: {
    overall: StatsBucket;
    by_competition: Record<string, StatsBucket>;
    by_source?: Record<string, StatsBucket>;
  };
  tiers: Tiers;
  calibration: CalibrationBin[];
  recent: RecentPrediction[];
  /** true when the Python prediction API couldn't be reached — data below is all-zero, not fabricated. */
  unavailable?: boolean;
}
