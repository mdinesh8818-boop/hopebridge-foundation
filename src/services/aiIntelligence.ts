import { getDocuments } from "./firestore";
import {
  fetchImpactIntelligence,
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
} from "./impactIntelligence";
import type { ImpactIntelligenceBundle } from "../app/dashboard/analytics/types";
import {
  formatCurrency,
  type AttentionItem,
  type OrganizationSnapshot,
} from "./organizationMetrics";

export type AiCoverageState = "connected" | "no_records" | "limited";

export type AiDataCoverage = {
  module: string;
  href: string;
  state: AiCoverageState;
  detail: string;
};

export type AiBriefingCard = {
  id: string;
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  tone: "positive" | "attention" | "neutral";
};

export type AiSnapshotMetric = {
  id: string;
  label: string;
  value: string;
  available: boolean;
  note?: string;
};

export type AiAnswerSectionHeading =
  | "FACT"
  | "OBSERVATION"
  | "WHY IT MATTERS"
  | "AI RECOMMENDATION"
  | "RECOMMENDED ACTION"
  | "DATA CONSIDERED";

export type AiAnswerSection = {
  heading: AiAnswerSectionHeading;
  body: string;
};

export type AiAnswer = {
  text: string;
  sections: AiAnswerSection[];
};

export type AiOrgContext = {
  snapshot: OrganizationSnapshot;
  attention: AttentionItem[];
  impact: ImpactIntelligenceBundle;
  briefing: AiBriefingCard[];
  coverage: AiDataCoverage[];
  liveMetrics: AiSnapshotMetric[];
  loadedAt: string;
};

function coverageState(count: number, limited?: boolean): AiCoverageState {
  if (count <= 0) return "no_records";
  if (limited) return "limited";
  return "connected";
}

function buildCoverage(
  snapshot: OrganizationSnapshot,
  impact: ImpactIntelligenceBundle,
  teamCount: number,
): AiDataCoverage[] {
  return [
    {
      module: "Campaigns",
      href: "/dashboard/campaigns",
      state: coverageState(snapshot.activeCampaigns + impact.filterOptions.campaigns.length),
      detail:
        impact.filterOptions.campaigns.length > 0
          ? `${impact.filterOptions.campaigns.length} campaign record${impact.filterOptions.campaigns.length === 1 ? "" : "s"}`
          : "No campaign records",
    },
    {
      module: "Programs",
      href: "/dashboard/programs",
      state: coverageState(impact.programs.length),
      detail:
        impact.programs.length > 0
          ? `${impact.programs.length} program record${impact.programs.length === 1 ? "" : "s"}`
          : "No program records",
    },
    {
      module: "Donors",
      href: "/dashboard/donors",
      state: coverageState(snapshot.activeDonors, snapshot.fundsRaised === 0),
      detail:
        snapshot.activeDonors > 0
          ? `${snapshot.activeDonors} active donor${snapshot.activeDonors === 1 ? "" : "s"}`
          : "No donor records",
    },
    {
      module: "Volunteers",
      href: "/dashboard/volunteers",
      state: coverageState(
        snapshot.volunteerCount,
        snapshot.volunteerCount > 0 && !impact.volunteers.hoursTracked,
      ),
      detail:
        snapshot.volunteerCount > 0
          ? impact.volunteers.hoursTracked
            ? `${snapshot.volunteerCount} volunteers · hours tracked`
            : `${snapshot.volunteerCount} volunteers · hours not recorded`
          : "No volunteer records",
    },
    {
      module: "Beneficiaries",
      href: "/dashboard/beneficiaries",
      state: coverageState(snapshot.beneficiaryCount),
      detail:
        snapshot.beneficiaryCount > 0
          ? `${snapshot.beneficiaryCount} beneficiary record${snapshot.beneficiaryCount === 1 ? "" : "s"}`
          : "No beneficiary records",
    },
    {
      module: "Teams",
      href: "/dashboard/teams",
      state: coverageState(teamCount || snapshot.activeTeams),
      detail:
        (teamCount || snapshot.activeTeams) > 0
          ? `${teamCount || snapshot.activeTeams} team record${(teamCount || snapshot.activeTeams) === 1 ? "" : "s"}`
          : "No team records",
    },
    {
      module: "Impact Analytics",
      href: "/dashboard/analytics",
      state:
        snapshot.beneficiaryCount > 0 ||
        impact.programs.length > 0 ||
        snapshot.fundsRaised > 0
          ? "connected"
          : "no_records",
      detail: "Uses audited organizational metrics",
    },
  ];
}

