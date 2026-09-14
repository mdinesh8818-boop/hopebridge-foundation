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

## Cross-module consistency (AI / Dashboard / search)

`src/services/teamsNormalization.ts` wraps the Teams integrity layer and is the shared read path for:

- Dashboard organization snapshot (`activeTeams`)
- AI Assistant context, Connected Data Sources coverage, and offline team answers
- Dashboard global search team hits
- Mission & Vision team linkables

AI must never count raw Firestore team documents. Coverage detail uses normalized `teamCount` / `activeTeams`. Deterministic regression: `npm run test:ai-teams-context`.

## Production QA follow-up — Discussions duplicates (post PR #13)

After PR #13/#14, Teams Overview, Directory, and Assignments matched production expectations (6 active teams, 8 members, 4 open / 5 total assignments, 0 workload alerts). A remaining UI symptom remained on **Teams → Discussions**:

- 4 discussion cards rendered for **2** logical seeded threads
- `"Q3 Community Outreach Planning"` (Community Outreach) shown twice
- `"Program KPI Alignment"` (Programs & Impact) shown twice

### Root cause

Same historical class as PR #13: seeded/demo discussion documents were written more than once with Firestore auto-ids. PR #13 normalized teams/members/assignments in `buildTeamsWorkspaceModel`, but the Discussions tab still subscribed to raw Firestore docs and rendered them without seeded-fingerprint dedupe.

### Fix

- Extend `integrity.ts` with `normalizeSeededDiscussions` (fingerprint: normalized seed title + teamName).
- Prefer the richer duplicate (more messages → more participants → higher unread → stable id).
- Remap `teamId` onto canonical Teams workspace ids by `teamName` so drawer/team filters stay consistent.
- Wire Discussions UI / drawer props through the normalized list only.
- Do **not** delete production Firestore discussion documents.

Legitimate user-created discussions (titles outside the known seed set) are never collapsed, even when titles collide with each other.

### Meetings audit

`INITIAL_MEETINGS` has the same historical seed shape and is therefore vulnerable to the same duplicate class. `normalizeSeededMeetings` exists for parity and smoke coverage, but the Meetings tab is **not** wired to it until production QA confirms duplicate meeting cards. No production evidence of meeting duplicates was reported in this QA pass.

### Regression

`npm run test:teams-integrity` covers duplicate discussion collapse, richer-thread preference, teamId remap, preservation of user-created same-title discussions, and meetings helper collapse.
