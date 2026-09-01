import { setDocument, getDocuments } from "./firestore";

export type UserSettings = {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  compactTables: boolean;
  timezone: string;
  defaultLandingModule: string;
};

const COLLECTION = "userSettings";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  emailNotifications: true,
  weeklyDigest: true,
  compactTables: false,
  timezone: "America/New_York",
  defaultLandingModule: "/dashboard",
};

function toBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeSettings(
  record: Record<string, unknown> | null,
): UserSettings {
  if (!record) return { ...DEFAULT_USER_SETTINGS };

  return {
    emailNotifications: toBool(
      record.emailNotifications,
      DEFAULT_USER_SETTINGS.emailNotifications,
    ),
    weeklyDigest: toBool(record.weeklyDigest, DEFAULT_USER_SETTINGS.weeklyDigest),
    compactTables: toBool(record.compactTables, DEFAULT_USER_SETTINGS.compactTables),
    timezone: toText(record.timezone, DEFAULT_USER_SETTINGS.timezone),
    defaultLandingModule: toText(
      record.defaultLandingModule,
      DEFAULT_USER_SETTINGS.defaultLandingModule,
    ),
  };
}

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const docs = await getDocuments(COLLECTION);
  const record = docs.find((doc) => doc.id === userId) ?? null;
  return normalizeSettings(record as Record<string, unknown> | null);
}

export async function saveUserSettings(
  userId: string,
  settings: UserSettings,
): Promise<void> {
  await setDocument(COLLECTION, userId, settings);
}