function buildBriefing(
  snapshot: OrganizationSnapshot,
  impact: ImpactIntelligenceBundle,
): AiBriefingCard[] {
  const cards: AiBriefingCard[] = [];
  const underGoal = impact.risks.filter((r) => r.id.startsWith("campaign-under")).length;
  const programAttention = impact.programs.filter(
    (p) => p.health === "Critical" || p.health === "Needs Attention",
  ).length;

  cards.push({
    id: "fundraising",
    title: "Fundraising",
    body:
      snapshot.activeCampaigns > 0
        ? underGoal > 0
          ? `${underGoal} active campaign${underGoal === 1 ? "" : "s"} currently below 50% of fundraising goal. ${formatCurrency(snapshot.fundsRaised)} raised against ${formatCurrency(snapshot.totalCampaignGoal)} combined goal.`
          : `${snapshot.activeCampaigns} active campaign${snapshot.activeCampaigns === 1 ? "" : "s"} with ${formatCurrency(snapshot.fundsRaised)} raised${snapshot.totalCampaignGoal > 0 ? ` of ${formatCurrency(snapshot.totalCampaignGoal)} goal` : ""}.`
        : "No active campaigns are currently recorded.",
    href: "/dashboard/campaigns",
    actionLabel: "Review Campaigns",
    tone: underGoal > 0 ? "attention" : snapshot.activeCampaigns > 0 ? "positive" : "neutral",
  });

  cards.push({
    id: "programs",
    title: "Program Delivery",
    body:
      impact.programs.length > 0
        ? `${snapshot.activePrograms} active/planning program${snapshot.activePrograms === 1 ? "" : "s"}. ${programAttention} require attention. ${snapshot.programsOnTrack} on target.`
        : "No programs are recorded yet.",
    href: "/dashboard/programs",
    actionLabel: "View Programs",
    tone: programAttention > 0 ? "attention" : impact.programs.length > 0 ? "positive" : "neutral",
  });

  cards.push({
    id: "beneficiaries",
    title: "Beneficiary Reach",
    body:
      snapshot.beneficiaryCount > 0
        ? `${formatAnalyticsNumber(snapshot.beneficiaryCount)} beneficiaries are currently recorded${impact.beneficiaries.newInPeriod > 0 ? ` · ${impact.beneficiaries.newInPeriod} new in the selected analytics period` : ""}.`
        : "No beneficiary records are available yet.",
    href: "/dashboard/beneficiaries",
    actionLabel: "View Beneficiaries",
    tone: snapshot.beneficiaryCount > 0 ? "positive" : "neutral",
  });

  cards.push({
    id: "volunteers",
    title: "Volunteer Capacity",
    body:
      snapshot.volunteerCount > 0
        ? impact.volunteers.hoursTracked
          ? `${snapshot.volunteerCount} active volunteer${snapshot.volunteerCount === 1 ? "" : "s"} with ${formatAnalyticsNumber(snapshot.volunteerHours)} hours logged.`
          : `${snapshot.volunteerCount} active volunteer${snapshot.volunteerCount === 1 ? "" : "s"} are registered, but no volunteer hours have been recorded yet.`
        : "No active volunteers are recorded.",
    href: "/dashboard/volunteers",
    actionLabel: "View Volunteers",
    tone:
      snapshot.volunteerCount > 0 && !impact.volunteers.hoursTracked
        ? "attention"
        : snapshot.volunteerCount > 0
          ? "positive"
          : "neutral",
  });

  cards.push({
    id: "campaign-risk",
    title: "Campaign Risk",
    body:
      underGoal > 0
        ? `${underGoal} campaign${underGoal === 1 ? "" : "s"} meet under-goal risk criteria based on raised vs goal.`
        : snapshot.activeCampaigns > 0
          ? "No active campaigns currently meet the under-goal risk threshold (<50%)."
          : "Campaign risk cannot be assessed until active campaigns exist.",
    href: "/dashboard/campaigns",
    actionLabel: "Review Campaigns",
    tone: underGoal > 0 ? "attention" : "neutral",
  });

  cards.push({
    id: "operations",
    title: "Operational Attention",
    body:
      impact.risks.length > 0
        ? `${impact.risks.length} leadership alert${impact.risks.length === 1 ? "" : "s"} derived from programs, campaigns, and beneficiary follow-ups.`
        : "No operational attention items are currently flagged.",
    href: "/dashboard/analytics",
    actionLabel: "Open Impact Analytics",
    tone: impact.risks.length > 0 ? "attention" : "positive",
  });

  return cards;
}

