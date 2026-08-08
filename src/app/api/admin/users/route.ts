import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, listUsers, createUserByAdmin, toCsv } from "@/lib/admin";

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1).optional(),
  password: z.string().min(8).optional(),
  planId: z.string().optional(),
  startTrial: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const users = await listUsers();

  if (new URL(request.url).searchParams.get("export") === "csv") {
    const csv = toCsv(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        createdAt: u.createdAt,
        plan: u.subscription?.planId ?? "",
        status: u.subscription?.status ?? "",
        roles: u.roles.join("|"),
      })),
      [
        { key: "id", header: "ID" },
        { key: "email", header: "Email" },
        { key: "fullName", header: "Full Name" },
        { key: "createdAt", header: "Created At" },
        { key: "plan", header: "Plan" },
        { key: "status", header: "Subscription Status" },
        { key: "roles", header: "Roles" },
      ],
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users.csv"`,
      },
    });
  }

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const result = await createUserByAdmin(guard.userId, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
