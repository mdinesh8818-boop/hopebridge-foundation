import type { User } from "firebase/auth";

import {
  HOPEBRIDGE_ORGANIZATION_ID,
  USER_PROFILES_COLLECTION,
  assertNoSelfAuthorizationChanges,
  buildLegacyActiveProfile,
  buildPendingRegistrationProfile,
  canCompleteSelfServeOrganizationOnboarding,
  canManageUserAccess,
  isAwaitingOrganizationInvite,
  isHopeBridgeAdmin,
  isListedBootstrapAdminEmail,
  isOrganizationAdmin,
  isUserAccessStatus,
  isUserRole,
  sameOrganization,
  shouldPromoteToBootstrapAdmin,
  type UserAccessStatus,
  type UserProfile,
  type UserRole,
} from "@/lib/accessControl";
import { getDocument, getDocuments, setDocument, updateDocument } from "./firestore";

const ACCESS_CONTROL_METADATA_ID = "accessControl";

type AccessControlMetadata = {
  bootstrapAdminEmails?: string[];
  organizationId?: string;
  /** ISO timestamp — Auth accounts created before this are treated as legacy actives. */
  enforceFrom?: string;
};

function coerceString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeUserProfile(
  record: (Record<string, unknown> & { id: string }) | null,
): UserProfile | null {
  if (!record) return null;

  const uid = coerceString(record.uid) || record.id;
  const status = isUserAccessStatus(record.status) ? record.status : "pending";
  const role = isUserRole(record.role) ? record.role : "member";
  // Empty organizationId is allowed (pending invite / awaiting onboarding).
  const organizationId = coerceString(record.organizationId);
  const onboardingComplete =
    typeof record.onboardingComplete === "boolean"
      ? record.onboardingComplete
      : status === "active" && organizationId.trim().length > 0
        ? true
        : false;

  return {
    id: record.id,
    uid,
    email: coerceString(record.email).toLowerCase(),
    displayName: coerceString(record.displayName),
    organizationId,
    role,
    status,
    onboardingComplete,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    approvedAt: record.approvedAt,
    approvedBy:
      typeof record.approvedBy === "string" ? record.approvedBy : null,
    disabledAt: record.disabledAt,
    disabledBy:
      typeof record.disabledBy === "string" ? record.disabledBy : null,
    legacyBackfill: Boolean(record.legacyBackfill),
  };
}

export async function fetchUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  if (!uid) return null;
  const record = await getDocument(USER_PROFILES_COLLECTION, uid);
  return normalizeUserProfile(record);
}

async function fetchAccessControlMetadata(): Promise<AccessControlMetadata> {
  const record = await getDocument("appMetadata", ACCESS_CONTROL_METADATA_ID);
  if (!record) return {};
  const emails = Array.isArray(record.bootstrapAdminEmails)
    ? record.bootstrapAdminEmails
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return {
    bootstrapAdminEmails: emails,
    organizationId:
      typeof record.organizationId === "string"
        ? record.organizationId
        : HOPEBRIDGE_ORGANIZATION_ID,
    enforceFrom:
      typeof record.enforceFrom === "string" ? record.enforceFrom : undefined,
  };
}

export function isPreEnforcementAccount(
  creationTime: string | undefined,
  enforceFrom: string | undefined,
): boolean {
  if (!creationTime || !enforceFrom) return false;
  const created = new Date(creationTime).getTime();
  const cutoff = new Date(enforceFrom).getTime();
  if (Number.isNaN(created) || Number.isNaN(cutoff)) return false;
  return created < cutoff;
}

async function promoteBootstrapAdminProfile(
  uid: string,
): Promise<UserProfile> {
  await updateDocument(USER_PROFILES_COLLECTION, uid, {
    role: "admin",
    status: "active",
    organizationId: HOPEBRIDGE_ORGANIZATION_ID,
    onboardingComplete: true,
    approvedAt: new Date().toISOString(),
    approvedBy: uid,
    disabledAt: null,
    disabledBy: null,
  });
  const promoted = await fetchUserProfile(uid);
  if (!promoted) {
    throw new Error("Unable to promote HopeBridge bootstrap administrator.");
  }
  return promoted;
}

