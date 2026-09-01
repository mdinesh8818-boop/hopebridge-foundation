# HopeBridge Firestore Collections

This document describes Firestore collections used by HopeBridge Foundation and the expected access model. **Security rules are not deployed from this repository** — review and apply in the Firebase console or via your own rules deployment pipeline.

## Access model (current application)

- All operational modules use the **client Firebase SDK** with `request.auth != null` as the practical gate.
- HopeBridge is currently **single-tenant**: records are not scoped by `organizationId` in application code.
- New collections introduced in the product-completion pass follow the same pattern unless noted.

## Collections

### Core operations (existing)

| Collection | Purpose | Typical access |
|------------|---------|----------------|
| `campaigns` | Fundraising campaigns | Authenticated read/write |
| `programs` | Community programs | Authenticated read/write |
| `donors` | Donor records | Authenticated read/write |
| `donations` | Gift ledger | Authenticated read/write |
| `volunteers` | Volunteer records | Authenticated read/write |
| `beneficiaries` | Beneficiary records | Authenticated read/write |
| `beneficiaryActivity` | Beneficiary activity log | Authenticated read/write |
| `teams` | Team records | Authenticated read/write |
| `teamMembers` | Team member directory | Authenticated read/write |
| `teamAssignments` | Team tasks | Authenticated read/write |
| `teamDiscussions` | Discussion threads | Authenticated read/write |
| `teamMeetings` | Scheduled meetings | Authenticated read/write |
| `teamActivity` | Team activity log | Authenticated read/write |
| `activities` | Organization-wide activity feed | Authenticated read/write |
| `missionVision` | Mission/vision doc (`foundation`) | Authenticated read/write |
| `coreValues` | Core values | Authenticated read/write |
| `strategicGoals` | Strategic goals | Authenticated read/write |
| `appMetadata` | Internal flags (demo cleanup, etc.) | Authenticated read/write |

### Product-completion collections (new)

| Collection | Document ID | Purpose | Recommended access |
|------------|-------------|---------|-------------------|
| `organizationProfile` | `foundation` (fixed) | Legal/contact profile, fiscal year, timezone, **Core Strategy Resources URL** | Authenticated read; write limited to admins in production |
| `userSettings` | Firebase Auth `uid` | Per-user notification and workspace preferences | Authenticated read/write **only for matching `uid`** |

## `organizationProfile` fields

- `organizationName`, `legalName`, `ein`
- Address: `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`
- Contact: `phone`, `email`, `website`, `primaryContactName`, `primaryContactTitle`
- Operations: `fiscalYearStartMonth`, `timezone`
- Resources: `resourcesUrl`, `resourcesLabel` (external link — must be configured by admin; app does not invent URLs)

## `userSettings` fields

- `emailNotifications`, `weeklyDigest`, `compactTables` (booleans)
- `timezone`, `defaultLandingModule` (string)

## Suggested rules snippet (for review only)

See `firestore.rules.example` in the repository root. **Do not weaken production rules** to pass tests. E2E tests should run against a dedicated Firebase project with appropriate test credentials.

## Team file storage

Team **Files** tab does not persist uploads. Document storage requires a separate integration (e.g. Firebase Storage + security rules). No `teamFiles` collection exists at this time.

## AI Assistant

- No chat persistence collection — conversation is session-only in the browser.
- OpenAI calls are **server-side only** via `/api/ai-assistant/chat`; API keys must never be exposed to the client.

## Migration notes

- Mission & Vision may perform a **one-time** read of legacy `localStorage` keys and migrate to Firestore; keys are then cleared.
- Do not reintroduce `localStorage` for production operational data.
