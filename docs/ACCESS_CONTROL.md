# HopeBridge access control

HopeBridge is the **product/platform**. Each nonprofit customer is a separate **organization workspace** with its own `organizationId`. Firebase Authentication proves identity; a Firestore `userProfiles/{uid}` document grants membership, status, role, and organization scope.

See also:

- `docs/ORGANIZATION_WORKSPACES.md` — tenant model, scoping, migration
- `docs/ENVIRONMENTS.md` — Firebase / Vercel environment separation

## Account lifecycle

| Field | Values | Notes |
|-------|--------|-------|
| `status` | `pending` \| `active` \| `disabled` | Gates dashboard and org data |
| `role` | `admin` \| `manager` \| `member` | Lightweight (not full enterprise RBAC) |
| `organizationId` | string (may be empty) | Tenant scope; empty until onboarding/invite completes |
| `onboardingComplete` | boolean | False for new signups until they create or join an org |

| Status | Meaning | Dashboard / org data |
|--------|---------|----------------------|
| `pending` | Awaiting onboarding completion or admin approval | Blocked |
| `active` | Approved member of an organization | Allowed when `organizationId` is non-empty |
| `disabled` | Explicitly revoked | Blocked |

Roles:

- `admin` — approve/disable users and manage User Access **within their own organization**
- `manager` — active operational access (reserved for future privilege splits)
- `member` — standard active access

## Registration & onboarding flow

1. Visitor uses **Create one** → Firebase Auth account is created.
2. App writes `userProfiles/{uid}` with `status: pending`, `role: member`, **empty** `organizationId`, and `onboardingComplete: false`.
3. User is sent to **`/onboarding`**:
   - **Create my nonprofit** → creates `organizations/{id}`, sets profile to `active` / `admin` for that org, `onboardingComplete: true`.
   - **Join existing org** → sets `onboardingComplete: true` while remaining `pending` with empty `organizationId` → **`/auth/pending`** until an org admin activates them into **that admin’s** `organizationId` only.
4. **Pending membership lock:** once a user has submitted a join request (`pending` + empty `organizationId` + `onboardingComplete: true`), they stay on `/auth/pending`. Direct navigation to `/onboarding` redirects back to `/auth/pending`. The pending page does **not** offer “Set up my nonprofit” / workspace creation. Firestore rules do **not** allow flipping `onboardingComplete` back to `false`.
5. Pending / empty-org users cannot read/write operational Firestore collections once rules are deployed.
6. A random signup does **not** receive access to HopeBridge Foundation (`hopebridge`) or any other customer org.

Unaffiliated users who have **not** yet chosen a path (`onboardingComplete: false`) may still use `/onboarding`.

### Legacy HopeBridge users

Existing HopeBridge Foundation members stay `organizationId = hopebridge` (the HopeBridge Foundation tenant). Soft-tag / migration adds `organizationId: "hopebridge"` to untagged operational docs when missing (additive only).

## Existing production users (migration)

Existing Auth users are **not** deleted or recreated.

On first login after access control shipped, `ensureUserProfile()` creates a profile if missing:

| Condition | Result |
|-----------|--------|
| `userSettings/{uid}` already exists | `active` / `member` / `organizationId: hopebridge` (`legacyBackfill: true`) |
| Auth `creationTime` &lt; `appMetadata/accessControl.enforceFrom` | `active` / `member` / `hopebridge` |
| Email listed in bootstrap admins (hardcoded defaults **or** `bootstrapAdminEmails`) | `active` / `admin` / `hopebridge` |
| Otherwise (new signup path) | `pending` / `member` / empty `organizationId` → `/onboarding` |

### Preview QA finding (admin stuck as member)

If the existing HopeBridge operator (`mdinesh8818@gmail.com`) signed in **before** bootstrap metadata existed, `ensureUserProfile()` created an `active` / `member` legacy profile and then returned it forever. Dashboard access worked (status-only gate), but:

- **User Access** stayed hidden in the Administration sidebar (`role !== admin`)
- `/dashboard/access` could not list `userProfiles` (admin-only Firestore `list`)

**Fix:** `DEFAULT_BOOTSTRAP_ADMIN_EMAILS` always includes `mdinesh8818@gmail.com`. On every login, `ensureUserProfile()` promotes matching **HopeBridge** (`hopebridge` tenant) profiles to `active` / `admin`. Firestore rules allow that one-time `bootstrapSelfAdminPromote` update. Ordinary members and new pending signups are never auto-promoted.

