/**
 * One-time cleanup of known demo/seed records from Firestore.
 *
 * Usage:
 *   NEXT_PUBLIC_ENABLE_DEMO_CLEANUP=true npm run cleanup-demo-data
 *
 * Requires Firebase env vars used by the app (same as next dev).
 * Does NOT delete unrecognized records (e.g. "Test Campaign Updated").
 */

console.log(`
HopeBridge demo cleanup runs automatically when the Dashboard loads if:
  NEXT_PUBLIC_ENABLE_DEMO_CLEANUP=true

Add that to .env.local, reload /dashboard once, then remove the flag.

Known demo sources removed:
  - src/data/demo-seed.ts (campaigns, volunteers)
  - src/app/dashboard/beneficiaries/data.ts (INITIAL_BENEFICIARIES)
  - src/app/dashboard/programs/data.ts (DEMO_PROGRAMS)

Persistent records NOT in the registry (manual Firebase delete required):
  - User-created test records like "Test Campaign Updated"
`);
