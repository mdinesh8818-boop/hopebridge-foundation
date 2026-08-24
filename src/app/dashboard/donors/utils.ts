export type DonorRecord = {
  id: string;
  name: string;
  email: string;
  amount: string;
  amountNum: number;
  campaign: string;
  date: string;
  status: string;
  initials: string;
};

export type MonthlyDonation = {
  month: string;
  raised: number;
  changePct: number;
  contributions: number;
};

export type CampaignPerformance = {
  name: string;
  raised: string;
  raisedNum: number;
  target: string;
  targetNum: number;
  percentage: number;
  donors: number;
  remaining: number;
};

export type DonorKpi = {
  title: string;
  value: string;
  change: string;
  detail: string;
  positive: boolean;
};

export type DonorSegment = {
  key: "major" | "recurring" | "one-time";
  name: string;
  donors: string;
  amount: string;
  percentage: string;
};

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function parseDonorDate(value: unknown): Date | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
    if (typeof maybeTimestamp.seconds === "number") {
      return new Date(maybeTimestamp.seconds * 1000);
    }
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const date = new Date(`${trimmed.slice(0, 10)}T12:00:00`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export function formatDonorDateDisplay(value: unknown): string {
  const date = parseDonorDate(value);
  if (!date) {
    return typeof value === "string" ? value : "";
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function normalizeDonorRecord(
  record: Record<string, unknown> & { id: string },
): DonorRecord {
  const name = typeof record.name === "string" ? record.name : String(record.name ?? "");
  const email =
    typeof record.email === "string" ? record.email : String(record.email ?? "");
  const campaign =
    typeof record.campaign === "string"
      ? record.campaign
      : String(record.campaign ?? "");
  const status =
    typeof record.status === "string" ? record.status : String(record.status ?? "");
  const amountNum = Number(record.amountNum);
  const safeAmount = Number.isFinite(amountNum)
    ? amountNum
    : Number(String(record.amount ?? "").replace(/[^0-9.]/g, "")) || 0;
  const date = formatDonorDateDisplay(record.date);
  const initials =
    typeof record.initials === "string" && record.initials.trim()
      ? record.initials
      : getInitials(name);

  return {
    id: record.id,
    name,
    email,
    amount: formatCurrencyFull(safeAmount),
    amountNum: safeAmount,
    campaign,
    date,
    status,
    initials,
  };
}

export function matchesDonorDateRange(dateValue: string, range: string): boolean {
  if (range === "All") return true;
  const date = parseDonorDate(dateValue);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "Last 7 days") {
    start.setDate(start.getDate() - 6);
    return date >= start && date <= now;
  }

  if (range === "Last 30 days") {
    start.setDate(start.getDate() - 29);
    return date >= start && date <= now;
  }

  return true;
}

export function computeDonorKpis(donors: DonorRecord[]): DonorKpi[] {
  const totalRaised = donors.reduce((sum, d) => sum + (Number(d.amountNum) || 0), 0);
  const activeDonors = donors.filter(
    (d) => !(d.status || "").toLowerCase().includes("lapsed"),
  ).length;
  const averageGift =
    donors.length > 0 ? Math.round(totalRaised / donors.length) : 0;
  const recurring = donors.filter((d) => d.status === "Recurring").length;
  const retentionRate =
    donors.length > 0 ? Math.round((recurring / donors.length) * 100) : 0;

  return [
    {
      title: "Total Donations",
      value: donors.length === 0 ? "$0" : formatCurrencyFull(totalRaised),
      change: donors.length === 0 ? "—" : `${donors.length} gifts recorded`,
      detail: donors.length === 0 ? "No donations yet" : "from donor records",
      positive: true,
    },
    {
      title: "Active Donors",
      value: String(activeDonors),
      change: donors.length === 0 ? "—" : `${donors.length} total`,
      detail: donors.length === 0 ? "No donors yet" : "supporting our mission",
      positive: true,
    },
    {
      title: "Average Gift",
      value: donors.length === 0 ? "$0" : formatCurrencyFull(averageGift),
      change: "—",
      detail: donors.length === 0 ? "No gifts recorded" : "per recorded gift",
      positive: true,
    },
    {
      title: "Retention Rate",
      value: donors.length === 0 ? "—" : `${retentionRate}%`,
      change: "—",
      detail:
        donors.length === 0
          ? "Requires donation history"
          : `${recurring} recurring donor${recurring === 1 ? "" : "s"}`,
      positive: retentionRate >= 50,
    },
  ];
}

export function computeMonthlyDonations(
  donors: DonorRecord[],
): MonthlyDonation[] {
  if (donors.length === 0) return [];

  const monthNames = [
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

  const buckets = new Map<string, { raised: number; contributions: number }>();

  for (const donor of donors) {
    const parsed = parseDonorDate(donor.date);
    if (!parsed) continue;
    const key = monthNames[parsed.getMonth()];
    const existing = buckets.get(key) ?? { raised: 0, contributions: 0 };
    existing.raised += Number(donor.amountNum) || 0;
    existing.contributions += 1;
    buckets.set(key, existing);
  }

  const ordered = monthNames
    .filter((m) => buckets.has(m))
    .map((month, index, arr) => {
      const data = buckets.get(month)!;
      const prev = index > 0 ? buckets.get(arr[index - 1]) : null;
      const changePct =
        prev && prev.raised > 0
          ? Math.round(((data.raised - prev.raised) / prev.raised) * 100)
          : 0;
      return {
        month,
        raised: data.raised,
        changePct,
        contributions: data.contributions,
      };
    });

  return ordered;
}

export function computeCampaignPerformance(
  donors: DonorRecord[],
  campaigns: { name: string; goal?: number; raised?: number }[],
): CampaignPerformance[] {
  if (campaigns.length === 0 && donors.length === 0) return [];

  const campaignNames = new Set([
    ...campaigns.map((c) => c.name).filter(Boolean),
    ...donors.map((d) => d.campaign).filter(Boolean),
  ]);

  return [...campaignNames]
    .filter(Boolean)
    .map((name) => {
      const campaignDonors = donors.filter((d) => d.campaign === name);
      const raisedNum = campaignDonors.reduce(
        (s, d) => s + (Number(d.amountNum) || 0),
        0,
      );
      const firestoreCampaign = campaigns.find((c) => c.name === name);
      const targetNum = Number(firestoreCampaign?.goal) || raisedNum || 0;
      const percentage =
        targetNum > 0 ? Math.min(100, Math.round((raisedNum / targetNum) * 100)) : 0;

      return {
        name,
        raised: formatCurrencyFull(raisedNum),
        raisedNum,
        target: formatCurrencyFull(targetNum),
        targetNum,
        percentage,
        donors: campaignDonors.length,
        remaining: Math.max(0, targetNum - raisedNum),
      };
    })
    .filter((c) => c.donors > 0 || c.targetNum > 0)
    .sort((a, b) => b.raisedNum - a.raisedNum);
}

export function computeDonorSegments(donors: DonorRecord[]): DonorSegment[] {
  const total = donors.reduce((s, d) => s + (Number(d.amountNum) || 0), 0);
  if (total === 0) return [];

  const major = donors.filter((d) =>
    (d.status || "").toLowerCase().includes("major"),
  );
  const recurring = donors.filter((d) => d.status === "Recurring");
  const oneTime = donors.filter((d) => d.status === "New donor");

  function segment(
    key: DonorSegment["key"],
    name: string,
    list: DonorRecord[],
  ): DonorSegment {
    const amount = list.reduce((s, d) => s + (Number(d.amountNum) || 0), 0);
    return {
      key,
      name,
      donors: `${list.length} donor${list.length === 1 ? "" : "s"}`,
      amount: formatCurrency(amount),
      percentage: `${Math.round((amount / total) * 100)}%`,
    };
  }

  return [
    segment("major", "Major Donors", major),
    segment("recurring", "Recurring Donors", recurring),
    segment("one-time", "One-Time Donors", oneTime),
  ].filter((s) => !s.donors.startsWith("0 "));
}

export function computeAiInsight(donors: DonorRecord[]): {
  title: string;
  body: string;
  recommendation: string | null;
} {
  if (donors.length === 0) {
    return {
      title: "No AI insights available yet",
      body: "HopeBridge AI will generate donor insights when sufficient real data exists.",
      recommendation: null,
    };
  }

  const lapsedCandidates = donors.filter((d) =>
    (d.status || "").toLowerCase().includes("lapsed"),
  ).length;

  if (lapsedCandidates > 0) {
    return {
      title: `${lapsedCandidates} donor${lapsedCandidates === 1 ? "" : "s"} may need re-engagement`,
      body: "These donors have lapsed status in your records.",
      recommendation:
        "Consider a personalized outreach campaign for lapsed donors.",
    };
  }

  const major = donors.filter((d) =>
    (d.status || "").toLowerCase().includes("major"),
  ).length;
  if (major > 0) {
    return {
      title: `${major} major donor${major === 1 ? "" : "s"} identified`,
      body: "Major donors represent a significant share of giving potential.",
      recommendation:
        "Schedule stewardship touchpoints with major donors this quarter.",
    };
  }

  return {
    title: "Donor portfolio growing",
    body: `${donors.length} donor record${donors.length === 1 ? "" : "s"} on file.`,
    recommendation: "Continue recording gifts to unlock trend analysis.",
  };
}
