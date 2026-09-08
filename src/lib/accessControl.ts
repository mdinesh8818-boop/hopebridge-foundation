/**
 * HopeBridge access-control constants and pure helpers.
 * Single-organization workspace with explicit membership + approval status.
 */

export const HOPEBRIDGE_ORGANIZATION_ID = "hopebridge" as const;

export const USER_PROFILES_COLLECTION = "userProfiles" as const;

export type UserAccessStatus = "pending" | "active" | "disabled";
export type UserRole = "admin" | "manager" | "member";

export const USER_ACCESS_STATUSES: UserAccessStatus[] = [
  "pending",
  "active",
  "disabled",
];

export const USER_ROLES: UserRole[] = ["admin", "manager", "member"];

export type UserProfile = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: UserRole;
  status: UserAccessStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  approvedAt?: unknown;
  approvedBy?: string | null;
  disabledAt?: unknown;
  disabledBy?: string | null;
  /** True when profile was auto-created for a pre-existing app user. */
  legacyBackfill?: boolean;
};

/** Fields a member may safely update on their own profile. */
export const USER_SAFE_SELF_FIELDS = ["displayName"] as const;

/** Fields that must never be self-edited. */
export const USER_PROTECTED_FIELDS = [
  "role",
  "status",
  "organizationId",
  "uid",
  "email",
  "approvedAt",
  "approvedBy",
  "disabledAt",
  "disabledBy",
  "legacyBackfill",
] as const;

export function isUserAccessStatus(value: unknown): value is UserAccessStatus {
  return (
    typeof value === "string" &&
    (USER_ACCESS_STATUSES as string[]).includes(value)
  );
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as string[]).includes(value);
}

export function isActiveHopeBridgeMember(
  profile: Pick<UserProfile, "status" | "organizationId"> | null | undefined,
): boolean {
  return (
    !!profile &&
    profile.status === "active" &&
    profile.organizationId === HOPEBRIDGE_ORGANIZATION_ID
  );
}

export function isHopeBridgeAdmin(
  profile: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): boolean {
  return isActiveHopeBridgeMember(profile) && profile?.role === "admin";
}

export function canManageUserAccess(
  actor: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): boolean {
  return isHopeBridgeAdmin(actor);
}

export function accessRedirectPath(
  profile: Pick<UserProfile, "status"> | null | undefined,
): "/dashboard" | "/auth/pending" | "/auth/disabled" {
  if (!profile) return "/auth/pending";
  if (profile.status === "active") return "/dashboard";
  if (profile.status === "disabled") return "/auth/disabled";
  return "/auth/pending";
}

/**
 * Rejects client payloads that attempt to self-promote authorization fields.
 */
export function assertNoSelfAuthorizationChanges(
  updates: Record<string, unknown>,
): void {
  for (const field of USER_PROTECTED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      throw new Error(
        `You cannot change your own ${field}. Contact a HopeBridge administrator.`,
      );
    }
  }
}

export function buildPendingRegistrationProfile(input: {
  uid: string;
  email: string;
  displayName?: string | null;
}): Omit<UserProfile, "id" | "createdAt" | "updatedAt"> {
  return {
    uid: input.uid,
    email: input.email.trim().toLowerCase(),
    displayName: (input.displayName ?? "").trim(),
    organizationId: HOPEBRIDGE_ORGANIZATION_ID,
    role: "member",
    status: "pending",
    approvedAt: null,
    approvedBy: null,
    disabledAt: null,
    disabledBy: null,
    legacyBackfill: false,
  };
}

export function buildLegacyActiveProfile(input: {
  uid: string;
  email: string;
  displayName?: string | null;
  role?: UserRole;
}): Omit<UserProfile, "id" | "createdAt" | "updatedAt"> {
  return {
    uid: input.uid,
    email: input.email.trim().toLowerCase(),
    displayName: (input.displayName ?? "").trim(),
    organizationId: HOPEBRIDGE_ORGANIZATION_ID,
    role: input.role ?? "member",
    status: "active",
    approvedAt: null,
    approvedBy: null,
    disabledAt: null,
    disabledBy: null,
    legacyBackfill: true,
  };
}
