import type {
  DateInput,
  DirectoryFilters,
  KpiFocus,
  RebalanceSuggestion,
  Team,
  TeamActivityEvent,
  TeamAssignment,
  TeamDiscussion,
  TeamMeeting,
  TeamMember,
  TeamStatus,
  AssignmentPriority,
  AssignmentStatus,
  MemberAvailability,
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

function coerceString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => coerceString(item)).filter(Boolean);
}

function coerceNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function coerceTeamStatus(value: unknown): TeamStatus {
  const status = coerceString(value, "Active");
  if (status === "Planning" || status === "On Hold") return status;
  return "Active";
}

function coerceAssignmentStatus(value: unknown): AssignmentStatus {
  const status = coerceString(value, "To Do");
  const allowed: AssignmentStatus[] = ["To Do", "In Progress", "In Review", "Completed"];
  return allowed.includes(status as AssignmentStatus) ? (status as AssignmentStatus) : "To Do";
}

function coerceAssignmentPriority(value: unknown): AssignmentPriority {
  const priority = coerceString(value, "Medium");
  const allowed: AssignmentPriority[] = ["Low", "Medium", "High", "Critical"];
  return allowed.includes(priority as AssignmentPriority)
    ? (priority as AssignmentPriority)
    : "Medium";
}

function coerceAvailability(value: unknown): MemberAvailability {
  const availability = coerceString(value, "Available");
  const allowed: MemberAvailability[] = [
    "Available",
    "Focused",
    "In Meeting",
    "Remote",
    "On Leave",
  ];
  return allowed.includes(availability as MemberAvailability)
    ? (availability as MemberAvailability)
    : "Available";
}

export function normalizeTeamRecord(record: Record<string, unknown> & { id: string }): Team {
  const memberIds = coerceStringArray(record.memberIds);
  return {
    id: record.id,
    name: coerceString(record.name),
    department: coerceString(record.department),
    description: coerceString(record.description),
    leadId: coerceString(record.leadId),
    leadName: coerceString(record.leadName),
    secondaryLeadId: coerceString(record.secondaryLeadId) || undefined,
    secondaryLeadName: coerceString(record.secondaryLeadName) || undefined,
    memberIds,
    status: coerceTeamStatus(record.status),
    capacity: coerceNumber(record.capacity),
    defaultPermission: coerceString(record.defaultPermission, "Team Lead"),
    nextDeadline: coerceString(record.nextDeadline) || undefined,
  };
}

export function normalizeTeamMemberRecord(
  record: Record<string, unknown> & { id: string },
): TeamMember {
  return {
    id: record.id,
    name: coerceString(record.name),
    email: coerceString(record.email),
    phone: coerceString(record.phone) || undefined,
    role: coerceString(record.role),
    department: coerceString(record.department),
    teamIds: coerceStringArray(record.teamIds),
    assignmentCount: coerceNumber(record.assignmentCount),
    workload: coerceNumber(record.workload),
    availability: coerceAvailability(record.availability),
  };
}

export function normalizeTeamAssignmentRecord(
  record: Record<string, unknown> & { id: string },
): TeamAssignment {
  return {
    id: record.id,
    title: coerceString(record.title),
    ownerId: coerceString(record.ownerId),
    ownerName: coerceString(record.ownerName),
    teamId: coerceString(record.teamId),
    teamName: coerceString(record.teamName),
    priority: coerceAssignmentPriority(record.priority),
    dueDate: coerceString(record.dueDate),
    status: coerceAssignmentStatus(record.status),
  };
}

export function normalizeTeamDiscussionRecord(
  record: Record<string, unknown> & { id: string },
): TeamDiscussion {
  const rawMessages = Array.isArray(record.messages) ? record.messages : [];
  return {
    id: record.id,
    title: coerceString(record.title),
    teamId: coerceString(record.teamId),
    teamName: coerceString(record.teamName),
    participantIds: coerceStringArray(record.participantIds),
    lastMessage: coerceString(record.lastMessage),
    lastActivityAt: coerceString(record.lastActivityAt),
    unreadCount: coerceNumber(record.unreadCount),
    resolved: Boolean(record.resolved),
    messages: rawMessages.map((message, index) => {
      const msg = (message ?? {}) as Record<string, unknown>;
      return {
        id: coerceString(msg.id, `msg-${index}`),
        authorId: coerceString(msg.authorId),
        authorName: coerceString(msg.authorName),
        body: coerceString(msg.body),
        createdAt: coerceString(msg.createdAt),
      };
    }),
  };
}

export function normalizeTeamMeetingRecord(
  record: Record<string, unknown> & { id: string },
): TeamMeeting {
  return {
    id: record.id,
    title: coerceString(record.title),
    teamId: coerceString(record.teamId),
    teamName: coerceString(record.teamName),
    date: coerceString(record.date),
    time: coerceString(record.time),
    attendeeIds: coerceStringArray(record.attendeeIds),
    agenda: coerceString(record.agenda),
    notes: coerceString(record.notes) || undefined,
    actionItems: Array.isArray(record.actionItems)
      ? record.actionItems.map((item) => coerceString(item)).filter(Boolean)
      : undefined,
    completed: Boolean(record.completed),
  };
}

export function normalizeTeamActivityRecord(
  record: Record<string, unknown> & { id: string },
): TeamActivityEvent {
  return {
    id: record.id,
    type: coerceString(record.type, "team_update"),
    detail: coerceString(record.detail),
    teamId: coerceString(record.teamId) || undefined,
    createdAt: (record.createdAt as DateInput) ?? new Date().toISOString(),
  };
}

export function toTeamWriteData(data: Omit<Team, "id" | "capacity"> & { capacity?: number }) {
  return {
    name: data.name.trim(),
    department: data.department,
    description: data.description.trim(),
    leadId: data.leadId,
    leadName: data.leadName,
    secondaryLeadId: data.secondaryLeadId ?? "",
    secondaryLeadName: data.secondaryLeadName ?? "",
    memberIds: data.memberIds,
    status: data.status,
    capacity: data.capacity ?? 0,
    defaultPermission: data.defaultPermission,
    nextDeadline: data.nextDeadline ?? "",
  };
}
