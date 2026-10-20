import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * Sends already-signed-in visitors from /login and /register to the app.
 * Validates the session server-side (not just the cookie) so a stale cookie
 * can't cause a redirect loop with the proxy.
 */
export async function RedirectIfSignedIn() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return null;
}
