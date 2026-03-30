import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and login page through
  if (
    pathname.startsWith("/_next") ||
    pathname === "/login" ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow API routes through (auth is handled there)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check auth cookie
  const cookie = request.cookies.get("dash_auth");
  if (cookie?.value === "authenticated") {
    return NextResponse.next();
  }

  // Redirect to login, preserving intended destination
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
