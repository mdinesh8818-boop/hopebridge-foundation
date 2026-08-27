import type { ActivityRecord } from "../types/activity";
import { dedupeActivityRecords } from "./activityDedupe";
import { getDocuments } from "./firestore";
import {
  cleanupDuplicateActivityRecords,
  cleanupKnownDemoRecords,
} from "./demoCleanup";
import type { MonthlyFundraisingPoint } from "./dashboardData";
import { buildChartPaths } from "./dashboardData";
import type { AttentionItem, OrganizationSnapshot } from "./organizationMetrics";
import { formatCurrency } from "./organizationMetrics";
import {
  buildDashboardNotifications,
  type DashboardNotification,
} from "./notifications";

export type { DashboardNotification };

export type UpcomingDeadline = {
  month: string;
  day: string;
  title: string;
  meta: string;
  href: string;
};

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
};

export type FundsRaisedSource = "donations" | "campaign_totals" | "none";

export type FundraisingPerformance = {
  fundsRaised: number;
  fundsRaisedSource: FundsRaisedSource;
  totalCampaignGoal: number;
  goalProgress: number;
  monthlyHistory: MonthlyFundraisingPoint[];
  displayMode: "chart" | "summary_only" | "empty";
  summaryMessage: string;
};

export type DashboardOrganizationData = {
  snapshot: OrganizationSnapshot;
  liveModuleCount: number;
  attentionItems: AttentionItem[];
  upcomingDeadlines: UpcomingDeadline[];
  recentActivities: ActivityRecord[];
  insights: DashboardInsight[];
  fundraising: FundraisingPerformance;
  notifications: DashboardNotification[];
  cleanupReport?: Awaited<ReturnType<typeof cleanupKnownDemoRecords>>;
  activityDedupeReport?: Awaited<
    ReturnType<typeof cleanupDuplicateActivityRecords>
  >;
};

type CampaignDoc = {
  id: string;
  name?: string;
  status?: string;
  raised?: number;
  goal?: number;
  endDate?: string;
};

type ProgramDoc = {
  id: string;
  name?: string;
  status?: string;
  budget?: number;
  spent?: number;
  progress?: number;
  priority?: string;
  endDate?: string;
  beneficiaries?: number;
};

type DonorDoc = {
  id: string;
  status?: string;
  amountNum?: number;
  date?: string;
  createdAt?: unknown;
};

type VolunteerDoc = {
  id: string;
  name?: string;
  status?: string;
  hours?: number;
};

type BeneficiaryDoc = {
  id: string;
  name?: string;
  beneficiaryId?: string;
  nextFollowUp?: string;
};

