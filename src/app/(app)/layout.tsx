import { redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/auth/server";
import { isAdmin } from "@/lib/admin";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";

/**
 * Guard for the authenticated area. The Next proxy already redirects
 * unauthenticated requests; this server layout is the defence-in-depth check
 * and provides the app chrome. It also enforces that a user has picked a
 * plan (free trial or paid) before reaching the dashboard — with no
 * subscription row, computeEntitlement() would otherwise quietly fall back
 * to a free tier, which isn't a real gate. Admins are routed to `/admin`
 * instead — the user-facing app and the admin area are mutually exclusive,
 * so an admin account never sees (or needs) a personal subscription here.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthedUser();
  if (!user) redirect("/auth");

  if (await isAdmin(user.id)) redirect("/admin");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!subscription) redirect("/onboarding");

  return <AppShell>{children}</AppShell>;
}
