import type {
  CoreValueInput,
  CoreValueRecord,
  MissionVisionBundle,
  MissionVisionInput,
  MissionVisionRecord,
  StrategicGoalInput,
  StrategicGoalRecord,
  StrategicGoalStatus,
  StrategicGoalSummary,
} from "../types/missionVision";
import { logActivity } from "./activity";
import {
  createDocument,
  deleteDocument,
  getDocuments,
  setDocument,
  updateDocument,
} from "./firestore";

const MISSION_VISION_DOC_ID = "foundation";
const LEGACY_MISSION_KEY = "hopebridge-mission-vision";
const LEGACY_GOALS_KEY = "hopebridge-strategic-goals";

const TEST_GOAL_TITLE_PATTERN = /^mission[_\s-]*vision$/i;
const TEST_GOAL_DESCRIPTION_PATTERN = /^mission\s*vision$/i;
const TEST_MISSION_TEXT_PATTERN = /^SOONer$/i;

const EMPTY_MISSION_VISION: MissionVisionRecord = {
  id: MISSION_VISION_DOC_ID,
  missionStatement: "",
  missionDescription: "",
  visionStatement: "",
  visionDescription: "",
};

export function missionVisionToInput(
  record: Partial<MissionVisionRecord> & {
    missionTitle?: string;
    visionTitle?: string;
  },
): MissionVisionInput {
  return {
    missionStatement: sanitizeMissionVisionText(
      record.missionStatement ?? record.missionTitle,
    ),
    missionDescription: sanitizeMissionVisionText(record.missionDescription),
    visionStatement: sanitizeMissionVisionText(
      record.visionStatement ?? record.visionTitle,
    ),
    visionDescription: sanitizeMissionVisionText(record.visionDescription),
  };
}

export function sanitizeMissionVisionText(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (TEST_MISSION_TEXT_PATTERN.test(trimmed)) return "";
  return trimmed.replace(
    "Empower communities through innovation and Measurable action.",
    "Empower communities through innovation and measurable action.",
  );
}

export function isTestStrategicGoal(record: {
  title?: string;
  description?: string;
}): boolean {
  const title = record.title?.trim() ?? "";
  const description = record.description?.trim() ?? "";
  return (
    TEST_GOAL_TITLE_PATTERN.test(title) ||
    TEST_GOAL_DESCRIPTION_PATTERN.test(description)
  );
}

export function resolveGoalProgressPercent(
  goal: Pick<
    StrategicGoalRecord,
    "currentValue" | "targetValue" | "progressPercent"
  >,
): number | null {
  const target = goal.targetValue;
  const current = goal.currentValue;
  if (target != null && target > 0 && current != null && !Number.isNaN(current)) {
    return Math.min(100, Math.round((current / target) * 100));
  }
  if (
    goal.progressPercent != null &&
    !Number.isNaN(goal.progressPercent) &&
    goal.progressPercent >= 0
  ) {
    return Math.min(100, Math.round(goal.progressPercent));
  }
  return null;
}

export function computeStrategicGoalSummary(
  goals: StrategicGoalRecord[],
): StrategicGoalSummary {
  const activeGoals = goals.filter((goal) => goal.status !== "Completed");
  const progressValues = activeGoals
    .map((goal) => resolveGoalProgressPercent(goal))
    .filter((value): value is number => value != null);

  return {
    activeGoals: activeGoals.length,
    averageCompletion:
      progressValues.length > 0
        ? Math.round(
            progressValues.reduce((sum, value) => sum + value, 0) /
              progressValues.length,
          )
        : 0,
    onTrack: goals.filter((goal) => goal.status === "On Track").length,
    needsFocusOrAtRisk: goals.filter(
      (goal) => goal.status === "Needs Focus" || goal.status === "At Risk",
    ).length,
  };
}

function normalizeCoreValue(record: CoreValueRecord & { title?: string }): CoreValueRecord {
  return {
    id: record.id,
    name: record.name ?? record.title ?? "",
    description: record.description ?? "",
    iconKey: record.iconKey ?? "heart",
    accent: record.accent ?? "gold",
    displayOrder: Number(record.displayOrder) || 0,
  };
}

function normalizeStrategicGoal(
  record: Partial<StrategicGoalRecord> & { id: string; progress?: number },
): StrategicGoalRecord {
  return {
    id: record.id,
    title: record.title?.trim() ?? "",
    description: record.description?.trim() ?? "",
    owner: record.owner?.trim() ?? "",
    targetOutcome: record.targetOutcome?.trim() ?? "",
    currentValue:
      record.currentValue != null ? Number(record.currentValue) : null,
    targetValue: record.targetValue != null ? Number(record.targetValue) : null,
    progressPercent:
      record.progressPercent != null
        ? Number(record.progressPercent)
        : record.progress != null
          ? Number(record.progress)
          : null,
    status: (record.status as StrategicGoalStatus) ?? inferStatusFromLegacyProgress(record),
    startDate: record.startDate ?? "",
    dueDate: record.dueDate ?? "",
    category: record.category?.trim() ?? "",
    linkedProgramIds: record.linkedProgramIds ?? [],
    linkedCampaignIds: record.linkedCampaignIds ?? [],
    linkedTeamIds: record.linkedTeamIds ?? [],
  };
}

