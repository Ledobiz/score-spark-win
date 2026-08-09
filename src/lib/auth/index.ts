import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Exchanges a Google Identity Services authorization code (obtained
 * client-side via the popup `initCodeClient` flow — see src/app/auth/page.tsx)
 * for tokens, then verifies the id_token's signature/audience via Google's
 * tokeninfo endpoint. `redirect_uri: "postmessage"` is a reserved value Google
 * recognizes for JS-popup code exchanges — no redirect URI registration
 * needed in the Cloud Console beyond the existing OAuth client.
 */
async function verifyGoogleCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Both calls hit Google directly with no retry layer in front of them, so a
  // slow/unresponsive response must not hang authorize() forever — that would
  // leave the client's "Signing you in…" screen spinning indefinitely with no
  // way to fail. 10s is generous for two small round-trips to Google.
  let tokenRes: Response;
  let infoRes: Response;
  try {
    tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return null;
  }
  if (!tokenRes.ok) return null;
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return null;

  try {
    infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
  } catch {
    return null;
  }
  if (!infoRes.ok) return null;
  const info = (await infoRes.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  };
  if (
    info.aud !== clientId ||
    !info.email ||
    String(info.email_verified) !== "true"
  ) {
    return null;
  }
  return { email: info.email.trim().toLowerCase(), name: info.name, picture: info.picture };
}

/**
 * Self-contained auth: credentials + Google identities all resolve to our own
 * `profiles` table (see prisma/schema.prisma) — no Supabase. Sessions are
 * JWTs (no adapter/database session table), so swapping the underlying
 * Postgres host is just repointing DATABASE_URL. Google sign-in is a second
 * Credentials provider (not next-auth's OAuth provider) so the account picker
 * opens in a popup instead of a full-page redirect; the profile upsert
 * happens directly in its `authorize`.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/auth" },
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const profile = await prisma.profile.findUnique({ where: { email } });
        if (!profile?.passwordHash) return null;

        const valid = await bcrypt.compare(password, profile.passwordHash);
        if (!valid) return null;

        return { id: profile.id, email: profile.email, name: profile.fullName };
      },
    }),
    Credentials({
      id: "google-popup",
      name: "Google",
      credentials: { code: { label: "code", type: "text" } },
      authorize: async (credentials) => {
        const code = credentials?.code as string | undefined;
        if (!code) return null;

        const verified = await verifyGoogleCode(code);
        if (!verified) return null;

        const profile = await prisma.profile.upsert({
          where: { email: verified.email },
          update: { emailVerified: new Date() },
          create: {
            email: verified.email,
            fullName: verified.name,
            avatarUrl: verified.picture,
            emailVerified: new Date(),
          },
        });
        return { id: profile.id, email: profile.email, name: profile.fullName };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
