# HopeBridge access control

HopeBridge is a **single-organization** workspace (`organizationId = hopebridge`). Firebase Authentication proves identity; a Firestore `userProfiles/{uid}` document grants organization access.

## Account lifecycle

| Status | Meaning | Dashboard / org data |
|--------|---------|----------------------|
| `pending` | Self-registered; awaiting approval | Blocked |
| `active` | Approved HopeBridge member | Allowed |
| `disabled` | Explicitly revoked | Blocked |

Roles (lightweight, not full enterprise RBAC):

- `admin` — can approve/disable users and manage User Access
- `manager` — active operational access (reserved for future privilege splits)
- `member` — standard active access

## Registration flow

1. Visitor uses **Create one** → Firebase Auth account is created.
2. App writes `userProfiles/{uid}` with `status: pending`, `role: member`, `organizationId: hopebridge`.
3. User is sent to `/auth/pending` (not the dashboard).
4. Pending users cannot read/write operational Firestore collections once rules are deployed.
5. An admin activates the account from **Administration → User Access**.

## Existing production users (migration)

Existing Auth users are **not** deleted or recreated.

On first login after this feature ships, `ensureUserProfile()` creates a profile if missing:

| Condition | Result |
|-----------|--------|
| `userSettings/{uid}` already exists | `active` / `member` (`legacyBackfill: true`) |
| Auth `creationTime` &lt; `appMetadata/accessControl.enforceFrom` | `active` / `member` |
| Email listed in bootstrap admins (hardcoded defaults **or** `bootstrapAdminEmails`) | `active` / `admin` |
| Otherwise (new signup path) | `pending` / `member` |

### Preview QA finding (admin stuck as member)

If the existing HopeBridge operator (`mdinesh8818@gmail.com`) signed in **before** bootstrap metadata existed, `ensureUserProfile()` created an `active` / `member` legacy profile and then returned it forever. Dashboard access worked (status-only gate), but:

- **User Access** stayed hidden in the Administration sidebar (`role !== admin`)
- `/dashboard/access` could not list `userProfiles` (admin-only Firestore `list`)

**Fix:** `DEFAULT_BOOTSTRAP_ADMIN_EMAILS` always includes `mdinesh8818@gmail.com`. On every login, `ensureUserProfile()` promotes matching HopeBridge profiles to `active` / `admin`. Firestore rules allow that one-time `bootstrapSelfAdminPromote` update. Ordinary members and new pending signups are never auto-promoted.

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
4. Sign in as `mdinesh8818@gmail.com` once (elevates stale member → admin).
5. Confirm **Administration → User Access** appears and pending users can be activated.

## Admin approval procedure

1. Sign in as an **active admin**.
2. Open **Administration → User Access** (`/dashboard/access`).
3. Find the pending account → **Activate**.
4. Optionally set role to `manager` or `admin`.

Users cannot change their own `status`, `role`, or `organizationId` (enforced in app helpers and Firestore rules), except the constrained bootstrap self-promote path for known bootstrap admin emails.

### First admin bootstrap

1. Known demo admin email is baked into `DEFAULT_BOOTSTRAP_ADMIN_EMAILS` / rules, **or**
2. Add additional emails to `appMetadata/accessControl.bootstrapAdminEmails`, **or**
3. Manually set `userProfiles/{yourUid}` in Console: `status=active`, `role=admin`, `organizationId=hopebridge`, `uid`, `email`.

Then use User Access for everyone else. Non-admins who open `/dashboard/access` are redirected to `/dashboard`.

## Firestore authorization model

Canonical rules file: **`firestore.rules`** (also referenced by `firebase.json`).

Helpers:

- `isSignedIn()`
- `isActiveMember()` — profile status active + org `hopebridge`
- `isAdmin()` — active + role admin

Operational collections (`campaigns`, `programs`, `donors`, …) require `isActiveMember()`.

`userProfiles`:

- Self **create** only as pending/member, or legacy active backfill under constrained conditions
- Self **update** cannot change authorization fields
- Admins can update status/role for others

### CRITICAL: rules deployment

Vercel does **not** deploy Firestore rules.

After merging/releasing app code, an operator must deploy rules:

```bash
firebase deploy --only firestore:rules
```

or paste/upload `firestore.rules` in Firebase Console → Firestore → Rules.

**Until rules are deployed, production security is incomplete** even if the UI shows pending screens.

## Dashboard cleanup isolation

`fetchDashboardOrganizationData()` may attempt demo/activity cleanup side-effects, but:

- Cleanup that lists/creates `appMetadata` is **admin-only** (matches Firestore rules).
- Active members skip those operations.
- Cleanup failures are isolated and must never block organization collection reads.

## AI / API authorization

`/api/ai-assistant/chat` requires:

1. `Authorization: Bearer <Firebase ID token>`
2. Verified token identity
3. Firestore `userProfiles/{uid}` with `status=active` and org `hopebridge`

Pending/disabled tokens receive `401`. Client SDK org reads are also blocked by rules.

## Rollback considerations

- Revert the app deploy to restore previous UI/auth redirects.
- Firestore rules rollback: restore previous rules in Console (keep a backup before deploy).
- `userProfiles` documents can remain; they are additive and do not delete operational data.

## Environment variables

No new secrets required. Existing Firebase web config and `OPENAI_API_KEY` unchanged.
