import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import {
  DEFAULT_ORGANIZATION_BRANDING,
  HOPEBRIDGE_ORGANIZATION_ID,
  HOPEBRIDGE_ORGANIZATION_NAME,
  ORGANIZATIONS_COLLECTION,
  buildOrganizationId,
  normalizeOrganizationBranding,
  type OrganizationBranding,
  type OrganizationRecord,
  type OrganizationType,
} from "@/lib/organization";

export type OrganizationInput = {
  name: string;
  displayName?: string;
  organizationType?: OrganizationType | string;
  mission?: string;
  website?: string;
  primaryContact?: string;
  contactEmail?: string;
  phone?: string;
  country?: string;
  stateRegion?: string;
  logoUrl?: string;
  primaryAccent?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  branding?: Partial<OrganizationBranding> | OrganizationBranding;
  createdBy: string;
  onboardingComplete?: boolean;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hopeBridgeFallbackRecord(): OrganizationRecord {
  return {
    id: HOPEBRIDGE_ORGANIZATION_ID,
    name: HOPEBRIDGE_ORGANIZATION_NAME,
    displayName: HOPEBRIDGE_ORGANIZATION_NAME,
    organizationType: "foundation",
    mission: "",
    website: "",
    primaryContact: "",
    contactEmail: "",
    phone: "",
    country: "",
    stateRegion: "",
    logoUrl: "",
    primaryAccent: "",
    branding: { ...DEFAULT_ORGANIZATION_BRANDING },
    createdBy: "system",
    onboardingComplete: true,
  };
}

function resolveBrandingFromInput(
  input: Partial<OrganizationInput>,
): OrganizationBranding {
  const legacyLogo = asString(input.logoUrl);
  const legacyAccent = asString(input.primaryAccent);
  const flatPartial = {
    logoUrl: asString(input.logoUrl) || undefined,
    tagline: asString(input.tagline) || undefined,
    primaryColor: asString(input.primaryColor) || undefined,
    secondaryColor: asString(input.secondaryColor) || undefined,
    accentColor:
      asString(input.accentColor) ||
      (legacyAccent.startsWith("#") ? legacyAccent : undefined),
  };

  return normalizeOrganizationBranding(
    input.branding
      ? { ...flatPartial, ...input.branding }
      : flatPartial,
    { logoUrl: legacyLogo, primaryAccent: legacyAccent },
  );
}

export function mapOrganizationDoc(
  id: string,
  data: Record<string, unknown> | undefined,
): OrganizationRecord | null {
  if (!data) return null;
  const name = asString(data.name) || asString(data.displayName);
  if (!name) return null;

  const branding = normalizeOrganizationBranding(data.branding, {
    logoUrl: asString(data.logoUrl),
    primaryAccent: asString(data.primaryAccent),
  });

  return {
    id,
    name,
    displayName: asString(data.displayName) || name,
    organizationType: (asString(data.organizationType) ||
      "nonprofit") as OrganizationRecord["organizationType"],
    mission: asString(data.mission),
    website: asString(data.website),
    primaryContact: asString(data.primaryContact),
    contactEmail: asString(data.contactEmail),
    phone: asString(data.phone),
    country: asString(data.country),
    stateRegion: asString(data.stateRegion),
    logoUrl: branding.logoUrl || asString(data.logoUrl),
    primaryAccent: asString(data.primaryAccent) || branding.accentColor,
    branding,
    createdBy: asString(data.createdBy),
    onboardingComplete: data.onboardingComplete !== false,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  };
}

export async function getOrganizationById(
  organizationId: string,
): Promise<OrganizationRecord | null> {
  const id = organizationId.trim();
  if (!id) return null;

  const snap = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, id));
  if (!snap.exists()) {
    if (id === HOPEBRIDGE_ORGANIZATION_ID) {
      return hopeBridgeFallbackRecord();
    }
    return null;
  }

  return mapOrganizationDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function ensureHopeBridgeOrganization(): Promise<OrganizationRecord> {
  const ref = doc(db, ORGANIZATIONS_COLLECTION, HOPEBRIDGE_ORGANIZATION_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return (
      mapOrganizationDoc(snap.id, snap.data() as Record<string, unknown>) ??
      hopeBridgeFallbackRecord()
    );
  }

  const branding = { ...DEFAULT_ORGANIZATION_BRANDING };
  const payload = {
    name: HOPEBRIDGE_ORGANIZATION_NAME,
    displayName: HOPEBRIDGE_ORGANIZATION_NAME,
    organizationType: "foundation",
    mission: "",
    website: "",
    primaryContact: "",
    contactEmail: "",
    phone: "",
    country: "United States",
    stateRegion: "",
    logoUrl: branding.logoUrl,
    primaryAccent: "emerald",
    branding,
    createdBy: "system",
    onboardingComplete: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload);
  return {
    id: HOPEBRIDGE_ORGANIZATION_ID,
    ...payload,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export async function createOrganization(
  input: OrganizationInput,
): Promise<OrganizationRecord> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Organization name is required.");
  }

  const organizationId = buildOrganizationId(name, input.createdBy);
  const ref = doc(db, ORGANIZATIONS_COLLECTION, organizationId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(
      "An organization with a similar name already exists. Choose a more distinctive name.",
    );
  }

  const displayName = (input.displayName || name).trim();
  const branding = resolveBrandingFromInput(input);
  const primaryAccent =
    asString(input.primaryAccent) || branding.accentColor || "emerald";

  const payload = {
    name,
    displayName,
    organizationType:
      (input.organizationType || "nonprofit").toString().trim() || "nonprofit",
    mission: (input.mission || "").trim(),
    website: (input.website || "").trim(),
    primaryContact: (input.primaryContact || "").trim(),
    contactEmail: (input.contactEmail || "").trim().toLowerCase(),
    phone: (input.phone || "").trim(),
    country: (input.country || "").trim(),
    stateRegion: (input.stateRegion || "").trim(),
    logoUrl: branding.logoUrl || (input.logoUrl || "").trim(),
    primaryAccent,
    branding,
    createdBy: input.createdBy,
    onboardingComplete: input.onboardingComplete !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload);

  return {
    id: organizationId,
    ...payload,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export async function updateOrganization(
  organizationId: string,
  updates: Partial<OrganizationInput>,
  actorUid: string,
): Promise<void> {
  const id = organizationId.trim();
  if (!id) throw new Error("Organization id is required.");
  if (!actorUid.trim()) throw new Error("Authenticated actor is required.");

  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.displayName !== undefined) {
    patch.displayName = updates.displayName.trim();
  }
  if (updates.organizationType !== undefined) {
    patch.organizationType = updates.organizationType.toString().trim();
  }
  if (updates.mission !== undefined) patch.mission = updates.mission.trim();
  if (updates.website !== undefined) patch.website = updates.website.trim();
  if (updates.primaryContact !== undefined) {
    patch.primaryContact = updates.primaryContact.trim();
  }
  if (updates.contactEmail !== undefined) {
    patch.contactEmail = updates.contactEmail.trim().toLowerCase();
  }
  if (updates.phone !== undefined) patch.phone = updates.phone.trim();
  if (updates.country !== undefined) patch.country = updates.country.trim();
  if (updates.stateRegion !== undefined) {
    patch.stateRegion = updates.stateRegion.trim();
  }
  if (updates.onboardingComplete !== undefined) {
    patch.onboardingComplete = updates.onboardingComplete;
  }

  const brandingTouched =
    updates.branding !== undefined ||
    updates.logoUrl !== undefined ||
    updates.tagline !== undefined ||
    updates.primaryColor !== undefined ||
    updates.secondaryColor !== undefined ||
    updates.accentColor !== undefined ||
    updates.primaryAccent !== undefined;

  if (brandingTouched) {
    const existing = await getDoc(doc(db, ORGANIZATIONS_COLLECTION, id));
    const existingData = existing.exists()
      ? (existing.data() as Record<string, unknown>)
      : {};
    const current = normalizeOrganizationBranding(existingData.branding, {
      logoUrl: asString(existingData.logoUrl),
      primaryAccent: asString(existingData.primaryAccent),
    });
    const next = normalizeOrganizationBranding(
      {
        ...current,
        ...(updates.branding ?? {}),
        ...(updates.logoUrl !== undefined
          ? { logoUrl: updates.logoUrl.trim() }
          : {}),
        ...(updates.tagline !== undefined
          ? { tagline: updates.tagline.trim() }
          : {}),
        ...(updates.primaryColor !== undefined
          ? { primaryColor: updates.primaryColor.trim() }
          : {}),
        ...(updates.secondaryColor !== undefined
          ? { secondaryColor: updates.secondaryColor.trim() }
          : {}),
        ...(updates.accentColor !== undefined
          ? { accentColor: updates.accentColor.trim() }
          : {}),
      },
      {
        logoUrl:
          updates.logoUrl !== undefined
            ? updates.logoUrl.trim()
            : current.logoUrl,
        primaryAccent:
          updates.primaryAccent !== undefined
            ? updates.primaryAccent.trim()
            : asString(existingData.primaryAccent),
      },
    );
    patch.branding = next;
    patch.logoUrl = next.logoUrl;
    if (updates.primaryAccent !== undefined) {
      patch.primaryAccent = updates.primaryAccent.trim();
    } else if (updates.accentColor !== undefined) {
      patch.primaryAccent = next.accentColor;
    }
  } else {
    if (updates.logoUrl !== undefined) patch.logoUrl = updates.logoUrl.trim();
    if (updates.primaryAccent !== undefined) {
      patch.primaryAccent = updates.primaryAccent.trim();
    }
  }

  await updateDoc(doc(db, ORGANIZATIONS_COLLECTION, id), patch);
}

export function organizationDisplayName(
  organization: OrganizationRecord | null | undefined,
  fallback = HOPEBRIDGE_ORGANIZATION_NAME,
): string {
  if (!organization) return fallback;
  return organization.displayName || organization.name || fallback;
}
