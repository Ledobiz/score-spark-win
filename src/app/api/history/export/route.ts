import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/server";
import { loadEntitlement } from "@/lib/entitlement";
import { loadHistory } from "@/lib/history";

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/**
 * Auth-required CSV export of the user's history. Paid feature — the gate is
 * enforced HERE (not just a disabled button), so a free user hitting the URL
 * directly gets 403. Scoped by userId.
 */
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entitlement } = await loadEntitlement(user.id);
  if (!entitlement.canExportHistory) {
    return NextResponse.json(
      { error: "CSV export is a paid feature." },
      { status: 403 },
    );
  }

  const rows = await loadHistory(user.id);
  const header = ["Fixture", "League", "Predicted", "Confidence", "Date", "Result"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.fixture,
        r.competition,
        r.predictedOutcome ?? "",
        r.confidence != null ? String(r.confidence) : "",
        r.createdAt,
        r.result ?? "Pending",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="prediction-history.csv"',
    },
  });
}
