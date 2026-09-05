import { fetchDashboardOrganizationData } from "./organizationSnapshot";
import { formatCurrency } from "./organizationMetrics";

export type ReportSection = {
  id: string;
  title: string;
  lines: string[];
};

export type OrganizationReport = {
  generatedAt: string;
  sections: ReportSection[];
  csvRows: string[][];
};

function pct(numerator: number, denominator: number): string {
  if (denominator <= 0) return "No goal recorded";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export async function buildOrganizationReport(): Promise<OrganizationReport> {
  const data = await fetchDashboardOrganizationData();
  const { snapshot, attentionItems } = data;
  const generatedAt = new Date().toISOString();

  const fundraisingLine =
    snapshot.totalCampaignGoal > 0
      ? `${formatCurrency(snapshot.fundsRaised)} raised of ${formatCurrency(snapshot.totalCampaignGoal)} goal (${pct(snapshot.fundsRaised, snapshot.totalCampaignGoal)})`
      : snapshot.fundsRaised > 0
        ? `${formatCurrency(snapshot.fundsRaised)} raised · no campaign goal totals recorded`
        : "No fundraising totals recorded yet";

  const programSpendLine =
    snapshot.totalProgramBudget > 0
      ? `${formatCurrency(snapshot.totalProgramSpent)} spent of ${formatCurrency(snapshot.totalProgramBudget)} program budget`
      : "No program budget data recorded yet";

  const sections: ReportSection[] = [
    {
      id: "executive",
      title: "Executive Summary",
      lines: [
        `${snapshot.activeCampaigns} active campaign${snapshot.activeCampaigns === 1 ? "" : "s"}`,
        `${snapshot.activePrograms} active program${snapshot.activePrograms === 1 ? "" : "s"}`,
        fundraisingLine,
        `${snapshot.activeDonors} active donor${snapshot.activeDonors === 1 ? "" : "s"} · ${snapshot.totalDonations} recorded gift${snapshot.totalDonations === 1 ? "" : "s"}`,
        `${snapshot.volunteerCount} volunteer${snapshot.volunteerCount === 1 ? "" : "s"}${snapshot.volunteerHours > 0 ? ` · ${snapshot.volunteerHours} hours tracked` : ""}`,
        `${snapshot.beneficiaryCount} beneficiary record${snapshot.beneficiaryCount === 1 ? "" : "s"}`,
      ],
    },
    {
      id: "programs",
      title: "Program Delivery",
      lines: [
        programSpendLine,
        `${snapshot.programsOnTrack} program${snapshot.programsOnTrack === 1 ? "" : "s"} on track`,
        `${snapshot.programsAtRisk} program${snapshot.programsAtRisk === 1 ? "" : "s"} flagged for attention`,
      ],
    },
    {
      id: "attention",
      title: "Items Needing Attention",
      lines:
        attentionItems.length > 0
          ? attentionItems.slice(0, 8).map((item) => `${item.title}: ${item.detail}`)
          : ["No leadership attention items are currently flagged."],
    },
  ];

  const csvRows: string[][] = [
    ["HopeBridge Foundation — Organizational Report"],
    ["Generated", generatedAt],
    [],
    ["Metric", "Value"],
    ["Active campaigns", String(snapshot.activeCampaigns)],
    ["Active programs", String(snapshot.activePrograms)],
    ["Funds raised", String(snapshot.fundsRaised)],
    ["Campaign goal total", String(snapshot.totalCampaignGoal)],
    ["Active donors", String(snapshot.activeDonors)],
    ["Total donations", String(snapshot.totalDonations)],
    ["Volunteers", String(snapshot.volunteerCount)],
    ["Volunteer hours", String(snapshot.volunteerHours)],
    ["Beneficiaries", String(snapshot.beneficiaryCount)],
    ["Active teams", String(snapshot.activeTeams)],
    ["Programs on track", String(snapshot.programsOnTrack)],
    ["Programs at risk", String(snapshot.programsAtRisk)],
    [],
    ["Attention items"],
    ...attentionItems.map((item) => [item.title, item.detail]),
  ];

  return { generatedAt, sections, csvRows };
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell.replace(/"/g, '""');
          return /[",\n]/.test(value) ? `"${value}"` : value;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
