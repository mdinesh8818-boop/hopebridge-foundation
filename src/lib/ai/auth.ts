import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "@/lib/auth";
import {
  HOPEBRIDGE_ORGANIZATION_ID,
  isActiveOrganizationMember,
  type UserAccessStatus,
  type UserProfile,
  type UserRole,
} from "@/lib/accessControl";
import { firebaseWebConfig } from "@/app/lib/firebase";

export type AuthorizedHopeBridgeSession = {
  uid: string;
  email: string;
  profile: UserProfile;
};

function isUserAccessStatus(value: unknown): value is UserAccessStatus {
  return value === "pending" || value === "active" || value === "disabled";
}

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "manager" || value === "member";
}

async function verifyFirebaseIdToken(idToken: string): Promise<{
  uid: string;
  email: string;
} | null> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseWebConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const user = payload.users?.[0];
  if (!user?.localId) return null;

  return {
    uid: user.localId,
    email: (user.email ?? "").toLowerCase(),
  };
}

async function fetchProfileWithUserToken(
  uid: string,
  idToken: string,
): Promise<UserProfile | null> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${firebaseWebConfig.projectId}` +
    `/databases/(default)/documents/userProfiles/${encodeURIComponent(uid)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    fields?: Record<string, { stringValue?: string; booleanValue?: boolean }>;
  };

  const fields = payload.fields ?? {};
  const status = fields.status?.stringValue;
  const role = fields.role?.stringValue;
  const organizationId = fields.organizationId?.stringValue ?? "";
  const onboardingComplete =
    typeof fields.onboardingComplete?.booleanValue === "boolean"
      ? fields.onboardingComplete.booleanValue
      : organizationId === HOPEBRIDGE_ORGANIZATION_ID;

  return {
    id: uid,
    uid,
    email: (fields.email?.stringValue ?? "").toLowerCase(),
    displayName: fields.displayName?.stringValue ?? "",
    organizationId,
    role: isUserRole(role) ? role : "member",
    status: isUserAccessStatus(status) ? status : "pending",
    onboardingComplete,
    legacyBackfill: Boolean(fields.legacyBackfill?.booleanValue),
  };
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

/**
 * Cookie presence check kept for transitional compatibility.
 * Prefer requireActiveHopeBridgeSession for organizational endpoints.
 */
export async function isHopeBridgeSessionAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;
}

/**
 * Requires a Firebase ID token AND an active organization member profile.
 * Pending/disabled/missing profiles are rejected.
 * Function name kept for callers; membership is any active org, not HopeBridge-only.
 */
export async function requireActiveHopeBridgeSession(
  request: Request,
): Promise<AuthorizedHopeBridgeSession | null> {
  const idToken = extractBearerToken(request);
  if (!idToken) return null;

  const identity = await verifyFirebaseIdToken(idToken);
  if (!identity) return null;

  const profile = await fetchProfileWithUserToken(identity.uid, idToken);
  if (!isActiveOrganizationMember(profile)) return null;

  return {
    uid: identity.uid,
    email: identity.email || profile!.email,
    profile: profile!,
  };
}