function buildLiveMetrics(
  snapshot: OrganizationSnapshot,
  impact: ImpactIntelligenceBundle,
): AiSnapshotMetric[] {
  const programAttention = impact.programs.filter(
    (p) => p.health === "Critical" || p.health === "Needs Attention",
  ).length;

  return [
    {
      id: "active-campaigns",
      label: "Active Campaigns",
      value: formatAnalyticsNumber(snapshot.activeCampaigns),
      available: true,
    },
    {
      id: "active-programs",
      label: "Active Programs",
      value: formatAnalyticsNumber(snapshot.activePrograms),
      available: true,
    },
    {
      id: "active-donors",
      label: "Active Donors",
      value: formatAnalyticsNumber(snapshot.activeDonors),
      available: true,
    },
    {
      id: "beneficiaries",
      label: "Beneficiaries Served",
      value: formatAnalyticsNumber(snapshot.beneficiaryCount),
      available: true,
    },
    {
      id: "volunteers",
      label: "Active Volunteers",
      value: formatAnalyticsNumber(snapshot.volunteerCount),
      available: true,
    },
    {
      id: "funds-raised",
      label: "Funds Raised",
      value: formatCurrency(snapshot.fundsRaised),
      available: true,
    },
    {
      id: "funds-deployed",
      label: "Funds Deployed",
      value:
        impact.funding.hasDeployedSpend
          ? formatCurrency(impact.funding.fundsDeployed)
          : "Not available",
      available: impact.funding.hasDeployedSpend,
      note: impact.funding.hasDeployedSpend
        ? undefined
        : "No program expenditure recorded",
    },
    {
      id: "programs-attention",
      label: "Programs Requiring Attention",
      value: formatAnalyticsNumber(programAttention),
      available: true,
    },
  ];
}

export async function loadAiOrgContext(): Promise<AiOrgContext> {
  const { fetchDashboardOrganizationData } = await import("./organizationSnapshot");

  const [dashboard, impact, teams] = await Promise.all([
    fetchDashboardOrganizationData(),
    fetchImpactIntelligence(),
    getDocuments("teams") as Promise<{ id: string; status?: string }[]>,
  ]);

  const snapshot = dashboard.snapshot;
  const attention = dashboard.attentionItems;
  const teamCount = teams.length;

  return {
    snapshot,
    attention,
    impact,
    briefing: buildBriefing(snapshot, impact),
    coverage: buildCoverage(snapshot, impact, teamCount),
    liveMetrics: buildLiveMetrics(snapshot, impact),
    loadedAt: new Date().toISOString(),
  };
}

type Intent =
  | "campaign_risk"
  | "fundraising"
  | "program_performance"
  | "beneficiaries"
  | "donors"
  | "volunteers"
  | "geographic"
  | "impact"
  | "deadlines"
  | "priorities"
  | "executive_summary"
  | "organization_summary"
  | "unknown";

function detectIntent(question: string): Intent {
  const q = question.toLowerCase();

  if (
    q.includes("executive summary") ||
    q.includes("generate executive") ||
    (q.includes("executive") && q.includes("summary"))
  ) {
    return "executive_summary";
  }
  if (
    (q.includes("campaign") && (q.includes("attention") || q.includes("risk") || q.includes("need"))) ||
    q.includes("which campaigns")
  ) {
    return "campaign_risk";
  }
  if (
    q.includes("fundrais") ||
    q.includes("funds raised") ||
    q.includes("analyze fundraising") ||
    (q.includes("funding") && q.includes("performance"))
  ) {
    return "fundraising";
  }
  if (
    q.includes("program") &&
    (q.includes("risk") || q.includes("health") || q.includes("performance") || q.includes("attention"))
  ) {
    return "program_performance";
  }
  if (q.includes("beneficiar") || q.includes("community reach") || q.includes("people we serve")) {
    return "beneficiaries";
  }
  if (q.includes("donor")) {
    return "donors";
  }
  if (q.includes("volunteer")) {
    return "volunteers";
  }
  if (q.includes("geographic") || q.includes("geography") || q.includes("location") || q.includes("where is our community")) {
    return "geographic";
  }
  if (
    q.includes("funding with beneficiary") ||
    q.includes("compare funding") ||
    q.includes("impact") ||
    q.includes("cost per")
  ) {
    return "impact";
  }
  if (q.includes("deadline") || q.includes("due soon") || q.includes("ending")) {
    return "deadlines";
  }
  if (
    q.includes("priorit") ||
    q.includes("leadership") ||
    q.includes("organizational risk") ||
    q.includes("find organizational")
  ) {
    return "priorities";
  }
  if (q.includes("summarize") || q.includes("overview") || q.includes("organization")) {
    return "organization_summary";
  }
  return "unknown";
}

