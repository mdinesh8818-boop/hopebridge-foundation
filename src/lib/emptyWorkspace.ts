/**
 * Shared empty-workspace copy for a brand-new nonprofit with no operational data.
 */

export const EMPTY_WORKSPACE_COPY = {
  campaigns: {
    title: "No campaigns yet.",
    body: "Create your first campaign to start tracking fundraising progress.",
  },
  programs: {
    title: "No programs yet.",
    body: "Add your first program to begin tracking delivery and outcomes.",
  },
  donors: {
    title: "No donors yet.",
    body: "Add or import donors when you're ready to start managing supporter relationships.",
  },
  volunteers: {
    title: "No volunteers yet.",
    body: "Build your volunteer network by adding your first volunteer.",
  },
  beneficiaries: {
    title: "No beneficiary records yet.",
    body: "Beneficiary information will appear here as your programs begin serving people.",
  },
  teams: {
    title: "No teams yet.",
    body: "Create your first team and assign members when your organization is ready.",
  },
  analytics: {
    title: "Impact insights will appear as your organization begins adding data.",
    body: "Impact insights will appear as your organization begins adding program, fundraising, and beneficiary data.",
  },
  ai: {
    title: "Workspace still getting started",
    body: "Your workspace is still getting started. Once you add campaigns, programs, donors, volunteers, beneficiaries, or teams, I can help analyze that information.",
  },
} as const;

export type EmptyWorkspaceModule = keyof typeof EMPTY_WORKSPACE_COPY;

export function isEmptyOperationalSnapshot(counts: {
  campaigns?: number;
  programs?: number;
  donors?: number;
  volunteers?: number;
  beneficiaries?: number;
  teams?: number;
}): boolean {
  return (
    (counts.campaigns ?? 0) === 0 &&
    (counts.programs ?? 0) === 0 &&
    (counts.donors ?? 0) === 0 &&
    (counts.volunteers ?? 0) === 0 &&
    (counts.beneficiaries ?? 0) === 0 &&
    (counts.teams ?? 0) === 0
  );
}
