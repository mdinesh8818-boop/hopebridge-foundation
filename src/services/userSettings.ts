import { getDocument, setDocument } from "./firestore";

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
  if (!userId) {
    throw new Error("A signed-in user is required to load settings.");
  }
  const record = await getDocument(COLLECTION, userId);
  return normalizeSettings(record);
}

export async function saveUserSettings(
  userId: string,
  settings: UserSettings,
): Promise<UserSettings> {
  if (!userId) {
    throw new Error("A signed-in user is required to save settings.");
  }

  const payload: UserSettings = {
    emailNotifications: Boolean(settings.emailNotifications),
    weeklyDigest: Boolean(settings.weeklyDigest),
    compactTables: Boolean(settings.compactTables),
    timezone: settings.timezone.trim() || DEFAULT_USER_SETTINGS.timezone,
    defaultLandingModule:
      settings.defaultLandingModule.trim() ||
      DEFAULT_USER_SETTINGS.defaultLandingModule,
  };

  await setDocument(COLLECTION, userId, payload);

  // Re-read to confirm persistence and return canonical saved values.
  const confirmed = await fetchUserSettings(userId);
  return confirmed;
}

export function describeFirestoreError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to save settings. Please try again.";
  }
  const code =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  if (code.includes("permission-denied")) {
    return "Unable to save settings: Firestore permission denied for userSettings. Ask an administrator to allow authenticated users to read/write their own settings document.";
  }
  if (code.includes("unavailable")) {
    return "Unable to save settings: Firestore is temporarily unavailable. Please retry.";
  }
  return "Unable to save settings. Check your connection and try again.";
}
