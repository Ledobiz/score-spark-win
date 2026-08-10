import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { welcomeEmailHtml } from "@/lib/email-templates";
import { loadEntitlement } from "@/lib/entitlement";

/**
 * Fires once, right after a new profile is created (credentials register or
 * first Google sign-in) — never on returning logins. Picks the "subscribe"
 * vs. "here's what you can do" variant off the same entitlement check every
 * other part of the app uses, so it stays correct if the signup flow ever
 * changes to provision a plan earlier.
 */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });
  if (!profile?.email) return;

  const { entitlement } = await loadEntitlement(userId);

  const result = await sendEmail({
    to: profile.email,
    subject: "Welcome to SHUZAM",
    html: welcomeEmailHtml(
      { fullName: profile.fullName, isSubscribed: entitlement.isActive },
      appUrl,
    ),
  });
  if (!result.ok) {
    console.error(`[welcome-email] failed to email ${profile.email}: ${result.error}`);
  }
}