/**
 * Ensures a Firestore userProfiles/{uid} document exists.
 *
 * - New self-registration → pending / member (empty org — may self-serve onboard)
 * - Pre-existing users (have userSettings) → active / hopebridge (or admin if bootstrap email)
 * - Known bootstrap admin emails are elevated to active/admin even if an earlier
 *   login already created an active/member legacy profile
 * - Never silently grants admin to all authenticated accounts
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const email = (user.email ?? "").trim().toLowerCase();
  const displayName = user.displayName ?? "";
  const metadata = await fetchAccessControlMetadata();
  const bootstrapAdmin = isListedBootstrapAdminEmail(
    email,
    metadata.bootstrapAdminEmails,
  );

  const existing = await fetchUserProfile(user.uid);
  if (existing) {
    if (
      shouldPromoteToBootstrapAdmin(
        existing,
        email,
        metadata.bootstrapAdminEmails,
      )
    ) {
      return promoteBootstrapAdminProfile(user.uid);
    }
    return existing;
  }

  const settings = await getDocument("userSettings", user.uid);
  const preEnforcement = isPreEnforcementAccount(
    user.metadata?.creationTime,
    metadata.enforceFrom,
  );
  const isLegacy = !!settings || preEnforcement || bootstrapAdmin;

  const payload = isLegacy
    ? buildLegacyActiveProfile({
        uid: user.uid,
        email,
        displayName,
        role: bootstrapAdmin ? "admin" : "member",
      })
    : buildPendingRegistrationProfile({
        uid: user.uid,
        email,
        displayName,
      });

  await setDocument(USER_PROFILES_COLLECTION, user.uid, {
    ...payload,
    createdAt: new Date().toISOString(),
  });

  const created = await fetchUserProfile(user.uid);
  if (!created) {
    throw new Error("Unable to create HopeBridge user profile.");
  }
  return created;
}

export async function createPendingUserProfile(
  user: User,
): Promise<UserProfile> {
  const existing = await fetchUserProfile(user.uid);
  if (existing) {
    const metadata = await fetchAccessControlMetadata();
    if (
      shouldPromoteToBootstrapAdmin(
        existing,
        user.email ?? "",
        metadata.bootstrapAdminEmails,
      )
    ) {
      return promoteBootstrapAdminProfile(user.uid);
    }
    return existing;
  }

  const email = (user.email ?? "").trim().toLowerCase();
  const metadata = await fetchAccessControlMetadata();
  if (isListedBootstrapAdminEmail(email, metadata.bootstrapAdminEmails)) {
    await setDocument(USER_PROFILES_COLLECTION, user.uid, {
      ...buildLegacyActiveProfile({
        uid: user.uid,
        email,
        displayName: user.displayName,
        role: "admin",
      }),
      createdAt: new Date().toISOString(),
    });
    const created = await fetchUserProfile(user.uid);
    if (!created) {
      throw new Error("Unable to create HopeBridge bootstrap admin profile.");
    }
    return created;
  }

  const payload = buildPendingRegistrationProfile({
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName,
  });

  await setDocument(USER_PROFILES_COLLECTION, user.uid, {
    ...payload,
    createdAt: new Date().toISOString(),
  });

  const created = await fetchUserProfile(user.uid);
  if (!created) {
    throw new Error("Unable to create pending HopeBridge profile.");
  }
  return created;
}

/**
 * User chose to join an existing organization instead of creating one.
 * Keeps status pending with no organizationId until an org admin activates them.
 */
export async function markAwaitingOrganizationInvite(
  uid: string,
): Promise<UserProfile> {
  const existing = await fetchUserProfile(uid);
  if (!existing) throw new Error("User profile not found.");
  if (existing.status === "disabled") {
    throw new Error("Disabled accounts cannot request organization access.");
  }
  if (existing.status === "active" && existing.organizationId.trim()) {
    return existing;
  }

  await updateDocument(USER_PROFILES_COLLECTION, uid, {
    onboardingComplete: true,
  });

  const updated = await fetchUserProfile(uid);
  if (!updated) throw new Error("Profile not found after update.");
  return updated;
}

/**
 * Intentionally unavailable: once a user requests access to an existing
 * organization (or otherwise leaves the onboarding chooser), they must wait
 * for admin activation. Re-opening workspace creation from /auth/pending is
 * not supported.
 */
export async function resumeOrganizationOnboarding(
  uid: string,
): Promise<UserProfile> {
  void uid;
  throw new Error(
    "Workspace creation cannot be resumed after requesting organization access. Wait for an administrator to activate your account, or sign out.",
  );
}

/**
 * Completes nonprofit onboarding: attach user as active admin of a new org.
 * Uses a constrained update path (not generic self-edit).
 */
export async function completeOrganizationOnboarding(input: {
  uid: string;
  organizationId: string;
  displayName?: string;
}): Promise<UserProfile> {
  const organizationId = input.organizationId.trim();
  if (!organizationId) {
    throw new Error("organizationId is required to complete onboarding.");
  }

  const existing = await fetchUserProfile(input.uid);
  if (!existing) {
    throw new Error("User profile not found.");
  }
  if (existing.status === "disabled") {
    throw new Error("Disabled accounts cannot complete onboarding.");
  }
  if (isAwaitingOrganizationInvite(existing)) {
    throw new Error(
      "You already requested access to an existing organization. Wait for an administrator to activate your account.",
    );
  }
  if (!canCompleteSelfServeOrganizationOnboarding(existing)) {
    throw new Error(
      "Only unaffiliated pending accounts can complete self-serve organization setup.",
    );
  }
  if (existing.organizationId.trim() && existing.onboardingComplete) {
    throw new Error("Onboarding is already complete for this account.");
  }
  if (
    existing.organizationId.trim() &&
    existing.organizationId !== organizationId
  ) {
    throw new Error("Account already belongs to a different organization.");
  }

  await updateDocument(USER_PROFILES_COLLECTION, input.uid, {
    organizationId,
    role: "admin",
    status: "active",
    onboardingComplete: true,
    approvedAt: new Date().toISOString(),
    approvedBy: input.uid,
    disabledAt: null,
    disabledBy: null,
    ...(input.displayName !== undefined
      ? { displayName: input.displayName.trim() }
      : {}),
  });

  const updated = await fetchUserProfile(input.uid);
  if (!updated) throw new Error("Profile not found after onboarding.");
  return updated;
}

