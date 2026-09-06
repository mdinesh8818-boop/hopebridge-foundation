/**
 * Teams data integrity layer.
 *
 * Production QA found duplicate seeded Firestore documents (auto-generated IDs)
 * whose cross-references still use logical seed ids (`team-001`, `mem-001`).
 *
 * This module is the single source of truth for Teams aggregations:
 * - safe read-layer dedupe of known seeded/demo entities only
 * - remapping of logical seed ids → canonical Firestore documents
 * - consistent open-assignment status semantics
 * - KPI / capacity / workload / AI intelligence from the same normalized data
 *
 * It does NOT mass-delete production records. Historical duplicates remain in
 * Firestore and require a deliberate cleanup/migration.
 */

import {
  INITIAL_ASSIGNMENTS,
  INITIAL_MEMBERS,
  INITIAL_TEAMS,
} from "./data";
import type {
  AssignmentStatus,
  Team,
  TeamAssignment,
  TeamMember,
} from "./types";

export type TeamsKpis = {
  activeTeams: number;
  teamMembers: number;
  openAssignments: number;
  workloadAlerts: number;
};

export type TeamIntelligence = {
  teamId: string | null;
  teamName: string;
  headline: string;
  detail: string;
  capacity: number;
  openAssignments: number;
  overloadedCount: number;
  availableCount: number;
};

export type TeamsWorkspaceModel = {
  teams: Team[];
  members: TeamMember[];
  assignments: TeamAssignment[];
  kpis: TeamsKpis;
  intelligence: TeamIntelligence;
  historicalDuplicateSummary: {
    duplicateTeamNames: string[];
    duplicateMemberKeys: string[];
    duplicateAssignmentKeys: string[];
  };
};

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[—–−]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export const SEEDED_TEAM_NAMES = new Set(
  INITIAL_TEAMS.map((team) => normalizeText(team.name)),
);

export const SEEDED_MEMBER_EMAILS = new Set(
  INITIAL_MEMBERS.map((member) => member.email.toLowerCase()),
);

export const SEEDED_MEMBER_NAMES = new Set(
  INITIAL_MEMBERS.map((member) => normalizeText(member.name)),
);

export const SEEDED_ASSIGNMENT_TITLES = new Set(
  INITIAL_ASSIGNMENTS.map((assignment) => normalizeText(assignment.title)),
);

/** Near-identical production titles that drifted from seed copy. */
const SEEDED_ASSIGNMENT_TITLE_ALIASES: Record<string, string> = {
  [normalizeText("Grant Proposal Draft — Riverside")]: normalizeText(
    "Grant Proposal Draft — Riverside",
  ),
  [normalizeText("August Beneficiary Follow-Up Review")]: normalizeText(
    "August Beneficiary Follow-Up Review",
  ),
  [normalizeText("Food Distribution Coordination")]: normalizeText(
    "Food Distribution Coordination",
  ),
  [normalizeText("Q3 Impact Metrics Review")]: normalizeText(
    "Q3 Impact Metrics Review",
  ),
  [normalizeText("Vendor Contract Renewal")]: normalizeText(
    "Vendor Contract Renewal",
  ),
  // Production copy drift observed in QA
  [normalizeText("Grant Proposal Draft - Riverside")]: normalizeText(
    "Grant Proposal Draft — Riverside",
  ),
  [normalizeText("August Beneficiary Follow Up Review")]: normalizeText(
    "August Beneficiary Follow-Up Review",
  ),
  [normalizeText("Food Distribution Coordination")]: normalizeText(
    "Food Distribution Coordination",
  ),
};

export function normalizeAssignmentStatus(status: unknown): AssignmentStatus {
  const raw = String(status ?? "").trim();
  if (!raw) return "To Do";

  const lowered = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (
    lowered === "completed" ||
    lowered === "complete" ||
    lowered === "done" ||
    lowered === "closed"
  ) {
    return "Completed";
  }
  if (lowered === "to do" || lowered === "todo") return "To Do";
  if (lowered === "in progress") return "In Progress";
  if (lowered === "in review") return "In Review";

  if (
    raw === "To Do" ||
    raw === "In Progress" ||
    raw === "In Review" ||
    raw === "Completed"
  ) {
    return raw;
  }
  return "To Do";
}

/** Open = To Do | In Progress | In Review. Closed = Completed. */
export function isOpenAssignmentStatus(status: unknown): boolean {
  return normalizeAssignmentStatus(status) !== "Completed";
}

export function isOpenAssignment(
  assignment: Pick<TeamAssignment, "status">,
): boolean {
  return isOpenAssignmentStatus(assignment.status);
}

