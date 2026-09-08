<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

HopeBridge Foundation is a single Next.js 16 (Turbopack) app that uses npm (`package-lock.json`). Standard scripts live in `package.json`: `npm run dev` (dev server on port 3000), `npm run build`, `npm run start`, `npm run lint`. There is no automated test suite. `npm run lint` currently reports pre-existing errors/warnings that are unrelated to environment setup.

Firebase is configured with hardcoded public web config in `src/app/lib/firebase.ts` and points at a real Firebase project (`hopebridge-foundation-70490`). No `.env`/secrets are needed to run the app; egress to `*.googleapis.com` is required for auth and Firestore.

Non-obvious auth/data gotcha: dashboard routes require a Firebase session **and** an active HopeBridge `userProfiles/{uid}` document (`status=active`). New self-registrations are `pending` until an admin approves them at `/dashboard/access`. Pending/disabled users are redirected to `/auth/pending` or `/auth/disabled` and cannot read operational Firestore data once `firestore.rules` are deployed. See `docs/ACCESS_CONTROL.md`. Firestore rules are **not** auto-deployed by Vercel — deploy with Firebase CLI/Console after release.
