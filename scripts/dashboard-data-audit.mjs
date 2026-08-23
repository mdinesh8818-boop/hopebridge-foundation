/**
 * Read-only Firestore audit for Dashboard data integrity report.
 * Usage: node scripts/dashboard-data-audit.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4-2khxnKFJMFA8SGCvjNo7XsQdP-MOHc",
  authDomain: "hopebridge-foundation-70490.firebaseapp.com",
  projectId: "hopebridge-foundation-70490",
  storageBucket: "hopebridge-foundation-70490.firebasestorage.app",
  messagingSenderId: "217007162999",
  appId: "1:217007162999:web:31dc5e7a63e4f904c32872",
};

const DEMO_CAMPAIGN_NAMES = new Set([
  "Education for Every Child",
  "Healthcare Outreach",
  "Emergency Relief",
  "Food Distribution",
  "Clean Water Initiative",
]);

const DEMO_BENEFICIARY_IDS = new Set([
  "BNF-2026-0142",
  "BNF-2026-0087",
  "BNF-2026-0201",
  "BNF-2026-0033",
  "BNF-2026-0178",
  "BNF-2026-0056",
  "BNF-2025-0440",
  "BNF-2026-0119",
]);

const DEMO_VOLUNTEER_NAMES = new Set([
  "Maya Chen",
  "James Okonkwo",
  "Sofia Reyes",
  "Daniel Brooks",
  "Priya Sharma",
]);

function normalizeDate(value) {
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
    if (typeof value.toDate === "function") {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  }
  return null;
}

function activityDedupeKey(record) {
  const isRemoval =
    record.action === "deleted" ||
    /removed/i.test(record.description ?? "");

  if (isRemoval) {
    const name =
      record.entityName ??
      record.description?.match(/"([^"]+)"/)?.[1] ??
      "";
    return `${record.module}|delete|${name.toLowerCase()}`;
  }

  return `${record.module}|${record.action}|${record.entityId ?? ""}|${record.entityName ?? ""}`;
}

function notificationEntityKey(title) {
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

async function fetchCollection(db, name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date();
now.setHours(0, 0, 0, 0);

const [
  campaigns,
  programs,
  donors,
  volunteers,
  beneficiaries,
  teams,
  donations,
  activities,
] = await Promise.all([
  fetchCollection(db, "campaigns"),
  fetchCollection(db, "programs"),
  fetchCollection(db, "volunteers"),
  fetchCollection(db, "beneficiaries"),
  fetchCollection(db, "teams"),
  fetchCollection(db, "donations"),
  fetchCollection(db, "activities"),
]);

const uniqueBeneficiaries = [];
const seenBen = new Set();
for (const b of beneficiaries) {
  const key = b.beneficiaryId || b.id;
  if (!key || seenBen.has(key)) continue;
  seenBen.add(key);
  uniqueBeneficiaries.push(b);
}

const activeCampaigns = campaigns.filter(
  (c) => c.status === "Active" || c.status === "In Progress",
);
const totalRaisedCampaigns = campaigns.reduce(
  (s, c) => s + (Number(c.raised) || 0),
  0,
);
const totalDonations = donations.reduce(
  (s, d) => s + (Number(d.amount) || 0),
  0,
);
const fundsRaised = totalDonations > 0 ? totalDonations : totalRaisedCampaigns;
const totalGoal = campaigns.reduce((s, c) => s + (Number(c.goal) || 0), 0);
const progress =
  totalGoal > 0 ? Math.min(100, Math.round((fundsRaised / totalGoal) * 100)) : 0;

const volunteerCount = volunteers.filter(
  (v) => v.status === "Active" || v.status === "In Progress",
).length;

const overdueBeneficiaries = uniqueBeneficiaries.filter((b) => {
  if (!b.nextFollowUp) return false;
  const due = normalizeDate(b.nextFollowUp);
  return due && due <= now;
});

const attentionItems = [];

for (const campaign of campaigns) {
  if (!campaign.endDate || !campaign.name) continue;
  const end = normalizeDate(campaign.endDate);
  if (!end) continue;
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (
    daysLeft >= 0 &&
    daysLeft <= 14 &&
    (campaign.status === "Active" || campaign.status === "In Progress")
  ) {
    attentionItems.push({
      id: `campaign-deadline-${campaign.id}`,
      title: `${campaign.name} ends soon`,
    });
  } else if (
    daysLeft < 0 &&
    (campaign.status === "Active" || campaign.status === "In Progress")
  ) {
    attentionItems.push({
      id: `campaign-overdue-${campaign.id}`,
      title: `${campaign.name} deadline passed`,
    });
  }
  const goal = Number(campaign.goal) || 0;
  const raised = Number(campaign.raised) || 0;
  if (
    goal > 0 &&
    raised / goal < 0.4 &&
    (campaign.status === "Active" || campaign.status === "In Progress")
  ) {
    attentionItems.push({
      id: `campaign-attention-${campaign.id}`,
      title: `${campaign.name} below fundraising target`,
    });
  }
}

for (const b of uniqueBeneficiaries) {
  if (!b.nextFollowUp) continue;
  const due = normalizeDate(b.nextFollowUp);
  if (due && due <= now) {
    attentionItems.push({
      id: `beneficiary-followup-${b.id}`,
      title: `Follow-up due: ${b.name ?? "Beneficiary"}`,
    });
  }
}

const upcomingDeadlines = [];
for (const c of campaigns) {
  if (!c.endDate || !c.name) continue;
  const end = normalizeDate(c.endDate);
  if (!end || end < now) continue;
  if (!["Active", "In Progress", "Draft", "Scheduled"].includes(c.status ?? ""))
    continue;
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  upcomingDeadlines.push({
    title: `${c.name} campaign ends`,
    date: end.toISOString().slice(0, 10),
    daysLeft: diffDays,
    sourceId: c.id,
  });
}

const attentionKeys = new Set(
  attentionItems.map((a) => notificationEntityKey(a.title)),
);
const deadlineNotifications = upcomingDeadlines
  .slice(0, 4)
  .filter((d) => !attentionKeys.has(notificationEntityKey(d.title)));

const notifications = [
  ...attentionItems.slice(0, 6).map((a) => ({ category: "attention", ...a })),
  ...deadlineNotifications.map((d) => ({
    category: "deadline",
    title: d.title,
    detail: `${d.daysLeft} days left`,
  })),
].slice(0, 8);

const campaignAlerts = attentionItems.filter((a) =>
  a.id.startsWith("campaign-"),
);
const followUps = attentionItems.filter((a) =>
  a.id.startsWith("beneficiary-followup"),
);
const insights = [];
if (campaignAlerts.length > 0) {
  insights.push({ title: "Campaign attention needed", count: campaignAlerts.length });
}
if (followUps.length > 0) {
  insights.push({
    title: "Beneficiary follow-ups overdue",
    count: followUps.length,
  });
}

const removalActivities = activities
  .filter(
    (a) =>
      a.module === "volunteers" &&
      (a.action === "deleted" || /removed/i.test(a.description ?? "")),
  )
  .map((a) => ({
    id: a.id,
    entityId: a.entityId,
    entityName: a.entityName,
    description: a.description,
    timestamp: normalizeDate(a.createdAt)?.toISOString() ?? null,
    dedupeKey: activityDedupeKey(a),
    demoVolunteerName: DEMO_VOLUNTEER_NAMES.has(
      a.entityName ??
        a.description?.match(/"([^"]+)"/)?.[1] ??
        "",
    ),
  }));

const duplicateGroups = new Map();
for (const a of removalActivities) {
  const list = duplicateGroups.get(a.dedupeKey) ?? [];
  list.push(a);
  duplicateGroups.set(a.dedupeKey, list);
}

console.log(
  JSON.stringify(
    {
      auditDate: new Date().toISOString(),
      referenceToday: now.toISOString().slice(0, 10),
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        raised: Number(c.raised) || 0,
        goal: Number(c.goal) || 0,
        endDate: c.endDate,
        source: "Firestore campaigns",
        seeded: DEMO_CAMPAIGN_NAMES.has(c.name),
        userCreated: !DEMO_CAMPAIGN_NAMES.has(c.name),
      })),
      beneficiaries: uniqueBeneficiaries.map((b) => ({
        id: b.id,
        beneficiaryId: b.beneficiaryId,
        name: b.name,
        nextFollowUp: b.nextFollowUp,
        source: "Firestore beneficiaries",
        seeded: DEMO_BENEFICIARY_IDS.has(b.beneficiaryId),
      })),
      volunteerRemovals: removalActivities.sort((a, b) =>
        (b.timestamp ?? "").localeCompare(a.timestamp ?? ""),
      ),
      duplicateRemovalGroups: [...duplicateGroups.entries()]
        .filter(([, list]) => list.length > 1)
        .map(([key, list]) => ({ key, count: list.length, ids: list.map((x) => x.id) })),
      calculations: {
        activeCampaigns: activeCampaigns.length,
        activeCampaignNames: activeCampaigns.map((c) => c.name),
        fundsRaised,
        fundsRaisedSource: totalDonations > 0 ? "donations" : "campaign_totals",
        totalGoal,
        progressPercent: progress,
        beneficiaryCount: uniqueBeneficiaries.length,
        overdueFollowUpCount: overdueBeneficiaries.length,
        overdueNames: overdueBeneficiaries.map((b) => b.name),
        volunteerCount,
        activeDonors: donors.filter(
          (d) =>
            d.status &&
            !d.status.toLowerCase().includes("lapsed") &&
            d.status !== "Inactive",
        ).length,
        activePrograms: programs.filter(
          (p) => p.status === "Active" || p.status === "Planning",
        ).length,
        liveModules: [
          activeCampaigns.length > 0,
          programs.some((p) => p.status === "Active" || p.status === "Planning"),
          uniqueBeneficiaries.length > 0,
          volunteerCount > 0,
          teams.some((t) => t.status === "Active"),
          fundsRaised > 0,
          donors.some(
            (d) =>
              d.status &&
              !d.status.toLowerCase().includes("lapsed") &&
              d.status !== "Inactive",
          ),
        ].filter(Boolean).length,
        aiInsights: insights.length,
        insightItems: insights,
      },
      upcomingDeadlines,
      notifications: {
        badgeCount: notifications.length,
        attentionCount: Math.min(attentionItems.length, 6),
        deadlineCount: deadlineNotifications.length,
        skippedDeadlineDuplicates:
          Math.min(upcomingDeadlines.length, 4) - deadlineNotifications.length,
        items: notifications,
      },
    },
    null,
    2,
  ),
);
