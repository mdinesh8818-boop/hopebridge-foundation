import type {
  DateInput,
  DirectoryFilters,
  KpiFocus,
  RebalanceSuggestion,
  Team,
  TeamActivityEvent,
  TeamAssignment,
  TeamMember,
} from "./types";

export function normalizeToDate(value: DateInput | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const date =
      trimmed.length <= 10 && !trimmed.includes("T")
        ? new Date(`${trimmed}T00:00:00`)
        : new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (typeof value.seconds === "number") {
      const date = new Date(value.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

export function formatRelativeTime(value: DateInput | null | undefined) {
  const date = normalizeToDate(value);
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return date.toLocaleDateString();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function calculateKpis(
  teams: Team[],
  members: TeamMember[],
  assignments: TeamAssignment[],
) {
  const activeTeams = teams.filter((t) => t.status === "Active").length;
  const teamMembers = members.length;
  const openAssignments = assignments.filter((a) => a.status !== "Completed").length;
  const workloadAlerts = members.filter((m) => m.workload >= 85).length;
  return { activeTeams, teamMembers, openAssignments, workloadAlerts };
}

export function getTeamAssignmentCount(teamId: string, assignments: TeamAssignment[]) {
  return assignments.filter((a) => a.teamId === teamId && a.status !== "Completed").length;
}

export function getCapacityClass(capacity: number) {
  if (capacity >= 85) return "tm-capacity-warning";
  if (capacity >= 70) return "tm-capacity-gold";
  return "tm-capacity-normal";
}

export function filterMembers(members: TeamMember[], filters: DirectoryFilters) {
  const q = filters.search.trim().toLowerCase();
  return members.filter((m) => {
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    const matchesDept = filters.department === "All" || m.department === filters.department;
    const matchesRole = filters.role === "All" || m.role === filters.role;
    const matchesTeam =
      filters.team === "All" ||
      m.teamIds.some((id) => {
        return filters.team === id;
      });
    const matchesAvail =
      filters.availability === "All" || m.availability === filters.availability;
    const matchesWorkload =
      filters.workload === "All" ||
      (filters.workload === "High" && m.workload >= 85) ||
      (filters.workload === "Normal" && m.workload < 85);
    return matchesSearch && matchesDept && matchesRole && matchesTeam && matchesAvail && matchesWorkload;
  });
}

export function sortActivity(events: TeamActivityEvent[]) {
  return [...events].sort((a, b) => {
    const bTime = normalizeToDate(b.createdAt)?.getTime() ?? 0;
    const aTime = normalizeToDate(a.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function buildRebalanceSuggestions(
  team: Team,
  members: TeamMember[],
  assignments: TeamAssignment[],
): RebalanceSuggestion[] {
  const teamMembers = members.filter((m) => team.memberIds.includes(m.id));
  const teamAssignments = assignments.filter(
    (a) => a.teamId === team.id && a.status !== "Completed",
  );
  const overloaded = teamMembers.filter((m) => m.workload >= 80);
  const available = teamMembers.filter((m) => m.workload < 70);
  if (overloaded.length === 0 || available.length === 0) return [];

  const suggestions: RebalanceSuggestion[] = [];
  overloaded.forEach((owner) => {
    const ownerAssignments = teamAssignments.filter((a) => a.ownerId === owner.id);
    const candidate = available.sort((a, b) => a.workload - b.workload)[0];
    if (!candidate || ownerAssignments.length === 0) return;
    const assignment = ownerAssignments[0];
    suggestions.push({
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      currentOwnerId: owner.id,
      currentOwnerName: owner.name,
      suggestedOwnerId: candidate.id,
      suggestedOwnerName: candidate.name,
      reason: `${owner.name} is at ${owner.workload}% capacity while ${candidate.name} has available bandwidth.`,
      currentCapacity: owner.workload,
      suggestedCapacity: candidate.workload,
    });
  });
  return suggestions.slice(0, 3);
}

export function getKpiFilteredTeams(teams: Team[], focus: KpiFocus) {
  if (focus === "teams") return teams.filter((t) => t.status === "Active");
  return teams;
}

export function searchTeams(teams: Team[], members: TeamMember[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return teams;
  return teams.filter((t) => {
    const memberNames = members
      .filter((m) => t.memberIds.includes(m.id))
      .map((m) => m.name.toLowerCase());
    return (
      t.name.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.leadName.toLowerCase().includes(q) ||
      memberNames.some((n) => n.includes(q))
    );
  });
}

export function recalculateMemberWorkload(
  memberId: string,
  assignments: TeamAssignment[],
  members: TeamMember[],
): number {
  const count = assignments.filter(
    (a) => a.ownerId === memberId && a.status !== "Completed",
  ).length;
  const base = 40 + count * 8;
  return Math.min(98, base);
}

export function recalculateTeamCapacity(
  team: Team,
  members: TeamMember[],
): number {
  const teamMembers = members.filter((m) => team.memberIds.includes(m.id));
  if (teamMembers.length === 0) return 0;
  const avg =
    teamMembers.reduce((sum, m) => sum + m.workload, 0) / teamMembers.length;
  return Math.round(avg);
}

export function updateMembersWorkload(
  members: TeamMember[],
  assignments: TeamAssignment[],
): TeamMember[] {
  return members.map((m) => ({
    ...m,
    assignmentCount: assignments.filter(
      (a) => a.ownerId === m.id && a.status !== "Completed",
    ).length,
    workload: recalculateMemberWorkload(m.id, assignments, members),
  }));
}

export function updateTeamsCapacity(teams: Team[], members: TeamMember[]): Team[] {
  return teams.map((t) => ({
    ...t,
    capacity: recalculateTeamCapacity(t, members),
  }));
}
