import { Program, ProgramFilters, ProgramStatistics } from "./types";

/**
 * Search programs by name, category, manager or location
 */
export function searchPrograms(
  programs: Program[],
  search: string
): Program[] {
  if (!search.trim()) return programs;

  const keyword = search.toLowerCase();

  return programs.filter((program) => {
    return (
      program.name.toLowerCase().includes(keyword) ||
      program.category.toLowerCase().includes(keyword) ||
      program.manager.toLowerCase().includes(keyword) ||
      program.location.toLowerCase().includes(keyword)
    );
  });
}

/**
 * Apply filters
 */
export function filterPrograms(
  programs: Program[],
  filters: ProgramFilters
): Program[] {
  return programs.filter((program) => {
    const statusMatch =
      !filters.status ||
      filters.status === "All" ||
      program.status === filters.status;

    const categoryMatch =
      !filters.category ||
      filters.category === "All" ||
      program.category === filters.category;

    const priorityMatch =
      !filters.priority ||
      filters.priority === "All" ||
      program.priority === filters.priority;

    return statusMatch && categoryMatch && priorityMatch;
  });
}

/**
 * Search + Filter together
 */
export function getVisiblePrograms(
  programs: Program[],
  filters: ProgramFilters
): Program[] {
  const searched = searchPrograms(programs, filters.search);

  return filterPrograms(searched, filters);
}

/**
 * Dashboard statistics
 */
export function calculateStatistics(
  programs: Program[]
): ProgramStatistics {
  return {
    active: programs.filter((p) => p.status === "Active").length,

    completed: programs.filter((p) => p.status === "Completed").length,

    inProgress: programs.filter(
      (p) => p.progress > 0 && p.progress < 100
    ).length,

    attention: programs.filter(
      (p) => p.priority === "Critical"
    ).length,

    totalBudget: programs.reduce(
      (sum, p) => sum + p.budget,
      0
    ),

    totalSpent: programs.reduce(
      (sum, p) => sum + p.spent,
      0
    ),

    totalBeneficiaries: programs.reduce(
      (sum, p) => sum + p.beneficiaries,
      0
    ),
  };
}

/**
 * Currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Percentage
 */
export function formatPercent(value: number): string {
  return `${value}%`;
}

/**
 * Today's date
 */
export function today(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate ID
 */
export function generateProgramId(): string {
  return `PG-${Date.now()}`;
}

/**
 * Progress color
 */
export function progressColor(progress: number): string {
  if (progress < 30)
    return "from-red-500 to-orange-400";

  if (progress < 60)
    return "from-yellow-400 to-amber-300";

  if (progress < 90)
    return "from-[#0d5f44] to-[#166534]";

  return "from-emerald-400 to-green-500";
}

/**
 * Status badge color
 */
export function statusColor(status: string): string {
  switch (status) {
    case "Completed":
      return "pn-status-completed";
    case "Active":
      return "pn-status-active";
    case "Planning":
      return "pn-status-planning";
    case "On Hold":
      return "pn-status-hold";
    default:
      return "pn-status-default";
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "Critical":
      return "pn-priority-critical";
    case "High":
      return "pn-priority-high";
    case "Medium":
      return "pn-priority-medium";
    default:
      return "pn-priority-low";
  }
}

export interface HealthMatrixMetrics {
  deliveryHealth: number;
  deliveryLabel: string;
  budgetUtilization: number;
  budgetLabel: string;
  beneficiaryReach: number;
  reachGrowth: string;
  milestoneCompletion: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  riskExposure: number;
  criticalCount: number;
  moderateCount: number;
}

export interface PortfolioSignal {
  id: string;
  icon: "up" | "check" | "warn" | "delay";
  text: string;
  value: string;
}

export function calculateHealthMatrix(programs: Program[]): HealthMatrixMetrics {
  const stats = calculateStatistics(programs);
  const deliveryHealth =
    programs.length > 0
      ? Math.round(
          programs.reduce((sum, program) => sum + program.progress, 0) /
            programs.length
        )
      : 0;

  const onTrackCount = programs.filter(
    (program) => program.progress >= 50 || program.status === "Completed"
  ).length;

  const deliveryLabel =
    onTrackCount >= programs.length * 0.75
      ? "On Track"
      : onTrackCount >= programs.length * 0.5
        ? "Monitor"
        : "At Risk";

  const budgetUtilization =
    stats.totalBudget > 0
      ? Math.round((stats.totalSpent / stats.totalBudget) * 100)
      : 0;

  const budgetLabel =
    budgetUtilization <= 85
      ? "Healthy"
      : budgetUtilization <= 95
        ? "Monitor"
        : "Over";

  const milestonesPerProgram = 4;
  const milestonesTotal = programs.length * milestonesPerProgram;
  const milestonesCompleted = programs.reduce(
    (sum, program) => sum + Math.min(4, Math.floor(program.progress / 25)),
    0
  );

  const milestoneCompletion =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;

  const criticalCount = programs.filter(
    (program) => program.priority === "Critical"
  ).length;

  const moderateCount = programs.filter(
    (program) =>
      program.priority !== "Critical" &&
      program.status === "Active" &&
      program.progress < 50
  ).length;

  const riskExposure = criticalCount + moderateCount;

  const educationProgram = programs.find((program) =>
    program.category === "Education"
  );

  const reachGrowth = educationProgram
    ? `+${(educationProgram.progress * 0.115).toFixed(1)}% this quarter`
    : "+0.0% this quarter";

  return {
    deliveryHealth,
    deliveryLabel,
    budgetUtilization,
    budgetLabel,
    beneficiaryReach: stats.totalBeneficiaries,
    reachGrowth,
    milestoneCompletion,
    milestonesCompleted,
    milestonesTotal,
    riskExposure,
    criticalCount,
    moderateCount,
  };
}

export function getPortfolioSignals(programs: Program[]): PortfolioSignal[] {
  const signals: PortfolioSignal[] = [];

  const education = programs.find((program) => program.category === "Education");
  if (education) {
    signals.push({
      id: "sig-edu",
      icon: "up",
      text: "Education reach accelerating",
      value: `+${(education.progress * 0.17).toFixed(1)}%`,
    });
  }

  const healthcare = programs.find((program) => program.category === "Healthcare");
  if (healthcare) {
    signals.push({
      id: "sig-hlt",
      icon: "check",
      text: "Healthcare delivery on target",
      value: `${healthcare.progress}%`,
    });
  }

  const critical = programs.find((program) => program.priority === "Critical");
  if (critical) {
    signals.push({
      id: "sig-crit",
      icon: "warn",
      text: `${critical.name} requires review`,
      value: "Critical",
    });
  }

  const delayed = programs.find(
    (program) => program.progress < 50 && program.status === "Active"
  );
  if (delayed) {
    signals.push({
      id: "sig-delay",
      icon: "delay",
      text: `${delayed.name} milestone delay`,
      value: "7 days",
    });
  }

  return signals;
}