function inferStatusFromLegacyProgress(
  record: Partial<StrategicGoalRecord> & { progress?: number },
): StrategicGoalStatus {
  const progress =
    record.progressPercent ??
    record.progress ??
    resolveGoalProgressPercent({
      currentValue: record.currentValue ?? null,
      targetValue: record.targetValue ?? null,
      progressPercent: record.progressPercent ?? null,
    });

  if (progress == null) return "Not Started";
  if (progress >= 100) return "Completed";
  if (progress >= 70) return "On Track";
  if (progress >= 50) return "At Risk";
  return "Needs Focus";
}

function readLegacyMissionVision(): MissionVisionInput | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LEGACY_MISSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      missionTitle?: string;
      missionDescription?: string;
      visionTitle?: string;
      visionDescription?: string;
    };
    return {
      missionStatement: sanitizeMissionVisionText(parsed.missionTitle),
      missionDescription: sanitizeMissionVisionText(parsed.missionDescription),
      visionStatement: sanitizeMissionVisionText(parsed.visionTitle),
      visionDescription: sanitizeMissionVisionText(parsed.visionDescription),
    };
  } catch {
    return null;
  }
}

function readLegacyGoals(): StrategicGoalInput[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LEGACY_GOALS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<{
      title?: string;
      description?: string;
      progress?: number;
    }>;
    return parsed
      .map((goal) =>
        normalizeStrategicGoal({
          id: "legacy",
          title: goal.title,
          description: goal.description,
          progress: goal.progress,
        }),
      )
      .filter((goal) => !isTestStrategicGoal(goal))
      .map(({ id: _id, ...goal }) => goal);
  } catch {
    return [];
  }
}

function clearLegacyStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_MISSION_KEY);
  localStorage.removeItem(LEGACY_GOALS_KEY);
}

async function loadMissionVisionRecord(): Promise<MissionVisionRecord> {
  const docs = (await getDocuments("missionVision")) as MissionVisionRecord[];
  const existing = docs.find((doc) => doc.id === MISSION_VISION_DOC_ID);

  if (existing) {
    const sanitized: MissionVisionRecord = {
      id: MISSION_VISION_DOC_ID,
      missionStatement: sanitizeMissionVisionText(
        existing.missionStatement ?? (existing as { missionTitle?: string }).missionTitle,
      ),
      missionDescription: sanitizeMissionVisionText(existing.missionDescription),
      visionStatement: sanitizeMissionVisionText(
        existing.visionStatement ?? (existing as { visionTitle?: string }).visionTitle,
      ),
      visionDescription: sanitizeMissionVisionText(existing.visionDescription),
    };

    const needsCleanup =
      sanitized.missionStatement !== (existing.missionStatement ?? "") ||
      sanitized.missionDescription !== (existing.missionDescription ?? "") ||
      sanitized.visionStatement !== (existing.visionStatement ?? "") ||
      sanitized.visionDescription !== (existing.visionDescription ?? "");

    if (needsCleanup) {
      await saveMissionVision(sanitized);
    }

    return sanitized;
  }

  const legacy = readLegacyMissionVision();
  if (legacy) {
    await saveMissionVision(legacy);
    clearLegacyStorage();
    return { id: MISSION_VISION_DOC_ID, ...legacy };
  }

  return EMPTY_MISSION_VISION;
}

async function loadCoreValues(): Promise<CoreValueRecord[]> {
  const docs = (await getDocuments("coreValues")) as CoreValueRecord[];
  return docs
    .map(normalizeCoreValue)
    .filter((value) => value.name.trim())
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
}

async function loadStrategicGoals(): Promise<StrategicGoalRecord[]> {
  const docs = (await getDocuments("strategicGoals")) as StrategicGoalRecord[];
  const normalized = docs
    .map(normalizeStrategicGoal)
    .filter((goal) => goal.title.trim() && !isTestStrategicGoal(goal));

  const testDocs = docs.filter((goal) => isTestStrategicGoal(normalizeStrategicGoal(goal)));
  await Promise.all(
    testDocs.map((goal) => deleteDocument("strategicGoals", goal.id)),
  );

  if (normalized.length === 0) {
    const legacyGoals = readLegacyGoals();
    if (legacyGoals.length > 0) {
      for (const goal of legacyGoals) {
        await createStrategicGoal(goal);
      }
      clearLegacyStorage();
      return loadStrategicGoals();
    }
  }

  return normalized.sort((a, b) => a.title.localeCompare(b.title));
}

