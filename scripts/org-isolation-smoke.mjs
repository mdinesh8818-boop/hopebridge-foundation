/**
 * Organization isolation & onboarding smoke tests (no Firebase / OpenAI network).
 * Run: npm run test:org-isolation
 */

import assert from "node:assert/strict";

import {
  HOPEBRIDGE_ORGANIZATION_ID,
  accessRedirectPath,
  assertNoSelfAuthorizationChanges,
  buildLegacyActiveProfile,
  buildPendingRegistrationProfile,
  canInitiateWorkspaceCreation,
  canCompleteSelfServeOrganizationOnboarding,
  canManageUserAccess,
  isActiveHopeBridgeMember,
  isActiveOrganizationMember,
  isAwaitingOrganizationInvite,
  isOrganizationAdmin,
  needsOrganizationOnboarding,
  sameOrganization,
} from "../src/lib/accessControl.ts";
import {
  HOPEBRIDGE_ORGANIZATION_NAME,
  ORGANIZATION_SCOPED_COLLECTIONS,
  buildOrganizationId,
  isOrganizationScopedCollection,
  slugifyOrganizationName,
} from "../src/lib/organization.ts";
import { isEmptyOperationalSnapshot, EMPTY_WORKSPACE_COPY } from "../src/lib/emptyWorkspace.ts";
import { buildHopeBridgeSystemPrompt } from "../src/lib/ai/prompt.ts";
import { buildHopeBridgeAiContextPayload } from "../src/services/aiContextPayload.ts";
import { answerOrganizationalQuestion } from "../src/services/aiIntelligence.ts";

function emptyAiContext() {
  return {
    loadedAt: new Date().toISOString(),
    snapshot: {
      activeCampaigns: 0,
      activePrograms: 0,
      fundsRaised: 0,
      totalCampaignGoal: 0,
      activeDonors: 0,
      volunteerCount: 0,
      volunteerHours: 0,
      beneficiaryCount: 0,
      activeTeams: 0,
      totalProgramBudget: 0,
      totalProgramSpent: 0,
      programsOnTrack: 0,
      programsAtRisk: 0,
    },
    briefing: [],
    liveMetrics: [],
    coverage: [],
    risks: [],
    programs: [],
    fundraising: {
      fundsRaised: 0,
      fundsDeployed: null,
      hasDeployedSpend: false,
      deploymentRate: null,
      costPerBeneficiary: null,
    },
    beneficiaries: {
      total: 0,
      newInPeriod: 0,
      communitiesReached: 0,
      topProgramAssignments: [],
    },
    volunteers: {
      hoursTracked: false,
      totalHours: 0,
      activeCount: 0,
    },
    geography: {
      uniqueLocations: 0,
      regions: 0,
      communities: 0,
      countriesAvailable: false,
      topLocations: [],
    },
    attention: [],
    teams: [],
    impact: {
      risks: [],
      programs: [],
      funding: {
        fundsRaised: 0,
        fundsDeployed: 0,
        hasDeployedSpend: false,
        deploymentRate: null,
        costPerBeneficiary: null,
      },
      beneficiaries: {
        newInPeriod: 0,
        communitiesReached: 0,
        byProgramAssignment: [],
      },
      volunteers: { hoursTracked: false },
      geography: {
        locations: [],
        uniqueLocations: 0,
        regions: 0,
        communities: 0,
        countriesAvailable: false,
      },
    },
  };
}

