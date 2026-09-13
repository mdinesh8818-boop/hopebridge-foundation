/**
 * Canonical public site URL for SEO, Open Graph, robots, and sitemap.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL  — preferred production marketing origin
 * 2. NEXT_PUBLIC_APP_URL   — shared with Capacitor / app base URL
 * 3. Default production Vercel alias (not a Preview deployment URL)
 *
 * When a custom domain is connected, set NEXT_PUBLIC_SITE_URL once in Vercel
 * (and locally) — do not scatter hostnames across the codebase.
 */
export const DEFAULT_PRODUCTION_SITE_URL =
  "https://hopebridge-foundation-five.vercel.app";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_PRODUCTION_SITE_URL;

  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
