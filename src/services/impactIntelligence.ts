import { getDocuments } from "./firestore";
import type {
  AnalyticsFilters,
  AnalyticsPeriodId,
  BeneficiaryOutcomes,
  CategoryDistribution,
  FilterOptions,
  FundingVsImpact,
  GeographicImpact,
  ImpactInsight,
  ImpactIntelligenceBundle,
  ProgramHealth,
  ProgramPerformanceRow,
  RiskAlert,
  TrendPoint,
  VolunteerContribution,
} from "../app/dashboard/analytics/types";

type CampaignDoc = {
  id: string;
  name?: string;
  status?: string;
  category?: string;
  raised?: number;
  goal?: number;
  endDate?: string;
  startDate?: string;
};

type ProgramDoc = {
  id: string;
  name?: string;
  status?: string;
  category?: string;
  location?: string;
  budget?: number;
  spent?: number;
  progress?: number;
  priority?: string;
  beneficiaries?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type DonationDoc = {
  id: string;
  amount?: number;
  date?: string;
  createdAt?: unknown;
  campaignId?: string;
  campaignName?: string;
};

type VolunteerDoc = {
  id: string;
  name?: string;
  status?: string;
  hours?: number;
  initiative?: string;
  lastActivity?: string;
  createdAt?: unknown;
};

type BeneficiaryDoc = {
  id: string;
  beneficiaryId?: string;
  name?: string;
  location?: string;
  region?: string;
  program?: string;
  status?: string;
  enrollmentDate?: string;
  nextFollowUp?: string;
  createdAt?: unknown;
};

type ActivityDoc = {
  id: string;
  module?: string;
  createdAt?: unknown;
  description?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Education: "#0d5f44",
  Healthcare: "#064e3b",
  Health: "#064e3b",
  Community: "#d4af37",
  Environment: "#6b8f71",
  "Food Security": "#9f7b24",
  "Disaster Relief": "#8b3a3a",
  "Community Development": "#d4af37",
  Other: "#a8a196",
};

const DEFAULT_FILTERS: AnalyticsFilters = {
  period: "90d",
  programId: "all",
  campaignId: "all",
  category: "all",
  status: "all",
  location: "all",
};

export { DEFAULT_FILTERS };

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "object" && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === "function") {
      const d = maybe.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybe.seconds === "number") {
      return new Date(maybe.seconds * 1000);
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function periodStart(period: AnalyticsPeriodId, now = new Date()): Date {
  const start = new Date(now);
  switch (period) {
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  start.setHours(0, 0, 0, 0);
  return start;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function uniqueBeneficiaryCount(docs: BeneficiaryDoc[]): number {
  const ids = new Set(
    docs.map((doc) => (doc.beneficiaryId || doc.id || "").trim()).filter(Boolean),
  );
  return ids.size;
}

function resolveProgramHealth(program: ProgramDoc): ProgramHealth {
  const status = program.status ?? "";
  const progress = toNumber(program.progress);
  const priority = program.priority ?? "";
  const end = toDate(program.endDate);
  const daysToEnd =
    end != null ? Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  if (status === "Completed") return "Completed";
  if (priority === "Critical") return "Critical";
  if (status === "On Hold") return "Needs Attention";
  if (status === "Active" && progress < 30) return "Critical";
  if (
    status === "Active" &&
    daysToEnd != null &&
    daysToEnd <= 30 &&
    progress < 70
  ) {
    return "Critical";
  }
  if (status === "Active" && progress < 50) return "Needs Attention";
  if (status === "Planning" && progress === 0) return "Needs Attention";
  return "On Track";
}

function filterPrograms(
  programs: ProgramDoc[],
  filters: AnalyticsFilters,
): ProgramDoc[] {
  return programs.filter((program) => {
    if (filters.programId !== "all" && program.id !== filters.programId) return false;
    if (filters.category !== "all" && (program.category || "Other") !== filters.category) {
      return false;
    }
    if (filters.status !== "all" && (program.status || "") !== filters.status) {
      return false;
    }
    if (filters.location !== "all" && (program.location || "") !== filters.location) {
      return false;
    }
    return true;
  });
}

function filterCampaigns(
  campaigns: CampaignDoc[],
  filters: AnalyticsFilters,
): CampaignDoc[] {
  return campaigns.filter((campaign) => {
    if (filters.campaignId !== "all" && campaign.id !== filters.campaignId) {
      return false;
    }
    return true;
  });
}

function buildTrend(
  period: AnalyticsPeriodId,
  beneficiaries: BeneficiaryDoc[],
  donations: DonationDoc[],
  programs: ProgramDoc[],
  volunteers: VolunteerDoc[],
): { points: TrendPoint[]; hasHistory: boolean } {
  const start = periodStart(period);
  const now = new Date();
  const buckets = new Map<
    string,
    { beneficiaries: number; fundsRaised: number; volunteerEvents: number }
  >();

  // Seed monthly buckets across the period
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= now) {
    buckets.set(monthKey(cursor), {
      beneficiaries: 0,
      fundsRaised: 0,
      volunteerEvents: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  let historySignals = 0;

  for (const beneficiary of beneficiaries) {
    const enrolled =
      toDate(beneficiary.enrollmentDate) ?? toDate(beneficiary.createdAt);
    if (!enrolled || enrolled < start) continue;
    const key = monthKey(enrolled);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.beneficiaries += 1;
    historySignals += 1;
  }

  for (const donation of donations) {
    const when = toDate(donation.date) ?? toDate(donation.createdAt);
    if (!when || when < start) continue;
    const key = monthKey(when);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.fundsRaised += toNumber(donation.amount);
    historySignals += 1;
  }

  for (const volunteer of volunteers) {
    const when = toDate(volunteer.lastActivity) ?? toDate(volunteer.createdAt);
    if (!when || when < start) continue;
    const key = monthKey(when);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.volunteerEvents += 1;
    historySignals += 1;
  }

  const activePrograms = programs.filter(
    (p) => p.status === "Active" || p.status === "Planning",
  );
  const avgProgress =
    activePrograms.length > 0
      ? Math.round(
          activePrograms.reduce((sum, p) => sum + toNumber(p.progress), 0) /
            activePrograms.length,
        )
      : 0;

  const points: TrendPoint[] = [...buckets.entries()].map(([key, bucket]) => ({
    label: monthLabel(key),
    beneficiaries: bucket.beneficiaries,
    fundsRaised: Math.round(bucket.fundsRaised),
    programProgress: avgProgress,
    volunteerHours: bucket.volunteerEvents,
  }));

  return {
    points,
    hasHistory: historySignals > 0,
  };
}

function buildProgramRows(programs: ProgramDoc[]): ProgramPerformanceRow[] {
  return programs
    .map((program) => {
      const beneficiariesReached = toNumber(program.beneficiaries);
      const progress = Math.min(100, Math.max(0, toNumber(program.progress)));
      const budget = toNumber(program.budget);
      const spent = toNumber(program.spent);
      return {
        id: program.id,
        name: program.name?.trim() || "Untitled Program",
        status: program.status || "Planning",
        category: program.category || "Other",
        location: program.location?.trim() || "",
        progress,
        beneficiariesReached,
        beneficiaryTarget: null,
        budget,
        fundsDeployed: spent,
        goalAchievement: budget > 0 ? Math.round((spent / budget) * 100) : null,
        health: resolveProgramHealth(program),
        endDate: typeof program.endDate === "string" ? program.endDate : "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildBeneficiaryOutcomes(
  beneficiaries: BeneficiaryDoc[],
  period: AnalyticsPeriodId,
): BeneficiaryOutcomes {
  const start = periodStart(period);
  const total = uniqueBeneficiaryCount(beneficiaries);

  let newInPeriod = 0;
  for (const beneficiary of beneficiaries) {
    const enrolled =
      toDate(beneficiary.enrollmentDate) ?? toDate(beneficiary.createdAt);
    if (enrolled && enrolled >= start) newInPeriod += 1;
  }

  const byProgramMap = new Map<string, number>();
  const byRegionMap = new Map<string, number>();
  const byLocationMap = new Map<string, number>();

  for (const beneficiary of beneficiaries) {
    const program = beneficiary.program?.trim() || "Unassigned";
    byProgramMap.set(program, (byProgramMap.get(program) ?? 0) + 1);

    const region = beneficiary.region?.trim();
    if (region) byRegionMap.set(region, (byRegionMap.get(region) ?? 0) + 1);

    const location = beneficiary.location?.trim();
    if (location) {
      byLocationMap.set(location, (byLocationMap.get(location) ?? 0) + 1);
    }
  }

  const { points } = buildTrend(period, beneficiaries, [], [], []);
  const growthTrend = points.map((point) => ({
    label: point.label,
    count: point.beneficiaries,
  }));

  const communities = new Set(
    [
      ...beneficiaries.map((b) => b.location?.trim() || ""),
      ...beneficiaries.map((b) => b.region?.trim() || ""),
    ].filter(Boolean),
  );

  return {
    total,
    newInPeriod,
    byProgram: [...byProgramMap.entries()]
      .map(([program, count]) => ({ program, count }))
      .sort((a, b) => b.count - a.count),
    byRegion: [...byRegionMap.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count),
    byLocation: [...byLocationMap.entries()]
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count),
    growthTrend,
    demographicsAvailable: false,
    childrenReached: null,
    womenImpacted: null,
    familiesSupported: null,
    communitiesReached: communities.size,
  };
}

function buildFunding(
  fundsRaised: number,
  programs: ProgramDoc[],
  beneficiariesServed: number,
): FundingVsImpact {
  const fundsDeployed = programs.reduce((sum, p) => sum + toNumber(p.spent), 0);
  const byProgram = programs
    .map((program) => {
      const spent = toNumber(program.spent);
      const beneficiaries = toNumber(program.beneficiaries);
      return {
        name: program.name?.trim() || "Untitled Program",
        spent,
        beneficiaries,
        costPerBeneficiary:
          beneficiaries > 0 ? Number((spent / beneficiaries).toFixed(2)) : null,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  return {
    fundsRaised,
    fundsDeployed,
    beneficiariesServed,
    costPerBeneficiary:
      beneficiariesServed > 0
        ? Number((fundsDeployed / beneficiariesServed).toFixed(2))
        : null,
    deploymentRate:
      fundsRaised > 0 ? Math.round((fundsDeployed / fundsRaised) * 100) : null,
    byProgram,
  };
}

function buildVolunteerContribution(
  volunteers: VolunteerDoc[],
  activities: ActivityDoc[],
): VolunteerContribution {
  const active = volunteers.filter(
    (v) => v.status === "Active" || v.status === "In Progress",
  );
  const totalHours = volunteers.reduce((sum, v) => sum + toNumber(v.hours), 0);
  const hoursTracked = volunteers.some((v) => toNumber(v.hours) > 0);

  const byProgramMap = new Map<string, { volunteers: number; hours: number }>();
  for (const volunteer of volunteers) {
    const program = volunteer.initiative?.trim() || "Unassigned";
    const existing = byProgramMap.get(program) ?? { volunteers: 0, hours: 0 };
    existing.volunteers += 1;
    existing.hours += toNumber(volunteer.hours);
    byProgramMap.set(program, existing);
  }

  const volunteerActivities = activities.filter(
    (activity) => activity.module === "volunteers",
  ).length;

  return {
    activeVolunteers: active.length,
    totalHours,
    activitiesLogged: volunteerActivities,
    byProgram: [...byProgramMap.entries()]
      .map(([program, data]) => ({ program, ...data }))
      .sort((a, b) => b.hours - a.hours || b.volunteers - a.volunteers),
    hoursTracked,
  };
}

function buildGeography(
  programs: ProgramDoc[],
  beneficiaries: BeneficiaryDoc[],
): GeographicImpact {
  const locationMap = new Map<
    string,
    { programs: number; beneficiaries: number; name: string }
  >();

  for (const program of programs) {
    const loc = program.location?.trim();
    if (!loc) continue;
    const existing = locationMap.get(loc) ?? {
      programs: 0,
      beneficiaries: 0,
      name: loc,
    };
    existing.programs += 1;
    existing.beneficiaries += toNumber(program.beneficiaries);
    locationMap.set(loc, existing);
  }

  for (const beneficiary of beneficiaries) {
    const loc = beneficiary.location?.trim() || beneficiary.region?.trim();
    if (!loc) continue;
    const existing = locationMap.get(loc) ?? {
      programs: 0,
      beneficiaries: 0,
      name: loc,
    };
    existing.beneficiaries += 1;
    locationMap.set(loc, existing);
  }

  const locations = [...locationMap.entries()].map(([id, data], index) => ({
    id,
    name: data.name,
    country: data.name,
    programs: data.programs,
    beneficiaries: data.beneficiaries,
    activePrograms: data.programs,
    impactLevel:
      data.beneficiaries > 50
        ? ("High" as const)
        : data.beneficiaries > 10
          ? ("Medium" as const)
          : ("Low" as const),
    lon: -100 + index * 12,
    lat: 30 + (index % 4) * 5,
    x: 120 + (index % 5) * 140,
    y: 100 + Math.floor(index / 5) * 80,
  }));

  const regions = new Set(
    beneficiaries.map((b) => b.region?.trim() || "").filter(Boolean),
  );
  const communities = new Set(
    [
      ...programs.map((p) => p.location?.trim() || ""),
      ...beneficiaries.map((b) => b.location?.trim() || ""),
    ].filter(Boolean),
  );

  return {
    locations,
    countries: locations.length,
    regions: regions.size,
    communities: communities.size,
  };
}

function buildDistribution(programs: ProgramDoc[]): CategoryDistribution[] {
  const map = new Map<string, { beneficiaries: number; programs: number }>();
  for (const program of programs) {
    const category = program.category?.trim() || "Other";
    const existing = map.get(category) ?? { beneficiaries: 0, programs: 0 };
    existing.beneficiaries += toNumber(program.beneficiaries);
    existing.programs += 1;
    map.set(category, existing);
  }

  const totalBeneficiaries = [...map.values()].reduce(
    (sum, entry) => sum + entry.beneficiaries,
    0,
  );

  return [...map.entries()]
    .map(([category, data]) => ({
      category,
      beneficiaries: data.beneficiaries,
      programs: data.programs,
      percent:
        totalBeneficiaries > 0
          ? Math.round((data.beneficiaries / totalBeneficiaries) * 100)
          : Math.round((data.programs / programs.length) * 100),
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.beneficiaries - a.beneficiaries || b.programs - a.programs);
}

function buildRisks(
  programs: ProgramDoc[],
  campaigns: CampaignDoc[],
  beneficiaries: BeneficiaryDoc[],
): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const now = Date.now();

  for (const program of programs) {
    const progress = toNumber(program.progress);
    const end = toDate(program.endDate);
    const daysToEnd =
      end != null ? Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24)) : null;
    const budget = toNumber(program.budget);
    const spent = toNumber(program.spent);

    if (program.status === "Active" && progress < 40) {
      risks.push({
        id: `program-behind-${program.id}`,
        title: `${program.name || "Program"} is behind schedule`,
        detail: `Progress is ${progress}% while status remains Active.`,
        severity: progress < 25 ? "high" : "medium",
        href: "/dashboard/programs",
        actionLabel: "View Program",
      });
    }

    if (
      program.status === "Active" &&
      daysToEnd != null &&
      daysToEnd >= 0 &&
      daysToEnd <= 21
    ) {
      risks.push({
        id: `program-ending-${program.id}`,
        title: `${program.name || "Program"} ends soon`,
        detail: `Ends in ${daysToEnd} day${daysToEnd === 1 ? "" : "s"} at ${progress}% progress.`,
        severity: daysToEnd <= 7 ? "high" : "medium",
        href: "/dashboard/programs",
        actionLabel: "View Program",
      });
    }

    if (budget > 0 && spent / budget >= 0.9 && program.status !== "Completed") {
      risks.push({
        id: `program-budget-${program.id}`,
        title: `${program.name || "Program"} budget pressure`,
        detail: `${Math.round((spent / budget) * 100)}% of budget deployed.`,
        severity: spent / budget >= 1 ? "high" : "medium",
        href: "/dashboard/programs",
        actionLabel: "View Program",
      });
    }

    if (program.status === "On Hold" || program.status === "Planning") {
      risks.push({
        id: `program-inactive-${program.id}`,
        title: `${program.name || "Program"} is ${program.status}`,
        detail: "Inactive or not yet delivering outcomes.",
        severity: "low",
        href: "/dashboard/programs",
        actionLabel: "View Program",
      });
    }

    if (
      (program.status === "Active" || program.status === "Planning") &&
      toNumber(program.beneficiaries) === 0
    ) {
      risks.push({
        id: `program-reach-${program.id}`,
        title: `${program.name || "Program"} has low beneficiary reach`,
        detail: "No beneficiaries recorded for this program yet.",
        severity: "medium",
        href: "/dashboard/beneficiaries",
        actionLabel: "View Beneficiaries",
      });
    }
  }

  for (const campaign of campaigns) {
    const goal = toNumber(campaign.goal);
    const raised = toNumber(campaign.raised);
    const end = toDate(campaign.endDate);
    const active =
      campaign.status === "Active" || campaign.status === "In Progress";
    if (active && goal > 0 && raised / goal < 0.5) {
      const daysToEnd =
        end != null ? Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24)) : null;
      risks.push({
        id: `campaign-under-${campaign.id}`,
        title: `${campaign.name || "Campaign"} under goal`,
        detail: `${Math.round((raised / goal) * 100)}% of $${goal.toLocaleString()} raised${
          daysToEnd != null && daysToEnd >= 0 ? ` · ${daysToEnd}d remaining` : ""
        }.`,
        severity: raised / goal < 0.25 ? "high" : "medium",
        href: "/dashboard/campaigns",
        actionLabel: "Review Campaign",
      });
    }
  }

  const overdueFollowUps = beneficiaries.filter((b) => {
    const next = toDate(b.nextFollowUp);
    return next != null && next.getTime() < now;
  }).length;

  if (overdueFollowUps > 0) {
    risks.push({
      id: "beneficiary-followups",
      title: `${overdueFollowUps} beneficiary follow-up${overdueFollowUps === 1 ? "" : "s"} overdue`,
      detail: "Follow-up dates have passed without recorded completion.",
      severity: overdueFollowUps > 5 ? "high" : "medium",
      href: "/dashboard/beneficiaries",
      actionLabel: "View Beneficiaries",
    });
  }

  const severityRank = { high: 0, medium: 1, low: 2 } as const;
  return risks
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, 12);
}

function buildInsights(
  programs: ProgramDoc[],
  campaigns: CampaignDoc[],
  beneficiaries: BeneficiaryDoc[],
  volunteers: VolunteerDoc[],
  fundsRaised: number,
  fundsDeployed: number,
  period: AnalyticsPeriodId,
): ImpactInsight[] {
  const insights: ImpactInsight[] = [];

  const ranked = [...programs].sort(
    (a, b) => toNumber(b.progress) - toNumber(a.progress),
  );
  const strongest = ranked.find((p) => (p.status === "Active" || p.status === "Completed"));
  if (strongest) {
    insights.push({
      id: "strongest-program",
      title: "Strongest-performing program",
      description: `${strongest.name} leads at ${toNumber(strongest.progress)}% progress with ${toNumber(strongest.beneficiaries).toLocaleString()} beneficiaries recorded.`,
      tone: "positive",
    });
  }

  const attention = programs.find(
    (p) => resolveProgramHealth(p) === "Critical" || resolveProgramHealth(p) === "Needs Attention",
  );
  if (attention) {
    insights.push({
      id: "program-attention",
      title: "Program requiring attention",
      description: `${attention.name} is marked ${resolveProgramHealth(attention)} at ${toNumber(attention.progress)}% progress.`,
      tone: "attention",
    });
  }

  if (fundsRaised > 0 || fundsDeployed > 0) {
    const rate =
      fundsRaised > 0 ? Math.round((fundsDeployed / fundsRaised) * 100) : null;
    insights.push({
      id: "fundraising-impact",
      title: "Fundraising-to-impact trend",
      description:
        rate != null
          ? `${rate}% of raised funds are currently deployed across programs ($${Math.round(fundsDeployed).toLocaleString()} of $${Math.round(fundsRaised).toLocaleString()}).`
          : `$${Math.round(fundsDeployed).toLocaleString()} deployed across programs. Record campaign donations to compare raised vs deployed.`,
      tone: rate != null && rate < 40 ? "attention" : "neutral",
    });
  }

  const start = periodStart(period);
  const newBeneficiaries = beneficiaries.filter((b) => {
    const enrolled = toDate(b.enrollmentDate) ?? toDate(b.createdAt);
    return enrolled != null && enrolled >= start;
  }).length;
  insights.push({
    id: "beneficiary-growth",
    title: "Beneficiary growth trend",
    description:
      newBeneficiaries > 0
        ? `${newBeneficiaries} new beneficiary record${newBeneficiaries === 1 ? "" : "s"} enrolled in the selected period (${uniqueBeneficiaryCount(beneficiaries)} total).`
        : `No new enrollments in the selected period. ${uniqueBeneficiaryCount(beneficiaries)} beneficiaries are currently recorded.`,
    tone: newBeneficiaries > 0 ? "positive" : "neutral",
  });

  const activeVolunteers = volunteers.filter(
    (v) => v.status === "Active" || v.status === "In Progress",
  ).length;
  const hours = volunteers.reduce((sum, v) => sum + toNumber(v.hours), 0);
  insights.push({
    id: "volunteer-participation",
    title: "Volunteer participation trend",
    description:
      hours > 0
        ? `${activeVolunteers} active volunteer${activeVolunteers === 1 ? "" : "s"} have logged ${hours.toLocaleString()} hours.`
        : activeVolunteers > 0
          ? `${activeVolunteers} active volunteer${activeVolunteers === 1 ? "" : "s"} are registered, but hours have not been recorded yet.`
          : "No active volunteers recorded. Add volunteers to track contribution.",
    tone: hours > 0 ? "positive" : "neutral",
  });

  const underGoalCampaigns = campaigns.filter((c) => {
    const goal = toNumber(c.goal);
    const raised = toNumber(c.raised);
    return (
      (c.status === "Active" || c.status === "In Progress") &&
      goal > 0 &&
      raised / goal < 0.5
    );
  }).length;
  if (underGoalCampaigns > 0) {
    insights.push({
      id: "campaign-pressure",
      title: "Campaigns under goal",
      description: `${underGoalCampaigns} active campaign${underGoalCampaigns === 1 ? "" : "s"} are below 50% of fundraising target.`,
      tone: "attention",
    });
  }

  return insights.slice(0, 6);
}

function buildFilterOptions(
  programs: ProgramDoc[],
  campaigns: CampaignDoc[],
): FilterOptions {
  const categories = [
    ...new Set(programs.map((p) => p.category?.trim() || "").filter(Boolean)),
  ].sort();
  const statuses = [
    ...new Set(programs.map((p) => p.status?.trim() || "").filter(Boolean)),
  ].sort();
  const locations = [
    ...new Set(programs.map((p) => p.location?.trim() || "").filter(Boolean)),
  ].sort();

  return {
    programs: programs
      .map((p) => ({ id: p.id, name: p.name?.trim() || "Untitled Program" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    campaigns: campaigns
      .map((c) => ({ id: c.id, name: c.name?.trim() || "Untitled Campaign" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    categories,
    statuses,
    locations,
  };
}

export async function fetchImpactIntelligence(
  filters: AnalyticsFilters = DEFAULT_FILTERS,
): Promise<ImpactIntelligenceBundle> {
  const [
    campaignsRaw,
    programsRaw,
    donationsRaw,
    volunteersRaw,
    beneficiariesRaw,
    activitiesRaw,
  ] = await Promise.all([
    getDocuments("campaigns") as Promise<CampaignDoc[]>,
    getDocuments("programs") as Promise<ProgramDoc[]>,
    getDocuments("donations") as Promise<DonationDoc[]>,
    getDocuments("volunteers") as Promise<VolunteerDoc[]>,
    getDocuments("beneficiaries") as Promise<BeneficiaryDoc[]>,
    getDocuments("activities") as Promise<ActivityDoc[]>,
  ]);

  const filterOptions = buildFilterOptions(programsRaw, campaignsRaw);

  const programs = filterPrograms(programsRaw, filters);
  const campaigns = filterCampaigns(campaignsRaw, filters);

  const selectedProgramNames = new Set(
    programs.map((p) => p.name?.trim() || "").filter(Boolean),
  );

  const beneficiaries =
    filters.programId === "all"
      ? beneficiariesRaw
      : beneficiariesRaw.filter((b) =>
          selectedProgramNames.has(b.program?.trim() || ""),
        );

  const donations =
    filters.campaignId === "all"
      ? donationsRaw
      : donationsRaw.filter((d) => d.campaignId === filters.campaignId);

  const volunteers =
    filters.programId === "all"
      ? volunteersRaw
      : volunteersRaw.filter((v) =>
          selectedProgramNames.has(v.initiative?.trim() || ""),
        );

  const donationTotal = donations.reduce((sum, d) => sum + toNumber(d.amount), 0);
  const campaignRaised = campaigns.reduce((sum, c) => sum + toNumber(c.raised), 0);
  const fundsRaised = donationTotal > 0 ? donationTotal : campaignRaised;
  const fundsDeployed = programs.reduce((sum, p) => sum + toNumber(p.spent), 0);
  const beneficiariesServed = uniqueBeneficiaryCount(beneficiaries);
  const volunteerHours = volunteers.reduce((sum, v) => sum + toNumber(v.hours), 0);

  const activePrograms = programs.filter(
    (p) => p.status === "Active" || p.status === "Planning",
  ).length;
  const programsOnTarget = programs.filter((p) => {
    const progress = toNumber(p.progress);
    return p.status === "Completed" || (p.status === "Active" && progress >= 50);
  }).length;
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "Active" || c.status === "In Progress",
  ).length;

  const totalGoal = campaigns.reduce((sum, c) => sum + toNumber(c.goal), 0);
  const goalAchievementRate =
    totalGoal > 0 ? Math.round((fundsRaised / totalGoal) * 100) : null;

  const geography = buildGeography(programs, beneficiaries);
  const { points: trend, hasHistory: trendHasHistory } = buildTrend(
    filters.period,
    beneficiaries,
    donations,
    programs,
    volunteers,
  );

  const programRows = buildProgramRows(programs);
  const beneficiaryOutcomes = buildBeneficiaryOutcomes(beneficiaries, filters.period);
  const funding = buildFunding(fundsRaised, programs, beneficiariesServed);
  const volunteerContribution = buildVolunteerContribution(volunteers, activitiesRaw);
  const distribution = buildDistribution(programs);
  const risks = buildRisks(programs, campaigns, beneficiaries);
  const insights = buildInsights(
    programs,
    campaigns,
    beneficiaries,
    volunteers,
    fundsRaised,
    fundsDeployed,
    filters.period,
  );

  return {
    kpis: {
      beneficiariesServed,
      activePrograms,
      programsOnTarget,
      activeCampaigns,
      fundsRaised,
      fundsDeployed,
      volunteerHours,
      costPerBeneficiary:
        beneficiariesServed > 0
          ? Number((fundsDeployed / beneficiariesServed).toFixed(2))
          : null,
      goalAchievementRate,
      geographicReach: geography.communities || geography.locations.length,
    },
    trend,
    trendHasHistory,
    programs: programRows,
    beneficiaries: beneficiaryOutcomes,
    funding,
    volunteers: volunteerContribution,
    geography,
    distribution,
    risks,
    insights,
    filterOptions,
    loadedAt: new Date().toISOString(),
  };
}

export function formatAnalyticsCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatAnalyticsNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
