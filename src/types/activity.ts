/** Unified HopeBridge activity / audit event */

export type ActivityModule =
  | "dashboard"
  | "campaigns"
  | "programs"
  | "donors"
  | "volunteers"
  | "beneficiaries"
  | "teams"
  | "missionVision"
  | "analytics";

export type DateInput =
  | string
  | number
  | Date
  | { seconds: number; nanoseconds?: number; toDate?: () => Date };

export type ActivityRecord = {
  id: string;
  organizationId?: string;
  module: ActivityModule;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  description: string;
  performedBy?: string;
  createdAt: DateInput;
  metadata?: Record<string, unknown>;
};

export type LogActivityInput = Omit<ActivityRecord, "id" | "createdAt"> & {
  createdAt?: string;
};
