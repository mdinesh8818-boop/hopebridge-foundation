# Teams data integrity notes

## Production QA symptom (post PR #12)

On `/dashboard/teams`, Overview KPIs disagreed with Team Workspace cards and the HopeBridge AI Team Intelligence panel:

- Overview counted every Firestore document (including duplicates): e.g. Active Teams 12, Team Members 16, Open Assignments 8.
- Workspace cards showed 0 active assignments / 0% capacity because assignment `teamId` / member links still used logical seed ids (`team-002`, `mem-003`) while team/member documents used Firestore auto-ids.
- The AI panel used hard-coded copy (“Community Outreach … 64%”) unrelated to live aggregations.
- Duplicate team and assignment cards were visible because seeded demo entities had been written more than once with `addDoc` auto-ids.

## Root cause

Combination of:

1. **Historical duplicate Firestore documents** for the same logical seeded teams/members/assignments (different document ids, same names/titles/emails).
2. **Broken cross-references** after non-idempotent seeding: documents kept logical seed ids inside `memberIds` / `teamIds` / `teamId` / `ownerId` fields.
3. **Hard-coded AI recommendation** in the Teams UI.
4. No read-layer normalization, so UI rendered raw Firestore lists and computed KPIs/capacity from mismatched ids.

This module does **not** currently auto-seed on page load. Duplicates are historical.

## Fix strategy (safe, minimal)

1. `src/app/dashboard/teams/integrity.ts` is the **single source of truth** for Teams aggregations.
2. On read, known seeded/demo entities are deduped by stable fingerprints (team name, member email/name, assignment title+teamName).
3. Logical seed ids are remapped onto canonical Firestore document ids before KPI/capacity/AI calculations.
4. Assignment status semantics: **To Do / In Progress / In Review = open**, **Completed = closed**.
5. AI Team Intelligence is derived from the same normalized model (no hard-coded percentages).
6. Legitimate user-created records are preserved even when names collide (dedupe applies only to known seeded fingerprints).

## Historical duplicates — do not mass-delete

Existing duplicate Firestore docs remain in production until a deliberate cleanup/migration is approved. The read layer hides seeded duplicates for calculations/UI consistency without deleting data.

A future cleanup can use `DEMO_TEAM_*` fingerprints in `src/data/demo-record-registry.ts` under an explicit opt-in flag, keeping one canonical doc per logical seeded entity and rewriting references.

## Preventing new duplicates

- Prefer `setDocument(stableLogicalId, …)` for any future seed/demo writers.
- Use `findMissingSeedRecords` + `matchSeed*` helpers so re-running seed is idempotent.
- Do not re-introduce hard-coded AI metrics.
