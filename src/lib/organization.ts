export const DEFAULT_ORGANIZATION_ID = "hopebridge-foundation";
export const DEFAULT_ORGANIZATION_NAME = "HopeBridge Foundation";

/** Minimal role model — extend later without breaking stored values. */
export type UserRole = "administrator" | "member";

export const USER_ROLES: readonly UserRole[] = [
  "administrator",
  "member",
] as const;

export type OrganizationRecord = {
  id: string;
  name: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserProfile = {
  uid: string;
  email: string;
  organizationId: string;
  role: UserRole;
  displayName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export function isUserRole(value: unknown): value is UserRole {
  return value === "administrator" || value === "member";
}

export function isDefaultOrganization(organizationId: string | null | undefined) {
  return organizationId === DEFAULT_ORGANIZATION_ID;
}

export function isAdministrator(role: UserRole | null | undefined) {
  return role === "administrator";
}

/** Application data collections that must be organization-scoped. */
export const ORGANIZATION_SCOPED_COLLECTIONS = [
  "campaigns",
  "programs",
  "donors",
  "donations",
  "volunteers",
  "beneficiaries",
  "beneficiaryActivity",
  "teams",
  "teamMembers",
  "teamAssignments",
  "teamDiscussions",
  "teamMeetings",
  "teamActivity",
  "activities",
  "missionVision",
  "coreValues",
  "strategicGoals",
  "appMetadata",
] as const;

export type OrganizationScopedCollection =
  (typeof ORGANIZATION_SCOPED_COLLECTIONS)[number];

export function isOrganizationScopedCollection(
  collectionName: string,
): collectionName is OrganizationScopedCollection {
  return (ORGANIZATION_SCOPED_COLLECTIONS as readonly string[]).includes(
    collectionName,
  );
}
