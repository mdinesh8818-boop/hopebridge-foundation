# HopeBridge Firestore Collections

This document describes Firestore collections used by HopeBridge and the expected access model. **Security rules are not deployed from this repository** — review and apply in the Firebase console or via your own rules deployment pipeline.

## Access model (current application)

HopeBridge is a **multi-organization** platform. Firebase Authentication proves identity; Firestore `userProfiles/{uid}` grants membership to one `organizationId`.

- Operational reads/writes require an **active** org member whose `organizationId` matches the document (see `docs/ACCESS_CONTROL.md`, `docs/ORGANIZATION_WORKSPACES.md`).
- Canonical rules: `firestore.rules` (must be deployed manually — Vercel does not publish them).
- Collection `organizations/{organizationId}` stores workspace identity.
- Legacy HopeBridge Foundation documents without `organizationId` are soft-tagged / readable only for `organizationId = hopebridge` during migration.

## Collections

### Core operations (existing)

| Collection | Purpose | Typical access |
|------------|---------|----------------|
| `organizations` | Nonprofit workspace identity | Members of that org; create during onboarding |
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
| `organizationProfile` | Org settings profile (`{organizationId}` doc; legacy `foundation` for HopeBridge) | Active members; admin writes |
| `appMetadata` | Internal flags + access-control bootstrap | Signed-in get for `accessControl`; admin writes |
| `userProfiles` | Authz profiles (`pending`/`active`/`disabled`) | Own get; org admin list/manage own org (+ pending unassigned) |

### Product-completion collections (new)

| Collection | Document ID | Purpose | Recommended access |
|------------|-------------|---------|-------------------|
| `organizationProfile` | `foundation` (fixed) | Legal/contact profile, fiscal year, timezone, **Core Strategy Resources URL** | Active members read; admin write |
| `userSettings` | Firebase Auth `uid` | Per-user notification and workspace preferences | Owner + active member |

## `organizationProfile` fields

- `organizationName`, `legalName`, `ein`
- Address: `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`
- Contact: `phone`, `email`, `website`, `primaryContactName`, `primaryContactTitle`
- Operations: `fiscalYearStartMonth`, `timezone`
- Resources: `resourcesUrl`, `resourcesLabel` (external link — must be configured by admin; app does not invent URLs)

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

## Migration notes

- Mission & Vision may perform a **one-time** read of legacy `localStorage` keys and migrate to Firestore; keys are then cleared.
- Do not reintroduce `localStorage` for production operational data.
