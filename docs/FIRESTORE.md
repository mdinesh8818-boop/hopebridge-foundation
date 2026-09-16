# HopeBridge Firestore Collections

This document describes Firestore collections used by HopeBridge Foundation and the expected access model. **Security rules are not deployed from this repository** — review and apply in the Firebase console or via your own rules deployment pipeline.

## Access model (current application)

HopeBridge uses Firebase Authentication **plus** Firestore `userProfiles/{uid}` with `status` / `role` / `organizationId`.

- Operational reads/writes require an **active** HopeBridge profile (`docs/ACCESS_CONTROL.md`).
- Canonical rules: `firestore.rules` (must be deployed manually — Vercel does not publish them).
- Collection `userProfiles` stores account lifecycle state (`pending` | `active` | `disabled`).

## Collections

### Core operations (existing)

| Collection | Purpose | Typical access |
|------------|---------|----------------|
| `campaigns` | Fundraising campaigns | Active HopeBridge members |
| `programs` | Community programs | Active HopeBridge members |
| `donors` | Donor records | Active HopeBridge members |
| `donations` | Gift ledger | Active HopeBridge members |
| `volunteers` | Volunteer records | Active HopeBridge members |
| `beneficiaries` | Beneficiary records | Active HopeBridge members |
| `beneficiaryActivity` | Beneficiary activity log | Active HopeBridge members |
| `teams` | Team records | Active HopeBridge members |
| `teamMembers` | Team member directory | Active HopeBridge members |
| `teamAssignments` | Team tasks | Active HopeBridge members |
| `teamDiscussions` | Discussion threads | Active HopeBridge members |
| `teamMeetings` | Scheduled meetings | Active HopeBridge members |
| `teamActivity` | Team activity log | Active HopeBridge members |
| `activities` | Organization-wide activity feed | Active HopeBridge members |
| `missionVision` | Mission/vision doc (`foundation`) | Active HopeBridge members |
| `coreValues` | Core values | Active HopeBridge members |
| `strategicGoals` | Strategic goals | Active HopeBridge members |
| `appMetadata` | Internal flags + access-control bootstrap | Signed-in get for `accessControl`; admin writes |
| `userProfiles` | Authz profiles (`pending`/`active`/`disabled`) | Own get; admin list/manage |

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
