export type AnalyticsPeriodId = "30d" | "90d" | "6m" | "1y";

export type ProgramHealth =
  | "On Track"
  | "Needs Attention"
  | "Critical"
  | "Completed";

export type AnalyticsFilters = {
  period: AnalyticsPeriodId;
  programId: string;
  campaignId: string;
  category: string;
  status: string;
  location: string;
};

export type AnalyticsKpis = {
  beneficiariesServed: number;
  activePrograms: number;
  programsOnTarget: number;
  activeCampaigns: number;
  fundsRaised: number;
  fundsDeployed: number;
  volunteerHours: number;
  costPerBeneficiary: number | null;
  goalAchievementRate: number | null;
  geographicReach: number;
};

export type TrendPoint = {
  label: string;
  beneficiaries: number;
  fundsRaised: number;
  programProgress: number;
  volunteerHours: number;
};

export type ProgramPerformanceRow = {
  id: string;
  name: string;
  status: string;
  category: string;
  location: string;
  progress: number;
  beneficiariesReached: number;
  beneficiaryTarget: number | null;
  budget: number;
  fundsDeployed: number;
  goalAchievement: number | null;
  health: ProgramHealth;
  endDate: string;
};

export type BeneficiaryOutcomes = {
  total: number;
  newInPeriod: number;
  byProgram: { program: string; count: number }[];
  byRegion: { region: string; count: number }[];
  byLocation: { location: string; count: number }[];
  growthTrend: { label: string; count: number }[];
  demographicsAvailable: false;
  childrenReached: null;
  womenImpacted: null;
  familiesSupported: null;
  communitiesReached: number;
};

export type FundingVsImpact = {
  fundsRaised: number;
  fundsDeployed: number;
  beneficiariesServed: number;
  costPerBeneficiary: number | null;
  deploymentRate: number | null;
  byProgram: {
    name: string;
    spent: number;
    beneficiaries: number;
    costPerBeneficiary: number | null;
  }[];
};

export type VolunteerContribution = {
  activeVolunteers: number;
  totalHours: number;
  activitiesLogged: number;
  byProgram: { program: string; volunteers: number; hours: number }[];
  hoursTracked: boolean;
};

export type GeographicImpact = {
  locations: {
    id: string;
    name: string;
    country: string;
    programs: number;
    beneficiaries: number;
    impactLevel: "High" | "Medium" | "Low";
    lon: number;
    lat: number;
    x: number;
    y: number;
    activePrograms: number;
  }[];
  countries: number;
  regions: number;
  communities: number;
};

export type CategoryDistribution = {
  category: string;
  beneficiaries: number;
  programs: number;
  percent: number;
  color: string;
};

export type RiskAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  href: string;
  actionLabel: string;
};

export type ImpactInsight = {
  id: string;
  title: string;
  description: string;
  tone: "positive" | "attention" | "neutral";
};

export type FilterOptions = {
  programs: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
  categories: string[];
  statuses: string[];
  locations: string[];
};

export type ImpactIntelligenceBundle = {
  kpis: AnalyticsKpis;
  trend: TrendPoint[];
  trendHasHistory: boolean;
  programs: ProgramPerformanceRow[];
  beneficiaries: BeneficiaryOutcomes;
  funding: FundingVsImpact;
  volunteers: VolunteerContribution;
  geography: GeographicImpact;
  distribution: CategoryDistribution[];
  risks: RiskAlert[];
  insights: ImpactInsight[];
  filterOptions: FilterOptions;
  loadedAt: string;
};
