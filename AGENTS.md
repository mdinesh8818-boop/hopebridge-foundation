<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

HopeBridge Foundation is a single Next.js 16 (Turbopack) app that uses npm (`package-lock.json`). Standard scripts live in `package.json`: `npm run dev` (dev server on port 3000), `npm run build`, `npm run start`, `npm run lint`. There is no automated test suite. `npm run lint` currently reports pre-existing errors/warnings that are unrelated to environment setup.

Firebase is configured with hardcoded public web config in `src/app/lib/firebase.ts` and points at a real Firebase project (`hopebridge-foundation-70490`). No `.env`/secrets are needed to run the app; egress to `*.googleapis.com` is required for auth and Firestore.

Non-obvious auth/data gotcha: every dashboard route renders without logging in, but all data modules (campaigns, donors, volunteers, beneficiaries, teams, programs, mission & vision) read/write Firestore, whose rules require an authenticated user. When logged out you will see empty data and `FirebaseError: Missing or insufficient permissions` in the console — this is expected, not a bug. To exercise any data feature, sign in at `/auth/login` first. Email/password sign-up is enabled on the project, so a throwaway account can be created (e.g. via the Firebase Auth REST `accounts:signUp` endpoint with the public API key) when no test login is supplied.
