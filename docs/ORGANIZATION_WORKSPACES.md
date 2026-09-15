# Multi-organization workspaces

HopeBridge is the **product/platform**. Each customer nonprofit is a separate **organization workspace**.

## Decision: organization creation model

**Model A (implemented): self-serve nonprofit creation during onboarding.**

| Path | Behavior |
|------|----------|
| Create my nonprofit | Signup → `/onboarding` → create `organizations/{id}` → user becomes `active` / `admin` of that org |
| Join existing org | Signup → onboarding choice → `/auth/pending` → an admin of that org activates the user into **their** `organizationId` only |
| Legacy HopeBridge users | Remain `organizationId = hopebridge` (HopeBridge Foundation tenant) |

A random Firebase Auth signup does **not** receive access to HopeBridge Foundation or any other customer org.

Platform-wide approval before org creation (Model B) was deferred as unnecessary complexity for the current stage.

## Stable HopeBridge Foundation tenant

- `organizationId = hopebridge`
- Display name: HopeBridge Foundation
- Existing operational Firestore documents are treated as this tenant
- Soft-tag / migration adds `organizationId: "hopebridge"` when missing (additive only)

## Collections

New: `organizations/{organizationId}`

Scoped operational collections (must carry `organizationId`):

campaigns, programs, donors, donations, volunteers, beneficiaries, beneficiaryActivity, teams, teamMembers, teamAssignments, teamDiscussions, teamMeetings, teamActivity, activities, missionVision, coreValues, strategicGoals, organizationProfile

Unscoped / special:

- `userProfiles` — membership + role + status; listed/managed per admin’s own org
- `userSettings` — per-user
- `appMetadata` — platform bootstrap

## Client scoping

`setFirestoreOrganizationContext(organizationId)` is set from Auth/Organization providers.

`src/services/firestore.ts` injects `organizationId` on writes and filters reads for scoped collections. Legacy untagged docs are visible only when the active org is `hopebridge`.

## Firestore rules

`firestore.rules` requires:

- authenticated user
- active profile
- matching `organizationId` on operational docs
- transition allowance for empty `organizationId` only for hopebridge members

**Must be deployed manually** (`firebase deploy --only firestore:rules`). Vercel does not deploy rules.

## Migration

Dry-run by default:

```bash
node scripts/migrate-organization-id.mjs
node scripts/migrate-organization-id.mjs --apply
```

Requires `firebase-admin` + ADC in an operator environment. Do not run destructive production migration from Cursor.

## Branding

- Public marketing site: HopeBridge product branding
- Authenticated workspace chrome: customer organization display name, with restrained “Powered by HopeBridge” / HOPEBRIDGE product mark in the sidebar
