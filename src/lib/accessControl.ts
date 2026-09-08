/**
 * HopeBridge access-control constants and pure helpers.
 * Multi-organization workspaces: each user belongs to one organization.
 * Product name = HopeBridge; customer org is identified by organizationId.
 */

export {
  HOPEBRIDGE_ORGANIZATION_ID,
} from "@/lib/organization";

import { HOPEBRIDGE_ORGANIZATION_ID } from "@/lib/organization";

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
  /** False until nonprofit onboarding finishes for self-serve org creators. */
  onboardingComplete: boolean;
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

/** Fields that must never be self-edited (except via controlled onboarding helpers). */
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
  "onboardingComplete",
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

/** Active member of any organization (not limited to HopeBridge Foundation). */
export function isActiveOrganizationMember(
  profile: Pick<UserProfile, "status" | "organizationId"> | null | undefined,
): boolean {
  return (
    !!profile &&
    profile.status === "active" &&
    typeof profile.organizationId === "string" &&
    profile.organizationId.trim().length > 0
  );
}

/** @deprecated Prefer isActiveOrganizationMember — kept for HopeBridge tenant checks. */
export function isActiveHopeBridgeMember(
  profile: Pick<UserProfile, "status" | "organizationId"> | null | undefined,
): boolean {
  return (
    isActiveOrganizationMember(profile) &&
    profile?.organizationId === HOPEBRIDGE_ORGANIZATION_ID
  );
}

export function isOrganizationAdmin(
  actor: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): boolean {
  return isActiveOrganizationMember(actor) && actor?.role === "admin";
}

/** @deprecated Prefer isOrganizationAdmin */
export function isHopeBridgeAdmin(
  profile: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): boolean {
  return isOrganizationAdmin(profile);
}

export function canManageUserAccess(
  actor: Pick<UserProfile, "status" | "organizationId" | "role"> | null | undefined,
): boolean {
  return isOrganizationAdmin(actor);
}

export function needsOrganizationOnboarding(
  profile: Pick<
    UserProfile,
    "status" | "organizationId" | "onboardingComplete"
  > | null | undefined,
): boolean {
  if (!profile) return false;
  if (profile.status === "disabled") return false;
  if (profile.status === "active" && profile.organizationId.trim()) {
    return profile.onboardingComplete === false;
  }
  // Pending users with no org: onboarding unless they chose "join existing".
  return (
    profile.status === "pending" &&
    !profile.organizationId.trim() &&
    profile.onboardingComplete === false
  );
}

export function accessRedirectPath(
  profile: Pick<
    UserProfile,
    "status" | "organizationId" | "onboardingComplete"
  > | null | undefined,
): "/dashboard" | "/onboarding" | "/auth/pending" | "/auth/disabled" {
  if (!profile) return "/auth/pending";
  if (profile.status === "disabled") return "/auth/disabled";
  if (needsOrganizationOnboarding(profile)) return "/onboarding";
  if (profile.status === "active" && profile.organizationId.trim()) {
    return "/dashboard";
  }
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
        `You cannot change your own ${field}. Contact an organization administrator.`,
      );
    }
  }
}

/**
 * New self-registration: pending, no organization yet.
 * User may complete onboarding to create their nonprofit, or wait for
 * an existing org admin to activate them into that org.
 */
export function buildPendingRegistrationProfile(input: {
  uid: string;
  email: string;
  displayName?: string | null;
}): Omit<UserProfile, "id" | "createdAt" | "updatedAt"> {
  return {
    uid: input.uid,
    email: input.email.trim().toLowerCase(),
    displayName: (input.displayName ?? "").trim(),
    organizationId: "",
    role: "member",
    status: "pending",
    onboardingComplete: false,
    approvedAt: null,
    approvedBy: null,
    disabledAt: null,
    disabledBy: null,
    legacyBackfill: false,
  };
}

/** Pre-existing HopeBridge Foundation users — stay on the hopebridge tenant. */
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
    onboardingComplete: true,
    approvedAt: null,
    approvedBy: null,
    disabledAt: null,
    disabledBy: null,
    legacyBackfill: true,
  };
}

/** True when two profiles share the same non-empty organization. */
export function sameOrganization(
  a: Pick<UserProfile, "organizationId"> | null | undefined,
  b: Pick<UserProfile, "organizationId"> | null | undefined,
): boolean {
  const left = a?.organizationId?.trim() ?? "";
  const right = b?.organizationId?.trim() ?? "";
  return left.length > 0 && left === right;
}