function formatAnswer(sections: AiAnswerSection[]): AiAnswer {
  const text = sections
    .map((section) => `${section.heading}\n${section.body}`)
    .join("\n\n");
  return { text, sections };
}

function answerCampaignRisk(ctx: AiOrgContext): AiAnswer {
  const risks = ctx.impact.risks.filter((r) => r.id.startsWith("campaign-under"));
  if (ctx.snapshot.activeCampaigns === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "There are no active campaigns in HopeBridge right now.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Create or activate a campaign in Campaigns to begin fundraising intelligence. This is an advisory recommendation only.",
      },
      {
        heading: "DATA CONSIDERED",
        body: "Campaigns · Impact Analytics",
      },
    ]);
  }
  if (risks.length === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: `${ctx.snapshot.activeCampaigns} active campaign${ctx.snapshot.activeCampaigns === 1 ? "" : "s"} are recorded.`,
      },
      {
        heading: "OBSERVATION",
        body: "No campaigns currently meet the under-goal risk rule (active and below 50% of goal).",
      },
      {
        heading: "DATA CONSIDERED",
        body: "Campaigns · Impact Analytics",
      },
    ]);
  }
  return formatAnswer([
    {
      heading: "OBSERVATION",
      body: `${risks.length} campaign${risks.length === 1 ? "" : "s"} need attention:\n${risks
        .map((r) => `• ${r.title} — ${r.detail}`)
        .join("\n")}`,
    },
    {
      heading: "WHY IT MATTERS",
      body: "These campaigns were flagged because available HopeBridge records show fundraising progress below 50% of goal and/or limited remaining time before the campaign end date.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Open Campaigns and review underperforming portfolios before deadlines pass. This is an AI recommendation and does not change any records automatically.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Impact Analytics",
    },
  ]);
}

function answerFundraising(ctx: AiOrgContext): AiAnswer {
  const goalPct =
    ctx.snapshot.totalCampaignGoal > 0
      ? Math.round((ctx.snapshot.fundsRaised / ctx.snapshot.totalCampaignGoal) * 100)
      : null;
  return formatAnswer([
    {
      heading: "FACT",
      body: `Funds raised: ${formatCurrency(ctx.snapshot.fundsRaised)}. Active campaigns: ${ctx.snapshot.activeCampaigns}. Active donors: ${ctx.snapshot.activeDonors}.${
        goalPct != null
          ? ` Combined goal progress: ${goalPct}% of ${formatCurrency(ctx.snapshot.totalCampaignGoal)}.`
          : " Combined campaign goal is not available (no goals recorded)."
      }`,
    },
    {
      heading: "OBSERVATION",
      body: ctx.impact.funding.hasDeployedSpend
        ? `Funds deployed across programs: ${formatCurrency(ctx.impact.funding.fundsDeployed)}${
            ctx.impact.funding.deploymentRate != null
              ? ` (${ctx.impact.funding.deploymentRate}% of raised funds)`
              : ""
          }.`
        : "Program expenditure (funds deployed) has not been recorded, so deployment efficiency cannot be calculated.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Review Campaigns for goal progress and Donors for gift activity. Record program spend to enable funding-vs-impact analysis. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Donors · Impact Analytics · Programs",
    },
  ]);
}

