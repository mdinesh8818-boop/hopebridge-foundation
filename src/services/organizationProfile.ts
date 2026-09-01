import { getDocuments, setDocument } from "./firestore";

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
const DOC_ID = "foundation";

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

function toText(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProfile(
  record: Record<string, unknown> | null,
): OrganizationProfile {
  if (!record) return { ...EMPTY_ORGANIZATION_PROFILE };

  return {
    organizationName:
      toText(record.organizationName) || EMPTY_ORGANIZATION_PROFILE.organizationName,
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

export async function fetchOrganizationProfile(): Promise<OrganizationProfile> {
  const docs = await getDocuments(COLLECTION);
  const record = docs.find((doc) => doc.id === DOC_ID) ?? docs[0] ?? null;
  return normalizeProfile(record as Record<string, unknown> | null);
}

export async function saveOrganizationProfile(
  profile: OrganizationProfile,
): Promise<void> {
  await setDocument(COLLECTION, DOC_ID, profile);
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