**Bootstrap admin always works for the hopebridge tenant** — even if `appMetadata/accessControl` is missing, the hardcoded email path still elevates that operator for HopeBridge Foundation.

**Recommended deploy order**

1. In Firebase Console → Firestore, create/update doc `appMetadata/accessControl`:

```json
{
  "organizationId": "hopebridge",
  "bootstrapAdminEmails": ["mdinesh8818@gmail.com"],
  "enforceFrom": "2026-09-08T12:00:00.000Z"
}
```

Emails in `bootstrapAdminEmails` must be **lowercase**. The known demo admin is also hardcoded in app + rules, so promotion still works if this doc is missing.

2. Deploy the application (Vercel).
3. **Deploy Firestore rules** from `firestore.rules` (required — see below). Promotion and admin list reads fail until rules are live.
4. Sign in as `mdinesh8818@gmail.com` once (elevates stale member → admin on the hopebridge tenant).
5. Confirm **Administration → User Access** appears and pending users can be activated.

## Admin approval procedure

1. Sign in as an **active admin** of an organization.
2. Open **Administration → User Access** (`/dashboard/access`).
3. Admins see members of **their own `organizationId` only**, plus pending users with **empty** `organizationId` (awaiting invite / join).
4. Find the pending account → **Activate** (assigns the admin’s organization).
5. Optionally set role to `manager` or `admin`.

Users cannot change their own `status`, `role`, or `organizationId` (enforced in app helpers and Firestore rules), except the constrained bootstrap self-promote path for known bootstrap admin emails on the hopebridge tenant.

### First admin bootstrap (HopeBridge Foundation)

1. Known demo admin email is baked into `DEFAULT_BOOTSTRAP_ADMIN_EMAILS` / rules, **or**
2. Add additional emails to `appMetadata/accessControl.bootstrapAdminEmails`, **or**
3. Manually set `userProfiles/{yourUid}` in Console: `status=active`, `role=admin`, `organizationId=hopebridge`, `uid`, `email`, `onboardingComplete=true`.

Customer orgs get their first admin via **Create my nonprofit** onboarding (creator becomes `active` / `admin`). Then use User Access for everyone else. Non-admins who open `/dashboard/access` are redirected to `/dashboard`.

## Firestore authorization model

Canonical rules file: **`firestore.rules`** (also referenced by `firebase.json`). `firestore.rules.example` mirrors that file as a short pointer.

Helpers (conceptually):

- `isSignedIn()`
- `isActiveMember()` — profile status active **and** non-empty `organizationId`
- `isAdmin()` — active + role admin
- Operational docs must match the member’s `organizationId` (legacy untagged docs only for hopebridge during migration)

Operational collections (`campaigns`, `programs`, `donors`, …) require an active member of the matching org.

`userProfiles`:

- Self **create** only as pending/member with empty `organizationId` (or legacy hopebridge backfill under constrained conditions)
- Self **update** cannot change authorization fields (except constrained bootstrap promote / onboarding completion paths)
- Admins can update status/role/org assignment for users in their org (+ empty-org pending invites)

### CRITICAL: rules deployment

Vercel does **not** deploy Firestore rules.

After merging/releasing app code, an operator must deploy rules:

```bash
firebase deploy --only firestore:rules
```

or paste/upload `firestore.rules` in Firebase Console → Firestore → Rules.

**Until rules are deployed, production security is incomplete** even if the UI shows pending/onboarding screens.

## Dashboard cleanup isolation

`fetchDashboardOrganizationData()` may attempt demo/activity cleanup side-effects, but:

- Cleanup that lists/creates `appMetadata` is **admin-only** (matches Firestore rules).
- Active members skip those operations.
- Cleanup failures are isolated and must never block organization collection reads.

## AI / API authorization

`/api/ai-assistant/chat` requires:

1. `Authorization: Bearer <Firebase ID token>`
2. Verified token identity
3. Firestore `userProfiles/{uid}` with `status=active` and a **non-empty** `organizationId`

Pending/disabled/empty-org tokens receive `401`. Client SDK org reads are also blocked by rules.

## Rollback considerations

- Revert the app deploy to restore previous UI/auth redirects.
- Firestore rules rollback: restore previous rules in Console (keep a backup before deploy).
- `userProfiles` / `organizations` documents can remain; they are additive and do not delete operational data.

## Environment variables

No new secrets required. Existing Firebase web config and `OPENAI_API_KEY` unchanged. See `docs/ENVIRONMENTS.md` for multi-project plans.