function answerPrograms(ctx: AiOrgContext): AiAnswer {
  const attention = ctx.impact.programs.filter(
    (p) => p.health === "Critical" || p.health === "Needs Attention",
  );
  if (ctx.impact.programs.length === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No program records are available.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Create programs in the Programs module to enable delivery intelligence.",
      },
    ]);
  }
  return formatAnswer([
    {
      heading: "FACT",
      body: `${ctx.impact.programs.length} program${ctx.impact.programs.length === 1 ? "" : "s"} tracked · ${ctx.snapshot.activePrograms} active/planning · ${ctx.snapshot.programsOnTrack} on target.`,
    },
    {
      heading: "OBSERVATION",
      body:
        attention.length > 0
          ? `Programs requiring attention:\n${attention
              .slice(0, 6)
              .map(
                (p) =>
                  `• ${p.name} — ${p.health} (${p.progress}% progress, ${formatCurrency(p.fundsDeployed)} deployed)`,
              )
              .join("\n")}`
          : "No programs are currently flagged Critical or Needs Attention.",
    },
    {
      heading: "WHY IT MATTERS",
      body:
        attention.length > 0
          ? "Programs are flagged based on recorded health, progress, budget/spend signals, and schedule context available in HopeBridge program and Impact Analytics data."
          : "Program health currently appears stable based on available HopeBridge records.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Open Programs or Impact Analytics to review health, budget utilization, and beneficiary fields on program records. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Programs · Impact Analytics",
    },
  ]);
}

function answerBeneficiaries(ctx: AiOrgContext): AiAnswer {
  if (ctx.snapshot.beneficiaryCount === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No beneficiary records are currently stored.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Enroll beneficiaries to measure community reach and follow-ups.",
      },
    ]);
  }
  const topAssignments = ctx.impact.beneficiaries.byProgramAssignment.slice(0, 5);
  return formatAnswer([
    {
      heading: "FACT",
      body: `${formatAnalyticsNumber(ctx.snapshot.beneficiaryCount)} beneficiaries are recorded. ${formatAnalyticsNumber(ctx.impact.beneficiaries.newInPeriod)} new in the current analytics period. Communities reached (from location fields): ${ctx.impact.beneficiaries.communitiesReached}.`,
    },
    {
      heading: "OBSERVATION",
      body:
        topAssignments.length > 0
          ? `Top program-assignment labels on beneficiary records:\n${topAssignments
              .map((row) => `• ${row.label}: ${row.count}`)
              .join("\n")}\nNote: these labels are not ID-linked to Programs module documents.`
          : "Beneficiary assignment labels are not populated.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Review Beneficiaries for follow-ups and Impact Analytics for reach trends. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Beneficiaries · Impact Analytics",
    },
  ]);
}

function answerDonors(ctx: AiOrgContext): AiAnswer {
  if (ctx.snapshot.activeDonors === 0 && ctx.snapshot.fundsRaised === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No donor or fundraising totals are available yet.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Add donors and record gifts to enable donor portfolio intelligence.",
      },
    ]);
  }
  return formatAnswer([
    {
      heading: "FACT",
      body: `${ctx.snapshot.activeDonors} active donor${ctx.snapshot.activeDonors === 1 ? "" : "s"} · ${formatCurrency(ctx.snapshot.fundsRaised)} funds raised (from donations or campaign totals).`,
    },
    {
      heading: "OBSERVATION",
      body: "Responses use aggregated donor counts and fundraising totals only — individual donor details are not exposed in organizational summaries.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Open Donors to manage cultivation and gift recording. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Donors · Campaigns",
    },
  ]);
}

function answerVolunteers(ctx: AiOrgContext): AiAnswer {
  if (ctx.snapshot.volunteerCount === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No active volunteers are recorded.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Add volunteers and log hours/initiatives to measure capacity.",
      },
    ]);
  }
  return formatAnswer([
    {
      heading: "FACT",
      body: `${ctx.snapshot.volunteerCount} active volunteer${ctx.snapshot.volunteerCount === 1 ? "" : "s"}.`,
    },
    {
      heading: "OBSERVATION",
      body: ctx.impact.volunteers.hoursTracked
        ? `${formatAnalyticsNumber(ctx.snapshot.volunteerHours)} hours logged across volunteer records.`
        : "Volunteer hours have not been recorded yet — capacity trends cannot be measured from hours.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Review Volunteers to update hours and initiative assignments. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Volunteers · Impact Analytics",
    },
  ]);
}

