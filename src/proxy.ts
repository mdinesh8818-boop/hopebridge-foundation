import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, getSafeDashboardPath } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/session-token";

function isProtectedPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isAuthPath(pathname: string) {
  return pathname === "/auth/login" || pathname === "/auth/signup";
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token || token === "1") {
    // Reject missing cookies and legacy presence-only values.
    return false;
  }

  try {
    await verifyFirebaseIdToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionValid = await hasValidSession(request);

  if (isProtectedPath(pathname) && !sessionValid) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);

    const response = NextResponse.redirect(loginUrl);
    if (request.cookies.get(AUTH_COOKIE_NAME)) {
      response.cookies.set(AUTH_COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
    }
    return response;
  }

  if (isAuthPath(pathname) && sessionValid) {
    const destination = getSafeDashboardPath(
      request.nextUrl.searchParams.get("next"),
    );
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/auth/login", "/auth/signup"],
};
