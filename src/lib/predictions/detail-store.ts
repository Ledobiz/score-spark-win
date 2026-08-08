import type { DetailedPrediction } from "./types";

// Hands the full detailed payload from the predictions flow to the detail page
// across a client navigation, without re-fetching (which would double-count the
// view and re-persist history). Survives refresh; cleared when the tab closes.
const DETAIL_KEY = "predictscore:detailed";

export function stashDetailed(d: DetailedPrediction) {
  try {
    sessionStorage.setItem(DETAIL_KEY, JSON.stringify(d));
  } catch {
    // storage unavailable — the detail page will show its empty state
  }
}

export function readDetailed(): DetailedPrediction | null {
  try {
    const s = sessionStorage.getItem(DETAIL_KEY);
    return s ? (JSON.parse(s) as DetailedPrediction) : null;
  } catch {
    return null;
  }
}
