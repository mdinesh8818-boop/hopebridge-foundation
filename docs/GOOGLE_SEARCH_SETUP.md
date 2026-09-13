# Google Search setup for HopeBridge

This guide is for a non-technical operator. It explains how to get the **public** HopeBridge website into Google Search Console. It does **not** submit anything automatically.

HopeBridge already ships:

- Professional homepage metadata (title, description, canonical)
- `robots.txt` that allows the public homepage and blocks private app areas
- `sitemap.xml` with public URLs only
- Optional Google site verification via environment variable

Private areas (`/dashboard`, `/auth`, `/onboarding`, `/api`) are blocked from indexing.

---

## Before you start

1. Confirm the production website URL you want Google to use.
   - Current default production alias: `https://hopebridge-foundation-five.vercel.app`
   - Preferred long-term: a custom domain such as `https://www.hopebridge.com` (or your chosen brand domain)
2. In Vercel → Project → Settings → Environment Variables, set:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, e.g. `https://hopebridge-foundation-five.vercel.app` or your custom domain |
| `GOOGLE_SITE_VERIFICATION` | Paste the verification token from Search Console (optional method below) |

3. Redeploy after changing environment variables.

---

## Step-by-step: Google Search Console

### 1) Open Google Search Console

Go to [https://search.google.com/search-console](https://search.google.com/search-console) and sign in with the Google account that should own the property.

### 2) Add the HopeBridge website property

1. Click **Add property**
2. Choose **URL prefix**
3. Enter the exact production origin, for example:
   - `https://hopebridge-foundation-five.vercel.app`
   - or your custom domain with `https://`
4. Click **Continue**

Use the same origin you set in `NEXT_PUBLIC_SITE_URL`.

### 3) Verify ownership

Pick one method:

#### Option A — HTML tag (recommended with HopeBridge)

1. In Search Console, choose **HTML tag** verification
2. Copy only the **content** token (the long string inside `content="..."`)
3. Add Vercel env var:

```text
GOOGLE_SITE_VERIFICATION=paste_token_here
```

4. Redeploy HopeBridge
5. Return to Search Console and click **Verify**

HopeBridge injects this token into site metadata when the env var is present.

#### Option B — HTML file upload

Download Google’s HTML file and host it at the site root if you prefer that method. (Not automated by this repo.)

### 4) Submit sitemap.xml

1. In Search Console, open **Sitemaps**
2. Submit:

```text
https://YOUR-PRODUCTION-ORIGIN/sitemap.xml
```

Example:

```text
https://hopebridge-foundation-five.vercel.app/sitemap.xml
```

3. Confirm it reports success (it may take time to process)

### 5) Request indexing of the homepage

1. Use the Search Console URL inspection tool
2. Inspect:

```text
https://YOUR-PRODUCTION-ORIGIN/
```

3. Click **Request indexing**

Do this for the homepage only at first. Do **not** request indexing for `/dashboard` or `/auth` pages.

---

## What Google should see

| URL | Expected |
|-----|----------|
| `/` | Indexable marketing homepage |
| `/robots.txt` | Allows `/`, disallows private app paths |
| `/sitemap.xml` | Contains public URLs only (currently `/`) |
| `/dashboard/*` | Disallowed / noindex |
| `/auth/*` | Disallowed / noindex |
| `/onboarding` | Disallowed / noindex |
| `/api/*` | Disallowed |

---

## Recommended before public launch

- Connect a **custom domain** and set `NEXT_PUBLIC_SITE_URL` to that domain
- Add a production Open Graph image (`public/og/hopebridge-og.png`, 1200×630)
- Publish a public Privacy Policy URL when legal copy is ready
- Keep Firestore security / org isolation production blockers resolved before promoting the product broadly

---

## What this guide does **not** do

- It does not submit HopeBridge to Google automatically
- It does not guarantee rankings
- It does not expose private nonprofit workspace data to search engines
