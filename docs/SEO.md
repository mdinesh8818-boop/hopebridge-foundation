# HopeBridge SEO notes

## Architecture

HopeBridge is a Next.js App Router product. Public marketing SEO applies to the homepage. Authenticated workspaces remain noindex.

## Site URL

Single source of truth: `src/lib/site.ts` → `getSiteUrl()`

Env precedence:

1. `NEXT_PUBLIC_SITE_URL`
2. `NEXT_PUBLIC_APP_URL`
3. Default: `https://hopebridge-foundation-five.vercel.app`

## Key files

| File | Role |
|------|------|
| `src/lib/seo.ts` | Titles, descriptions, OG/Twitter, JSON-LD builders |
| `src/app/layout.tsx` | Root metadata + optional `GOOGLE_SITE_VERIFICATION` |
| `src/app/page.tsx` | Homepage metadata + JSON-LD |
| `src/app/robots.ts` | robots.txt |
| `src/app/sitemap.ts` | sitemap.xml (public routes only) |
| `src/app/auth/layout.tsx` | noindex |
| `src/app/dashboard/layout.tsx` | noindex |
| `src/app/onboarding/layout.tsx` | noindex |
| `docs/GOOGLE_SEARCH_SETUP.md` | Search Console operator steps |
| `public/og/README.md` | Required social image specs |

## Public vs private branding

- Public SEO promotes **HopeBridge** (the product)
- Authenticated UI may show the customer nonprofit’s organization name
- Customer names must not replace HopeBridge in public metadata

## Mobile coexistence

Capacitor / PWA packaging continues to load the remote Next.js app. SEO metadata on the public web origin does not affect native store listings and does not require static export.
