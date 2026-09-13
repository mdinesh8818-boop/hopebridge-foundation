# Open Graph / social preview assets

## Required before polished social sharing

| Asset | Path | Size | Notes |
|-------|------|------|-------|
| Open Graph image | `public/og/hopebridge-og.png` | **1200×630** PNG | LinkedIn / Facebook / Slack / Messages |
| Optional Twitter | same file is fine | 1200×630 | Uses `summary_large_image` |

Until `hopebridge-og.png` is supplied, HopeBridge falls back to `/icon.svg` for OG/Twitter tags. That is acceptable for development but **not** ideal for production social previews.

## Brand guidance

- Emerald `#0d5f44`, ivory, gold accents
- Include the HopeBridge wordmark or clear product name
- Do not invent unrelated imagery
- Keep file under ~300KB when possible

## After adding the file

1. Place `hopebridge-og.png` in this folder
2. Update `OG_IMAGE_FALLBACK_PATH` usage in `src/lib/seo.ts` to prefer `OG_IMAGE_PATH` when the file exists (or always point Open Graph `images` at `/og/hopebridge-og.png`)
3. Redeploy