/**
 * Lists profiles for an organization admin's workspace.
 * Includes org members plus pending users with empty organizationId (awaiting invite).
 */
export async function listUserProfilesForOrganization(
  actor: UserProfile,
): Promise<UserProfile[]> {
  if (!canManageUserAccess(actor)) {
    throw new Error("Only organization administrators can manage user access.");
  }
  const organizationId = actor.organizationId.trim();
  if (!organizationId) {
    return [];
  }

  const { collection, getDocs, query, where } = await import(
    "firebase/firestore"
  );
  const { db } = await import("@/app/lib/firebase");

  const orgQuery = query(
    collection(db, USER_PROFILES_COLLECTION),
    where("organizationId", "==", organizationId),
  );
  const pendingQuery = query(
    collection(db, USER_PROFILES_COLLECTION),
    where("organizationId", "==", ""),
    where("status", "==", "pending"),
  );

  const [orgSnap, pendingSnap] = await Promise.all([
    getDocs(orgQuery),
    getDocs(pendingQuery).catch(() => null),
  ]);

  const byId = new Map<string, UserProfile>();
  for (const snap of [orgSnap, pendingSnap]) {
    if (!snap) continue;
    for (const docSnap of snap.docs) {
      const profile = normalizeUserProfile({
        ...(docSnap.data() as Record<string, unknown>),
        id: docSnap.id,
      });
      if (profile) byId.set(profile.uid, profile);
    }
  }

  return [...byId.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/** @deprecated Prefer listUserProfilesForOrganization */
export async function listUserProfiles(): Promise<UserProfile[]> {
  const docs = await getDocuments(USER_PROFILES_COLLECTION);
  return docs
    .map((docRecord) => normalizeUserProfile(docRecord))
    .filter((profile): profile is UserProfile => !!profile)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function updateOwnDisplayName(
  uid: string,
  displayName: string,
): Promise<UserProfile> {
  assertNoSelfAuthorizationChanges({ displayName });
  await updateDocument(USER_PROFILES_COLLECTION, uid, {
    displayName: displayName.trim(),
  });
  const updated = await fetchUserProfile(uid);
  if (!updated) throw new Error("Profile not found after update.");
  return updated;
}

export async function adminSetUserAccess(input: {
  actor: UserProfile;
  targetUid: string;
  status: UserAccessStatus;
  role?: UserRole;
  /** Admins may assign pending users (no org yet) into their own organization. */
  organizationId?: string;
}): Promise<UserProfile> {
  if (!canManageUserAccess(input.actor)) {
    throw new Error("Only organization administrators can manage user access.");
  }
  if (input.targetUid === input.actor.uid && input.status !== "active") {
    throw new Error("Administrators cannot disable their own account.");
  }

  const target = await fetchUserProfile(input.targetUid);
  if (!target) {
    throw new Error("Target profile not found.");
  }

  const actorOrg = input.actor.organizationId.trim();
  if (!actorOrg) {
    throw new Error("Administrator has no organization.");
  }

  const targetOrg = target.organizationId.trim();
  if (targetOrg) {
    if (!sameOrganization(input.actor, target)) {
      throw new Error(
        "You cannot manage users that belong to another organization.",
      );
    }
  }

  const assignOrg = (input.organizationId ?? actorOrg).trim();
  if (assignOrg !== actorOrg) {
    throw new Error("You can only assign users to your own organization.");
  }

  const patch: Record<string, unknown> = {
    status: input.status,
  };

  // Claim pending empty-org users into the actor's organization; never move orgs.
  if (!targetOrg) {
    patch.organizationId = actorOrg;
  } else {
    patch.organizationId = targetOrg;
  }

  if (input.role) {
    patch.role = input.role;
  }

  if (input.status === "active") {
    patch.approvedAt = new Date().toISOString();
    patch.approvedBy = input.actor.uid;
    patch.disabledAt = null;
    patch.disabledBy = null;
    patch.onboardingComplete = true;
    if (!targetOrg) {
      patch.organizationId = actorOrg;
    }
  }

  if (input.status === "disabled") {
    patch.disabledAt = new Date().toISOString();
    patch.disabledBy = input.actor.uid;
  }

  if (input.status === "pending") {
    patch.approvedAt = null;
    patch.approvedBy = null;
    patch.disabledAt = null;
    patch.disabledBy = null;
  }

  await updateDocument(USER_PROFILES_COLLECTION, input.targetUid, patch);
  const updated = await fetchUserProfile(input.targetUid);
  if (!updated) throw new Error("Target profile not found after update.");
  return updated;
}

export { isHopeBridgeAdmin, isOrganizationAdmin, canManageUserAccess };
