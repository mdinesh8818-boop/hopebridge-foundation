import type { Program } from "../app/dashboard/programs/types";
import type { ImpactPeriodId, ImpactSnapshot } from "../app/dashboard/programs/types";

export const IMPACT_PERIOD_OPTIONS = [
  { id: "3m" as const, label: "Last 3 Months" },
  { id: "6m" as const, label: "Last 6 Months" },
  { id: "12m" as const, label: "Last 12 Months" },
  { id: "year" as const, label: "This Year" },
  { id: "all" as const, label: "All Time" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Education: "#0d5f44",
  Healthcare: "#064e3b",
  Environment: "#6b8f71",
  Community: "#d4af37",
  default: "#a8a196",
};

export function getImpactSnapshotFromPrograms(
  programs: Program[],
  _period: ImpactPeriodId,
): ImpactSnapshot {
  const totalBeneficiaries = programs.reduce(
    (sum, p) => sum + (Number(p.beneficiaries) || 0),
    0,
  );

  if (programs.length === 0 || totalBeneficiaries === 0) {
    return {
      kpis: {
        totalBeneficiaries: 0,
        beneficiaryGrowth: 0,
        childrenReached: 0,
        childrenPercent: 0,
        womenImpacted: 0,
        womenPercent: 0,
        familiesSupported: 0,
        familiesPercent: 0,
      },
      beneficiaryTrend: [],
      programImpact: [],
      distribution: [],
      geography: [],
      geographicSummary: { countries: 0, regions: 0, communities: 0 },
      stories: [],
      efficiency: {
        costPerBeneficiary: 0,
        programsImproving: 0,
        programsTotal: 0,
        highestImpactProgram: "—",
        fastestGrowingProgram: "—",
        fastestGrowthPercent: 0,
        communitiesReached: 0,
      },
    };
  }

  const totalSpent = programs.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
  const programImpact = programs.map((p) => ({
    name: p.name,
    impactPercent: Math.min(100, Number(p.progress) || 0),
    beneficiaries: Number(p.beneficiaries) || 0,
  }));

  const categoryTotals = new Map<string, number>();
  for (const p of programs) {
    const cat = p.category || "Other";
    categoryTotals.set(
      cat,
      (categoryTotals.get(cat) ?? 0) + (Number(p.beneficiaries) || 0),
    );
  }

  const distribution = [...categoryTotals.entries()].map(([category, beneficiaries]) => ({
    category,
    percent: Math.round((beneficiaries / totalBeneficiaries) * 100),
    beneficiaries,
    color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default,
  }));

  const locationMap = new Map<
    string,
    { beneficiaries: number; activePrograms: number; name: string }
  >();
  for (const p of programs) {
    const loc = p.location || "Unknown";
    const existing = locationMap.get(loc) ?? {
      beneficiaries: 0,
      activePrograms: 0,
      name: loc,
    };
    existing.beneficiaries += Number(p.beneficiaries) || 0;
    if (p.status === "Active") existing.activePrograms += 1;
    locationMap.set(loc, existing);
  }

  const geography = [...locationMap.entries()].map(([id, data], index) => ({
    id,
    name: data.name,
    country: data.name,
    x: 120 + (index % 5) * 140,
    y: 100 + Math.floor(index / 5) * 80,
    activePrograms: data.activePrograms,
    beneficiaries: data.beneficiaries,
    impactLevel:
      data.beneficiaries > 5000
        ? ("High" as const)
        : data.beneficiaries > 1000
          ? ("Medium" as const)
          : ("Low" as const),
    lon: -100 + index * 15,
    lat: 30 + index * 5,
  }));

  const improving = programs.filter((p) => Number(p.progress) >= 50).length;
  const highest = [...programs].sort(
    (a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0),
  )[0];

  return {
    kpis: {
      totalBeneficiaries,
      beneficiaryGrowth: 0,
      childrenReached: 0,
      childrenPercent: 0,
      womenImpacted: 0,
      womenPercent: 0,
      familiesSupported: 0,
      familiesPercent: 0,
    },
    beneficiaryTrend: [],
    programImpact,
    distribution,
    geography,
    geographicSummary: {
      countries: locationMap.size,
      regions: locationMap.size,
      communities: locationMap.size,
    },
    stories: [],
    efficiency: {
      costPerBeneficiary:
        totalBeneficiaries > 0
          ? Number((totalSpent / totalBeneficiaries).toFixed(2))
          : 0,
      programsImproving: improving,
      programsTotal: programs.length,
      highestImpactProgram: highest?.name ?? "—",
      fastestGrowingProgram: highest?.name ?? "—",
      fastestGrowthPercent: Number(highest?.progress) || 0,
      communitiesReached: locationMap.size,
    },
  };
}

export function computeProgramInsights(programs: Program[]) {
  if (programs.length === 0) return [];

  const insights: {
    id: string;
    title: string;
    description: string;
    severity: "Low" | "Medium" | "High";
    recommendation: string;
  }[] = [];

  for (const program of programs) {
    if (program.priority === "Critical" && program.status === "Active") {
      insights.push({
        id: `insight-${program.id}-critical`,
        title: `${program.name} requires review`,
        description: `Critical priority program at ${program.progress}% progress.`,
        severity: "High",
        recommendation: "Review milestones and resource allocation immediately.",
      });
    } else if (
      program.status === "Active" &&
      program.budget > 0 &&
      program.spent / program.budget > 0.9
    ) {
      insights.push({
        id: `insight-${program.id}-budget`,
        title: `${program.name} budget nearly exhausted`,
        description: `${Math.round((program.spent / program.budget) * 100)}% of budget utilized.`,
        severity: "Medium",
        recommendation: "Review spending and adjust forecast.",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "insight-healthy",
      title: "Portfolio operating normally",
      description: `${programs.length} program${programs.length === 1 ? "" : "s"} tracked with no critical flags.`,
      severity: "Low",
      recommendation: "Continue monitoring milestones and outcomes.",
    });
  }

  return insights.slice(0, 4);
}
