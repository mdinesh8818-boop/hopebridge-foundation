/**
 * Multi-organization workspace model for HopeBridge (the product).
 * Existing HopeBridge Foundation tenant uses organizationId = "hopebridge".
 */

export const HOPEBRIDGE_ORGANIZATION_ID = "hopebridge" as const;
export const HOPEBRIDGE_ORGANIZATION_NAME = "HopeBridge Foundation" as const;

export const ORGANIZATIONS_COLLECTION = "organizations" as const;

export type OrganizationType =
  | "foundation"
  | "charity"
  | "ngo"
  | "community"
  | "other";

export type OrganizationRecord = {
  id: string;
  name: string;
  displayName: string;
  organizationType: OrganizationType | string;
  mission: string;
  website: string;
  primaryContact: string;
  contactEmail: string;
  phone: string;
  country: string;
  stateRegion: string;
  logoUrl: string;
  primaryAccent: string;
  createdBy: string;
  onboardingComplete: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/** Collections that must be isolated per organization. */
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
  "organizationProfile",
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

export function isDefaultHopeBridgeOrganization(
  organizationId: string | null | undefined,
): boolean {
  return organizationId === HOPEBRIDGE_ORGANIZATION_ID;
}

export function slugifyOrganizationName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "organization";
}

export function buildOrganizationId(name: string, uid: string): string {
  const slug = slugifyOrganizationName(name);
  const suffix = uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();
  return `${slug}-${suffix || "org"}`;
}