type DonationDoc = {
  amount?: number;
  date?: string;
  createdAt?: unknown;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function normalizeDate(value: unknown): Date | null {
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
  if (typeof value === "object" && value !== null) {
    const obj = value as { seconds?: number; toDate?: () => Date };
    if (typeof obj.toDate === "function") {
      const d = obj.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
  }
  return null;
}

function computeLiveModuleCount(snapshot: OrganizationSnapshot): number {
  return [
    snapshot.activeCampaigns > 0,
    snapshot.activePrograms > 0,
    snapshot.beneficiaryCount > 0,
    snapshot.volunteerCount > 0,
    snapshot.activeTeams > 0,
    snapshot.fundsRaised > 0,
    snapshot.activeDonors > 0,
  ].filter(Boolean).length;
}

function computeImpactScore(
  programs: ProgramDoc[],
  beneficiaryCount: number,
): number | null {
  const activeWithOutcomes = programs.filter(
    (p) =>
      p.status === "Active" &&
      (Number(p.beneficiaries) || 0) > 0 &&
      Number(p.progress) >= 0,
  );

  if (activeWithOutcomes.length === 0 || beneficiaryCount <= 0) {
    return null;
  }

  const totalWeightedBeneficiaries = activeWithOutcomes.reduce(
    (sum, p) => sum + (Number(p.beneficiaries) || 0),
    0,
  );

  if (totalWeightedBeneficiaries <= 0) return null;

  const weightedProgress =
    activeWithOutcomes.reduce(
      (sum, p) =>
        sum + (Number(p.progress) || 0) * (Number(p.beneficiaries) || 0),
      0,
    ) / totalWeightedBeneficiaries;

  return Math.min(100, Math.round(weightedProgress));
}

function dedupeById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

function dedupeBeneficiaries(records: BeneficiaryDoc[]): BeneficiaryDoc[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = r.beneficiaryId || r.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function computeSnapshot(
  campaigns: CampaignDoc[],
  programs: ProgramDoc[],
  donors: DonorDoc[],
  volunteers: VolunteerDoc[],
  beneficiaries: BeneficiaryDoc[],
  teams: { id: string; status?: string }[],
  donations: DonationDoc[],
): OrganizationSnapshot {
  const uniqueCampaigns = dedupeById(campaigns);
  const uniquePrograms = dedupeById(programs);
  const uniqueDonors = dedupeById(donors);
  const uniqueVolunteers = dedupeById(volunteers);
  const uniqueBeneficiaries = dedupeBeneficiaries(beneficiaries);
  const uniqueTeams = dedupeById(teams);

  const activeCampaigns = uniqueCampaigns.filter(
    (c) => c.status === "Active" || c.status === "In Progress",
  ).length;

  const fundsRaisedFromCampaigns = uniqueCampaigns.reduce(
    (sum, c) => sum + (Number(c.raised) || 0),
    0,
  );

  const totalDonations = donations.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0,
  );

  const fundsRaised =
    totalDonations > 0 ? totalDonations : fundsRaisedFromCampaigns;

  const totalCampaignGoal = uniqueCampaigns.reduce(
    (sum, c) => sum + (Number(c.goal) || 0),
    0,
  );

  const activePrograms = uniquePrograms.filter(
    (p) => p.status === "Active" || p.status === "Planning",
  ).length;

  const totalProgramBudget = uniquePrograms.reduce(
    (sum, p) => sum + (Number(p.budget) || 0),
    0,
  );
  const totalProgramSpent = uniquePrograms.reduce(
    (sum, p) => sum + (Number(p.spent) || 0),
    0,
  );

  const programsOnTrack = uniquePrograms.filter(
    (p) =>
      p.status === "Completed" ||
      (Number(p.progress) >= 50 && p.status === "Active"),
  ).length;

  const programsAtRisk = uniquePrograms.filter(
    (p) =>
      p.priority === "Critical" ||
      (p.status === "Active" && Number(p.progress) < 50),
  ).length;

  const activeDonors = uniqueDonors.filter(
    (d) =>
      d.status &&
      !d.status.toLowerCase().includes("lapsed") &&
      d.status !== "Inactive",
  ).length;

  const volunteerCount = uniqueVolunteers.filter(
    (v) => v.status === "Active" || v.status === "In Progress",
  ).length;

  const volunteerHours = uniqueVolunteers.reduce(
    (sum, v) => sum + (Number(v.hours) || 0),
    0,
  );

  const beneficiaryCount = uniqueBeneficiaries.length;
  const activeTeams = uniqueTeams.filter((t) => t.status === "Active").length;

  const impactScore = computeImpactScore(uniquePrograms, beneficiaryCount);

  return {
    activeCampaigns,
    activePrograms,
    fundsRaised,
    totalCampaignGoal,
    activeDonors,
    totalDonations,
    volunteerCount,
    volunteerHours,
    beneficiaryCount,
    activeTeams,
    totalProgramBudget,
    totalProgramSpent,
    programsOnTrack,
    programsAtRisk,
    impactScore,
  };
}

function computeFundraisingPerformance(
  snapshot: OrganizationSnapshot,
  campaigns: CampaignDoc[],
  donations: DonationDoc[],
  donors: DonorDoc[],
): FundraisingPerformance {
  const fundsRaisedSource: FundsRaisedSource =
    snapshot.totalDonations > 0
      ? "donations"
      : snapshot.fundsRaised > 0
        ? "campaign_totals"
        : "none";

  const goalProgress =
    snapshot.totalCampaignGoal > 0
      ? Math.min(
          100,
          Math.round(
            (snapshot.fundsRaised / snapshot.totalCampaignGoal) * 100,
          ),
        )
      : 0;

  const monthlyRaised = new Map<string, number>();
  const totalGoal = campaigns.reduce((s, c) => s + (Number(c.goal) || 0), 0);
  const goalPerMonth = totalGoal > 0 ? totalGoal / 12 : 0;

  function addToMonth(date: Date, amount: number) {
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    monthlyRaised.set(key, (monthlyRaised.get(key) ?? 0) + amount);
  }

  for (const d of donations) {
    const amount = Number(d.amount) || 0;
    if (amount <= 0) continue;
    const date = normalizeDate(d.date) ?? normalizeDate(d.createdAt);
    if (date) addToMonth(date, amount);
  }

  for (const d of donors) {
    const amount = Number(d.amountNum) || 0;
    if (amount <= 0) continue;
    const date = normalizeDate(d.date) ?? normalizeDate(d.createdAt);
    if (date) addToMonth(date, amount);
  }

  const monthlyHistory =
    monthlyRaised.size === 0
      ? []
      : [...monthlyRaised.keys()].sort().map((key) => {
          const [, monthIndex] = key.split("-");
          return {
            month: key,
            monthLabel: MONTH_LABELS[Number(monthIndex)] ?? key,
            raised: monthlyRaised.get(key) ?? 0,
            goal: goalPerMonth,
          };
        });

  if (monthlyHistory.length > 0) {
    return {
      fundsRaised: snapshot.fundsRaised,
      fundsRaisedSource,
      totalCampaignGoal: snapshot.totalCampaignGoal,
      goalProgress,
      monthlyHistory,
      displayMode: "chart",
      summaryMessage: "",
    };
  }

  if (snapshot.fundsRaised > 0) {
    const sourceLabel =
      fundsRaisedSource === "donations"
        ? "dated donation transactions"
        : "active campaign records";
    return {
      fundsRaised: snapshot.fundsRaised,
      fundsRaisedSource,
      totalCampaignGoal: snapshot.totalCampaignGoal,
      goalProgress,
      monthlyHistory: [],
      displayMode: "summary_only",
      summaryMessage: `${formatCurrency(snapshot.fundsRaised)} raised across ${sourceLabel}. Historical trend requires dated donation transactions.`,
    };
  }

  return {
    fundsRaised: 0,
    fundsRaisedSource: "none",
    totalCampaignGoal: snapshot.totalCampaignGoal,
    goalProgress: 0,
    monthlyHistory: [],
    displayMode: "empty",
    summaryMessage:
      "No fundraising performance data yet. Create a campaign or record donations to begin tracking performance.",
  };
}

function computeAttentionItems(
  campaigns: CampaignDoc[],
  programs: ProgramDoc[],
  beneficiaries: BeneficiaryDoc[],
  volunteers: VolunteerDoc[],
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const campaign of dedupeById(campaigns)) {
    if (!campaign.endDate || !campaign.name) continue;
    const end = normalizeDate(campaign.endDate);
    if (!end) continue;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (
      daysLeft >= 0 &&
      daysLeft <= 14 &&
      (campaign.status === "Active" || campaign.status === "In Progress")
    ) {
      items.push({
        id: `campaign-deadline-${campaign.id}`,
        title: `${campaign.name} ends soon`,
        detail: `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`,
        href: "/dashboard/campaigns",
        priority: daysLeft <= 5 ? "high" : "medium",
      });
    } else if (
      daysLeft < 0 &&
      (campaign.status === "Active" || campaign.status === "In Progress")
    ) {
      items.push({
        id: `campaign-overdue-${campaign.id}`,
        title: `${campaign.name} deadline passed`,
        detail: `Ended ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago`,
        href: "/dashboard/campaigns",
        priority: "high",
      });
    }
    const goal = Number(campaign.goal) || 0;
    const raised = Number(campaign.raised) || 0;
    if (
      goal > 0 &&
      raised / goal < 0.4 &&
      (campaign.status === "Active" || campaign.status === "In Progress")
    ) {
      items.push({
        id: `campaign-attention-${campaign.id}`,
        title: `${campaign.name} below fundraising target`,
        detail: `${Math.round((raised / goal) * 100)}% of goal reached`,
        href: "/dashboard/campaigns",
        priority: "high",
      });
    }
  }

  for (const program of dedupeById(programs)) {
    if (
      program.status === "Active" &&
      Number(program.progress) < 50 &&
      program.name
    ) {
      items.push({
        id: `program-risk-${program.id}`,
        title: `${program.name} at risk`,
        detail: `${program.progress ?? 0}% progress on active program`,
        href: "/dashboard/programs",
        priority: program.priority === "Critical" ? "high" : "medium",
      });
    }
  }

  for (const b of dedupeBeneficiaries(beneficiaries)) {
    if (b.nextFollowUp) {
      const due = normalizeDate(b.nextFollowUp);
      if (due && due <= now) {
        items.push({
          id: `beneficiary-followup-${b.id}`,
          title: `Follow-up due: ${b.name ?? "Beneficiary"}`,
          detail: "Scheduled follow-up is overdue",
          href: "/dashboard/beneficiaries",
          priority: "high",
        });
      }
    }
  }

  for (const v of dedupeById(volunteers)) {
    if (v.status === "Needs Attention" && v.name) {
      items.push({
        id: `volunteer-attention-${v.id}`,
        title: `Volunteer needs attention: ${v.name}`,
        detail: "Review volunteer status and assignments",
        href: "/dashboard/volunteers",
        priority: "medium",
      });
    }
  }

  return items
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 6);
}