function answerGeographic(ctx: AiOrgContext): AiAnswer {
  if (ctx.impact.geography.uniqueLocations === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No location fields are populated on programs or beneficiaries.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Add locations to program and beneficiary records to measure community reach.",
      },
    ]);
  }
  const top = ctx.impact.geography.locations
    .slice()
    .sort((a, b) => b.beneficiaries - a.beneficiaries)
    .slice(0, 5);
  return formatAnswer([
    {
      heading: "FACT",
      body: `Unique locations: ${ctx.impact.geography.uniqueLocations}. Regions (beneficiary.region): ${ctx.impact.geography.regions}. Communities/cities: ${ctx.impact.geography.communities}. Country totals are not available because no country field is stored.`,
    },
    {
      heading: "OBSERVATION",
      body:
        top.length > 0
          ? `Strongest recorded locations by associated beneficiaries:\n${top
              .map((loc) => `• ${loc.name}: ${loc.beneficiaries} people · ${loc.programs} program link${loc.programs === 1 ? "" : "s"}`)
              .join("\n")}`
          : "Location markers exist but beneficiary associations are limited.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Open Impact Analytics → Geographic Impact for the full location map. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Beneficiaries · Programs · Impact Analytics",
    },
  ]);
}

function answerImpact(ctx: AiOrgContext): AiAnswer {
  return formatAnswer([
    {
      heading: "FACT",
      body: `Beneficiaries served: ${formatAnalyticsNumber(ctx.snapshot.beneficiaryCount)}. Funds raised: ${formatCurrency(ctx.snapshot.fundsRaised)}. Funds deployed: ${
        ctx.impact.funding.hasDeployedSpend
          ? formatCurrency(ctx.impact.funding.fundsDeployed)
          : "not available"
      }. Cost per beneficiary: ${
        ctx.impact.funding.costPerBeneficiary != null
          ? formatCurrency(ctx.impact.funding.costPerBeneficiary)
          : "not available"
      }.`,
    },
    {
      heading: "OBSERVATION",
      body: ctx.impact.funding.hasDeployedSpend
        ? "Funding-to-impact ratios use audited Impact Analytics logic (donations/campaign raised vs program spend)."
        : "Funding-to-impact efficiency cannot be calculated until program expenditures are recorded.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Open Impact Analytics for funding vs impact, program health, and leadership alerts. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Programs · Beneficiaries · Impact Analytics",
    },
  ]);
}

function answerDeadlines(ctx: AiOrgContext): AiAnswer {
  const ending = ctx.impact.risks.filter(
    (r) => r.id.startsWith("program-ending") || r.detail.toLowerCase().includes("remaining"),
  );
  if (ending.length === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No approaching program/campaign deadline alerts are currently flagged by the risk engine.",
      },
      {
        heading: "OBSERVATION",
        body: "Deadline alerts require end dates on active programs/campaigns plus progress/goal context.",
      },
    ]);
  }
  return formatAnswer([
    {
      heading: "OBSERVATION",
      body: ending.map((r) => `• ${r.title} — ${r.detail}`).join("\n"),
    },
    {
      heading: "WHY IT MATTERS",
      body: "These items were flagged because available HopeBridge records show approaching end dates combined with progress, goal, or delivery context that warrants leadership attention.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Review the linked Programs or Campaigns modules before deadlines pass. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Programs · Impact Analytics",
    },
  ]);
}

