import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export interface WatchlistItem {
  id: string;
  entityType: string;
  entityName: string;
  createdAt: string;
}

// GET — the user's watchlist (scoped by userId).
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.watchlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const items: WatchlistItem[] = rows.map((r) => ({
    id: r.id,
    entityType: r.entityType,
    entityName: r.entityName,
    createdAt: r.createdAt.toISOString(),
  }));
  return NextResponse.json({ items });
}

const addSchema = z.object({
  entityType: z.enum(["team", "league"]),
  entityName: z.string().min(1).max(120),
});

// POST — add an entry (idempotent on the unique [userId, type, name]).
export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { entityType, entityName } = parsed.data;
  await prisma.watchlist.upsert({
    where: {
      userId_entityType_entityName: {
        userId: user.id,
        entityType,
        entityName: entityName.trim(),
      },
    },
    create: { userId: user.id, entityType, entityName: entityName.trim() },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

// DELETE — remove one of the user's entries by id (?id=). Scoped by userId so a
// user can only delete their own rows.
export async function DELETE(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await prisma.watchlist.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
