// ===============================
// PROGRAM MANAGEMENT TYPES
// HopeBridge Foundation
// ===============================

export type ProgramStatus =
  | "Planning"
  | "Active"
  | "Completed"
  | "On Hold";

export type ProgramPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export interface Program {
  id: string;

  name: string;

  category: string;

  description: string;

  manager: string;

  beneficiaries: number;

  budget: number;

  spent: number;

  progress: number;

  startDate: string;

  endDate: string;

  status: ProgramStatus;

  priority: ProgramPriority;

  location: string;

  createdAt: string;

  updatedAt: string;
}

export interface ProgramActivity {
  id: string;

  programId: string;

  title: string;

  description: string;

  time: string;

  user: string;

  type:
    | "created"
    | "updated"
    | "deleted"
    | "completed"
    | "reviewed";
}

export interface ProgramStatistics {
  active: number;

  completed: number;

  inProgress: number;

  attention: number;

  totalBudget: number;

  totalSpent: number;

  totalBeneficiaries: number;
}

export interface ProgramFilters {
  search: string;

  status: string;

  category: string;

  priority: string;
}

export interface ProgramInsight {
  id: string;

  title: string;

  description: string;

  severity:
    | "Low"
    | "Medium"
    | "High";

  recommendation: string;
}

export interface PerformancePoint {
  month: string;

  planning: number;

  execution: number;

  review: number;

  optimization: number;
}

export type ImpactPeriodId = "3m" | "6m" | "12m" | "year" | "all";

export interface ImpactPeriodOption {
  id: ImpactPeriodId;
  label: string;
}

export interface ImpactKPIs {
  totalBeneficiaries: number;
  beneficiaryGrowth: number;
  childrenReached: number;
  childrenPercent: number;
  womenImpacted: number;
  womenPercent: number;
  familiesSupported: number;
  familiesPercent: number;
}

export interface BeneficiaryTrendPoint {
  month: string;
  beneficiaries: number;
  changePercent: number;
}

export interface ProgramImpactBar {
  name: string;
  impactPercent: number;
  beneficiaries: number;
}

export interface ImpactDistributionSlice {
  category: string;
  percent: number;
  beneficiaries: number;
  color: string;
}

export interface GeographicLocation {
  id: string;
  name: string;
  country: string;
  x: number;
  y: number;
  activePrograms: number;
  beneficiaries: number;
  impactLevel: "High" | "Medium" | "Low" | "Growing";
  lon: number;
  lat: number;
}

export interface GeographicSummary {
  countries: number;
  regions: number;
  communities: number;
}

export interface ImpactStory {
  id: string;
  title: string;
  category: string;
  description: string;
  accent: "emerald" | "gold" | "sage";
}

export interface ImpactEfficiency {
  costPerBeneficiary: number;
  programsImproving: number;
  programsTotal: number;
  highestImpactProgram: string;
  fastestGrowingProgram: string;
  fastestGrowthPercent: number;
  communitiesReached: number;
}

export interface ImpactSnapshot {
  kpis: ImpactKPIs;
  beneficiaryTrend: BeneficiaryTrendPoint[];
  programImpact: ProgramImpactBar[];
  distribution: ImpactDistributionSlice[];
  geography: GeographicLocation[];
  geographicSummary: GeographicSummary;
  stories: ImpactStory[];
  efficiency: ImpactEfficiency;
}