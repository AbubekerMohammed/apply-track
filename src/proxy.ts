import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = /^(?:__Secure-)?(?:authjs|next-auth)\.session-token(?:\.\d+)?$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth.js splits a session cookie over 4 KB into "<name>.0", "<name>.1", ...
  // Missing those chunks bounced signed-in users between here and /login.
  const sessionCookie = request.cookies
    .getAll()
    .some((c) => SESSION_COOKIE.test(c.name) && c.value);

  const isProtected = [
    "/dashboard",
    "/applications",
    "/targets",
    "/contacts",
    "/settings",
  ].some((path) => pathname.startsWith(path));

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users are sent away from /login and /register by those pages
  // themselves, after auth() validates the session. Doing it here on cookie
  // presence alone loops forever when the cookie holds a revoked session.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/applications/:path*",
    "/targets/:path*",
    "/contacts/:path*",
    "/settings/:path*",
  ],
};
