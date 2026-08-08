import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Issues a password-reset token. Always responds success (no user
 * enumeration) even if the email doesn't exist.
 *
 * NOTE: there's no transactional-email provider wired up yet, so the reset
 * link isn't actually emailed — it's logged server-side. Wire up a provider
 * (e.g. Resend) and send `resetUrl` by email before relying on this in
 * production.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const profile = await prisma.profile.findUnique({ where: { email } });
  if (profile) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: profile.id,
        token,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;
    console.log(`[password-reset] ${email} -> ${resetUrl}`);
  }

  return NextResponse.json({ ok: true });
}
