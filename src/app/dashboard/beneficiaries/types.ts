export type JourneyStage =
  | "Enrolled"
  | "Needs Assessed"
  | "Support Assigned"
  | "Service Active"
  | "Outcome Review"
  | "Follow-Up";

export type ServiceStatus =
  | "Enrolled"
  | "Active"
  | "Under Review"
  | "Follow-Up Required"
  | "Completed"
  | "Inactive";

export type FollowUpStatus =
  | "None"
  | "Required"
  | "Overdue"
  | "Scheduled"
  | "Completed";

export type OutcomeStatus =
  | "Pending"
  | "Positive"
  | "In Progress"
  | "Review Due";

export type Beneficiary = {
  id: string;
  beneficiaryId: string;
  name: string;
  location: string;
  region: string;
  program: string;
  supportType: string;
  status: ServiceStatus;
  journeyStage: JourneyStage;
  followUpStatus: FollowUpStatus;
  coordinator: string;
  enrollmentDate: string;
  lastSupportDate: string;
  nextFollowUp: string;
  outcomeStatus: OutcomeStatus;
  notes: string;
};

export type BeneficiaryFormData = {
  name: string;
  beneficiaryId: string;
  location: string;
  region: string;
  program: string;
  supportType: string;
  status: ServiceStatus;
  journeyStage: JourneyStage;
  followUpStatus: FollowUpStatus;
  coordinator: string;
  enrollmentDate: string;
  lastSupportDate: string;
  nextFollowUp: string;
  outcomeStatus: OutcomeStatus;
  notes: string;
};

/** Values that may arrive from forms, Firestore, or local state. */
export type DateInput =
  | string
  | number
  | Date
  | { seconds: number; nanoseconds?: number; toDate?: () => Date };

export type ActivityType =
  | "Beneficiary Enrolled"
  | "Service Assigned"
  | "Support Delivered"
  | "Follow-Up Completed"
  | "Outcome Updated"
  | "Program Enrollment Changed"
  | "Status Updated";

export type ActivityEvent = {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  type: ActivityType;
  detail: string;
  createdAt: DateInput;
};

export type BeneficiaryFilters = {
  search: string;
  program: string;
  supportType: string;
  status: string;
  location: string;
  followUpStatus: string;
  coordinator: string;
};

export type ProfileTab =
  | "overview"
  | "services"
  | "programs"
  | "outcomes"
  | "followups"
  | "history";
