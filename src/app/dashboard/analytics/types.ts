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
  /** null when beneficiariesServed is 0 or fundsDeployed is 0 (avoid misleading $0 efficiency). */
  costPerBeneficiary: number | null;
  /** null when no campaign goals exist. */
  goalAchievementRate: number | null;
  /** Unique city/community locations from program + beneficiary location fields. */
  geographicReach: number;
};

export type TrendPoint = {
  label: string;
  beneficiaries: number;
  fundsRaised: number;
  programProgress: number;
  volunteerActivity: number;
};

export type ProgramPerformanceRow = {
  id: string;
  name: string;
  status: string;
  category: string;
  location: string;
  progress: number;
  /** From programs.beneficiaries field (program document), not beneficiary collection join. */
  beneficiariesReached: number;
  beneficiaryTarget: number | null;
  budget: number;
  fundsDeployed: number;
  /** Budget utilization (spent/budget). null when budget is 0. */
  budgetUtilization: number | null;
  health: ProgramHealth;
  endDate: string;
};

export type BeneficiaryOutcomes = {
  total: number;
  newInPeriod: number;
  /**
   * Grouped by beneficiary.program free-text label (dropdown values),
   * not by Programs module document IDs.
   */
  byProgramAssignment: { label: string; count: number }[];
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
  hasDeployedSpend: boolean;
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
  /** Grouped by volunteer.initiative label. */
  byInitiative: { initiative: string; volunteers: number; hours: number }[];
  hoursTracked: boolean;
};

export type GeographicImpact = {
  locations: {
    id: string;
    name: string;
    /** Always unspecified — no country field exists in source records. */
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
  /** null when no country field is stored on programs/beneficiaries. */
  countries: number | null;
  countriesAvailable: boolean;
  regions: number;
  communities: number;
  uniqueLocations: number;
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
