/**
 * Access-control authorization smoke tests (no Firebase / OpenAI network).
 * Run: npm run test:access-control
 */

import assert from "node:assert/strict";

import {
  DEFAULT_BOOTSTRAP_ADMIN_EMAILS,
  HOPEBRIDGE_ORGANIZATION_ID,
  accessRedirectPath,
  assertNoSelfAuthorizationChanges,
  buildLegacyActiveProfile,
  buildPendingRegistrationProfile,
  canManageUserAccess,
  isActiveHopeBridgeMember,
  isHopeBridgeAdmin,
  isListedBootstrapAdminEmail,
  mergeBootstrapAdminEmails,
  shouldPromoteToBootstrapAdmin,
} from "../src/lib/accessControl.ts";
import { isPreEnforcementAccount } from "../src/services/userProfile.ts";

function run() {
  const pending = buildPendingRegistrationProfile({
    uid: "u1",
    email: "new@example.com",
    displayName: "New User",
  });
  assert.equal(pending.status, "pending");
  assert.equal(pending.role, "member");
  assert.equal(pending.organizationId, HOPEBRIDGE_ORGANIZATION_ID);
  assert.equal(isActiveHopeBridgeMember(pending), false);
  assert.equal(accessRedirectPath(pending), "/auth/pending");

  const legacy = buildLegacyActiveProfile({
    uid: "u2",
    email: "legacy@example.com",
    role: "member",
  });
  assert.equal(legacy.status, "active");
  assert.equal(legacy.legacyBackfill, true);
  assert.equal(isActiveHopeBridgeMember(legacy), true);
  assert.equal(accessRedirectPath(legacy), "/dashboard");

  const admin = {
    ...legacy,
    role: "admin",
  };
  assert.equal(isHopeBridgeAdmin(admin), true);
  assert.equal(canManageUserAccess(admin), true);
  assert.equal(canManageUserAccess(legacy), false);

  const disabled = { ...legacy, status: "disabled" };
  assert.equal(accessRedirectPath(disabled), "/auth/disabled");
  assert.equal(isActiveHopeBridgeMember(disabled), false);

  assert.throws(() => assertNoSelfAuthorizationChanges({ role: "admin" }));
  assert.throws(() => assertNoSelfAuthorizationChanges({ status: "active" }));
  assert.throws(() =>
    assertNoSelfAuthorizationChanges({ organizationId: "other" }),
  );
  assert.doesNotThrow(() =>
    assertNoSelfAuthorizationChanges({ displayName: "Safe Name" }),
  );

  assert.equal(
    isPreEnforcementAccount("2026-01-01T00:00:00.000Z", "2026-09-08T00:00:00.000Z"),
    true,
  );
  assert.equal(
    isPreEnforcementAccount("2026-09-09T00:00:00.000Z", "2026-09-08T00:00:00.000Z"),
    false,
  );
  assert.equal(isPreEnforcementAccount(undefined, "2026-09-08T00:00:00.000Z"), false);

  // Unauthenticated / missing profile cannot access dashboard.
  assert.equal(accessRedirectPath(null), "/auth/pending");
  assert.equal(accessRedirectPath(undefined), "/auth/pending");

  // --- Preview QA: existing demo admin stuck as active/member ---
  assert.ok(
    DEFAULT_BOOTSTRAP_ADMIN_EMAILS.includes("mdinesh8818@gmail.com"),
  );
  assert.equal(
    isListedBootstrapAdminEmail("mdinesh8818@gmail.com"),
    true,
    "Known production/demo admin must resolve without metadata",
  );
  assert.equal(
    isListedBootstrapAdminEmail("MDINESH8818@GMAIL.COM"),
    true,
    "Bootstrap email matching must be case-insensitive",
  );
  assert.equal(
    isListedBootstrapAdminEmail("mmanikanta8818@gmail.com"),
    false,
    "New registrations must not be treated as bootstrap admins",
  );

  const merged = mergeBootstrapAdminEmails(["Extra.Admin@Example.com"]);
  assert.ok(merged.includes("mdinesh8818@gmail.com"));
  assert.ok(merged.includes("extra.admin@example.com"));

  const stuckMember = buildLegacyActiveProfile({
    uid: "admin-uid",
    email: "mdinesh8818@gmail.com",
    role: "member",
  });
  assert.equal(
    shouldPromoteToBootstrapAdmin(stuckMember, "mdinesh8818@gmail.com"),
    true,
    "Legacy active/member for bootstrap email must be promoted",
  );
  assert.equal(
    canManageUserAccess(stuckMember),
    false,
    "Before promotion, User Access UI must stay hidden",
  );

  const alreadyAdmin = { ...stuckMember, role: "admin" };
  assert.equal(
    shouldPromoteToBootstrapAdmin(alreadyAdmin, "mdinesh8818@gmail.com"),
    false,
  );
  assert.equal(canManageUserAccess(alreadyAdmin), true);

  const pendingBootstrap = buildPendingRegistrationProfile({
    uid: "admin-uid",
    email: "mdinesh8818@gmail.com",
  });
  assert.equal(
    shouldPromoteToBootstrapAdmin(
      pendingBootstrap,
      "mdinesh8818@gmail.com",
    ),
    true,
    "Bootstrap admin pending profile must elevate to active/admin",
  );

  const unrelatedMember = buildLegacyActiveProfile({
    uid: "u3",
    email: "volunteer@example.com",
    role: "member",
  });
  assert.equal(
    shouldPromoteToBootstrapAdmin(
      unrelatedMember,
      "volunteer@example.com",
    ),
    false,
    "Ordinary members must never auto-promote",
  );

  const configuredOnly = shouldPromoteToBootstrapAdmin(
    buildLegacyActiveProfile({
      uid: "u4",
      email: "ops@example.com",
      role: "member",
    }),
    "ops@example.com",
    ["ops@example.com"],
  );
  assert.equal(configuredOnly, true);

  const otherOrg = {
    ...stuckMember,
    organizationId: "other-org",
  };
  assert.equal(
    shouldPromoteToBootstrapAdmin(otherOrg, "mdinesh8818@gmail.com"),
    false,
  );

  console.log("access-control-smoke: PASS");
  console.log(
    JSON.stringify(
      {
        pendingStatus: pending.status,
        legacyActive: legacy.status,
        adminCanManage: canManageUserAccess(admin),
        memberCanManage: canManageUserAccess(legacy),
        stuckMemberPromotes: shouldPromoteToBootstrapAdmin(
          stuckMember,
          "mdinesh8818@gmail.com",
        ),
        newUserIsBootstrap: isListedBootstrapAdminEmail(
          "mmanikanta8818@gmail.com",
        ),
        orgId: HOPEBRIDGE_ORGANIZATION_ID,
      },
      null,
      2,
    ),
  );
}

run();
