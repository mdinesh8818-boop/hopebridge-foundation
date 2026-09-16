import type { User } from "firebase/auth";

import {
  HOPEBRIDGE_ORGANIZATION_ID,
  USER_PROFILES_COLLECTION,
  assertNoSelfAuthorizationChanges,
  buildLegacyActiveProfile,
  buildPendingRegistrationProfile,
  canManageUserAccess,
  isHopeBridgeAdmin,
  isListedBootstrapAdminEmail,
  isUserAccessStatus,
  isUserRole,
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
  const organizationId =
    coerceString(record.organizationId) || HOPEBRIDGE_ORGANIZATION_ID;

  return {
    id: record.id,
    uid,
    email: coerceString(record.email).toLowerCase(),
    displayName: coerceString(record.displayName),
    organizationId,
    role,
    status,
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
 * - New self-registration → pending / member
 * - Pre-existing users (have userSettings) → active / member (or admin if bootstrap email)
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
  if (existing) return existing;

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

export async function listUserProfiles(): Promise<UserProfile[]> {
  const docs = await getDocuments(USER_PROFILES_COLLECTION);
  return docs
    .map((doc) => normalizeUserProfile(doc))
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
}): Promise<UserProfile> {
  if (!canManageUserAccess(input.actor)) {
    throw new Error("Only HopeBridge administrators can manage user access.");
  }
  if (input.targetUid === input.actor.uid && input.status !== "active") {
    throw new Error("Administrators cannot disable their own account.");
  }

  const patch: Record<string, unknown> = {
    status: input.status,
  };

  if (input.role) {
    patch.role = input.role;
  }

  if (input.status === "active") {
    patch.approvedAt = new Date().toISOString();
    patch.approvedBy = input.actor.uid;
    patch.disabledAt = null;
    patch.disabledBy = null;
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

export { isHopeBridgeAdmin, canManageUserAccess };
