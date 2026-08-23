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
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function computeDonorKpis(donors: DonorRecord[]): DonorKpi[] {
  const totalRaised = donors.reduce((sum, d) => sum + d.amountNum, 0);
  const activeDonors = donors.filter(
    (d) => !d.status.toLowerCase().includes("lapsed"),
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
    const parsed = new Date(donor.date);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = monthNames[parsed.getMonth()];
    const existing = buckets.get(key) ?? { raised: 0, contributions: 0 };
    existing.raised += donor.amountNum;
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
    ...campaigns.map((c) => c.name),
    ...donors.map((d) => d.campaign),
  ]);

  return [...campaignNames]
    .filter(Boolean)
    .map((name) => {
      const campaignDonors = donors.filter((d) => d.campaign === name);
      const raisedNum = campaignDonors.reduce((s, d) => s + d.amountNum, 0);
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
  const total = donors.reduce((s, d) => s + d.amountNum, 0);
  if (total === 0) return [];

  const major = donors.filter((d) => d.status.toLowerCase().includes("major"));
  const recurring = donors.filter((d) => d.status === "Recurring");
  const oneTime = donors.filter((d) => d.status === "New donor");

  function segment(
    key: DonorSegment["key"],
    name: string,
    list: DonorRecord[],
  ): DonorSegment {
    const amount = list.reduce((s, d) => s + d.amountNum, 0);
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

  const lapsedCandidates = donors.filter(
    (d) => d.status.toLowerCase().includes("lapsed"),
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
    d.status.toLowerCase().includes("major"),
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
