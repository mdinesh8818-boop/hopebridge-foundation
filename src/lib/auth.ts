export const AUTH_COOKIE_NAME = "hopebridge_session";

/** @deprecated Presence-only cookie value; sessions now store a verified Firebase ID token. */
export const AUTH_COOKIE_VALUE = "1";

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function getSafeDashboardPath(next: string | null | undefined): string {
  if (!next) return "/dashboard";

  const value = next.trim();
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://") ||
    value.includes("\\")
  ) {
    return "/dashboard";
  }

  if (!value.startsWith("/dashboard")) {
    return "/dashboard";
  }

  return value;
}

/**
 * Client-side cookie helpers are retained only as a fallback clear for legacy
 * presence cookies. Authoritative session cookies are httpOnly and set by
 * `/api/auth/session` after Firebase ID token verification.
 */
export function setAuthCookie() {
  // No-op: session is established via POST /api/auth/session (httpOnly JWT).
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getSessionCookieMaxAgeSeconds(expiresAtMs?: number) {
  if (expiresAtMs && Number.isFinite(expiresAtMs)) {
    const seconds = Math.floor((expiresAtMs - Date.now()) / 1000);
    if (seconds > 60) return seconds;
  }
  return AUTH_COOKIE_MAX_AGE_SECONDS;
}

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is not enabled.";
    default:
      return "Unable to complete authentication. Please try again.";
  }
}
