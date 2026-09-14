/**
 * Teams integrity regression smoke test.
 * Run: npm run test:teams-integrity
 */

import assert from "node:assert/strict";

import {
  INITIAL_ASSIGNMENTS,
  INITIAL_DISCUSSIONS,
  INITIAL_MEETINGS,
  INITIAL_MEMBERS,
  INITIAL_TEAMS,
} from "../src/app/dashboard/teams/data.ts";
import {
  buildTeamsWorkspaceModel,
  findMissingSeedRecords,
  isOpenAssignment,
  matchSeedAssignment,
  matchSeedDiscussion,
  matchSeedMeeting,
  matchSeedMember,
  matchSeedTeam,
  normalizeAssignmentStatus,
  normalizeSeededDiscussions,
  normalizeSeededMeetings,
} from "../src/app/dashboard/teams/integrity.ts";

function cloneWithAutoId(record, prefix, index) {
  return { ...record, id: `${prefix}-auto-${index}` };
}

function buildDuplicatedFixture() {
  // Simulate production: seed written twice with Firestore auto-IDs while
  // cross-references still point at logical seed ids (team-001 / mem-001).
  const teams = [
    ...INITIAL_TEAMS.map((team, index) => cloneWithAutoId(team, "team", index)),
    ...INITIAL_TEAMS.map((team, index) =>
      cloneWithAutoId(team, "team", index + 100),
    ),
  ];
  const members = [
    ...INITIAL_MEMBERS.map((member, index) =>
      cloneWithAutoId(member, "mem", index),
    ),
    ...INITIAL_MEMBERS.map((member, index) =>
      cloneWithAutoId(member, "mem", index + 100),
    ),
  ];
  const assignments = [
    ...INITIAL_ASSIGNMENTS.map((assignment, index) =>
      cloneWithAutoId(assignment, "asg", index),
    ),
    ...INITIAL_ASSIGNMENTS.map((assignment, index) =>
      cloneWithAutoId(assignment, "asg", index + 100),
    ),
  ];
  return { teams, members, assignments };
}

