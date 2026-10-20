import { requireUser } from "@/lib/session";

/**
 * Server-side session check for the (app) group. Rendered as a sibling of the
 * page (not a wrapper), inside its own <Suspense>, so it never blocks client
 * navigations. On a direct visit with a forged or expired cookie it redirects
 * to /login. Data access is still protected separately: every component that
 * reads user data, and every Server Action, calls requireUser() itself.
 */
export async function SessionCheck() {
  await requireUser();
  return null;
}
