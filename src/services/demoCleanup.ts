import {
  DEMO_BENEFICIARY_ACTIVITY_IDS,
  isKnownDemoActivityDescription,
  isKnownDemoBeneficiary,
  isKnownDemoCampaign,
  isKnownDemoProgram,
  isKnownDemoVolunteer,
} from "@/data/demo-record-registry";
import { auth } from "@/app/lib/firebase";
import {
  shouldRunAdminOnlyCleanup,
} from "@/lib/accessControl";
import type { ActivityRecord } from "../types/activity";
import {
  findDuplicateActivityGroups,
} from "./activityDedupe";
import { deleteDocument, getDocuments } from "./firestore";
import { isDemoSeedEnabled } from "./seed";
import { fetchUserProfile } from "./userProfile";

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

const EMPTY_DEMO_DELETED: Record<string, string[]> = {
  campaigns: [],
  programs: [],
  volunteers: [],
  beneficiaries: [],
  activities: [],
  beneficiaryActivity: [],
  donations: [],
};

export { shouldRunAdminOnlyCleanup };

function isDemoCleanupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_CLEANUP === "true";
}

async function currentUserMayRunAdminCleanup(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const profile = await fetchUserProfile(user.uid);
    return shouldRunAdminOnlyCleanup(profile);
  } catch {
    return false;
  }
}

async function isCleanupComplete(): Promise<boolean> {
  try {
    const metadata = await getDocuments("appMetadata");
    return metadata.some(
      (r) => "key" in r && (r as { key?: string }).key === CLEANUP_METADATA_KEY,
    );
  } catch {
    // Non-admins cannot list appMetadata — treat as incomplete only for admins
    // who will retry; callers must gate non-admins before reaching here.
    return false;
  }
}

/**
 * Removes known demo/seed records from Firestore.
 * Requires NEXT_PUBLIC_ENABLE_DEMO_CLEANUP=true.
 * Runs at most once (tracked in appMetadata).
 * Admin-only: members skip (appMetadata list/create is admin-restricted).
 * Never throws — returns a skipped report on failure.
 */
export async function cleanupKnownDemoRecords(): Promise<DemoCleanupReport> {
  const empty: DemoCleanupReport = { ran: false, deleted: { ...EMPTY_DEMO_DELETED } };

  try {
    if (!(await currentUserMayRunAdminCleanup())) {
      return {
        ...empty,
        skippedReason: "Admin-only demo cleanup skipped for non-admin session",
      };
    }

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
  } catch (error) {
    console.warn("[HopeBridge] Demo cleanup skipped after error.", error);
    return {
      ...empty,
      skippedReason:
        error instanceof Error
          ? `Demo cleanup failed: ${error.message}`
          : "Demo cleanup failed",
    };
  }
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
 * Admin-only: members skip (appMetadata list/create is admin-restricted).
 * Never throws — returns a skipped report on failure.
 */
export async function cleanupDuplicateActivityRecords(): Promise<ActivityDedupeReport> {
  const empty: ActivityDedupeReport = {
    ran: false,
    deletedIds: [],
    duplicateGroups: [],
  };

  try {
    if (!(await currentUserMayRunAdminCleanup())) {
      return {
        ...empty,
        skippedReason:
          "Admin-only activity dedupe cleanup skipped for non-admin session",
      };
    }

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
  } catch (error) {
    console.warn(
      "[HopeBridge] Activity dedupe cleanup skipped after error.",
      error,
    );
    return {
      ...empty,
      skippedReason:
        error instanceof Error
          ? `Activity dedupe cleanup failed: ${error.message}`
          : "Activity dedupe cleanup failed",
    };
  }
}

/**
 * Runs dashboard cleanup side-effects without ever rejecting.
 * Used so cleanup permission failures cannot block organization data reads.
 */
export async function runIsolatedDashboardCleanup(): Promise<{
  cleanupReport: DemoCleanupReport;
  activityDedupeReport: ActivityDedupeReport;
}> {
  const [demoResult, dedupeResult] = await Promise.allSettled([
    cleanupKnownDemoRecords(),
    cleanupDuplicateActivityRecords(),
  ]);

  const cleanupReport: DemoCleanupReport =
    demoResult.status === "fulfilled"
      ? demoResult.value
      : {
          ran: false,
          deleted: { ...EMPTY_DEMO_DELETED },
          skippedReason:
            demoResult.reason instanceof Error
              ? `Demo cleanup isolated: ${demoResult.reason.message}`
              : "Demo cleanup isolated failure",
        };

  const activityDedupeReport: ActivityDedupeReport =
    dedupeResult.status === "fulfilled"
      ? dedupeResult.value
      : {
          ran: false,
          deletedIds: [],
          duplicateGroups: [],
          skippedReason:
            dedupeResult.reason instanceof Error
              ? `Activity dedupe isolated: ${dedupeResult.reason.message}`
              : "Activity dedupe isolated failure",
        };

  return { cleanupReport, activityDedupeReport };
}