function run() {
  assert.equal(normalizeAssignmentStatus("To Do"), "To Do");
  assert.equal(normalizeAssignmentStatus("In Progress"), "In Progress");
  assert.equal(normalizeAssignmentStatus("In Review"), "In Review");
  assert.equal(normalizeAssignmentStatus("Completed"), "Completed");
  assert.equal(normalizeAssignmentStatus("complete"), "Completed");
  assert.equal(isOpenAssignment({ status: "To Do" }), true);
  assert.equal(isOpenAssignment({ status: "In Progress" }), true);
  assert.equal(isOpenAssignment({ status: "In Review" }), true);
  assert.equal(isOpenAssignment({ status: "Completed" }), false);

  const once = {
    teams: INITIAL_TEAMS.map((team, index) => cloneWithAutoId(team, "team", index)),
    members: INITIAL_MEMBERS.map((member, index) =>
      cloneWithAutoId(member, "mem", index),
    ),
    assignments: INITIAL_ASSIGNMENTS.map((assignment, index) =>
      cloneWithAutoId(assignment, "asg", index),
    ),
  };

  assert.equal(
    findMissingSeedRecords({
      existing: once.teams,
      seed: INITIAL_TEAMS,
      match: matchSeedTeam,
    }).length,
    0,
  );
  assert.equal(
    findMissingSeedRecords({
      existing: once.members,
      seed: INITIAL_MEMBERS,
      match: matchSeedMember,
    }).length,
    0,
  );
  assert.equal(
    findMissingSeedRecords({
      existing: once.assignments,
      seed: INITIAL_ASSIGNMENTS,
      match: matchSeedAssignment,
    }).length,
    0,
  );

  // Second init against already-seeded data remains idempotent.
  assert.equal(
    findMissingSeedRecords({
      existing: once.teams,
      seed: INITIAL_TEAMS,
      match: matchSeedTeam,
    }).length,
    0,
  );

  const dup = buildDuplicatedFixture();
  assert.equal(dup.teams.length, INITIAL_TEAMS.length * 2);
  assert.equal(dup.members.length, INITIAL_MEMBERS.length * 2);
  assert.equal(dup.assignments.length, INITIAL_ASSIGNMENTS.length * 2);

  const model = buildTeamsWorkspaceModel(
    dup.teams,
    dup.members,
    dup.assignments,
  );

  assert.equal(model.teams.length, INITIAL_TEAMS.length);
  assert.equal(model.members.length, INITIAL_MEMBERS.length);
  assert.equal(model.assignments.length, INITIAL_ASSIGNMENTS.length);
  assert.ok(model.historicalDuplicateSummary.duplicateTeamNames.length > 0);
  assert.ok(model.historicalDuplicateSummary.duplicateMemberKeys.length > 0);
  assert.ok(
    model.historicalDuplicateSummary.duplicateAssignmentKeys.length > 0,
  );

  const expectedOpen = INITIAL_ASSIGNMENTS.filter((assignment) =>
    isOpenAssignment(assignment),
  ).length;
  assert.equal(model.kpis.openAssignments, expectedOpen);
  assert.equal(
    model.kpis.activeTeams,
    INITIAL_TEAMS.filter((team) => team.status === "Active").length,
  );
  assert.equal(model.kpis.teamMembers, INITIAL_MEMBERS.length);

  assert.equal(
    model.assignments.filter((assignment) => assignment.status === "Completed")
      .length,
    INITIAL_ASSIGNMENTS.filter((assignment) => assignment.status === "Completed")
      .length,
  );

  const perTeamOpen = model.teams.reduce((sum, team) => {
    return (
      sum +
      model.assignments.filter(
        (assignment) =>
          assignment.teamId === team.id && isOpenAssignment(assignment),
      ).length
    );
  }, 0);
  assert.equal(perTeamOpen, model.kpis.openAssignments);

  const outreach = model.teams.find((team) => team.name === "Community Outreach");
  assert.ok(outreach, "Community Outreach team should exist after dedupe");
  const outreachOpen = model.assignments.filter(
    (assignment) =>
      assignment.teamId === outreach.id && isOpenAssignment(assignment),
  );
  assert.ok(
    outreachOpen.length > 0,
    "Community Outreach should have open assignments after id remapping",
  );
  assert.ok(outreach.memberIds.length >= 3);
  assert.ok(
    outreach.capacity > 0,
    "Community Outreach capacity should not stay at 0% when members/assignments resolve",
  );

  assert.ok(model.intelligence.headline.length > 0);
  assert.ok(model.intelligence.detail.length > 0);
  assert.equal(model.intelligence.detail.includes("64%"), false);
  assert.ok(model.intelligence.teamName.length > 0);
  if (model.intelligence.teamId) {
    const featuredOpen = model.assignments.filter(
      (assignment) =>
        assignment.teamId === model.intelligence.teamId &&
        isOpenAssignment(assignment),
    ).length;
    assert.equal(model.intelligence.openAssignments, featuredOpen);
  }

  const userTeams = [
    ...once.teams,
    {
      id: "user-team-1",
      name: "Special Projects Alpha",
      department: "Custom",
      description: "User-created",
      leadId: "user-1",
      leadName: "User Lead",
      memberIds: ["user-1"],
      status: "Active",
      capacity: 10,
      defaultPermission: "Team Lead",
    },
    {
      id: "user-team-2",
      name: "Special Projects Alpha",
      department: "Custom",
      description: "Second user-created with same name",
      leadId: "user-2",
      leadName: "User Lead 2",
      memberIds: ["user-2"],
      status: "Active",
      capacity: 12,
      defaultPermission: "Team Lead",
    },
  ];
  const userModel = buildTeamsWorkspaceModel(
    userTeams,
    once.members,
    once.assignments,
  );
  assert.equal(
    userModel.teams.filter((team) => team.name === "Special Projects Alpha")
      .length,
    2,
    "Legitimate user-created same-name teams must not be collapsed",
  );

  // --- Discussions: production QA duplicate cards (PR #13 class) ---
  const duplicatedDiscussions = [
    ...INITIAL_DISCUSSIONS.map((discussion, index) =>
      cloneWithAutoId(discussion, "disc", index),
    ),
    ...INITIAL_DISCUSSIONS.map((discussion, index) =>
      cloneWithAutoId(
        {
          ...discussion,
          unreadCount: discussion.unreadCount + 1,
          messages: discussion.messages.slice(0, 1),
        },
        "disc",
        index + 100,
      ),
    ),
  ];
  assert.equal(duplicatedDiscussions.length, INITIAL_DISCUSSIONS.length * 2);

  const discussionNorm = normalizeSeededDiscussions(
    duplicatedDiscussions,
    model.teams,
  );
  assert.equal(
    discussionNorm.discussions.length,
    INITIAL_DISCUSSIONS.length,
    "Seeded discussion duplicates must collapse to one card per logical thread",
  );
  assert.equal(discussionNorm.duplicateDiscussionKeys.length, 2);
  assert.equal(
    findMissingSeedRecords({
      existing: discussionNorm.discussions,
      seed: INITIAL_DISCUSSIONS,
      match: matchSeedDiscussion,
    }).length,
    0,
  );

  // Prefer the richer message thread when collapsing duplicates.
  const outreachDiscussion = discussionNorm.discussions.find(
    (discussion) => discussion.title === "Q3 Community Outreach Planning",
  );
  assert.ok(outreachDiscussion);
  assert.equal(outreachDiscussion.messages.length, 3);
  assert.equal(outreachDiscussion.participantIds.length, 3);

  // Remap discussion teamId onto canonical Teams workspace ids by teamName.
  const outreachTeamForDiscussion = model.teams.find(
    (team) => team.name === "Community Outreach",
  );
  assert.ok(outreachTeamForDiscussion);
  assert.equal(outreachDiscussion.teamId, outreachTeamForDiscussion.id);

  // User-created discussions must never collapse — even with matching titles.
  const userDiscussions = [
    {
      id: "user-disc-1",
      title: "Board Update Draft",
      teamId: "user-team-1",
      teamName: "Special Projects Alpha",
      participantIds: ["user-1"],
      lastMessage: "First draft ready",
      lastActivityAt: "2026-09-01T10:00:00",
      unreadCount: 0,
      resolved: false,
      messages: [],
    },
    {
      id: "user-disc-2",
      title: "Board Update Draft",
      teamId: "user-team-1",
      teamName: "Special Projects Alpha",
      participantIds: ["user-1", "user-2"],
      lastMessage: "Second thread",
      lastActivityAt: "2026-09-02T10:00:00",
      unreadCount: 1,
      resolved: false,
      messages: [],
    },
  ];
  const mixedDiscussions = normalizeSeededDiscussions(
    [...duplicatedDiscussions, ...userDiscussions],
    model.teams,
  );
  assert.equal(
    mixedDiscussions.discussions.filter(
      (discussion) => discussion.title === "Board Update Draft",
    ).length,
    2,
    "Legitimate user-created same-title discussions must not be collapsed",
  );
  assert.equal(
    mixedDiscussions.discussions.length,
    INITIAL_DISCUSSIONS.length + 2,
  );

  // Meetings helper: same seed-dupe class; UI unwired until production confirms.
  const duplicatedMeetings = [
    ...INITIAL_MEETINGS.map((meeting, index) =>
      cloneWithAutoId(meeting, "mtg", index),
    ),
    ...INITIAL_MEETINGS.map((meeting, index) =>
      cloneWithAutoId(meeting, "mtg", index + 100),
    ),
  ];
  const meetingNorm = normalizeSeededMeetings(duplicatedMeetings, model.teams);
  assert.equal(meetingNorm.meetings.length, INITIAL_MEETINGS.length);
  assert.equal(meetingNorm.duplicateMeetingKeys.length, INITIAL_MEETINGS.length);
  assert.equal(
    findMissingSeedRecords({
      existing: meetingNorm.meetings,
      seed: INITIAL_MEETINGS,
      match: matchSeedMeeting,
    }).length,
    0,
  );

  console.log("teams-integrity-smoke: PASS");
  console.log(
    JSON.stringify(
      {
        teams: model.teams.length,
        members: model.members.length,
        assignments: model.assignments.length,
        openAssignments: model.kpis.openAssignments,
        outreachOpen: outreachOpen.length,
        outreachCapacity: outreach.capacity,
        intelligence: model.intelligence.headline,
        discussionsAfterDedupe: discussionNorm.discussions.length,
        discussionDuplicateKeys: discussionNorm.duplicateDiscussionKeys.length,
        meetingsAfterDedupe: meetingNorm.meetings.length,
      },
      null,
      2,
    ),
  );
}

run();
