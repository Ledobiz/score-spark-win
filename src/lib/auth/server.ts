import "server-only";
import { auth } from "@/lib/auth";

/**
 * Returns the authenticated user, or null. Use this at the top of every
 * server handler that touches user data, then scope all Prisma queries by
 * `user.id` (there is no RLS to do it for you — see CLAUDE.md).
 */
export async function getAuthedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}
