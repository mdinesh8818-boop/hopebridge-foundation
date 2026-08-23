import {
  DEMO_BENEFICIARY_ACTIVITY_IDS,
  isKnownDemoActivityDescription,
  isKnownDemoBeneficiary,
  isKnownDemoCampaign,
  isKnownDemoProgram,
  isKnownDemoVolunteer,
} from "@/data/demo-record-registry";
import type { ActivityRecord } from "../types/activity";
import {
  findDuplicateActivityGroups,
} from "./activityDedupe";
import { deleteDocument, getDocuments } from "./firestore";
import { isDemoSeedEnabled } from "./seed";

const CLEANUP_METADATA_KEY = "demo-cleanup-v1-completed";
const ACTIVITY_DEDUPE_METADATA_KEY = "activity-dedupe-v1-completed";

export type DemoCleanupReport = {
  ran: boolean;
  skippedReason?: string;
  deleted: Record<string, string[]>;
};

export type ActivityDedupeReport = {
  ran: boolean;
  skippedReason?: string;
  deletedIds: string[];
  duplicateGroups: { key: string; keptId: string; removedIds: string[] }[];
};

function isDemoCleanupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_CLEANUP === "true";
}

async function isCleanupComplete(): Promise<boolean> {
  try {
    const metadata = await getDocuments("appMetadata");
    return metadata.some(
      (r) => "key" in r && (r as { key?: string }).key === CLEANUP_METADATA_KEY,
    );
  } catch {
    return false;
  }
}

/**
 * Removes known demo/seed records from Firestore.
 * Requires NEXT_PUBLIC_ENABLE_DEMO_CLEANUP=true.
 * Runs at most once (tracked in appMetadata).
 * Does NOT delete unrecognized records (e.g. "Test Campaign Updated").
 */
export async function cleanupKnownDemoRecords(): Promise<DemoCleanupReport> {
  const empty: DemoCleanupReport = { ran: false, deleted: {} };

  if (!isDemoCleanupEnabled()) {
    return {
      ...empty,
      skippedReason: "NEXT_PUBLIC_ENABLE_DEMO_CLEANUP is not true",
    };
  }

  if (isDemoSeedEnabled()) {
    return {
      ...empty,
      skippedReason:
        "Demo cleanup disabled while NEXT_PUBLIC_ENABLE_DEMO_SEED=true",
    };
  }

  if (await isCleanupComplete()) {
    return { ...empty, skippedReason: "Demo cleanup already completed" };
  }

  const deleted: Record<string, string[]> = {
    campaigns: [],
    programs: [],
    volunteers: [],
    beneficiaries: [],
    activities: [],
    beneficiaryActivity: [],
    donations: [],
  };

  const [
    campaigns,
    programs,
    volunteers,
    beneficiaries,
    activities,
    beneficiaryActivity,
    donations,
  ] = await Promise.all([
    getDocuments("campaigns"),
    getDocuments("programs"),
    getDocuments("volunteers"),
    getDocuments("beneficiaries"),
    getDocuments("activities"),
    getDocuments("beneficiaryActivity"),
    getDocuments("donations"),
  ]);

  for (const c of campaigns as { id: string; name?: string }[]) {
    if (isKnownDemoCampaign(c)) {
      await deleteDocument("campaigns", c.id);
      deleted.campaigns.push(`${c.name} (${c.id})`);
    }
  }

  for (const p of programs as { id: string; name?: string }[]) {
    if (isKnownDemoProgram(p)) {
      await deleteDocument("programs", p.id);
      deleted.programs.push(`${p.name ?? p.id} (${p.id})`);
    }
  }

  for (const v of volunteers as {
    id: string;
    name?: string;
    email?: string;
  }[]) {
    if (isKnownDemoVolunteer(v)) {
      await deleteDocument("volunteers", v.id);
      deleted.volunteers.push(`${v.name ?? v.email} (${v.id})`);
    }
  }

  for (const b of beneficiaries as {
    id: string;
    name?: string;
    beneficiaryId?: string;
  }[]) {
    if (isKnownDemoBeneficiary(b)) {
      await deleteDocument("beneficiaries", b.id);
      deleted.beneficiaries.push(
        `${b.name ?? b.beneficiaryId} (${b.id})`,
      );
    }
  }

  for (const a of activities as { id: string; description?: string }[]) {
    if (isKnownDemoActivityDescription(a.description)) {
      await deleteDocument("activities", a.id);
      deleted.activities.push(`${a.description?.slice(0, 60)} (${a.id})`);
    }
  }

  for (const a of beneficiaryActivity as {
    id: string;
    beneficiaryName?: string;
  }[]) {
    if (
      DEMO_BENEFICIARY_ACTIVITY_IDS.has(a.id) ||
      isKnownDemoActivityDescription(a.beneficiaryName)
    ) {
      await deleteDocument("beneficiaryActivity", a.id);
      deleted.beneficiaryActivity.push(`${a.id}`);
    }
  }

  for (const d of donations as { id: string; campaignName?: string }[]) {
    if (
      d.campaignName &&
      isKnownDemoCampaign({ name: d.campaignName })
    ) {
      await deleteDocument("donations", d.id);
      deleted.donations.push(d.id);
    }
  }

  const { createDocument } = await import("./firestore");
  await createDocument("appMetadata", {
    key: CLEANUP_METADATA_KEY,
    completed: true,
    completedAt: new Date().toISOString(),
  });

  console.info("[HopeBridge] Demo cleanup completed:", deleted);

  return { ran: true, deleted };
}

async function isActivityDedupeComplete(): Promise<boolean> {
  try {
    const metadata = await getDocuments("appMetadata");
    return metadata.some(
      (r) =>
        "key" in r &&
        (r as { key?: string }).key === ACTIVITY_DEDUPE_METADATA_KEY,
    );
  } catch {
    return false;
  }
}

/**
 * Removes duplicate activity documents from Firestore (keeps newest per dedupe key).
 * Runs once, tracked in appMetadata.
 */
export async function cleanupDuplicateActivityRecords(): Promise<ActivityDedupeReport> {
  const empty: ActivityDedupeReport = {
    ran: false,
    deletedIds: [],
    duplicateGroups: [],
  };

  if (await isActivityDedupeComplete()) {
    return { ...empty, skippedReason: "Activity dedupe already completed" };
  }

  const activities = (await getDocuments("activities")) as ActivityRecord[];
  const groups = findDuplicateActivityGroups(activities);
  const deletedIds: string[] = [];
  const duplicateGroups: ActivityDedupeReport["duplicateGroups"] = [];

  for (const group of groups) {
    const [newest, ...older] = group.records;
    const keptId = newest.id ?? "";
    const removedIds: string[] = [];

    for (const record of older) {
      if (!record.id) continue;
      await deleteDocument("activities", record.id);
      deletedIds.push(record.id);
      removedIds.push(record.id);
    }

    if (removedIds.length > 0) {
      duplicateGroups.push({
        key: group.key,
        keptId,
        removedIds,
      });
    }
  }

  const { createDocument } = await import("./firestore");
  await createDocument("appMetadata", {
    key: ACTIVITY_DEDUPE_METADATA_KEY,
    completed: true,
    completedAt: new Date().toISOString(),
    deletedCount: deletedIds.length,
    duplicateGroupCount: duplicateGroups.length,
  });

  if (deletedIds.length > 0) {
    console.info("[HopeBridge] Duplicate activity cleanup completed:", {
      deletedIds,
      duplicateGroups,
    });
  }

  return {
    ran: true,
    deletedIds,
    duplicateGroups,
  };
}
