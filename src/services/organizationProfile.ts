import {
  getDocument,
  getFirestoreOrganizationContext,
  setDocument,
} from "./firestore";
import {
  HOPEBRIDGE_ORGANIZATION_ID,
  HOPEBRIDGE_ORGANIZATION_NAME,
} from "@/lib/organization";

export type OrganizationProfile = {
  organizationName: string;
  legalName: string;
  ein: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  primaryContactName: string;
  primaryContactTitle: string;
  fiscalYearStartMonth: number;
  timezone: string;
  /** External strategy/resources URL — requires admin configuration */
  resourcesUrl: string;
  resourcesLabel: string;
};

const COLLECTION = "organizationProfile";
const LEGACY_HOPEBRIDGE_DOC_ID = "foundation";

export const EMPTY_ORGANIZATION_PROFILE: OrganizationProfile = {
  organizationName: "HopeBridge Foundation",
  legalName: "",
  ein: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  phone: "",
  email: "",
  website: "",
  primaryContactName: "",
  primaryContactTitle: "",
  fiscalYearStartMonth: 1,
  timezone: "America/New_York",
  resourcesUrl: "",
  resourcesLabel: "Core Strategy Resources",
};

function profileDocId(): string {
  return getFirestoreOrganizationContext() || HOPEBRIDGE_ORGANIZATION_ID;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProfile(
  record: Record<string, unknown> | null,
  fallbackName = EMPTY_ORGANIZATION_PROFILE.organizationName,
): OrganizationProfile {
  if (!record) {
    return {
      ...EMPTY_ORGANIZATION_PROFILE,
      organizationName: fallbackName,
    };
  }

  return {
    organizationName: toText(record.organizationName) || fallbackName,
    legalName: toText(record.legalName),
    ein: toText(record.ein),
    addressLine1: toText(record.addressLine1),
    addressLine2: toText(record.addressLine2),
    city: toText(record.city),
    state: toText(record.state),
    postalCode: toText(record.postalCode),
    country: toText(record.country) || EMPTY_ORGANIZATION_PROFILE.country,
    phone: toText(record.phone),
    email: toText(record.email),
    website: toText(record.website),
    primaryContactName: toText(record.primaryContactName),
    primaryContactTitle: toText(record.primaryContactTitle),
    fiscalYearStartMonth: toNumber(
      record.fiscalYearStartMonth,
      EMPTY_ORGANIZATION_PROFILE.fiscalYearStartMonth,
    ),
    timezone: toText(record.timezone) || EMPTY_ORGANIZATION_PROFILE.timezone,
    resourcesUrl: toText(record.resourcesUrl),
    resourcesLabel:
      toText(record.resourcesLabel) || EMPTY_ORGANIZATION_PROFILE.resourcesLabel,
  };
}

function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  return code.includes("permission-denied");
}

/**
 * Read one profile doc. Treat permission-denied as missing so a probe of the
 * canonical org id can fall back to the HopeBridge legacy "foundation" id
 * when older rules still require resource.data on get.
 */
async function readProfileDoc(
  docId: string,
): Promise<Record<string, unknown> | null> {
  try {
    return await getDocument(COLLECTION, docId);
  } catch (error) {
    if (isPermissionDenied(error)) return null;
    throw error;
  }
}

export async function fetchOrganizationProfile(): Promise<OrganizationProfile> {
  const orgId = profileDocId();
  const fallbackName =
    orgId === HOPEBRIDGE_ORGANIZATION_ID
      ? HOPEBRIDGE_ORGANIZATION_NAME
      : EMPTY_ORGANIZATION_PROFILE.organizationName;

  // Canonical id first (matches org context / post-migration saves).
  let record = await readProfileDoc(orgId);

  // Legacy HopeBridge singleton doc id when canonical doc is absent.
  if (!record && orgId === HOPEBRIDGE_ORGANIZATION_ID) {
    record = await readProfileDoc(LEGACY_HOPEBRIDGE_DOC_ID);
  }

  return normalizeProfile(record, fallbackName);
}

export async function saveOrganizationProfile(
  profile: OrganizationProfile,
): Promise<OrganizationProfile> {
  const orgId = profileDocId();
  const fallbackName =
    orgId === HOPEBRIDGE_ORGANIZATION_ID
      ? HOPEBRIDGE_ORGANIZATION_NAME
      : EMPTY_ORGANIZATION_PROFILE.organizationName;

  const payload: OrganizationProfile = {
    organizationName: profile.organizationName.trim() || fallbackName,
    legalName: profile.legalName.trim(),
    ein: profile.ein.trim(),
    addressLine1: profile.addressLine1.trim(),
    addressLine2: profile.addressLine2.trim(),
    city: profile.city.trim(),
    state: profile.state.trim(),
    postalCode: profile.postalCode.trim(),
    country: profile.country.trim() || EMPTY_ORGANIZATION_PROFILE.country,
    phone: profile.phone.trim(),
    email: profile.email.trim(),
    website: profile.website.trim(),
    primaryContactName: profile.primaryContactName.trim(),
    primaryContactTitle: profile.primaryContactTitle.trim(),
    fiscalYearStartMonth: Number.isFinite(profile.fiscalYearStartMonth)
      ? profile.fiscalYearStartMonth
      : EMPTY_ORGANIZATION_PROFILE.fiscalYearStartMonth,
    timezone: profile.timezone.trim() || EMPTY_ORGANIZATION_PROFILE.timezone,
    resourcesUrl: profile.resourcesUrl.trim(),
    resourcesLabel:
      profile.resourcesLabel.trim() || EMPTY_ORGANIZATION_PROFILE.resourcesLabel,
  };

  // setDocument injects organizationId for scoped collections.
  await setDocument(COLLECTION, orgId, payload);

  const confirmed = await fetchOrganizationProfile();
  return confirmed;
}

export function isResourcesUrlConfigured(profile: OrganizationProfile): boolean {
  const url = profile.resourcesUrl.trim();
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function describeOrganizationSaveError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to save organization profile. Please try again.";
  }
  const code =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  if (code.includes("permission-denied")) {
    return "Unable to save organization profile: Firestore permission denied for organizationProfile.";
  }
  if (code.includes("unavailable")) {
    return "Unable to save organization profile: Firestore is temporarily unavailable. Please retry.";
  }
  return "Unable to save organization profile. Check your connection and try again.";
}
