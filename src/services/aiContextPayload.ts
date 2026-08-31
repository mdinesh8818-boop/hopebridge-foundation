import type { AiOrgContext } from "./aiIntelligence";
import type { HopeBridgeAiContextPayload } from "@/lib/ai/types";

/**
 * Aggregated, privacy-safe organizational context for server-side LLM grounding.
 * Excludes donor names, beneficiary PII, emails, and raw Firestore documents.
 */
export function buildHopeBridgeAiContextPayload(
  ctx: AiOrgContext,
): HopeBridgeAiContextPayload {
  const topLocations = ctx.impact.geography.locations
    .slice()
    .sort((a, b) => b.beneficiaries - a.beneficiaries)
    .slice(0, 8)
    .map((loc) => ({
      name: loc.name,
      beneficiaries: loc.beneficiaries,
      programs: loc.programs,
    }));

  return {
    loadedAt: ctx.loadedAt,
    snapshot: {
      activeCampaigns: ctx.snapshot.activeCampaigns,
      activePrograms: ctx.snapshot.activePrograms,
      fundsRaised: ctx.snapshot.fundsRaised,
      totalCampaignGoal: ctx.snapshot.totalCampaignGoal,
      activeDonors: ctx.snapshot.activeDonors,
      volunteerCount: ctx.snapshot.volunteerCount,
      volunteerHours: ctx.snapshot.volunteerHours,
      beneficiaryCount: ctx.snapshot.beneficiaryCount,
      activeTeams: ctx.snapshot.activeTeams,
      totalProgramBudget: ctx.snapshot.totalProgramBudget,
      totalProgramSpent: ctx.snapshot.totalProgramSpent,
      programsOnTrack: ctx.snapshot.programsOnTrack,
      programsAtRisk: ctx.snapshot.programsAtRisk,
    },
    briefing: ctx.briefing.map((card) => ({
      title: card.title,
      body: card.body,
    })),
    liveMetrics: ctx.liveMetrics.map((metric) => ({
      label: metric.label,
      value: metric.value,
      available: metric.available,
      note: metric.note,
    })),
    coverage: ctx.coverage.map((item) => ({
      module: item.module,
      state: item.state,
      detail: item.detail,
    })),
    risks: ctx.impact.risks.map((risk) => ({
      title: risk.title,
      detail: risk.detail,
      severity: risk.severity,
    })),
    programs: ctx.impact.programs.map((program) => ({
      name: program.name,
      health: program.health,
      progress: program.progress,
      fundsDeployed: program.fundsDeployed,
      beneficiariesReached: program.beneficiariesReached,
    })),
    fundraising: {
      fundsRaised: ctx.impact.funding.fundsRaised,
      fundsDeployed: ctx.impact.funding.hasDeployedSpend
        ? ctx.impact.funding.fundsDeployed
        : null,
      hasDeployedSpend: ctx.impact.funding.hasDeployedSpend,
      deploymentRate: ctx.impact.funding.deploymentRate,
      costPerBeneficiary: ctx.impact.funding.costPerBeneficiary,
    },
    beneficiaries: {
      total: ctx.snapshot.beneficiaryCount,
      newInPeriod: ctx.impact.beneficiaries.newInPeriod,
      communitiesReached: ctx.impact.beneficiaries.communitiesReached,
      topProgramAssignments: ctx.impact.beneficiaries.byProgramAssignment
        .slice(0, 8)
        .map((row) => ({ label: row.label, count: row.count })),
    },
    volunteers: {
      hoursTracked: ctx.impact.volunteers.hoursTracked,
      totalHours: ctx.snapshot.volunteerHours,
      activeCount: ctx.snapshot.volunteerCount,
    },
    geography: {
      uniqueLocations: ctx.impact.geography.uniqueLocations,
      regions: ctx.impact.geography.regions,
      communities: ctx.impact.geography.communities,
      countriesAvailable: ctx.impact.geography.countriesAvailable,
      topLocations,
    },
    attention: ctx.attention.map((item) => ({
      title: item.title,
      detail: item.detail,
      priority: item.priority,
    })),
  };
}
