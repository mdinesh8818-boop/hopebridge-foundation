/**
 * Capacitor / native-shell helpers.
 * Safe to import from client components; all native calls are guarded.
 */

export function isProbablyNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    }
  ).Capacitor;
  if (capacitor?.isNativePlatform?.()) return true;
  // Query flag used for local browser simulation of native launch.
  return new URLSearchParams(window.location.search).get("nativeApp") === "1";
}

export async function isNativePlatform(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return isProbablyNativeShell();
  }
}

export function getAppBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.CAPACITOR_SERVER_URL ||
    "https://hopebridge-foundation.vercel.app"
  ).replace(/\/$/, "");
}

export function isExternalHttpUrl(href: string): boolean {
  try {
    const url = new URL(href, getAppBaseUrl());
    const base = new URL(getAppBaseUrl());
    return url.origin !== base.origin;
  } catch {
    return false;
  }
}

/** Preferred first route when the installed app opens unauthenticated. */
export const NATIVE_UNAUTHENTICATED_ENTRY = "/auth/login";

/** Preferred first route when the installed app opens with an active session. */
export const NATIVE_AUTHENTICATED_ENTRY = "/dashboard";