function answerPriorities(ctx: AiOrgContext): AiAnswer {
  const priorities: string[] = [];
  const campaignRisks = ctx.impact.risks.filter((r) => r.id.startsWith("campaign-under"));
  const programRisks = ctx.impact.programs.filter(
    (p) => p.health === "Critical" || p.health === "Needs Attention",
  );
  const followUps = ctx.impact.risks.filter((r) => r.id === "beneficiary-followups");

  if (campaignRisks.length > 0) {
    priorities.push(
      `Address ${campaignRisks.length} under-goal campaign${campaignRisks.length === 1 ? "" : "s"}.`,
    );
  }
  if (programRisks.length > 0) {
    priorities.push(
      `Stabilize ${programRisks.length} program${programRisks.length === 1 ? "" : "s"} marked ${programRisks[0]?.health ?? "at risk"}.`,
    );
  }
  if (followUps.length > 0) {
    priorities.push(followUps[0].detail);
  }
  if (ctx.snapshot.volunteerCount > 0 && !ctx.impact.volunteers.hoursTracked) {
    priorities.push("Begin logging volunteer hours so capacity can be measured.");
  }
  if (!ctx.impact.funding.hasDeployedSpend && ctx.snapshot.fundsRaised > 0) {
    priorities.push("Record program expenditures to connect fundraising with deployment.");
  }

  if (priorities.length === 0) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "No high-urgency risk signals are currently derived from campaigns, programs, beneficiaries, or volunteers.",
      },
      {
        heading: "OBSERVATION",
        body: "Continue monitoring Impact Analytics as new operational records are added.",
      },
    ]);
  }

  return formatAnswer([
    {
      heading: "OBSERVATION",
      body: `${ctx.impact.risks.length} leadership alert${ctx.impact.risks.length === 1 ? "" : "s"} are active.\n${priorities
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n")}`,
    },
    {
      heading: "WHY IT MATTERS",
      body: "Priorities combine under-goal campaigns, program health, overdue beneficiary follow-ups, and missing volunteer/expenditure signals derived from current HopeBridge records — not invented thresholds.",
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Work the Priority & Risk panel actions, then confirm progress in Campaigns, Programs, Beneficiaries, and Volunteers. These are AI recommendations and do not change data automatically.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Programs · Beneficiaries · Volunteers · Impact Analytics",
    },
  ]);
}

function answerExecutiveSummary(ctx: AiOrgContext): AiAnswer {
  const programAttention = ctx.impact.programs.filter(
    (p) => p.health === "Critical" || p.health === "Needs Attention",
  ).length;
  const underGoal = ctx.impact.risks.filter((r) => r.id.startsWith("campaign-under")).length;

  const body = [
    "HopeBridge Executive Summary",
    "",
    "Fundraising",
    `• ${ctx.snapshot.activeCampaigns} active campaigns`,
    `• ${formatCurrency(ctx.snapshot.fundsRaised)} raised${
      ctx.snapshot.totalCampaignGoal > 0
        ? ` of ${formatCurrency(ctx.snapshot.totalCampaignGoal)} combined goal`
        : " (no combined goal recorded)"
    }`,
    `• ${ctx.snapshot.activeDonors} active donors`,
    "",
    "Programs",
    `• ${ctx.snapshot.activePrograms} active/planning programs`,
    `• ${programAttention} requiring attention`,
    `• Funds deployed: ${
      ctx.impact.funding.hasDeployedSpend
        ? formatCurrency(ctx.impact.funding.fundsDeployed)
        : "not available"
    }`,
    "",
    "Community Impact",
    `• ${formatAnalyticsNumber(ctx.snapshot.beneficiaryCount)} beneficiaries recorded`,
    `• ${ctx.impact.geography.uniqueLocations} unique locations · ${ctx.impact.geography.regions} regions`,
    "",
    "Volunteer Capacity",
    `• ${ctx.snapshot.volunteerCount} active volunteers`,
    `• Hours: ${
      ctx.impact.volunteers.hoursTracked
        ? formatAnalyticsNumber(ctx.snapshot.volunteerHours)
        : "not recorded"
    }`,
    "",
    "Risks",
    underGoal > 0 || programAttention > 0 || ctx.impact.risks.length > 0
      ? `• ${ctx.impact.risks.length} leadership alerts · ${underGoal} under-goal campaigns · ${programAttention} programs needing attention`
      : "• No critical risk signals currently flagged",
    "",
    "Recommended Priorities",
    ...answerPriorities(ctx)
      .sections.find((s) => s.heading === "OBSERVATION")
      ?.body.split("\n")
      .map((line) => (line ? `• ${line.replace(/^\d+\.\s*/, "")}` : ""))
      .filter(Boolean) ?? ["• Continue monitoring operational modules"],
  ].join("\n");

  return formatAnswer([
    {
      heading: "FACT",
      body,
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Programs · Donors · Volunteers · Beneficiaries · Teams · Impact Analytics",
    },
  ]);
}

