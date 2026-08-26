export type VolunteerStatus =
  | "Active"
  | "Completed"
  | "In Progress"
  | "Needs Attention";

export type VolunteerRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  initiative: string;
  availability: string;
  hours: number;
  status: VolunteerStatus;
  lastActivity: string;
};

export type VolunteerWriteData = Omit<VolunteerRecord, "id">;

const VOLUNTEER_STATUSES: VolunteerStatus[] = [
  "Active",
  "Completed",
  "In Progress",
  "Needs Attention",
];

function coerceString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function coerceVolunteerStatus(value: unknown): VolunteerStatus {
  const status = coerceString(value, "Active");
  return VOLUNTEER_STATUSES.includes(status as VolunteerStatus)
    ? (status as VolunteerStatus)
    : "Active";
}

function coerceHours(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatLastActivity(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    return trimmed;
  }

  if (value && typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }
    if (typeof maybeTimestamp.seconds === "number") {
      return new Date(maybeTimestamp.seconds * 1000).toISOString().slice(0, 10);
    }
  }

  return new Date().toISOString().slice(0, 10);
}

export function normalizeVolunteerRecord(
  record: Record<string, unknown> & { id: string },
): VolunteerRecord {
  return {
    id: record.id,
    name: coerceString(record.name),
    email: coerceString(record.email),
    role: coerceString(record.role),
    initiative: coerceString(record.initiative),
    availability: coerceString(record.availability),
    hours: coerceHours(record.hours),
    status: coerceVolunteerStatus(record.status),
    lastActivity: formatLastActivity(record.lastActivity ?? record.updatedAt ?? record.createdAt),
  };
}

export function toVolunteerWriteData(data: VolunteerWriteData): Record<string, unknown> {
  return {
    name: data.name.trim(),
    email: data.email.trim(),
    role: data.role,
    initiative: data.initiative,
    availability: data.availability,
    hours: coerceHours(data.hours),
    status: data.status,
    lastActivity: formatLastActivity(data.lastActivity),
  };
}
