import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Optimistic gate: bounce visitors without a session cookie to /login before
 * any rendering happens. This only checks that a cookie exists. The real
 * check (session valid, not expired) happens server-side in the (app) layout
 * and in every Server Action via requireUser().
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/finance/:path*",
    "/fitness/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
