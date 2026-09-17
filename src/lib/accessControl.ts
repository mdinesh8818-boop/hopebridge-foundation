/**
 * HopeBridge access-control constants and pure helpers.
 * Multi-organization workspaces: each user belongs to one organization.
 * Product name = HopeBridge; customer org is identified by organizationId.
 *
 * Preserves PR #15 bootstrap admin promotion for the HopeBridge Foundation tenant.
 */

export { HOPEBRIDGE_ORGANIZATION_ID } from "@/lib/organization";

import { HOPEBRIDGE_ORGANIZATION_ID } from "@/lib/organization";

export const USER_PROFILES_COLLECTION = "userProfiles" as const;

/**
 * Deterministic HopeBridge production/demo administrators.
 * Merged with `appMetadata/accessControl.bootstrapAdminEmails` at runtime.
 * Keep in sync with `firestore.rules` `isKnownBootstrapAdminEmail()`.
 */
export const DEFAULT_BOOTSTRAP_ADMIN_EMAILS = [
  "mdinesh8818@gmail.com",
] as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Union of hardcoded demo admins + configured metadata emails (lowercased). */
export function mergeBootstrapAdminEmails(
  configured: readonly string[] | null | undefined,
): string[] {
  const emails = new Set<string>(
    DEFAULT_BOOTSTRAP_ADMIN_EMAILS.map((email) => normalizeEmail(email)),
  );
  for (const entry of configured ?? []) {
    if (typeof entry !== "string") continue;
    const normalized = normalizeEmail(entry);
    if (normalized) emails.add(normalized);
  }
  return [...emails];
}

export function isListedBootstrapAdminEmail(
  email: string,
  configured?: readonly string[] | null,
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return mergeBootstrapAdminEmails(configured).includes(normalized);
}

/**
 * True when an existing HopeBridge profile should be elevated to active admin
 * because the signed-in email is a known bootstrap administrator.
 * Does not apply to unrelated members or non-HopeBridge orgs.
 */
export function shouldPromoteToBootstrapAdmin(
  profile: Pick<UserProfile, "role" | "status" | "organizationId">,
  email: string,
  configured?: readonly string[] | null,
): boolean {
  if (!isListedBootstrapAdminEmail(email, configured)) return false;
  const orgId = profile.organizationId?.trim() ?? "";
  // Only HopeBridge Foundation tenant (or empty org during signup/onboarding).
  if (orgId && orgId !== HOPEBRIDGE_ORGANIZATION_ID) return false;
  if (
    profile.role === "admin" &&
    profile.status === "active" &&
    orgId === HOPEBRIDGE_ORGANIZATION_ID
  ) {
    return false;
  }
  return true;
}

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

/** HopeBridge Foundation tenant member — used for legacy/bootstrap paths. */
export function isActiveHopeBridgeMember(
  profile: Pick<UserProfile, "status" | "organizationId"> | null | undefined,
): boolean {
  return (
    isActiveOrganizationMember(profile) &&
    profile?.organizationId === HOPEBRIDGE_ORGANIZATION_ID
  );
}

export function isOrganizationAdmin(
  actor:
    | Pick<UserProfile, "status" | "organizationId" | "role">
    | null
    | undefined,
): boolean {
  return isActiveOrganizationMember(actor) && actor?.role === "admin";
}

/** HopeBridge Foundation admin (bootstrap / platform tenant). */
export function isHopeBridgeAdmin(
  profile:
    | Pick<UserProfile, "status" | "organizationId" | "role">
    | null
    | undefined,
): boolean {
  return isActiveHopeBridgeMember(profile) && profile?.role === "admin";
}

/**
 * Org admins may manage users in their own organization.
 * HopeBridge Foundation admins remain able to manage the hopebridge tenant.
 */
export function canManageUserAccess(
  actor:
    | Pick<UserProfile, "status" | "organizationId" | "role">
    | null
    | undefined,
): boolean {
  return isOrganizationAdmin(actor);
}

/**
 * Admin-only dashboard side-effects (appMetadata list/create, demo cleanup).
 * Restricted to HopeBridge Foundation admins so other tenants cannot mutate
 * platform metadata collections.
 */
export function shouldRunAdminOnlyCleanup(
  profile:
    | Pick<UserProfile, "status" | "organizationId" | "role">
    | null
    | undefined,
): boolean {
  return isHopeBridgeAdmin(profile);
}

/**
 * Pending user who already requested membership in an existing organization.
 * They must remain on /auth/pending until an org admin activates them.
 * They must NOT re-enter workspace creation /onboarding.
 */
export function isAwaitingOrganizationInvite(
  profile:
    | Pick<UserProfile, "status" | "organizationId" | "onboardingComplete">
    | null
    | undefined,
): boolean {
  return (
    !!profile &&
    profile.status === "pending" &&
    !profile.organizationId.trim() &&
    profile.onboardingComplete === true
  );
}

/**
 * True only for users who still need the multi-org onboarding chooser
 * (create nonprofit vs request access). Once a join request is submitted,
 * this becomes false and accessRedirectPath sends them to /auth/pending.
 */
export function needsOrganizationOnboarding(
  profile:
    | Pick<UserProfile, "status" | "organizationId" | "onboardingComplete">
    | null
    | undefined,
): boolean {
  if (!profile) return false;
  if (profile.status === "disabled") return false;
  if (isAwaitingOrganizationInvite(profile)) return false;
  if (profile.status === "active" && profile.organizationId.trim()) {
    return profile.onboardingComplete === false;
  }
  // Unaffiliated pending users who have not yet chosen a path.
  return (
    profile.status === "pending" &&
    !profile.organizationId.trim() &&
    profile.onboardingComplete === false
  );
}

/**
 * Resume-create-org escape hatch is intentionally closed once a user has
 * submitted a pending membership request (or otherwise left the chooser).
 */
export function canInitiateWorkspaceCreation(
  profile:
    | Pick<UserProfile, "status" | "organizationId" | "onboardingComplete">
    | null
    | undefined,
): boolean {
  return needsOrganizationOnboarding(profile);
}

export function accessRedirectPath(
  profile:
    | Pick<UserProfile, "status" | "organizationId" | "onboardingComplete">
    | null
    | undefined,
): "/dashboard" | "/onboarding" | "/auth/pending" | "/auth/disabled" {
  if (!profile) return "/auth/pending";
  if (profile.status === "disabled") return "/auth/disabled";
  if (needsOrganizationOnboarding(profile)) return "/onboarding";
  if (profile.status === "active" && profile.organizationId.trim()) {
    return "/dashboard";
  }
  // Pending membership request, pending-with-org, or incomplete profiles.
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
