/**
 * Deterministic AI Teams context regression (no OpenAI / network).
 * Proves duplicated seed fixtures collapse to canonical teams for AI answers
 * and Connected Data Sources coverage counts.
 *
 * Run: npm run test:ai-teams-context
 */

import assert from "node:assert/strict";

import {
  INITIAL_ASSIGNMENTS,
  INITIAL_MEMBERS,
  INITIAL_TEAMS,
} from "../src/app/dashboard/teams/data.ts";
import { answerOrganizationalQuestion } from "../src/services/aiIntelligence.ts";
import { normalizeTeamsBundle } from "../src/services/teamsNormalization.ts";

function cloneWithAutoId(record, prefix, index) {
  return { ...record, id: `${prefix}-auto-${index}` };
}

function buildDuplicatedFixture() {
  // Simulate production: seed written twice with Firestore auto-IDs.
  return {
    teams: [
      ...INITIAL_TEAMS.map((team, index) => cloneWithAutoId(team, "team", index)),
      ...INITIAL_TEAMS.map((team, index) =>
        cloneWithAutoId(team, "team", index + 100),
      ),
    ],
    members: [
      ...INITIAL_MEMBERS.map((member, index) =>
        cloneWithAutoId(member, "mem", index),
      ),
      ...INITIAL_MEMBERS.map((member, index) =>
        cloneWithAutoId(member, "mem", index + 100),
      ),
    ],
    assignments: [
      ...INITIAL_ASSIGNMENTS.map((assignment, index) =>
        cloneWithAutoId(assignment, "asg", index),
      ),
      ...INITIAL_ASSIGNMENTS.map((assignment, index) =>
        cloneWithAutoId(assignment, "asg", index + 100),
      ),
    ],
  };
}

function buildMinimalAiContext(bundle) {
  return {
    snapshot: {
      activeCampaigns: 0,
      activePrograms: 0,
      fundsRaised: 0,
      totalCampaignGoal: 0,
      activeDonors: 0,
      totalDonations: 0,
      volunteerCount: 0,
      volunteerHours: 0,
      beneficiaryCount: 0,
      activeTeams: bundle.activeTeams,
      totalProgramBudget: 0,
      totalProgramSpent: 0,
      programsOnTrack: 0,
      programsAtRisk: 0,
      impactScore: null,
    },
    attention: [],
    impact: {
      programs: [],
      risks: [],
      beneficiaries: {
        newInPeriod: 0,
        communitiesReached: 0,
        byProgramAssignment: [],
      },
      funding: {
        fundsRaised: 0,
        fundsDeployed: 0,
        hasDeployedSpend: false,
        deploymentRate: null,
        costPerBeneficiary: null,
      },
      volunteers: {
        hoursTracked: false,
        byInitiative: [],
      },
      geography: {
        uniqueLocations: 0,
        regions: 0,
        communities: 0,
        countriesAvailable: false,
        locations: [],
      },
      filterOptions: { campaigns: [] },
    },
    briefing: [],
    coverage: [
      {
        module: "Teams",
        href: "/dashboard/teams",
        state: "connected",
        detail: `${bundle.activeTeams} active · ${bundle.teamCount} teams`,
      },
    ],
    liveMetrics: [
      {
        id: "active-teams",
        label: "Active Teams",
        value: String(bundle.activeTeams),
        available: true,
      },
    ],
    teams: bundle.canonicalTeams.map((team) => ({
      id: team.id,
      name: team.name,
      status: team.status,
      department: team.department,
      leadName: team.leadName,
      memberCount: team.memberCount,
      capacity: team.capacity,
      openAssignments: team.openAssignments,
    })),
    loadedAt: new Date().toISOString(),
  };
}

function run() {
  const dup = buildDuplicatedFixture();
  assert.equal(dup.teams.length, INITIAL_TEAMS.length * 2);

  const bundle = normalizeTeamsBundle(dup.teams, dup.members, dup.assignments);

  assert.equal(bundle.teamCount, INITIAL_TEAMS.length);
  assert.equal(bundle.activeTeams, INITIAL_TEAMS.length);
  assert.equal(bundle.canonicalTeams.length, INITIAL_TEAMS.length);

  const expectedNames = INITIAL_TEAMS.map((team) => team.name).sort();
  const canonicalNames = bundle.canonicalTeams.map((team) => team.name).sort();
  assert.deepEqual(canonicalNames, expectedNames);

  for (const team of bundle.canonicalTeams) {
    assert.ok(team.name, "canonical team must include a name");
    assert.ok(team.id, "canonical team must include an id");
  }

  const ctx = buildMinimalAiContext(bundle);
  assert.equal(ctx.snapshot.activeTeams, INITIAL_TEAMS.length);
  assert.equal(ctx.teams.length, INITIAL_TEAMS.length);

  const question =
    "How many active teams do we currently have? List each team name and tell me the total.";
  const answer = answerOrganizationalQuestion(question, ctx);

  assert.ok(
    answer.text.includes(String(INITIAL_TEAMS.length)),
    `answer should include canonical count ${INITIAL_TEAMS.length}: ${answer.text}`,
  );
  assert.ok(
    !answer.text.includes(String(INITIAL_TEAMS.length * 2)),
    "AI answer must not report raw duplicated team count",
  );
  for (const name of expectedNames) {
    assert.ok(
      answer.text.includes(name),
      `AI answer must include team name: ${name}\n---\n${answer.text}`,
    );
  }

  const teamsCoverage = ctx.coverage.find((item) => item.module === "Teams");
  assert.ok(teamsCoverage);
  assert.ok(teamsCoverage.detail.includes(String(bundle.teamCount)));
  assert.ok(!teamsCoverage.detail.includes(String(INITIAL_TEAMS.length * 2)));

  console.log("ai-teams-context-smoke: PASS");
  console.log(
    JSON.stringify(
      {
        rawTeamDocs: dup.teams.length,
        canonicalTeams: bundle.teamCount,
        activeTeams: bundle.activeTeams,
        names: canonicalNames,
        answerPreview: answer.text.split("\n").slice(0, 12),
      },
      null,
      2,
    ),
  );
}

run();
