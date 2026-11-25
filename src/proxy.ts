import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

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
