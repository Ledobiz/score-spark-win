export const STATUS_OPTIONS = ["trialing", "active", "cancelled", "expired"] as const;

export async function json<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function fmt(d: string | null | undefined) {
  return d ? new Date(d).toLocaleString() : "—";
}

export function fmtNgn(amountNgn: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountNgn);
}
