export type TeamStatus = "Active" | "Planning" | "On Hold";
export type AssignmentStatus = "To Do" | "In Progress" | "In Review" | "Completed";
export type AssignmentPriority = "Low" | "Medium" | "High" | "Critical";
export type MemberAvailability =
  | "Available"
  | "Focused"
  | "In Meeting"
  | "Remote"
  | "On Leave";

export type WorkspaceTab =
  | "overview"
  | "directory"
  | "assignments"
  | "discussions"
  | "meetings"
  | "permissions";

export type TeamDetailTab =
  | "overview"
  | "members"
  | "assignments"
  | "discussions"
  | "meetings"
  | "files"
  | "activity";

export type KpiFocus = "teams" | "members" | "assignments" | "workload";

export type DateInput =
  | string
  | number
  | Date
  | { seconds: number; nanoseconds?: number; toDate?: () => Date };

export type Team = {
  id: string;
  name: string;
  department: string;
  description: string;
  leadId: string;
  leadName: string;
  secondaryLeadId?: string;
  secondaryLeadName?: string;
  memberIds: string[];
  status: TeamStatus;
  capacity: number;
  defaultPermission: string;
  nextDeadline?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  teamIds: string[];
  assignmentCount: number;
  workload: number;
  availability: MemberAvailability;
};

export type TeamAssignment = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  teamId: string;
  teamName: string;
  priority: AssignmentPriority;
  dueDate: string;
  status: AssignmentStatus;
};

export type DiscussionMessage = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type TeamDiscussion = {
  id: string;
  title: string;
  teamId: string;
  teamName: string;
  participantIds: string[];
  lastMessage: string;
  lastActivityAt: string;
  unreadCount: number;
  resolved: boolean;
  messages: DiscussionMessage[];
};

export type TeamMeeting = {
  id: string;
  title: string;
  teamId: string;
  teamName: string;
  date: string;
  time: string;
  attendeeIds: string[];
  agenda: string;
  notes?: string;
  actionItems?: string[];
  completed: boolean;
};

export type TeamActivityEvent = {
  id: string;
  type: string;
  detail: string;
  teamId?: string;
  createdAt: DateInput;
};

export type CreateTeamForm = {
  name: string;
  department: string;
  description: string;
  leadId: string;
  secondaryLeadId: string;
  memberIds: string[];
  defaultPermission: string;
};

export type DirectoryFilters = {
  search: string;
  department: string;
  role: string;
  team: string;
  availability: string;
  workload: string;
};

export type PermissionRole = {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
};

export type RebalanceSuggestion = {
  assignmentId: string;
  assignmentTitle: string;
  currentOwnerId: string;
  currentOwnerName: string;
  suggestedOwnerId: string;
  suggestedOwnerName: string;
  reason: string;
  currentCapacity: number;
  suggestedCapacity: number;
};
