import type { ActivityRecord, LogActivityInput } from "../types/activity";

export function normalizeActivityDate(value: ActivityRecord["createdAt"]): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? new Date(`${trimmed}T12:00:00`)
      : new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const obj = value as { seconds?: number; toDate?: () => Date };
    if (typeof obj.toDate === "function") {
      const d = obj.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
  }
  return null;
}

export function activityDedupeKey(record: Pick<
  ActivityRecord,
  "module" | "action" | "entityId" | "entityName" | "description"
>): string {
  const isRemoval =
    record.action === "deleted" ||
    /removed/i.test(record.description ?? "") ||
    /removed/i.test(record.action ?? "");

  if (isRemoval) {
    const name =
      record.entityName ??
      record.description?.match(/"([^"]+)"/)?.[1] ??
      "";
    return `${record.module}|delete|${name.toLowerCase()}`;
  }

  return `${record.module}|${record.action}|${record.entityId ?? ""}|${record.entityName ?? ""}`;
}

export function dedupeActivityRecords(
  activities: ActivityRecord[],
): ActivityRecord[] {
  const byId = new Map<string, ActivityRecord>();
  for (const activity of activities) {
    if (activity.id) byId.set(activity.id, activity);
  }

  const bestByKey = new Map<string, ActivityRecord>();
  for (const activity of byId.values()) {
    const key = activityDedupeKey(activity);
    const existing = bestByKey.get(key);
    const activityTime = normalizeActivityDate(activity.createdAt)?.getTime() ?? 0;
    const existingTime = existing
      ? normalizeActivityDate(existing.createdAt)?.getTime() ?? 0
      : -1;
    if (!existing || activityTime > existingTime) {
      bestByKey.set(key, activity);
    }
  }

  return [...bestByKey.values()].sort((a, b) => {
    const bTime = normalizeActivityDate(b.createdAt)?.getTime() ?? 0;
    const aTime = normalizeActivityDate(a.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function buildActivityWriteKey(input: LogActivityInput): string {
  return activityDedupeKey({
    module: input.module,
    action: input.action,
    entityId: input.entityId,
    entityName: input.entityName,
    description: input.description,
  });
}

export function findDuplicateActivityGroups(
  activities: ActivityRecord[],
): { key: string; records: ActivityRecord[] }[] {
  const groups = new Map<string, ActivityRecord[]>();
  for (const activity of activities) {
    if (!activity.id) continue;
    const key = activityDedupeKey(activity);
    const list = groups.get(key) ?? [];
    list.push(activity);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .filter(([, records]) => records.length > 1)
    .map(([key, records]) => ({
      key,
      records: records.sort(
        (a, b) =>
          (normalizeActivityDate(b.createdAt)?.getTime() ?? 0) -
          (normalizeActivityDate(a.createdAt)?.getTime() ?? 0),
      ),
    }));
}
