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

/**
 * Workspace branding / configuration for a customer nonprofit.
 * HopeBridge remains the product; these fields customize the tenant workspace.
 * Phase 1 establishes the model — full white-label chrome comes in Phase 2.
 */
export type OrganizationBranding = {
  logoUrl: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

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
  /** @deprecated Prefer branding.logoUrl — kept for older docs. */
  logoUrl: string;
  /** @deprecated Prefer branding.accentColor */
  primaryAccent: string;
  branding: OrganizationBranding;
  createdBy: string;
  onboardingComplete: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const DEFAULT_ORGANIZATION_BRANDING: OrganizationBranding = {
  logoUrl: "",
  tagline: "",
  primaryColor: "#0d5f44",
  secondaryColor: "#112e24",
  accentColor: "#d4af37",
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

export function normalizeOrganizationBranding(
  raw: unknown,
  legacy?: { logoUrl?: string; primaryAccent?: string },
): OrganizationBranding {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const logoFromLegacy =
    typeof legacy?.logoUrl === "string" ? legacy.logoUrl.trim() : "";
  const accentFromLegacy =
    typeof legacy?.primaryAccent === "string" ? legacy.primaryAccent.trim() : "";

  return {
    logoUrl:
      (typeof source.logoUrl === "string" ? source.logoUrl.trim() : "") ||
      logoFromLegacy,
    tagline: typeof source.tagline === "string" ? source.tagline.trim() : "",
    primaryColor:
      (typeof source.primaryColor === "string" && source.primaryColor.trim()) ||
      DEFAULT_ORGANIZATION_BRANDING.primaryColor,
    secondaryColor:
      (typeof source.secondaryColor === "string" &&
        source.secondaryColor.trim()) ||
      DEFAULT_ORGANIZATION_BRANDING.secondaryColor,
    accentColor:
      (typeof source.accentColor === "string" && source.accentColor.trim()) ||
      (accentFromLegacy && accentFromLegacy.startsWith("#")
        ? accentFromLegacy
        : "") ||
      DEFAULT_ORGANIZATION_BRANDING.accentColor,
  };
}
