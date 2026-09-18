# HopeBridge Firestore Collections

This document describes Firestore collections used by the HopeBridge product (multi-organization workspaces) and the expected access model. **Security rules are not deployed from this repository** — review and apply in the Firebase console or via your own rules deployment pipeline (`firebase deploy --only firestore:rules`). Vercel does not publish rules.

## Access model (current application)

HopeBridge uses Firebase Authentication **plus** Firestore `userProfiles/{uid}` with `status` / `role` / `organizationId` / `onboardingComplete`.

- Operational reads/writes require an **active** profile with a **non-empty** `organizationId` matching the document’s tenant (`docs/ACCESS_CONTROL.md`, `docs/ORGANIZATION_WORKSPACES.md`).
- Canonical rules: `firestore.rules` (must be deployed manually). `firestore.rules.example` is a short mirror/pointer to that file.
- Collection `userProfiles` stores account lifecycle state (`pending` | `active` | `disabled`).
- New signups start with empty `organizationId` and complete `/onboarding` (create org or join → pending).

## Collections

### Organizations (multi-tenant)

| Collection | Document ID | Purpose | Typical access |
|------------|-------------|---------|----------------|
| `organizations` | slug / generated org id | Workspace registry (display name, branding foundation, creator) | Active members of that org read; create during onboarding; admin update |
| `organizationProfile` | **same as `organizationId`** (legacy HopeBridge uses `hopebridge`; older docs may still use `foundation` until migrated) | Legal/contact profile, fiscal year, timezone, resources URL, branding fields | Active members of that org read; admin write |

### Core operations (organization-scoped)

Every operational document **must** carry `organizationId`. Client helpers inject it on writes and filter reads. **Legacy untagged documents** (missing `organizationId`) are readable/writable **only** by active `hopebridge` members during migration — soft-tag adds `organizationId: "hopebridge"`.

| Collection | Purpose | Typical access |
|------------|---------|----------------|
| `campaigns` | Fundraising campaigns | Active members of matching org |
| `programs` | Community programs | Active members of matching org |
| `donors` | Donor records | Active members of matching org |
| `donations` | Gift ledger | Active members of matching org |
| `volunteers` | Volunteer records | Active members of matching org |
| `beneficiaries` | Beneficiary records | Active members of matching org |
| `beneficiaryActivity` | Beneficiary activity log | Active members of matching org |
| `teams` | Team records | Active members of matching org |
| `teamMembers` | Team member directory | Active members of matching org |
| `teamAssignments` | Team tasks | Active members of matching org |
| `teamDiscussions` | Discussion threads | Active members of matching org |
| `teamMeetings` | Scheduled meetings | Active members of matching org |
| `teamActivity` | Team activity log | Active members of matching org |
| `activities` | Organization-wide activity feed | Active members of matching org |
| `missionVision` | Mission/vision docs | Active members of matching org |
| `coreValues` | Core values | Active members of matching org |
| `strategicGoals` | Strategic goals | Active members of matching org |
| `appMetadata` | Internal flags + access-control bootstrap | Signed-in get for `accessControl`; admin writes |
| `userProfiles` | Authz profiles (`pending`/`active`/`disabled`) | Own get; org admins list/manage own org + empty-org pending |
| `userSettings` | Per-user notification and workspace preferences | Owner + active member |

## `organizationProfile` fields

- Identity: `organizationName`, `legalName`, `ein`
- Address: `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`
- Contact: `phone`, `email`, `website`, `primaryContactName`, `primaryContactTitle`
- Operations: `fiscalYearStartMonth`, `timezone`
- Resources: `resourcesUrl`, `resourcesLabel` (external link — must be configured by admin; app does not invent URLs)
- Branding (Phase 1 foundation): `logoUrl` / branding `logoUrl`, `tagline`, `primaryColor`, `secondaryColor`, `accentColor` — stored for future workspace chrome; full branded chrome is Phase 2

Document id equals the org id (e.g. `hopebridge`). Do not assume a single global `foundation` id for new orgs.

## `userSettings` fields

- `emailNotifications`, `weeklyDigest`, `compactTables` (booleans)
- `timezone`, `defaultLandingModule` (string)

## Suggested rules

Canonical production rules are maintained in **`firestore.rules`**. See `docs/ACCESS_CONTROL.md` for deployment and approval procedures.

```
// Deploy after reviewing:
// firebase deploy --only firestore:rules
```

Do **not** weaken production rules to pass tests. E2E tests should run against a dedicated Firebase project with appropriate test credentials.

## Team file storage

Team **Files** tab does not persist uploads. Document storage requires a separate integration (e.g. Firebase Storage + security rules). No `teamFiles` collection exists at this time.

## AI Assistant

- No chat persistence collection — conversation is session-only in the browser.
- OpenAI calls are **server-side only** via `/api/ai-assistant/chat`; API keys must never be exposed to the client.
- Chat API requires an active profile with non-empty `organizationId`.

## Migration notes

- Soft-tag operational collections with `organizationId: "hopebridge"` when missing:

```bash
npm run migrate:organization-id
npm run migrate:organization-id -- --apply
```

Script: `scripts/migrate-organization-id.mjs` (dry-run by default). Requires `firebase-admin` + ADC in an operator environment. See `docs/ORGANIZATION_WORKSPACES.md`.

- Mission & Vision may perform a **one-time** read of legacy `localStorage` keys and migrate to Firestore; keys are then cleared.
- Do not reintroduce `localStorage` for production operational data.
