import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import disposableDomains from "disposable-email-domains";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import { resolveReferrer } from "@/lib/referrals";

const DISPOSABLE_DOMAINS = new Set(disposableDomains);

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  ageConfirmed: z.literal(true),
  referralCode: z.string().optional(),
});

/**
 * Creates the account directly in `profiles` (no separate auth.users, no
 * email-verification gate — there's no email provider wired up yet, so
 * verification can't be enforced without locking everyone out).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { fullName, ageConfirmed } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  const domain = email.split("@")[1];
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    return NextResponse.json(
      { error: "Please use a permanent email address" },
      { status: 400 },
    );
  }

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const referredById = parsed.data.referralCode
    ? await resolveReferrer(parsed.data.referralCode)
    : null;

  const profile = await prisma.profile.create({
    data: {
      email,
      passwordHash,
      fullName,
      ageConfirmed,
      emailVerified: new Date(),
      ...(referredById ? { referredById } : {}),
    },
  });

  await sendWelcomeEmail(profile.id);

  return NextResponse.json({ ok: true });
}
