import {
  DEMO_BENEFICIARY_IDS,
  DEMO_CAMPAIGN_NAMES,
  isKnownDemoBeneficiary,
  isKnownDemoCampaign,
} from "@/data/demo-record-registry";
import type { ActivityRecord } from "../types/activity";
import type { AttentionItem } from "./organizationMetrics";
import type { UpcomingDeadline } from "./organizationSnapshot";
import {
  activityDedupeKey,
  findDuplicateActivityGroups,
  normalizeActivityDate,
} from "./activityDedupe";

type CampaignRow = {
  id: string;
  name?: string;
  status?: string;
  raised?: number;
  goal?: number;
  endDate?: string;
};

type BeneficiaryRow = {
  id: string;
  name?: string;
  beneficiaryId?: string;
  nextFollowUp?: string;
};

export function classifyCampaign(record: CampaignRow) {
  const seeded = Boolean(record.name && DEMO_CAMPAIGN_NAMES.has(record.name));
  return {
    name: record.name ?? record.id,
    source: "Firestore campaigns collection",
    persistent: true,
    seeded,
    userCreated: !seeded,
  };
}

export function classifyBeneficiary(record: BeneficiaryRow) {
  const seeded = isKnownDemoBeneficiary(record);
  return {
    name: record.name ?? record.beneficiaryId ?? record.id,
    beneficiaryId: record.beneficiaryId,
    source: "Firestore beneficiaries collection",
    persistent: true,
    seeded,
    knownDemoId: Boolean(
      record.beneficiaryId && DEMO_BENEFICIARY_IDS.has(record.beneficiaryId),
    ),
  };
}

export function auditCampaignMath(campaigns: CampaignRow[]) {
  const active = campaigns.filter(
    (c) => c.status === "Active" || c.status === "In Progress",
  );
  const totalRaised = campaigns.reduce(
    (sum, c) => sum + (Number(c.raised) || 0),
    0,
  );
  const totalGoal = campaigns.reduce((sum, c) => sum + (Number(c.goal) || 0), 0);
  const progress =
    totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;

  return {
    activeCampaignCount: active.length,
    totalRaised,
    totalGoal,
    progressPercent: progress,
    contributors: campaigns.map((c) => ({
      name: c.name ?? c.id,
      status: c.status,
      raised: Number(c.raised) || 0,
      goal: Number(c.goal) || 0,
      countsAsActive:
        c.status === "Active" || c.status === "In Progress",
    })),
  };
}

export function auditOverdueBeneficiaries(
  beneficiaries: BeneficiaryRow[],
  now = new Date(),
) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return beneficiaries.filter((b) => {
    if (!b.nextFollowUp) return false;
    const due = normalizeActivityDate(b.nextFollowUp);
    return due !== null && due <= today;
  });
}

export function auditActivityRecord(record: ActivityRecord) {
  const duplicates = findDuplicateActivityGroups([record]);
  return {
    id: record.id,
    module: record.module,
    action: record.action,
    entityId: record.entityId,
    entityName: record.entityName,
    description: record.description,
    timestamp: normalizeActivityDate(record.createdAt)?.toISOString() ?? null,
    source: "Firestore activities collection",
    hardCoded: false,
    dedupeKey: activityDedupeKey(record),
    isRemovalEvent:
      record.action === "deleted" || /removed/i.test(record.description ?? ""),
    genuineCrud:
      Boolean(record.module && record.action && record.description) &&
      !/seed|demo|sample/i.test(record.description ?? ""),
  };
}

export function explainNotificationBadge(
  attentionItems: AttentionItem[],
  upcomingDeadlines: UpcomingDeadline[],
) {
  const attention = attentionItems.map((item) => ({
    id: item.id,
    category: "attention" as const,
    title: item.title,
    detail: item.detail,
  }));

  const attentionEntityKeys = new Set(
    attentionItems.map((item) => normalizeNotificationEntityKey(item.title)),
  );

  const deadlines = upcomingDeadlines.slice(0, 4).flatMap((deadline) => {
    const entityKey = normalizeNotificationEntityKey(deadline.title);
    if (attentionEntityKeys.has(entityKey)) {
      return [];
    }
    return [
      {
        id: `deadline-${deadline.title}`,
        category: "deadline" as const,
        title: deadline.title,
        detail: deadline.meta,
      },
    ];
  });

  const combined = [...attention, ...deadlines];
  return {
    badgeCount: combined.length,
    attentionCount: attention.length,
    deadlineCount: deadlines.length,
    skippedDeadlineDuplicates: upcomingDeadlines.slice(0, 4).length - deadlines.length,
    items: combined,
  };
}

function normalizeNotificationEntityKey(title: string): string {
  return title
    .replace(/ ends soon$/i, "")
    .replace(/ campaign ends$/i, "")
    .replace(/ deadline passed$/i, "")
    .replace(/ below fundraising target$/i, "")
    .replace(/^Follow-up due: /i, "")
    .replace(/^Follow-up: /i, "")
    .trim()
    .toLowerCase();
}
