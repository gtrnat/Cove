import { requireUser } from "@/lib/session";

/**
 * Server-side guard for every page in the (app) group. The proxy only checks
 * that a cookie exists; this validates the session itself.
 */
export async function SessionGate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
