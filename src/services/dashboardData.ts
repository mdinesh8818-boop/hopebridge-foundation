import { getDocuments } from "./firestore";
import { fetchAttentionItems, type AttentionItem, type OrganizationSnapshot } from "./organizationMetrics";

export type SearchResult = {
  id: string;
  module: string;
  label: string;
  sublabel?: string;
  href: string;
};

export type MonthlyFundraisingPoint = {
  month: string;
  monthLabel: string;
  raised: number;
  goal: number;
};

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
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
    const d = new Date(value);
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

function dedupeById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    if (!r.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

function dedupeBeneficiaries<T extends { id: string; beneficiaryId?: string }>(
  records: T[],
): T[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = r.beneficiaryId || r.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesQuery(value: unknown, query: string): boolean {
  if (value == null) return false;
  return String(value).toLowerCase().includes(query);
}

export async function searchOrganizationRecords(
  query: string,
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const [campaigns, programs, donors, volunteers, beneficiaries, teams] =
    await Promise.all([
      getDocuments("campaigns") as Promise<
        { id: string; name?: string; category?: string; owner?: string }[]
      >,
      getDocuments("programs") as Promise<
        { id: string; name?: string; category?: string; manager?: string; location?: string }[]
      >,
      getDocuments("donors") as Promise<
        { id: string; name?: string; email?: string; campaign?: string }[]
      >,
      getDocuments("volunteers") as Promise<
        { id: string; name?: string; email?: string; role?: string; initiative?: string }[]
      >,
      getDocuments("beneficiaries") as Promise<
        { id: string; name?: string; beneficiaryId?: string; program?: string; location?: string }[]
      >,
      getDocuments("teams") as Promise<
        { id: string; name?: string; department?: string }[]
      >,
    ]);

  const results: SearchResult[] = [];

  for (const c of dedupeById(campaigns)) {
    if (
      matchesQuery(c.name, q) ||
      matchesQuery(c.category, q) ||
      matchesQuery(c.owner, q)
    ) {
      results.push({
        id: c.id,
        module: "Campaign",
        label: c.name ?? "Campaign",
        sublabel: c.category,
        href: `/dashboard/campaigns?q=${encodeURIComponent(query)}`,
      });
    }
  }

  for (const p of dedupeById(programs)) {
    if (
      matchesQuery(p.name, q) ||
      matchesQuery(p.category, q) ||
      matchesQuery(p.manager, q) ||
      matchesQuery(p.location, q)
    ) {
      results.push({
        id: p.id,
        module: "Program",
        label: p.name ?? "Program",
        sublabel: p.category,
        href: `/dashboard/programs?q=${encodeURIComponent(query)}`,
      });
    }
  }

  for (const d of dedupeById(donors)) {
    if (
      matchesQuery(d.name, q) ||
      matchesQuery(d.email, q) ||
      matchesQuery(d.campaign, q)
    ) {
      results.push({
        id: d.id,
        module: "Donor",
        label: d.name ?? "Donor",
        sublabel: d.email,
        href: `/dashboard/donors?q=${encodeURIComponent(query)}`,
      });
    }
  }

  for (const v of dedupeById(volunteers)) {
    if (
      matchesQuery(v.name, q) ||
      matchesQuery(v.email, q) ||
      matchesQuery(v.role, q) ||
      matchesQuery(v.initiative, q)
    ) {
      results.push({
        id: v.id,
        module: "Volunteer",
        label: v.name ?? "Volunteer",
        sublabel: v.role,
        href: `/dashboard/volunteers?q=${encodeURIComponent(query)}`,
      });
    }
  }

  for (const b of dedupeBeneficiaries(beneficiaries)) {
    if (
      matchesQuery(b.name, q) ||
      matchesQuery(b.beneficiaryId, q) ||
      matchesQuery(b.program, q) ||
      matchesQuery(b.location, q)
    ) {
      results.push({
        id: b.id,
        module: "Beneficiary",
        label: b.name ?? "Beneficiary",
        sublabel: b.beneficiaryId,
        href: `/dashboard/beneficiaries?q=${encodeURIComponent(query)}`,
      });
    }
  }

  for (const t of dedupeById(teams)) {
    if (matchesQuery(t.name, q) || matchesQuery(t.department, q)) {
      results.push({
        id: t.id,
        module: "Team",
        label: t.name ?? "Team",
        sublabel: t.department,
        href: `/dashboard/teams?q=${encodeURIComponent(query)}`,
      });
    }
  }

  return results.slice(0, 10);
}

export async function fetchFundraisingMonthlyHistory(): Promise<
  MonthlyFundraisingPoint[]
> {
  const [donations, donors, campaigns] = await Promise.all([
    getDocuments("donations") as Promise<
      { amount?: number; date?: string; createdAt?: unknown }[]
    >,
    getDocuments("donors") as Promise<
      { amountNum?: number; date?: string; createdAt?: unknown }[]
    >,
    getDocuments("campaigns") as Promise<{ goal?: number }[]>,
  ]);

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

  if (monthlyRaised.size === 0) return [];

  const sortedKeys = [...monthlyRaised.keys()].sort();
  return sortedKeys.map((key) => {
    const [, monthIndex] = key.split("-");
    const raised = monthlyRaised.get(key) ?? 0;
    return {
      month: key,
      monthLabel: MONTH_LABELS[Number(monthIndex)] ?? key,
      raised,
      goal: goalPerMonth,
    };
  });
}

export function generateDashboardInsights(
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

export async function fetchDashboardNotifications(): Promise<
  DashboardNotification[]
> {
  const attention = await fetchAttentionItems();
  return attention.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    href: item.href,
    priority: item.priority,
  }));
}

export function buildChartPaths(
  points: MonthlyFundraisingPoint[],
  width: number,
  height: number,
): { raisedPath: string; goalPath: string; areaPath: string; maxValue: number } {
  if (points.length === 0) {
    return { raisedPath: "", goalPath: "", areaPath: "", maxValue: 0 };
  }

  const maxValue = Math.max(
    ...points.map((p) => Math.max(p.raised, p.goal)),
    1,
  );
  const padX = 30;
  const padY = 25;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? padX + chartW / 2
        : padX + (i / (points.length - 1)) * chartW;
    const raisedY = padY + chartH - (p.raised / maxValue) * chartH;
    const goalY = padY + chartH - (p.goal / maxValue) * chartH;
    return { x, raisedY, goalY };
  });

  const raisedPath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.raisedY}`)
    .join(" ");

  const goalPath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.goalY}`)
    .join(" ");

  const first = coords[0];
  const last = coords[coords.length - 1];
  const areaPath = `${raisedPath} L ${last.x} ${padY + chartH} L ${first.x} ${padY + chartH} Z`;

  return { raisedPath, goalPath, areaPath, maxValue };
}
