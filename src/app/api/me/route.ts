import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

// Auth-required — lightweight identity + admin flag for the app shell.
export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminRole = await prisma.userRole.findFirst({
    where: { userId: user.id, role: "admin" },
    select: { id: true },
  });
  return NextResponse.json({
    userId: user.id,
    email: user.email ?? null,
    isAdmin: Boolean(adminRole),
  });
}
