export const AUTH_COOKIE_NAME = "hopebridge_session";
export const AUTH_COOKIE_VALUE = "1";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

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

export function setAuthCookie() {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/**
 * Full document navigation after auth so the session cookie set via
 * document.cookie is included on the next request to /dashboard.
 * Client-side router transitions can race proxy/middleware cookie checks.
 */
export function redirectAfterAuth(next: string | null | undefined) {
  if (typeof window === "undefined") return;
  window.location.assign(getSafeDashboardPath(next));
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
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