function workloadFromOpenCount(openCount: number): number {
  return Math.min(98, 40 + openCount * 8);
}

function preferRecord<T extends { id: string }>(a: T, b: T): T {
  return a.id <= b.id ? a : b;
}

function dedupeByKey<T extends { id: string }>(
  records: T[],
  getKey: (record: T) => string | null,
): { unique: T[]; duplicateKeys: string[] } {
  const best = new Map<string, T>();
  const passthrough: T[] = [];
  const seenCounts = new Map<string, number>();

  for (const record of records) {
    const key = getKey(record);
    if (!key) {
      passthrough.push(record);
      continue;
    }
    seenCounts.set(key, (seenCounts.get(key) ?? 0) + 1);
    const existing = best.get(key);
    best.set(key, existing ? preferRecord(existing, record) : record);
  }

  const duplicateKeys = [...seenCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);

  return { unique: [...passthrough, ...best.values()], duplicateKeys };
}

function seededAssignmentTitleKey(title: string): string | null {
  const normalized = normalizeText(title);
  if (SEEDED_ASSIGNMENT_TITLES.has(normalized)) return normalized;
  return SEEDED_ASSIGNMENT_TITLE_ALIASES[normalized] ?? null;
}

function isSeededTeam(team: Pick<Team, "name">): boolean {
  return SEEDED_TEAM_NAMES.has(normalizeText(team.name));
}

function isSeededMember(member: Pick<TeamMember, "name" | "email">): boolean {
  if (member.email && SEEDED_MEMBER_EMAILS.has(member.email.toLowerCase())) {
    return true;
  }
  return SEEDED_MEMBER_NAMES.has(normalizeText(member.name));
}

function isSeededAssignment(assignment: Pick<TeamAssignment, "title">): boolean {
  return seededAssignmentTitleKey(assignment.title) != null;
}

/**
 * Idempotent seed helper: returns seed records not already represented.
 * Future writers should persist with setDocument(stableLogicalId).
 */
export function findMissingSeedRecords<T>(options: {
  existing: T[];
  seed: T[];
  match: (existing: T[], seedRecord: T) => boolean;
}): T[] {
  return options.seed.filter(
    (seedRecord) => !options.match(options.existing, seedRecord),
  );
}

export function matchSeedTeam(existing: Team[], seed: Team): boolean {
  const key = normalizeText(seed.name);
  return existing.some((team) => normalizeText(team.name) === key);
}

export function matchSeedMember(
  existing: TeamMember[],
  seed: TeamMember,
): boolean {
  const email = seed.email.toLowerCase();
  const name = normalizeText(seed.name);
  return existing.some(
    (member) =>
      member.email.toLowerCase() === email ||
      normalizeText(member.name) === name,
  );
}

export function matchSeedAssignment(
  existing: TeamAssignment[],
  seed: TeamAssignment,
): boolean {
  const titleKey = seededAssignmentTitleKey(seed.title);
  if (!titleKey) return false;
  const teamKey = normalizeText(seed.teamName);
  return existing.some(
    (assignment) =>
      seededAssignmentTitleKey(assignment.title) === titleKey &&
      normalizeText(assignment.teamName) === teamKey,
  );
}

export function getOpenAssignmentsForTeam(
  teamId: string,
  assignments: TeamAssignment[],
): TeamAssignment[] {
  return assignments.filter(
    (assignment) => assignment.teamId === teamId && isOpenAssignment(assignment),
  );
}

export function countOpenAssignmentsForTeam(
  teamId: string,
  assignments: TeamAssignment[],
): number {
  return getOpenAssignmentsForTeam(teamId, assignments).length;
}

