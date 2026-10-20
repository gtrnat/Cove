import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

/*
 * Server-side session access. Reading headers() makes callers request-time,
 * so components that use these must sit inside <Suspense> (Cache Components).
 *
 * cache() dedupes the lookup within one request (layout + page + sidebar).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user, or a redirect to /login. Use in pages and Server Actions. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
