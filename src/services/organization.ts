import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../app/lib/firebase";
import {
  DEFAULT_ORGANIZATION_ID,
  DEFAULT_ORGANIZATION_NAME,
  isUserRole,
  type OrganizationRecord,
  type UserProfile,
  type UserRole,
} from "../lib/organization";

const USERS_COLLECTION = "users";
const ORGANIZATIONS_COLLECTION = "organizations";

function buildUserProfile(
  uid: string,
  data: Record<string, unknown>,
): UserProfile {
  const role: UserRole = isUserRole(data.role) ? data.role : "member";
  const organizationId =
    typeof data.organizationId === "string" && data.organizationId.trim()
      ? data.organizationId.trim()
      : DEFAULT_ORGANIZATION_ID;

  return {
    uid,
    email: typeof data.email === "string" ? data.email : "",
    organizationId,
    role,
    displayName:
      typeof data.displayName === "string" ? data.displayName : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snapshot.exists()) return null;
  return buildUserProfile(uid, snapshot.data() as Record<string, unknown>);
}

async function ensureOrganizationDocument(
  organization: Pick<OrganizationRecord, "id" | "name" | "createdBy">,
): Promise<void> {
  const ref = doc(db, ORGANIZATIONS_COLLECTION, organization.id);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    name: organization.name,
    createdBy: organization.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function writeUserProfile(profile: {
  uid: string;
  email: string;
  organizationId: string;
  role: UserRole;
  displayName?: string;
}): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, profile.uid);
  await setDoc(
    ref,
    {
      email: profile.email,
      organizationId: profile.organizationId,
      role: profile.role,
      displayName: profile.displayName ?? null,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  const saved = await getUserProfile(profile.uid);
  if (!saved) {
    throw new Error("Failed to persist user profile.");
  }
  return saved;
}

/**
 * Ensure the shared legacy organization exists so pre-existing Firestore
 * records can be associated without wiping data.
 */
export async function ensureDefaultOrganization(createdBy: string): Promise<void> {
  await ensureOrganizationDocument({
    id: DEFAULT_ORGANIZATION_ID,
    name: DEFAULT_ORGANIZATION_NAME,
    createdBy,
  });
}

/**
 * Existing Firebase accounts (no users/ doc yet) join the default organization
 * as administrators so primary accounts keep working with legacy data.
 */
export async function ensureLegacyUserMembership(
  user: User,
): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  await ensureDefaultOrganization(user.uid);

  return writeUserProfile({
    uid: user.uid,
    email: user.email ?? "",
    organizationId: DEFAULT_ORGANIZATION_ID,
    role: "administrator",
    displayName: user.displayName ?? undefined,
  });
}

/**
 * New sign-ups get an isolated organization with the creator as administrator.
 */
export async function createOrganizationMembershipForNewUser(
  user: User,
): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const organizationId = `org_${user.uid}`;
  const emailLocal = (user.email ?? "workspace").split("@")[0] || "workspace";
  const organizationName = `${emailLocal}'s Organization`;

  await ensureOrganizationDocument({
    id: organizationId,
    name: organizationName,
    createdBy: user.uid,
  });

  return writeUserProfile({
    uid: user.uid,
    email: user.email ?? "",
    organizationId,
    role: "administrator",
    displayName: user.displayName ?? undefined,
  });
}

/**
 * Resolve membership for an authenticated session.
 * Creates a legacy default-org profile when the users/ doc is missing.
 */
export async function resolveUserMembership(user: User): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;
  return ensureLegacyUserMembership(user);
}
