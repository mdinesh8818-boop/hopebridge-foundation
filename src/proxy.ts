import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
  getSafeDashboardPath,
} from "@/lib/auth";

function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isGuestAuthPath(pathname: string) {
  return pathname === "/auth/login" || pathname === "/auth/signup";
}

function isAccessStatusPath(pathname: string) {
  return pathname === "/auth/pending" || pathname === "/auth/disabled";
}

function isOnboardingPath(pathname: string) {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((isAccessStatusPath(pathname) || isOnboardingPath(pathname)) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestAuthPath(pathname) && hasSession) {
    // Status-aware routing continues in GuestRoute / ProtectedRoute.
    const destination = getSafeDashboardPath(
      request.nextUrl.searchParams.get("next"),
    );
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/auth/login",
    "/auth/signup",
    "/auth/pending",
    "/auth/disabled",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
