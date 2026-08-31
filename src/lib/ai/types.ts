export type AiChatRole = "user" | "assistant";

export type AiChatTurn = {
  role: AiChatRole;
  content: string;
};

export type AiChatRequestBody = {
  question: string;
  history: AiChatTurn[];
  context: HopeBridgeAiContextPayload;
};

export type HopeBridgeAiContextPayload = {
  loadedAt: string;
  snapshot: {
    activeCampaigns: number;
    activePrograms: number;
    fundsRaised: number;
    totalCampaignGoal: number;
    activeDonors: number;
    volunteerCount: number;
    volunteerHours: number;
    beneficiaryCount: number;
    activeTeams: number;
    totalProgramBudget: number;
    totalProgramSpent: number;
    programsOnTrack: number;
    programsAtRisk: number;
  };
  briefing: { title: string; body: string }[];
  liveMetrics: { label: string; value: string; available: boolean; note?: string }[];
  coverage: { module: string; state: string; detail: string }[];
  risks: { title: string; detail: string; severity: string }[];
  programs: {
    name: string;
    health: string;
    progress: number;
    fundsDeployed: number;
    beneficiariesReached: number;
  }[];
  fundraising: {
    fundsRaised: number;
    fundsDeployed: number | null;
    hasDeployedSpend: boolean;
    deploymentRate: number | null;
    costPerBeneficiary: number | null;
  };
  beneficiaries: {
    total: number;
    newInPeriod: number;
    communitiesReached: number;
    topProgramAssignments: { label: string; count: number }[];
  };
  volunteers: {
    hoursTracked: boolean;
    totalHours: number;
    activeCount: number;
  };
  geography: {
    uniqueLocations: number;
    regions: number;
    communities: number;
    countriesAvailable: boolean;
    topLocations: { name: string; beneficiaries: number; programs: number }[];
  };
  attention: { title: string; detail: string; priority: string }[];
};

export type AiChatSuccessResponse = {
  mode: "llm";
  text: string;
  model: string;
};

export type AiChatUnconfiguredResponse = {
  mode: "unconfigured";
  message: string;
};

export type AiChatErrorResponse = {
  mode: "error";
  message: string;
};

export type AiChatResponse =
  | AiChatSuccessResponse
  | AiChatUnconfiguredResponse
  | AiChatErrorResponse;

export type AiAssistantStatusResponse = {
  configured: boolean;
  provider: "openai";
  model?: string;
};
