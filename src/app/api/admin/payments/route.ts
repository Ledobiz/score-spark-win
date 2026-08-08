import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, listPayments, toCsv } from "@/lib/admin";

const querySchema = z.object({
  status: z.string().optional(),
  provider: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  export: z.enum(["csv"]).optional(),
});

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    provider: searchParams.get("provider") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    export: searchParams.get("export") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { status, provider, page, export: exportFormat } = parsed.data;
  const pageSize = exportFormat === "csv" ? 5000 : parsed.data.pageSize;

  const { rows, total } = await listPayments({ status, provider, page, pageSize });

  if (exportFormat === "csv") {
    const csv = toCsv(rows, [
      { key: "reference", header: "Reference" },
      { key: "userEmail", header: "User" },
      { key: "planName", header: "Plan" },
      { key: "provider", header: "Provider" },
      { key: "amountNgn", header: "Amount (NGN)" },
      { key: "status", header: "Status" },
      { key: "createdAt", header: "Created At" },
    ]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payments.csv"`,
      },
    });
  }

  return NextResponse.json({ rows, total, page, pageSize });
}
