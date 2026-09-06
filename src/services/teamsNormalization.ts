/**
 * Shared Teams normalization for Dashboard, AI, Reports, and related modules.
 *
 * Reuses the Teams module integrity layer so every surface counts the same
 * canonical teams (seeded duplicates collapsed; user-created records kept).
 * Does not delete Firestore documents.
 */

import {
  buildTeamsWorkspaceModel,
  isOpenAssignment,
} from "@/app/dashboard/teams/integrity";
import type {
  Team,
  TeamAssignment,
  TeamMember,
} from "@/app/dashboard/teams/types";
import {
  normalizeTeamAssignmentRecord,
  normalizeTeamMemberRecord,
  normalizeTeamRecord,
} from "@/app/dashboard/teams/utils";
import { getDocuments } from "./firestore";

export type CanonicalTeamSummary = {
  id: string;
  name: string;
  status: string;
  department: string;
  leadName: string;
  memberCount: number;
  capacity: number;
  openAssignments: number;
};

export type NormalizedTeamsBundle = {
  teams: Team[];
  members: TeamMember[];
  assignments: TeamAssignment[];
  /** Logical teams after seeded-duplicate collapse. */
  teamCount: number;
  activeTeams: number;
  teamMembers: number;
  openAssignments: number;
  activeTeamNames: string[];
  canonicalTeams: CanonicalTeamSummary[];
};

export function normalizeTeamsBundle(
  rawTeams: Array<Record<string, unknown> & { id: string }>,
  rawMembers: Array<Record<string, unknown> & { id: string }> = [],
  rawAssignments: Array<Record<string, unknown> & { id: string }> = [],
): NormalizedTeamsBundle {
  const model = buildTeamsWorkspaceModel(
    rawTeams.map((doc) => normalizeTeamRecord(doc)),
    rawMembers.map((doc) => normalizeTeamMemberRecord(doc)),
    rawAssignments.map((doc) => normalizeTeamAssignmentRecord(doc)),
  );

  const active = model.teams.filter((team) => team.status === "Active");
  const canonicalTeams: CanonicalTeamSummary[] = model.teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      status: team.status,
      department: team.department,
      leadName: team.leadName,
      memberCount: team.memberIds.length,
      capacity: team.capacity,
      openAssignments: model.assignments.filter(
        (assignment) =>
          assignment.teamId === team.id && isOpenAssignment(assignment),
      ).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    teams: model.teams,
    members: model.members,
    assignments: model.assignments,
    teamCount: model.teams.length,
    activeTeams: active.length,
    teamMembers: model.kpis.teamMembers,
    openAssignments: model.kpis.openAssignments,
    activeTeamNames: active
      .map((team) => team.name)
      .sort((a, b) => a.localeCompare(b)),
    canonicalTeams,
  };
}

export async function loadNormalizedTeamsBundle(): Promise<NormalizedTeamsBundle> {
  const [teams, members, assignments] = await Promise.all([
    getDocuments("teams") as Promise<
      Array<Record<string, unknown> & { id: string }>
    >,
    getDocuments("teamMembers") as Promise<
      Array<Record<string, unknown> & { id: string }>
    >,
    getDocuments("teamAssignments") as Promise<
      Array<Record<string, unknown> & { id: string }>
    >,
  ]);

  return normalizeTeamsBundle(teams, members, assignments);
}
