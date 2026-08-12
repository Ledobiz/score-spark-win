import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The Python API's `odds` field is typed as `number` but occasionally comes
 * back null for a market it couldn't price — guard every display site. */
export function formatOdds(odds: number | null | undefined): string {
  return odds != null ? odds.toFixed(2) : "—";
}
