import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, listPredictionHistory, toCsv } from "@/lib/admin";

const querySchema = z.object({
  userEmail: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  export: z.enum(["csv"]).optional(),
});

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userEmail: searchParams.get("userEmail") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    export: searchParams.get("export") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { userEmail, from, to, page, export: exportFormat } = parsed.data;
  const pageSize = exportFormat === "csv" ? 5000 : parsed.data.pageSize;

  const { rows, total } = await listPredictionHistory({
    userEmail,
    from,
    to,
    page,
    pageSize,
  });

  if (exportFormat === "csv") {
    const csv = toCsv(rows, [
      { key: "userEmail", header: "User" },
      { key: "fixture", header: "Fixture" },
      { key: "competition", header: "Competition" },
      { key: "predictedOutcome", header: "Predicted" },
      { key: "confidence", header: "Confidence" },
      { key: "result", header: "Result" },
      { key: "createdAt", header: "Created At" },
    ]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="prediction-history.csv"`,
      },
    });
  }

  return NextResponse.json({ rows, total, page, pageSize });
}