function answerOrganizationSummary(ctx: AiOrgContext): AiAnswer {
  return formatAnswer([
    {
      heading: "FACT",
      body: `HopeBridge currently shows ${ctx.snapshot.activeCampaigns} active campaigns, ${ctx.snapshot.activePrograms} active/planning programs, ${ctx.snapshot.activeDonors} active donors, ${ctx.snapshot.volunteerCount} volunteers, ${ctx.snapshot.beneficiaryCount} beneficiaries, and ${ctx.snapshot.activeTeams} active teams. Funds raised: ${formatCurrency(ctx.snapshot.fundsRaised)}.`,
    },
    {
      heading: "OBSERVATION",
      body: `Impact Analytics reports ${ctx.impact.risks.length} leadership alert${ctx.impact.risks.length === 1 ? "" : "s"} and ${ctx.impact.geography.uniqueLocations} unique locations.`,
    },
    {
      heading: "AI RECOMMENDATION",
      body: "Ask a focused question (campaigns, programs, beneficiaries, volunteers, priorities) or generate an executive summary. This is advisory only.",
    },
    {
      heading: "DATA CONSIDERED",
      body: "Campaigns · Programs · Donors · Volunteers · Beneficiaries · Teams · Impact Analytics",
    },
  ]);
}

/**
 * Offline/baseline HopeBridge organizational intelligence.
 * Used when OpenAI is unavailable; answers are constructed from live aggregates.
 */
export function answerOrganizationalQuestion(
  question: string,
  ctx: AiOrgContext,
): AiAnswer {
  const trimmed = question.trim();
  if (!trimmed) {
    return formatAnswer([
      {
        heading: "OBSERVATION",
        body: "Please enter a question about HopeBridge campaigns, programs, donors, beneficiaries, volunteers, or impact.",
      },
    ]);
  }

  const hasData =
    ctx.snapshot.activeCampaigns > 0 ||
    ctx.snapshot.activePrograms > 0 ||
    ctx.snapshot.beneficiaryCount > 0 ||
    ctx.snapshot.volunteerCount > 0 ||
    ctx.snapshot.fundsRaised > 0 ||
    ctx.snapshot.activeDonors > 0 ||
    ctx.impact.programs.length > 0;

  if (!hasData) {
    return formatAnswer([
      {
        heading: "FACT",
        body: "HopeBridge does not yet have enough operational records to answer organizational questions.",
      },
      {
        heading: "AI RECOMMENDATION",
        body: "Create campaigns, programs, donors, volunteers, or beneficiaries to enable intelligence.",
      },
    ]);
  }

  switch (detectIntent(trimmed)) {
    case "campaign_risk":
      return answerCampaignRisk(ctx);
    case "fundraising":
      return answerFundraising(ctx);
    case "program_performance":
      return answerPrograms(ctx);
    case "beneficiaries":
      return answerBeneficiaries(ctx);
    case "donors":
      return answerDonors(ctx);
    case "volunteers":
      return answerVolunteers(ctx);
    case "geographic":
      return answerGeographic(ctx);
    case "impact":
      return answerImpact(ctx);
    case "deadlines":
      return answerDeadlines(ctx);
    case "priorities":
      return answerPriorities(ctx);
    case "executive_summary":
      return answerExecutiveSummary(ctx);
    case "organization_summary":
      return answerOrganizationSummary(ctx);
    default:
      return answerOrganizationSummary(ctx);
  }
}

export const SUGGESTED_QUESTIONS = [
  "Which campaigns need attention?",
  "Summarize our fundraising performance.",
  "Which programs are at risk?",
  "How many beneficiaries are we currently serving?",
  "Where is our community reach strongest?",
  "Summarize volunteer participation.",
  "What should leadership prioritize?",
  "Compare funding with beneficiary impact.",
] as const;

export const QUICK_ACTIONS = [
  {
    id: "fundraising",
    label: "Analyze Fundraising",
    question: "Summarize our fundraising performance.",
  },
  {
    id: "programs",
    label: "Review Program Health",
    question: "Which programs are at risk?",
  },
  {
    id: "beneficiaries",
    label: "Analyze Beneficiary Reach",
    question: "How many beneficiaries are we currently serving?",
  },
  {
    id: "volunteers",
    label: "Review Volunteer Capacity",
    question: "Summarize volunteer participation.",
  },
  {
    id: "risks",
    label: "Find Organizational Risks",
    question: "What should leadership prioritize?",
  },
  {
    id: "executive",
    label: "Generate Executive Summary",
    question: "Generate an executive summary of HopeBridge.",
  },
] as const;

export { formatCurrency, formatAnalyticsCurrency, formatAnalyticsNumber };
