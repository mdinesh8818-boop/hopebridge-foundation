<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

HopeBridge is a multi-organization Next.js 16 (Turbopack) app that uses npm (`package-lock.json`). Standard scripts live in `package.json`: `npm run dev` (dev server on port 3000), `npm run build`, `npm run start`, `npm run lint`. There is no automated test suite. `npm run lint` currently reports pre-existing errors/warnings that are unrelated to environment setup.

Firebase is configured with hardcoded public web config in `src/app/lib/firebase.ts` and points at a real Firebase project (`hopebridge-foundation-70490`). No `.env`/secrets are needed to run the app; egress to `*.googleapis.com` is required for auth and Firestore.

Multi-org auth/data gotcha: dashboard access requires a Firebase session **and** an active `userProfiles/{uid}` with a **non-empty** `organizationId`. New signups start with empty `organizationId` and go to `/onboarding` (create an org or join existing → pending until an org admin activates them). Legacy HopeBridge Foundation users use `organizationId=hopebridge`. Pending/disabled/empty-org users are redirected away from operational data once `firestore.rules` are deployed. See `docs/ACCESS_CONTROL.md` and `docs/ORGANIZATION_WORKSPACES.md`. Firestore rules are **not** auto-deployed by Vercel — deploy manually with Firebase CLI/Console after release (`firebase deploy --only firestore:rules`).