function run() {
  // 1. New org begins empty
  assert.equal(
    isEmptyOperationalSnapshot({
      campaigns: 0,
      programs: 0,
      donors: 0,
      volunteers: 0,
      beneficiaries: 0,
      teams: 0,
    }),
    true,
  );
  assert.equal(
    isEmptyOperationalSnapshot({ campaigns: 1, programs: 0, donors: 0 }),
    false,
  );
  assert.match(EMPTY_WORKSPACE_COPY.campaigns.title, /No campaigns yet/);

  // Pending signup has no org and needs onboarding
  const pending = buildPendingRegistrationProfile({
    uid: "u-new",
    email: "new@example.com",
  });
  assert.equal(pending.organizationId, "");
  assert.equal(pending.status, "pending");
  assert.equal(needsOrganizationOnboarding(pending), true);
  assert.equal(accessRedirectPath(pending), "/onboarding");
  assert.equal(isActiveOrganizationMember(pending), false);

  // Join-existing path stays pending — cannot reopen workspace creation
  const awaiting = { ...pending, onboardingComplete: true };
  assert.equal(needsOrganizationOnboarding(awaiting), false);
  assert.equal(accessRedirectPath(awaiting), "/auth/pending");
  assert.notEqual(accessRedirectPath(awaiting), "/onboarding");
  assert.equal(isAwaitingOrganizationInvite(awaiting), true);
  assert.equal(canInitiateWorkspaceCreation(awaiting), false);
  assert.equal(canCompleteSelfServeOrganizationOnboarding(awaiting), false);
  assert.equal(canCompleteSelfServeOrganizationOnboarding(pending), true);

  // 2–3 / 13. Org A vs B isolation helpers
  const orgA = {
    uid: "a1",
    email: "a@example.com",
    displayName: "Admin A",
    organizationId: "helping-hands-a1",
    role: "admin",
    status: "active",
    onboardingComplete: true,
  };
  const orgB = {
    uid: "b1",
    email: "b@example.com",
    displayName: "Admin B",
    organizationId: "other-org-b1",
    role: "admin",
    status: "active",
    onboardingComplete: true,
  };
  assert.equal(sameOrganization(orgA, orgB), false);
  assert.equal(sameOrganization(orgA, { organizationId: orgA.organizationId }), true);
  assert.equal(isActiveOrganizationMember(orgA), true);
  assert.equal(isActiveHopeBridgeMember(orgA), false);
  assert.equal(isOrganizationAdmin(orgA), true);
  assert.equal(canManageUserAccess(orgA), true);

  // Existing HopeBridge tenant remains accessible for its members
  const hopebridge = buildLegacyActiveProfile({
    uid: "hb1",
    email: "legacy@example.com",
    role: "admin",
  });
  assert.equal(hopebridge.organizationId, HOPEBRIDGE_ORGANIZATION_ID);
  assert.equal(hopebridge.onboardingComplete, true);
  assert.equal(isActiveHopeBridgeMember(hopebridge), true);
  assert.equal(accessRedirectPath(hopebridge), "/dashboard");
  assert.equal(HOPEBRIDGE_ORGANIZATION_NAME.includes("HopeBridge"), true);

  // 14. Pending cannot access org data
  assert.equal(isActiveOrganizationMember(pending), false);
  assert.notEqual(accessRedirectPath(pending), "/dashboard");

  // 15. Users cannot self-change organization membership fields
  assert.throws(() =>
    assertNoSelfAuthorizationChanges({ organizationId: "other" }),
  );
  assert.throws(() => assertNoSelfAuthorizationChanges({ role: "admin" }));
  assert.throws(() => assertNoSelfAuthorizationChanges({ status: "active" }));
  assert.throws(() =>
    assertNoSelfAuthorizationChanges({ onboardingComplete: true }),
  );

  // 16. Org admin scope is own-org only (sameOrganization gate)
  assert.equal(sameOrganization(orgA, orgB), false);

  // Scoped collections inventory
  for (const name of [
    "campaigns",
    "programs",
    "donors",
    "volunteers",
    "beneficiaries",
    "teams",
  ]) {
    assert.equal(isOrganizationScopedCollection(name), true);
  }
  assert.equal(isOrganizationScopedCollection("userProfiles"), false);
  assert.ok(ORGANIZATION_SCOPED_COLLECTIONS.length >= 10);

  // Org id builder uniqueness
  const id1 = buildOrganizationId("Helping Hands Foundation", "abc12345xyz");
  const id2 = buildOrganizationId("Helping Hands Foundation", "zzz99999xyz");
  assert.notEqual(id1, id2);
  assert.equal(slugifyOrganizationName("Helping Hands!"), "helping-hands");

  // 11. AI empty workspace does not invent insights
  const emptyCtx = emptyAiContext();
  const answer = answerOrganizationalQuestion(
    "How many active campaigns do we have?",
    emptyCtx,
  );
  assert.match(
    answer.text || answer.sections.map((s) => s.body).join(" "),
    /still getting started|Once you add/i,
  );

  const payloadA = buildHopeBridgeAiContextPayload(emptyCtx, {
    id: orgA.organizationId,
    name: "Helping Hands Foundation",
  });
  const payloadB = buildHopeBridgeAiContextPayload(emptyCtx, {
    id: orgB.organizationId,
    name: "Other Org",
  });
  assert.equal(payloadA.organizationId, orgA.organizationId);
  assert.equal(payloadB.organizationId, orgB.organizationId);
  assert.notEqual(payloadA.organizationId, payloadB.organizationId);

  const prompt = buildHopeBridgeSystemPrompt(
    payloadA,
    "Helping Hands Foundation",
  );
  assert.match(prompt, /Helping Hands Foundation/);
  assert.match(prompt, /EMPTY WORKSPACE RULE|still getting started/i);
  assert.doesNotMatch(
    prompt,
    /You are HopeBridge AI Assistant — a helpful advisor for HopeBridge Foundation leadership\n/,
  );

  // Dashboard/metrics emptiness helper used by Getting Started UX
  assert.equal(
    isEmptyOperationalSnapshot({
      campaigns: 0,
      programs: 0,
      donors: 0,
      volunteers: 0,
      beneficiaries: 0,
      teams: 0,
    }),
    true,
  );

  console.log("org-isolation-smoke: PASS");
  console.log(
    JSON.stringify(
      {
        pendingGoesToOnboarding: accessRedirectPath(pending),
        hopebridgeOrgId: HOPEBRIDGE_ORGANIZATION_ID,
        scopedCollections: ORGANIZATION_SCOPED_COLLECTIONS.length,
        emptyAiMentionsGettingStarted: true,
      },
      null,
      2,
    ),
  );
}

run();
