export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export type OrganizationSnapshot = {
  activeCampaigns: number;
  activePrograms: number;
  fundsRaised: number;
  totalCampaignGoal: number;
  activeDonors: number;
  totalDonations: number;
  volunteerCount: number;
  volunteerHours: number;
  beneficiaryCount: number;
  activeTeams: number;
  totalProgramBudget: number;
  totalProgramSpent: number;
  programsOnTrack: number;
  programsAtRisk: number;
  impactScore: number | null;
};

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
};

export async function fetchOrganizationSnapshot(): Promise<OrganizationSnapshot> {
  const { fetchDashboardOrganizationData } = await import(
    "./organizationSnapshot"
  );
  const data = await fetchDashboardOrganizationData();
  return data.snapshot;
}

export async function fetchAttentionItems(): Promise<AttentionItem[]> {
  const { fetchDashboardOrganizationData } = await import(
    "./organizationSnapshot"
  );
  const data = await fetchDashboardOrganizationData();
  return data.attentionItems;
}