async function loadLinkables() {
  const [programs, campaigns, teams] = await Promise.all([
    getDocuments("programs") as Promise<{ id: string; name?: string }[]>,
    getDocuments("campaigns") as Promise<{ id: string; name?: string }[]>,
    getDocuments("teams") as Promise<{ id: string; name?: string }[]>,
  ]);

  return {
    programs: programs
      .filter((record) => record.name)
      .map((record) => ({ id: record.id, name: record.name! }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    campaigns: campaigns
      .filter((record) => record.name)
      .map((record) => ({ id: record.id, name: record.name! }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    teams: teams
      .filter((record) => record.name)
      .map((record) => ({ id: record.id, name: record.name! }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function fetchMissionVisionBundle(): Promise<MissionVisionBundle> {
  const [missionVision, coreValues, strategicGoals, linkables] =
    await Promise.all([
      loadMissionVisionRecord(),
      loadCoreValues(),
      loadStrategicGoals(),
      loadLinkables(),
    ]);

  return {
    missionVision,
    coreValues,
    strategicGoals,
    programs: linkables.programs,
    campaigns: linkables.campaigns,
    teams: linkables.teams,
    summary: computeStrategicGoalSummary(strategicGoals),
  };
}

export async function saveMissionVision(input: MissionVisionInput): Promise<void> {
  const payload = {
    missionStatement: sanitizeMissionVisionText(input.missionStatement),
    missionDescription: sanitizeMissionVisionText(input.missionDescription),
    visionStatement: sanitizeMissionVisionText(input.visionStatement),
    visionDescription: sanitizeMissionVisionText(input.visionDescription),
  };

  await setDocument("missionVision", MISSION_VISION_DOC_ID, payload);
  await logActivity({
    module: "missionVision",
    action: "updated",
    entityType: "missionVision",
    entityId: MISSION_VISION_DOC_ID,
    entityName: "Mission & Vision",
    description: "Mission and vision statements updated",
  });
}

export async function createCoreValue(input: CoreValueInput): Promise<string> {
  const id = await createDocument("coreValues", input);
  await logActivity({
    module: "missionVision",
    action: "created",
    entityType: "coreValue",
    entityId: id,
    entityName: input.name,
    description: `Core value "${input.name}" added`,
  });
  return id;
}

export async function updateCoreValue(
  id: string,
  input: CoreValueInput,
): Promise<void> {
  await updateDocument("coreValues", id, input);
  await logActivity({
    module: "missionVision",
    action: "updated",
    entityType: "coreValue",
    entityId: id,
    entityName: input.name,
    description: `Core value "${input.name}" updated`,
  });
}

export async function deleteCoreValue(id: string, name: string): Promise<void> {
  await deleteDocument("coreValues", id);
  await logActivity({
    module: "missionVision",
    action: "deleted",
    entityType: "coreValue",
    entityId: id,
    entityName: name,
    description: `Core value "${name}" removed`,
  });
}

export async function createStrategicGoal(
  input: StrategicGoalInput,
): Promise<string> {
  if (isTestStrategicGoal(input)) {
    throw new Error("Test strategic goal content is not allowed.");
  }

  const id = await createDocument("strategicGoals", input);
  await logActivity({
    module: "missionVision",
    action: "created",
    entityType: "strategicGoal",
    entityId: id,
    entityName: input.title,
    description: `Strategic goal "${input.title}" created`,
  });
  return id;
}

export async function updateStrategicGoal(
  id: string,
  input: StrategicGoalInput,
): Promise<void> {
  if (isTestStrategicGoal(input)) {
    throw new Error("Test strategic goal content is not allowed.");
  }

  await updateDocument("strategicGoals", id, input);
  await logActivity({
    module: "missionVision",
    action: "updated",
    entityType: "strategicGoal",
    entityId: id,
    entityName: input.title,
    description: `Strategic goal "${input.title}" updated`,
  });
}

export async function deleteStrategicGoal(id: string, title: string): Promise<void> {
  await deleteDocument("strategicGoals", id);
  await logActivity({
    module: "missionVision",
    action: "deleted",
    entityType: "strategicGoal",
    entityId: id,
    entityName: title,
    description: `Strategic goal "${title}" removed`,
  });
}

export function getGoalStatusClassName(status: StrategicGoalStatus): string {
  switch (status) {
    case "On Track":
      return "mv2-status mv2-status-on-track";
    case "At Risk":
      return "mv2-status mv2-status-progress";
    case "Needs Focus":
      return "mv2-status mv2-status-attention";
    case "Completed":
      return "mv2-status mv2-status-on-track";
    default:
      return "mv2-status mv2-status-progress";
  }
}

export function formatGoalDueDate(value: string): string {
  if (!value) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function resolveLinkedNames<T extends { id: string; name: string }>(
  ids: string[],
  records: T[],
): T[] {
  const lookup = new Map(records.map((record) => [record.id, record]));
  return ids
    .map((id) => lookup.get(id))
    .filter((record): record is T => Boolean(record));
}
