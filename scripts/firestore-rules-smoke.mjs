/**
 * Firestore rules structure smoke test (no emulator / no network).
 * Validates multi-org isolation helpers are present in firestore.rules.
 * Run: npm run test:firestore-rules
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function run() {
  const rules = readFileSync(join(process.cwd(), "firestore.rules"), "utf8");

  assert.match(rules, /function isActiveMember\(\)/);
  assert.match(rules, /function canAccessOrgDoc\(\)/);
  assert.match(rules, /function canCreateOrgDoc\(\)/);
  assert.match(rules, /function onboardingActivationUpdate\(\)/);
  assert.match(rules, /match \/organizations\/\{orgId\}/);
  assert.match(rules, /organizationId == memberOrgId\(\)/);
  assert.match(rules, /hopebridgeOrgId\(\)/);
  assert.match(rules, /match \/campaigns\/\{id\}/);
  assert.match(rules, /match \/programs\/\{id\}/);
  assert.match(rules, /match \/donors\/\{id\}/);
  assert.match(rules, /match \/volunteers\/\{id\}/);
  assert.match(rules, /match \/beneficiaries\/\{id\}/);
  assert.match(rules, /match \/teams\/\{id\}/);
  assert.match(rules, /match \/userProfiles\/\{userId\}/);
  assert.doesNotMatch(
    rules,
    /match \/campaigns\/\{id\} \{\s*allow read, write: if request\.auth != null;/,
  );

  // Pending self-create must not auto-join hopebridge.
  assert.match(rules, /pendingSelfCreate\(\)/);
  assert.match(
    rules,
    /request\.resource\.data\.get\("organizationId", ""\) == ""/,
  );

  // Preserve PR #15 bootstrap admin promote path.
  assert.match(rules, /function isKnownBootstrapAdminEmail\(\)/);
  assert.match(rules, /function bootstrapSelfAdminPromote\(/);
  assert.match(rules, /mdinesh8818@gmail\.com/);

  // Pending membership request is one-way — no resume-onboarding escape hatch.
  assert.match(rules, /function awaitInviteUpdate\(\)/);
  assert.doesNotMatch(rules, /function resumeOnboardingUpdate\(\)/);
  assert.doesNotMatch(rules, /\|\|\s*resumeOnboardingUpdate\(\)/);

  // Awaiting-invite users cannot self-activate via onboardingActivationUpdate.
  // Extract the function body and require the resource onboardingComplete == false guard.
  const activationMatch = rules.match(
    /function onboardingActivationUpdate\(\) \{([\s\S]*?)\n    \}/,
  );
  assert.ok(activationMatch, "onboardingActivationUpdate must exist");
  const activationBody = activationMatch[1];
  assert.match(
    activationBody,
    /resource\.data\.get\("onboardingComplete", false\) == false/,
    "onboardingActivationUpdate must require resource onboardingComplete == false",
  );
  assert.match(activationBody, /resource\.data\.status == "pending"/);
  assert.match(
    activationBody,
    /resource\.data\.get\("organizationId", ""\) == ""/,
  );

  console.log("firestore-rules-smoke: PASS");
  console.log(
    JSON.stringify(
      {
        bytes: rules.length,
        hasOrgIsolation: true,
        hasOnboardingActivation: true,
      },
      null,
      2,
    ),
  );
}

run();