function computeUpcomingDeadlines(
  campaigns: CampaignDoc[],
  programs: ProgramDoc[],
  beneficiaries: BeneficiaryDoc[],
): UpcomingDeadline[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  type Item = UpcomingDeadline & { sortDate: number };
  const items: Item[] = [];

  function push(
    date: Date,
    title: string,
    meta: string,
    href: string,
  ) {
    items.push({
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: String(date.getDate()),
      title,
      meta,
      href,
      sortDate: date.getTime(),
    });
  }

  for (const c of dedupeById(campaigns)) {
    if (!c.endDate || !c.name) continue;
    const end = normalizeDate(c.endDate);
    if (!end || end < now) continue;
    if (
      !["Active", "In Progress", "Draft", "Scheduled"].includes(
        c.status ?? "",
      )
    ) {
      continue;
    }
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    push(
      end,
      `${c.name} campaign ends`,
      `${diffDays} day${diffDays === 1 ? "" : "s"} left`,
      "/dashboard/campaigns",
    );
  }

  for (const p of dedupeById(programs)) {
    if (!p.endDate || !p.name) continue;
    const end = normalizeDate(p.endDate);
    if (!end || end < now) continue;
    if (!["Active", "Planning"].includes(p.status ?? "")) continue;
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    push(
      end,
      `${p.name} program ends`,
      `${diffDays} day${diffDays === 1 ? "" : "s"} left`,
      "/dashboard/programs",
    );
  }

  for (const b of dedupeBeneficiaries(beneficiaries)) {
    if (!b.nextFollowUp) continue;
    const due = normalizeDate(b.nextFollowUp);
    if (!due || due < now) continue;
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    push(
      due,
      `Follow-up: ${b.name ?? "Beneficiary"}`,
      `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
      "/dashboard/beneficiaries",
    );
  }

  return items
    .sort((a, b) => a.sortDate - b.sortDate)
    .slice(0, 6)
    .map(({ sortDate: _s, ...rest }) => rest);
}

function computeInsights(
  snapshot: OrganizationSnapshot,
  attentionItems: AttentionItem[],
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const goalPct =
    snapshot.totalCampaignGoal > 0
      ? Math.round((snapshot.fundsRaised / snapshot.totalCampaignGoal) * 100)
      : 0;

  const campaignAlerts = attentionItems.filter((a) =>
    a.id.startsWith("campaign-"),
  );
  if (campaignAlerts.length > 0) {
    insights.push({
      id: "insight-campaigns",
      title: "Campaign attention needed",
      description: `${campaignAlerts.length} campaign${campaignAlerts.length === 1 ? "" : "s"} require leadership review based on deadlines or fundraising progress.`,
    });
  } else if (
    snapshot.activeCampaigns > 0 &&
    goalPct < 50 &&
    snapshot.totalCampaignGoal > 0
  ) {
    insights.push({
      id: "insight-fundraising",
      title: "Fundraising below target",
      description: `Active campaigns have reached ${goalPct}% of combined fundraising goals.`,
    });
  }

  const followUps = attentionItems.filter((a) =>
    a.id.startsWith("beneficiary-followup"),
  );
  if (followUps.length > 0) {
    insights.push({
      id: "insight-beneficiaries",
      title: "Beneficiary follow-ups overdue",
      description: `${followUps.length} beneficiar${followUps.length === 1 ? "y has" : "ies have"} overdue follow-ups requiring action.`,
    });
  }

  if (snapshot.programsAtRisk > 0) {
    insights.push({
      id: "insight-programs",
      title: "Programs at risk",
      description: `${snapshot.programsAtRisk} active program${snapshot.programsAtRisk === 1 ? "" : "s"} may need budget or milestone review.`,
    });
  }

  const volunteerAlerts = attentionItems.filter((a) =>
    a.id.startsWith("volunteer-"),
  );
  if (volunteerAlerts.length > 0) {
    insights.push({
      id: "insight-volunteers",
      title: "Volunteer coordination",
      description: `${volunteerAlerts.length} volunteer record${volunteerAlerts.length === 1 ? "" : "s"} flagged for review.`,
    });
  }

  return insights.slice(0, 3);
}

function sortActivities(activities: ActivityRecord[]): ActivityRecord[] {
  return [...activities].sort((a, b) => {
    const bTime = normalizeDate(b.createdAt)?.getTime() ?? 0;
    const aTime = normalizeDate(a.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

/**
 * Single aggregation entry point for the Dashboard.
 * All metrics, alerts, deadlines, and performance derive from the same Firestore fetch.
 *
 * Multi-tenancy: getDocuments() injects organization scoping via AuthProvider
 * context (organizationId). This aggregator stays collection-agnostic.
 */
export async function fetchDashboardOrganizationData(): Promise<DashboardOrganizationData> {
  const [cleanupReport, activityDedupeReport] = await Promise.all([
    cleanupKnownDemoRecords(),
    cleanupDuplicateActivityRecords(),
  ]);

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
    getDocuments("campaigns") as Promise<CampaignDoc[]>,
    getDocuments("programs") as Promise<ProgramDoc[]>,
    getDocuments("donors") as Promise<DonorDoc[]>,
    getDocuments("volunteers") as Promise<VolunteerDoc[]>,
    getDocuments("beneficiaries") as Promise<BeneficiaryDoc[]>,
    getDocuments("teams") as Promise<{ id: string; status?: string }[]>,
    getDocuments("donations") as Promise<DonationDoc[]>,
    getDocuments("activities") as Promise<ActivityRecord[]>,
  ]);

  const snapshot = computeSnapshot(
    campaigns,
    programs,
    donors,
    volunteers,
    beneficiaries,
    teams,
    donations,
  );

  const attentionItems = computeAttentionItems(
    campaigns,
    programs,
    beneficiaries,
    volunteers,
  );

  const upcomingDeadlines = computeUpcomingDeadlines(
    campaigns,
    programs,
    beneficiaries,
  );

  const fundraising = computeFundraisingPerformance(
    snapshot,
    campaigns,
    donations,
    donors,
  );

  const recentActivities = sortActivities(
    dedupeActivityRecords(activities),
  ).slice(0, 8);

  const insights = computeInsights(snapshot, attentionItems);
  const notifications = buildDashboardNotifications(
    attentionItems,
    upcomingDeadlines,
  );

  return {
    snapshot,
    liveModuleCount: computeLiveModuleCount(snapshot),
    attentionItems,
    upcomingDeadlines,
    recentActivities,
    insights,
    fundraising,
    notifications,
    cleanupReport,
    activityDedupeReport,
  };
}

export { buildChartPaths };
