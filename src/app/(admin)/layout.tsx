import { redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/auth/server";
import { isAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin area lives in its own route group so it never inherits the
 * user-facing AppShell/sidebar from `(app)/layout.tsx` — it gets its own
 * chrome, scoped to admin-only navigation (users, subscriptions, payments,
 * analytics).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthedUser();
  if (!user) redirect("/auth");
  if (!(await isAdmin(user.id))) redirect("/dashboard");

  return <AdminShell>{children}</AdminShell>;
}
