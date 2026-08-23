import { fetchDashboardOrganizationData } from "./organizationSnapshot";
import { formatCurrency } from "./organizationMetrics";

export type DashboardMetrics = {
  activeCampaigns: number;
  activePrograms: number;
  fundsRaised: number;
  totalCampaignGoal: number;
  beneficiaryCount: number;
  activeDonors: number;
  volunteerCount: number;
  volunteerHours: number;
  activeTeams: number;
  impactScore: number | null;
  totalProgramBudget: number;
  programsOnTrack: number;
};

export { formatCurrency };

export type { UpcomingDeadline } from "./organizationSnapshot";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const data = await fetchDashboardOrganizationData();
  const s = data.snapshot;
  return {
    activeCampaigns: s.activeCampaigns,
    activePrograms: s.activePrograms,
    fundsRaised: s.fundsRaised,
    totalCampaignGoal: s.totalCampaignGoal,
    beneficiaryCount: s.beneficiaryCount,
    activeDonors: s.activeDonors,
    volunteerCount: s.volunteerCount,
    volunteerHours: s.volunteerHours,
    activeTeams: s.activeTeams,
    impactScore: s.impactScore,
    totalProgramBudget: s.totalProgramBudget,
    programsOnTrack: s.programsOnTrack,
  };
}

export async function fetchUpcomingDeadlines() {
  const data = await fetchDashboardOrganizationData();
  return data.upcomingDeadlines;
}
