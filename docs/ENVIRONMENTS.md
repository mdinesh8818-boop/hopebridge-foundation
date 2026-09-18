# Development / Staging / Production environments

HopeBridge Phase 1 prepares multi-tenant SaaS isolation. Environment separation is **documented here** but **not auto-provisioned** by this PR.

## Current state (today)

| Layer | Reality |
|-------|---------|
| App hosting | Vercel Production + Preview deployments |
| Firebase | Single project (`hopebridge-foundation-70490`) hard-coded in `src/app/lib/firebase.ts` |
| OpenAI | `OPENAI_API_KEY` / `OPENAI_MODEL` via Vercel/local env |
| Firestore rules | Versioned in `firestore.rules` — **manual deploy** (`firebase deploy --only firestore:rules`) |
| CI | Local npm smoke scripts; no GitHub Actions yet |

Preview deployments currently share the **same Firebase project** as Production unless you create separate projects.

## Target architecture (later phase)

| Environment | Next.js | Firebase project | Data |
|-------------|---------|------------------|------|
| Development | `npm run dev` / localhost | `hopebridge-dev` (to create) | Synthetic / disposable |
| Staging | Vercel Preview **or** dedicated staging domain | `hopebridge-staging` (to create) | Fixtures / anonymized |
| Production | Production domain | `hopebridge-foundation-70490` | Real customer data |

### What you must configure manually later

1. **Create Firebase projects** for Dev and Staging (Console → Add project). Do not reuse Production data.
2. **Copy Auth settings** (email/password enabled) and deploy `firestore.rules` to each project.
3. **Vercel environment variables** per environment:
   - Prefer `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` (Phase 4 should stop hard-coding config).
   - `OPENAI_API_KEY`, `OPENAI_MODEL` (separate keys recommended for non-prod).
4. **Map Vercel Production → Production Firebase**; Preview/Staging → Staging Firebase.
5. **Never** point Preview at Production once multi-tenant onboarding is live (risk of creating stray customer orgs / polluting data).

### Operator release checklist (any environment)

1. Deploy app (Vercel).
2. Deploy Firestore rules: `firebase deploy --only firestore:rules` (or Console paste) for **that** Firebase project.
3. Ensure `appMetadata/accessControl` exists with `bootstrapAdminEmails` for HopeBridge Foundation operators.
4. Dry-run then apply orgId migration only against the intended project:
   ```bash
   npm run migrate:organization-id
   npm run migrate:organization-id -- --apply
   ```
5. Sign in as HopeBridge bootstrap admin and confirm User Access + org data.

Phase 1 does **not** create paid Firebase projects or change Vercel project settings automatically.
