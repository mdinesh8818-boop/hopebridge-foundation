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
| Email listed in `bootstrapAdminEmails` | `active` / `admin` |
| Otherwise (new signup path) | `pending` / `member` |

**Recommended deploy order**

1. In Firebase Console → Firestore, create/update doc `appMetadata/accessControl`:

```json
{
  "organizationId": "hopebridge",
  "bootstrapAdminEmails": ["your-admin@example.com"],
  "enforceFrom": "2026-09-08T12:00:00.000Z"
}
```

Set `enforceFrom` to approximately **now (UTC)** before announcing the change so accounts created earlier auto-activate as members on next login.

2. Deploy the application (Vercel).
3. Have known users sign in once (creates active profiles).
4. **Deploy Firestore rules** from `firestore.rules` (required — see below).
5. Confirm admins can open `/dashboard/access` and approve any remaining pending users.

## Admin approval procedure

1. Sign in as an **active admin**.
2. Open **Administration → User Access** (`/dashboard/access`).
3. Find the pending account → **Activate**.
4. Optionally set role to `manager` or `admin`.

Users cannot change their own `status`, `role`, or `organizationId` (enforced in app helpers and Firestore rules).

### First admin bootstrap

If no admin exists yet:

1. Add your email to `appMetadata/accessControl.bootstrapAdminEmails`, **or**
2. Manually set `userProfiles/{yourUid}` in Console: `status=active`, `role=admin`, `organizationId=hopebridge`, `uid`, `email`.

Then use User Access for everyone else.

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
