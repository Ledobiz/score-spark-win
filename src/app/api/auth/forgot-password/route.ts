import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmailHtml } from "@/lib/email-templates";

const schema = z.object({ email: z.string().email() });
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Issues a password-reset token and emails the reset link via Resend.
 * Always responds success (no user enumeration) even if the email doesn't
 * exist, and even if the send itself fails (failure is logged server-side).
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
    const appUrl = new URL(request.url).origin;
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const result = await sendEmail({
      to: email,
      subject: "Reset your SHUZAM password",
      html: resetPasswordEmailHtml(resetUrl, appUrl),
    });
    if (!result.ok) {
      console.error(`[password-reset] failed to email ${email}: ${result.error}`);
    }
  }

  return NextResponse.json({ ok: true });
}
