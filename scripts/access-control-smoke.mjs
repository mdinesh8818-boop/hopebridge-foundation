/**
 * Access-control authorization smoke tests (no Firebase / OpenAI network).
 * Run: npm run test:access-control
 */

import assert from "node:assert/strict";

import {
  HOPEBRIDGE_ORGANIZATION_ID,
  accessRedirectPath,
  assertNoSelfAuthorizationChanges,
  buildLegacyActiveProfile,
  buildPendingRegistrationProfile,
  canManageUserAccess,
  isActiveHopeBridgeMember,
  isActiveOrganizationMember,
  isHopeBridgeAdmin,
  needsOrganizationOnboarding,
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
  assert.equal(pending.organizationId, "");
  assert.equal(pending.onboardingComplete, false);
  assert.equal(isActiveHopeBridgeMember(pending), false);
  assert.equal(isActiveOrganizationMember(pending), false);
  assert.equal(needsOrganizationOnboarding(pending), true);
  assert.equal(accessRedirectPath(pending), "/onboarding");

  const awaitingInvite = { ...pending, onboardingComplete: true };
  assert.equal(accessRedirectPath(awaitingInvite), "/auth/pending");

  const legacy = buildLegacyActiveProfile({
    uid: "u2",
    email: "legacy@example.com",
    role: "member",
  });
  assert.equal(legacy.status, "active");
  assert.equal(legacy.legacyBackfill, true);
  assert.equal(legacy.organizationId, HOPEBRIDGE_ORGANIZATION_ID);
  assert.equal(isActiveHopeBridgeMember(legacy), true);
  assert.equal(accessRedirectPath(legacy), "/dashboard");

  const admin = {
    ...legacy,
    role: "admin",
  };
  assert.equal(isHopeBridgeAdmin(admin), true);
  assert.equal(canManageUserAccess(admin), true);
  assert.equal(canManageUserAccess(legacy), false);

  const otherOrgAdmin = {
    ...admin,
    organizationId: "helping-hands-demo",
  };
  assert.equal(isActiveOrganizationMember(otherOrgAdmin), true);
  assert.equal(isActiveHopeBridgeMember(otherOrgAdmin), false);
  assert.equal(canManageUserAccess(otherOrgAdmin), true);

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

  assert.equal(accessRedirectPath(null), "/auth/pending");
  assert.equal(accessRedirectPath(undefined), "/auth/pending");

  console.log("access-control-smoke: PASS");
  console.log(
    JSON.stringify(
      {
        pendingStatus: pending.status,
        pendingRedirect: accessRedirectPath(pending),
        legacyActive: legacy.status,
        adminCanManage: canManageUserAccess(admin),
        memberCanManage: canManageUserAccess(legacy),
        orgId: HOPEBRIDGE_ORGANIZATION_ID,
      },
      null,
      2,
    ),
  );
}

run();