export function buildTeamsWorkspaceModel(
  rawTeams: Team[],
  rawMembers: TeamMember[],
  rawAssignments: TeamAssignment[],
): TeamsWorkspaceModel {
  const logicalTeamByName = new Map(
    INITIAL_TEAMS.map((team) => [normalizeText(team.name), team.id] as const),
  );
  const logicalMemberByKey = new Map<string, string>();
  for (const member of INITIAL_MEMBERS) {
    logicalMemberByKey.set(member.email.toLowerCase(), member.id);
    logicalMemberByKey.set(`name:${normalizeText(member.name)}`, member.id);
  }

  const teamsDedupe = dedupeByKey(rawTeams, (team) =>
    isSeededTeam(team) ? normalizeText(team.name) : null,
  );
  const membersDedupe = dedupeByKey(rawMembers, (member) => {
    if (!isSeededMember(member)) return null;
    if (member.email) return `email:${member.email.toLowerCase()}`;
    return `name:${normalizeText(member.name)}`;
  });
  const assignmentsDedupe = dedupeByKey(rawAssignments, (assignment) => {
    const titleKey = seededAssignmentTitleKey(assignment.title);
    if (!titleKey || !isSeededAssignment(assignment)) return null;
    return `${titleKey}::${normalizeText(assignment.teamName)}`;
  });

  const teams = teamsDedupe.unique;
  const members = membersDedupe.unique;
  const assignments = assignmentsDedupe.unique.map((assignment) => ({
    ...assignment,
    status: normalizeAssignmentStatus(assignment.status),
  }));

  const teamIdByLogical = new Map<string, string>();
  const teamIdByName = new Map<string, string>();
  for (const team of teams) {
    const nameKey = normalizeText(team.name);
    teamIdByName.set(nameKey, team.id);
    teamIdByLogical.set(team.id, team.id);
    const logicalId = logicalTeamByName.get(nameKey);
    if (logicalId) teamIdByLogical.set(logicalId, team.id);
  }

  const memberIdByLogical = new Map<string, string>();
  const memberIdByName = new Map<string, string>();
  for (const member of members) {
    memberIdByLogical.set(member.id, member.id);
    memberIdByName.set(normalizeText(member.name), member.id);
    const byEmail = logicalMemberByKey.get(member.email.toLowerCase());
    if (byEmail) memberIdByLogical.set(byEmail, member.id);
    const byName = logicalMemberByKey.get(`name:${normalizeText(member.name)}`);
    if (byName) memberIdByLogical.set(byName, member.id);
  }

  function resolveTeamId(teamId: string, teamName: string): string {
    if (teamIdByLogical.has(teamId)) return teamIdByLogical.get(teamId)!;
    const byName = teamIdByName.get(normalizeText(teamName));
    if (byName) return byName;
    return teamId;
  }

  function resolveMemberId(memberId: string, memberName?: string): string {
    if (memberIdByLogical.has(memberId)) return memberIdByLogical.get(memberId)!;
    if (memberName) {
      const byName = memberIdByName.get(normalizeText(memberName));
      if (byName) return byName;
    }
    return memberId;
  }

  const remappedAssignments: TeamAssignment[] = assignments.map((assignment) => ({
    ...assignment,
    teamId: resolveTeamId(assignment.teamId, assignment.teamName),
    ownerId: resolveMemberId(assignment.ownerId, assignment.ownerName),
    status: normalizeAssignmentStatus(assignment.status),
  }));

  const remappedMembers: TeamMember[] = members.map((member) => {
    const resolvedTeamIds = Array.from(
      new Set(
        member.teamIds
          .map((teamId) => teamIdByLogical.get(teamId) ?? teamId)
          .filter((teamId) => teams.some((team) => team.id === teamId)),
      ),
    );

    for (const team of teams) {
      const referencedByTeam = team.memberIds.some(
        (id) => resolveMemberId(id) === member.id,
      );
      const seedTeam = INITIAL_TEAMS.find(
        (seed) => normalizeText(seed.name) === normalizeText(team.name),
      );
      const referencedBySeed = Boolean(
        seedTeam?.memberIds.some(
          (logicalId) => memberIdByLogical.get(logicalId) === member.id,
        ),
      );
      if (
        (referencedByTeam || referencedBySeed) &&
        !resolvedTeamIds.includes(team.id)
      ) {
        resolvedTeamIds.push(team.id);
      }
    }

    return {
      ...member,
      teamIds: resolvedTeamIds,
    };
  });

  const remappedTeams: Team[] = teams.map((team) => {
    const fromMemberIds = team.memberIds
      .map((id) => resolveMemberId(id))
      .filter((id) => remappedMembers.some((member) => member.id === id));

    const fromReverseLinks = remappedMembers
      .filter((member) => member.teamIds.includes(team.id))
      .map((member) => member.id);

    const seedTeam = INITIAL_TEAMS.find(
      (seed) => normalizeText(seed.name) === normalizeText(team.name),
    );
    const fromSeedMembers = (seedTeam?.memberIds ?? [])
      .map((logicalId) => memberIdByLogical.get(logicalId))
      .filter((id): id is string => Boolean(id));

    const memberIds = Array.from(
      new Set([...fromMemberIds, ...fromReverseLinks, ...fromSeedMembers]),
    );

    return {
      ...team,
      leadId: resolveMemberId(team.leadId, team.leadName),
      secondaryLeadId: team.secondaryLeadId
        ? resolveMemberId(team.secondaryLeadId, team.secondaryLeadName)
        : undefined,
      memberIds,
    };
  });

  const membersFinal: TeamMember[] = remappedMembers.map((member) => {
    const openCount = remappedAssignments.filter(
      (assignment) =>
        assignment.ownerId === member.id && isOpenAssignment(assignment),
    ).length;
    return {
      ...member,
      assignmentCount: openCount,
      workload: workloadFromOpenCount(openCount),
    };
  });

  const teamsFinal: Team[] = remappedTeams.map((team) => {
    const teamMembers = membersFinal.filter((member) =>
      team.memberIds.includes(member.id),
    );
    const capacity =
      teamMembers.length === 0
        ? 0
        : Math.round(
            teamMembers.reduce((sum, member) => sum + member.workload, 0) /
              teamMembers.length,
          );
    return { ...team, capacity };
  });

  const openAssignments = remappedAssignments.filter(isOpenAssignment);
  const kpis: TeamsKpis = {
    activeTeams: teamsFinal.filter((team) => team.status === "Active").length,
    teamMembers: membersFinal.length,
    openAssignments: openAssignments.length,
    workloadAlerts: membersFinal.filter((member) => member.workload >= 85)
      .length,
  };

  return {
    teams: teamsFinal,
    members: membersFinal,
    assignments: remappedAssignments,
    kpis,
    intelligence: buildTeamIntelligence(
      teamsFinal,
      membersFinal,
      remappedAssignments,
    ),
    historicalDuplicateSummary: {
      duplicateTeamNames: teamsDedupe.duplicateKeys,
      duplicateMemberKeys: membersDedupe.duplicateKeys,
      duplicateAssignmentKeys: assignmentsDedupe.duplicateKeys,
    },
  };
}

