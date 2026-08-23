import type { ActivityModule, ActivityRecord, LogActivityInput } from "../types/activity";
import {
  activityDedupeKey,
  buildActivityWriteKey,
  dedupeActivityRecords,
  normalizeActivityDate,
} from "./activityDedupe";
import { createDocument, getDocuments } from "./firestore";

const WRITE_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function normalizeToDate(value: ActivityRecord["createdAt"]): Date | null {
  return normalizeActivityDate(value);
}

export function formatActivityTime(value: ActivityRecord["createdAt"]): string {
  const date = normalizeToDate(value);
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return date.toLocaleDateString();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function logActivity(input: LogActivityInput): Promise<string | null> {
  try {
    const writeKey = buildActivityWriteKey(input);
    const recent = (await getDocuments("activities")) as ActivityRecord[];
    const now = Date.now();

    for (const activity of recent) {
      if (activityDedupeKey(activity) !== writeKey || !activity.id) continue;
      const createdAt = normalizeActivityDate(activity.createdAt)?.getTime();
      if (createdAt != null && now - createdAt < WRITE_DEDUPE_WINDOW_MS) {
        return activity.id;
      }
    }

    const payload = {
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    return await createDocument("activities", payload);
  } catch (error) {
    console.error("Unable to log activity.", error);
    return null;
  }
}

export async function getActivities(options?: {
  module?: ActivityModule;
  limit?: number;
}): Promise<ActivityRecord[]> {
  try {
    const docs = (await getDocuments("activities")) as ActivityRecord[];
    let list = dedupeActivityRecords(docs);

    if (options?.module) {
      list = list.filter((a) => a.module === options.module);
    }
    if (options?.limit != null) {
      list = list.slice(0, options.limit);
    }
    return list;
  } catch (error) {
    console.error("Unable to load activities.", error);
    return [];
  }
}
