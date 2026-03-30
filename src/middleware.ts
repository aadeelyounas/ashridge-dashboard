import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

const PASSWORD = "Ashridge2026!";
const COOKIE_NAME = "dash_auth";

function isAuthenticated(request: NextRequest) {
  return request.cookies.get(COOKIE_NAME)?.value === "authenticated";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internals, and the login page through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/login" ||
    pathname.includes(".") // any file extension
  ) {
    return NextResponse.next();
  }

  if (isAuthenticated(request)) {
    return NextResponse.next();
  }

  // Not authenticated → send to login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|_next/static|favicon.ico).*)"],
};
