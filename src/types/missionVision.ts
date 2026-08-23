export type StrategicGoalStatus =
  | "Not Started"
  | "On Track"
  | "At Risk"
  | "Needs Focus"
  | "Completed";

export type CoreValueAccent = "rose" | "emerald" | "gold";

export type CoreValueIconKey =
  | "heart"
  | "shield"
  | "target"
  | "compass"
  | "sparkles"
  | "hand-heart"
  | "leaf"
  | "users";

export type MissionVisionRecord = {
  id: string;
  missionStatement: string;
  missionDescription: string;
  visionStatement: string;
  visionDescription: string;
};

export type CoreValueRecord = {
  id: string;
  name: string;
  description: string;
  iconKey: CoreValueIconKey;
  accent: CoreValueAccent;
  displayOrder: number;
};

export type StrategicGoalRecord = {
  id: string;
  title: string;
  description: string;
  owner: string;
  targetOutcome: string;
  currentValue?: number | null;
  targetValue?: number | null;
  progressPercent?: number | null;
  status: StrategicGoalStatus;
  startDate: string;
  dueDate: string;
  category: string;
  linkedProgramIds: string[];
  linkedCampaignIds: string[];
  linkedTeamIds: string[];
};

export type LinkableProgram = { id: string; name: string };
export type LinkableCampaign = { id: string; name: string };
export type LinkableTeam = { id: string; name: string };

export type StrategicGoalSummary = {
  activeGoals: number;
  averageCompletion: number;
  onTrack: number;
  needsFocusOrAtRisk: number;
};

export type MissionVisionBundle = {
  missionVision: MissionVisionRecord;
  coreValues: CoreValueRecord[];
  strategicGoals: StrategicGoalRecord[];
  programs: LinkableProgram[];
  campaigns: LinkableCampaign[];
  teams: LinkableTeam[];
  summary: StrategicGoalSummary;
};

export type MissionVisionInput = {
  missionStatement: string;
  missionDescription: string;
  visionStatement: string;
  visionDescription: string;
};

export type CoreValueInput = Omit<CoreValueRecord, "id">;

export type StrategicGoalInput = Omit<StrategicGoalRecord, "id">;
