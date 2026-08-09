import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/predictions",
  "/onboarding",
  "/accumulator",
  "/history",
  "/watchlist",
  "/settings",
  "/insights",
  "/admin",
];

/** Route guard — redirects unauthenticated requests to /auth. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  // getToken() defaults `secureCookie` to false, which makes it look for the
  // plain `authjs.session-token` cookie and derive its decryption salt from
  // that name. In production (https), the session is actually issued as
  // `__Secure-authjs.session-token` (see @auth/core's `useSecureCookies`
  // default: `url.protocol === "https:"`), so without this the lookup always
  // misses in production — while working locally over http, where the
  // non-secure cookie name is the correct one — and every authenticated
  // request gets redirected back to /auth.
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