function buildTeamIntelligence(
  teams: Team[],
  members: TeamMember[],
  assignments: TeamAssignment[],
): TeamIntelligence {
  if (teams.length === 0) {
    return {
      teamId: null,
      teamName: "Teams",
      headline: "No team data available yet.",
      detail:
        "Create a team or add assignments to see capacity and workload guidance.",
      capacity: 0,
      openAssignments: 0,
      overloadedCount: 0,
      availableCount: 0,
    };
  }

  const scored = teams.map((team) => {
    const teamMembers = members.filter((member) =>
      team.memberIds.includes(member.id),
    );
    const open = getOpenAssignmentsForTeam(team.id, assignments);
    const overloaded = teamMembers.filter((member) => member.workload >= 80);
    const available = teamMembers.filter(
      (member) =>
        member.workload < 70 &&
        !open.some((assignment) => assignment.ownerId === member.id),
    );
    const outreachBoost =
      normalizeText(team.name) === normalizeText("Community Outreach") ? 8 : 0;
    const score =
      team.capacity + overloaded.length * 10 + open.length + outreachBoost;
    return { team, teamMembers, open, overloaded, available, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (best.open.length === 0 && best.team.capacity === 0) {
    return {
      teamId: best.team.id,
      teamName: best.team.name,
      headline: `${best.team.name} has no open assignments linked yet.`,
      detail:
        "Open assignments and membership links were normalized. Add or reassign work to refresh capacity insights.",
      capacity: best.team.capacity,
      openAssignments: 0,
      overloadedCount: best.overloaded.length,
      availableCount: best.available.length,
    };
  }

  const holders = best.teamMembers
    .map((member) => ({
      member,
      count: best.open.filter((assignment) => assignment.ownerId === member.id)
        .length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const topHolders = holders.slice(0, Math.min(3, holders.length));
  const sharePct =
    best.open.length === 0
      ? 0
      : Math.round(
          (topHolders.reduce((sum, entry) => sum + entry.count, 0) /
            best.open.length) *
            100,
        );

  const approaching = best.team.capacity >= 70;
  const headline = approaching
    ? `${best.team.name} is approaching capacity.`
    : `${best.team.name} workload can absorb additional assignments.`;

  const detail =
    topHolders.length > 0
      ? `${topHolders.length} team member${topHolders.length === 1 ? "" : "s"} currently hold${topHolders.length === 1 ? "s" : ""} ${sharePct}% of the team's active assignments, while ${best.available.length} member${best.available.length === 1 ? " has" : "s have"} available capacity.`
      : `${best.team.name} has ${best.open.length} open assignment${best.open.length === 1 ? "" : "s"} at ${best.team.capacity}% capacity.`;

  return {
    teamId: best.team.id,
    teamName: best.team.name,
    headline,
    detail,
    capacity: best.team.capacity,
    openAssignments: best.open.length,
    overloadedCount: best.overloaded.length,
    availableCount: best.available.length,
  };
}
