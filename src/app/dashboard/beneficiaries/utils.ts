import { JOURNEY_STAGES } from "./data";
import type {
  ActivityEvent,
  Beneficiary,
  BeneficiaryFilters,
  DateInput,
  JourneyStage,
} from "./types";

export function normalizeToDate(value: DateInput | null | undefined): Date | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const date =
      trimmed.length <= 10 && !trimmed.includes("T")
        ? new Date(`${trimmed}T00:00:00`)
        : new Date(trimmed);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof value.seconds === "number") {
      const date = new Date(value.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

function formatNormalizedDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDate(value: DateInput | null | undefined) {
  const date = normalizeToDate(value);
  if (!date) {
    return typeof value === "string" && value.trim() ? value : "—";
  }

  return formatNormalizedDate(date);
}

export function formatRelativeTime(value: DateInput | null | undefined) {
  const date = normalizeToDate(value);
  if (!date) return "—";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return formatNormalizedDate(date);

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return formatNormalizedDate(date);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isWithinLastDays(dateStr: string, days: number) {
  if (!dateStr) return false;
  const date = new Date(`${dateStr}T00:00:00`);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

export function calculateKpis(beneficiaries: Beneficiary[]) {
  const total = beneficiaries.length;

  const currentlyServed = beneficiaries.filter(
    (b) => b.status === "Active" || b.journeyStage === "Service Active" || b.journeyStage === "Support Assigned",
  ).length;

  const newThisPeriod = beneficiaries.filter((b) =>
    isWithinLastDays(b.enrollmentDate, 30),
  ).length;

  const needsFollowUp = beneficiaries.filter(
    (b) =>
      b.followUpStatus === "Required" ||
      b.followUpStatus === "Overdue" ||
      b.status === "Follow-Up Required",
  ).length;

  return { total, currentlyServed, newThisPeriod, needsFollowUp };
}

export function calculateJourneyProgress(beneficiaries: Beneficiary[]) {
  if (beneficiaries.length === 0) {
    return JOURNEY_STAGES.map((stage) => ({ stage, count: 0, percentage: 0 }));
  }

  return JOURNEY_STAGES.map((stage) => {
    const count = beneficiaries.filter((b) => b.journeyStage === stage).length;
    return {
      stage,
      count,
      percentage: Math.round((count / beneficiaries.length) * 100),
    };
  });
}

export function calculateSupportDistribution(beneficiaries: Beneficiary[]) {
  const map = new Map<string, number>();

  beneficiaries.forEach((b) => {
    map.set(b.supportType, (map.get(b.supportType) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function calculateRegionReach(beneficiaries: Beneficiary[]) {
  const map = new Map<string, { count: number; programs: Set<string> }>();

  beneficiaries.forEach((b) => {
    const entry = map.get(b.region) ?? { count: 0, programs: new Set<string>() };
    entry.count += 1;
    entry.programs.add(b.program);
    map.set(b.region, entry);
  });

  return Array.from(map.entries()).map(([region, data]) => ({
    region,
    count: data.count,
    programCount: data.programs.size,
  }));
}

export function calculateOutcomes(beneficiaries: Beneficiary[]) {
  const servicesDelivered = beneficiaries.filter((b) => b.lastSupportDate).length;
  const positiveOutcomes = beneficiaries.filter((b) => b.outcomeStatus === "Positive").length;
  const followUpsCompleted = beneficiaries.filter((b) => b.followUpStatus === "Completed").length;
  const reviewsPending = beneficiaries.filter(
    (b) => b.outcomeStatus === "Review Due" || b.outcomeStatus === "Pending",
  ).length;

  return { servicesDelivered, positiveOutcomes, followUpsCompleted, reviewsPending };
}

export function getFollowUpCases(beneficiaries: Beneficiary[]) {
  return beneficiaries.filter(
    (b) =>
      b.followUpStatus === "Overdue" ||
      b.followUpStatus === "Required" ||
      b.outcomeStatus === "Review Due" ||
      b.status === "Follow-Up Required" ||
      b.status === "Under Review",
  );
}

export function filterBeneficiaries(
  beneficiaries: Beneficiary[],
  filters: BeneficiaryFilters,
) {
  const query = filters.search.trim().toLowerCase();

  return beneficiaries.filter((b) => {
    const matchesSearch =
      !query ||
      b.name.toLowerCase().includes(query) ||
      b.beneficiaryId.toLowerCase().includes(query) ||
      b.location.toLowerCase().includes(query) ||
      b.region.toLowerCase().includes(query) ||
      b.program.toLowerCase().includes(query) ||
      b.coordinator.toLowerCase().includes(query);

    const matchesProgram = filters.program === "All" || b.program === filters.program;
    const matchesSupport =
      filters.supportType === "All" || b.supportType === filters.supportType;
    const matchesStatus = filters.status === "All" || b.status === filters.status;
    const matchesLocation =
      filters.location === "All" || b.region === filters.location;
    const matchesFollowUp =
      filters.followUpStatus === "All" || b.followUpStatus === filters.followUpStatus;
    const matchesCoordinator =
      filters.coordinator === "All" || b.coordinator === filters.coordinator;

    return (
      matchesSearch &&
      matchesProgram &&
      matchesSupport &&
      matchesStatus &&
      matchesLocation &&
      matchesFollowUp &&
      matchesCoordinator
    );
  });
}

export function getStatusClass(status: string) {
  switch (status) {
    case "Active":
      return "bf-status bf-status-active";
    case "Completed":
      return "bf-status bf-status-completed";
    case "Follow-Up Required":
      return "bf-status bf-status-warning";
    case "Under Review":
      return "bf-status bf-status-review";
    case "Enrolled":
      return "bf-status bf-status-enrolled";
    default:
      return "bf-status bf-status-default";
  }
}

export function getFollowUpClass(status: string) {
  switch (status) {
    case "Overdue":
      return "bf-priority-critical";
    case "Required":
      return "bf-priority-attention";
    case "Scheduled":
      return "bf-priority-normal";
    default:
      return "bf-priority-normal";
  }
}

export function journeyStageIndex(stage: JourneyStage) {
  return JOURNEY_STAGES.indexOf(stage);
}

export function generateBeneficiaryId(existing: Beneficiary[]) {
  const max = existing.reduce((acc, b) => {
    const match = b.beneficiaryId.match(/BNF-\d+-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);

  return `BNF-2026-${String(max + 1).padStart(4, "0")}`;
}

export function sortActivity(events: ActivityEvent[]) {
  return [...events].sort((a, b) => {
    const bTime = normalizeToDate(b.createdAt)?.getTime() ?? 0;
    const aTime = normalizeToDate(a.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

export function getActiveFilterChips(filters: BeneficiaryFilters) {
  const chips: { key: keyof BeneficiaryFilters; label: string; value: string }[] = [];

  if (filters.program !== "All") {
    chips.push({ key: "program", label: "Program", value: filters.program });
  }
  if (filters.supportType !== "All") {
    chips.push({ key: "supportType", label: "Support", value: filters.supportType });
  }
  if (filters.status !== "All") {
    chips.push({ key: "status", label: "Status", value: filters.status });
  }
  if (filters.location !== "All") {
    chips.push({ key: "location", label: "Location", value: filters.location });
  }
  if (filters.followUpStatus !== "All") {
    chips.push({ key: "followUpStatus", label: "Follow-Up", value: filters.followUpStatus });
  }
  if (filters.coordinator !== "All") {
    chips.push({ key: "coordinator", label: "Coordinator", value: filters.coordinator });
  }

  return chips;
}
