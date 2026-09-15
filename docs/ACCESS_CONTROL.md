# HopeBridge access control

HopeBridge is a **multi-organization** platform. Firebase Authentication proves identity; a Firestore `userProfiles/{uid}` document grants membership to **one** organization workspace.

Canonical product docs for tenant model: `docs/ORGANIZATION_WORKSPACES.md`.

## Account lifecycle

| Status | Meaning | Dashboard / org data |
|--------|---------|----------------------|
| `pending` | Registered; no active org membership yet | Blocked (may complete onboarding) |
| `active` | Member of an organization | Allowed for that `organizationId` only |
| `disabled` | Explicitly revoked | Blocked |

Roles (per organization):

- `admin` — manage User Access for **their** organization only; update org settings
- `manager` — active operational access (reserved for future privilege splits)
- `member` — standard active access

## Registration / onboarding flow

1. Visitor creates a Firebase Auth account.
2. App writes `userProfiles/{uid}` with `status: pending`, empty `organizationId`, `onboardingComplete: false`.
3. User is sent to `/onboarding`.
4. **Create nonprofit:** creates `organizations/{id}`, activates user as `admin` of that org, empty operational data.
5. **Join existing:** marks awaiting invite → `/auth/pending` until an org admin activates them into that admin’s organization only.
6. Pending/disabled users cannot read/write operational collections once rules are deployed.

## Existing HopeBridge Foundation users

Existing Auth users are **not** deleted. Legacy backfill keeps `organizationId = hopebridge`.

On first login after access-control shipped, `ensureUserProfile()` creates a profile if missing:

| Condition | Result |
|-----------|--------|
| `userSettings/{uid}` already exists | `active` / `member` / `hopebridge` (`legacyBackfill: true`) |
| Auth `creationTime` &lt; `appMetadata/accessControl.enforceFrom` | `active` / `member` / `hopebridge` |
| Email listed in `bootstrapAdminEmails` | `active` / `admin` / `hopebridge` |
| Otherwise (new signup path) | `pending` / no org → onboarding |

## Admin approval procedure

1. Sign in as an **active admin** of an organization.
2. Open **Administration → User Access**.
3. Activate pending users (assigns them to **your** organization only).
4. You cannot view or manage users belonging to other organizations.

Users cannot change their own `status`, `role`, or `organizationId`.

### First admin bootstrap (HopeBridge Foundation)

1. Add your email to `appMetadata/accessControl.bootstrapAdminEmails`, **or**
2. Manually set `userProfiles/{yourUid}` in Console: `status=active`, `role=admin`, `organizationId=hopebridge`, `uid`, `email`, `onboardingComplete=true`.

## Firestore authorization model

Canonical rules file: **`firestore.rules`**.

Helpers:

- `isSignedIn()`
- `isActiveMember()` — profile status active + non-empty organizationId
- `canAccessOrgDoc()` — doc `organizationId` matches member org (legacy untagged docs only for `hopebridge`)
- `isAdmin()` — active + role admin

### CRITICAL: rules deployment

Vercel does **not** deploy Firestore rules.

```bash
firebase deploy --only firestore:rules
```

**Until rules are deployed, production security is incomplete.**

## AI / API authorization

`/api/ai-assistant/chat` requires an active organization member (any org). Context payloads include `organizationId` / `organizationName` and must only contain that org’s aggregates.

## Migration

See `docs/ORGANIZATION_WORKSPACES.md` and `scripts/migrate-organization-id.mjs` (dry-run default).
